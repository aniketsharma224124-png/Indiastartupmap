// firebase.js — single source of truth for all Firebase operations
// ─────────────────────────────────────────────────────────────────
import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore, collection, query, where,
  getDocs, addDoc, updateDoc, doc, getDoc, setDoc,
  orderBy, limit,
} from 'firebase/firestore'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'

// ── CONFIG ────────────────────────────────────────────────────────────────────
// All values come from .env (VITE_ prefix = exposed to browser by Vite)
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// ── STARTUP GUARD ─────────────────────────────────────────────────────────────
// Detects missing .env values and logs a clear error in the console instead of
// cryptic Firebase "app/invalid-api-key" messages.
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v || v.includes('XXXX') || v.includes('your-'))
  .map(([k]) => k)

if (missingKeys.length > 0) {
  console.error(
    '%c[IndiaStartupMap] ⚠️  FIREBASE NOT CONFIGURED',
    'color:#ff4444;font-size:14px;font-weight:bold',
    '\n\nMissing / placeholder values in your .env file:',
    missingKeys,
    '\n\n👉 Open .env in the project root and fill in your real Firebase credentials.',
    '\n   Get them from: Firebase Console → Project Settings → Your Apps → Web App',
  )
}

// ── INIT ──────────────────────────────────────────────────────────────────────
// Guard against double-init in hot-reload / StrictMode
const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
const db   = getFirestore(app)
const auth = getAuth(app)

export { auth, db }

// Call this from browser console to verify config: firebaseDebug()
export function debugConfig() {
  console.table({
    apiKey:            firebaseConfig.apiKey?.slice(0, 10) + '…',
    authDomain:        firebaseConfig.authDomain,
    projectId:         firebaseConfig.projectId,
    storageBucket:     firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId:             firebaseConfig.appId?.slice(0, 20) + '…',
  })
  console.log('Missing keys:', missingKeys.length ? missingKeys : 'none ✅')
}
// Expose to browser console: type firebaseDebug() in DevTools
if (typeof window !== 'undefined') window.firebaseDebug = debugConfig

// ── HELPERS ───────────────────────────────────────────────────────────────────
const PLAN_DURATION  = { basic: 12, premium: 24, enterprise: 60 }
const isPremiumPlan  = (plan) => plan === 'enterprise' || plan === 'premium'
const snapshotToArr  = (snap) => snap.docs.map(d => ({ id: d.id, ...d.data() }))

// ── STARTUPS — READ ───────────────────────────────────────────────────────────

/**
 * Fetch approved startups. Optionally filter by state name.
 * Uses a simple single-field query to avoid needing a composite index
 * for the most common case (no state filter).
 */
export async function getStartups(state = null) {
  try {
    let q
    if (state) {
      // Two-field query — needs composite index (defined in firestore.indexes.json)
      q = query(
        collection(db, 'startups'),
        where('status', '==', 'approved'),
        where('state',  '==', state),
      )
    } else {
      // Single-field query — no index needed
      q = query(
        collection(db, 'startups'),
        where('status', '==', 'approved'),
      )
    }
    const snap = await getDocs(q)
    const arr  = snapshotToArr(snap)
    // Sort in JS: enterprise first, then premium, then basic; newest last
    arr.sort((a, b) => {
      const rank = { enterprise: 0, premium: 1, basic: 2 }
      const ra = rank[a.plan] ?? (a.is_premium ? 1 : 2)
      const rb = rank[b.plan] ?? (b.is_premium ? 1 : 2)
      return ra !== rb
        ? ra - rb
        : new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })
    return arr
  } catch (e) {
    console.error('[getStartups] error:', e.code, e.message)
    // If it's a missing index error, log the link Firebase provides
    if (e.message?.includes('index')) {
      console.error(
        '[getStartups] Missing Firestore index. Deploy indexes:\n  firebase deploy --only firestore:indexes\nor run this in browser:\n',
        e.message.match(/https:\/\/[^\s]+/)?.[0] || '(no link in error)'
      )
    }
    return []
  }
}

export async function getStartupCountByState() {
  try {
    const snap = await getDocs(
      query(collection(db, 'startups'), where('status', '==', 'approved'))
    )
    const counts = {}
    snap.docs.forEach(d => {
      const { state } = d.data()
      if (state) counts[state] = (counts[state] || 0) + 1
    })
    return counts
  } catch (e) {
    console.error('[getStartupCountByState]', e.code, e.message)
    return {}
  }
}

export async function getPremiumCountByState() {
  try {
    const snap = await getDocs(query(
      collection(db, 'startups'),
      where('status',     '==', 'approved'),
      where('is_premium', '==', true),
    ))
    const counts = {}
    snap.docs.forEach(d => {
      const { state } = d.data()
      if (state) counts[state] = (counts[state] || 0) + 1
    })
    return counts
  } catch (e) {
    console.error('[getPremiumCountByState]', e.code, e.message)
    return {}
  }
}

export async function getStartupById(id) {
  try {
    const snap = await getDoc(doc(db, 'startups', id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  } catch (e) {
    console.error('[getStartupById]', e.code, e.message)
    return null
  }
}

export async function getPendingStartups() {
  try {
    const snap = await getDocs(
      query(collection(db, 'startups'), where('status', '==', 'pending'))
    )
    return snapshotToArr(snap).sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    )
  } catch (e) {
    console.error('[getPendingStartups]', e.code, e.message)
    return []
  }
}

// ── STARTUPS — WRITE ──────────────────────────────────────────────────────────

export async function submitStartup(payload) {
  try {
    const docRef = await addDoc(collection(db, 'startups'), {
      ...payload,
      status:       'pending',
      created_at:   new Date().toISOString(),
      listing_date: new Date().toISOString(),
    })
    return { id: docRef.id, ...payload }
  } catch (e) {
    console.error('[submitStartup]', e.code, e.message)
    throw e
  }
}

export async function activateStartup(id, paymentId, plan) {
  try {
    const months    = PLAN_DURATION[plan] || 12
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + months)
    await updateDoc(doc(db, 'startups', id), {
      payment_id:   paymentId,
      plan,
      is_premium:   isPremiumPlan(plan),
      status:       'approved',
      expires_at:   expiresAt.toISOString(),
      listing_date: new Date().toISOString(),
    })
    const snap = await getDoc(doc(db, 'startups', id))
    return { id: snap.id, ...snap.data() }
  } catch (e) {
    console.error('[activateStartup]', e.code, e.message)
    throw e
  }
}

export async function updateStartupStatus(id, status) {
  try {
    await updateDoc(doc(db, 'startups', id), { status })
  } catch (e) {
    console.error('[updateStartupStatus]', e.code, e.message)
    throw e
  }
}

// ── CLOUDINARY LOGO UPLOAD ────────────────────────────────────────────────────

export async function uploadLogo(file, companyName) {
  const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || cloudName.includes('your-')) {
    throw new Error(
      'Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and ' +
      'VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    )
  }
  if (!uploadPreset || uploadPreset.includes('indiastartupmap-logos')) {
    // Default preset name — warn but try anyway
    console.warn('[uploadLogo] Using default preset name. Make sure it exists in Cloudinary.')
  }

  const safe     = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const formData = new FormData()
  formData.append('file',          file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder',        'indiastartupmap-logos')
  formData.append('public_id',     `${safe}-${Date.now()}`)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Cloudinary upload failed (${res.status}): ${body}`)
  }
  return (await res.json()).secure_url
}

// ── AUTH ──────────────────────────────────────────────────────────────────────

async function saveUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), data, { merge: true })
}

export async function signUpWithEmail({ email, password, name, role }) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: name })
    await saveUserProfile(credential.user.uid, {
      uid:        credential.user.uid,
      email, name, role,
      created_at: new Date().toISOString(),
      provider:   'email',
    })
    return credential.user
  } catch (e) {
    console.error('[signUpWithEmail]', e.code, e.message)
    throw e
  }
}

export async function signIn(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const user       = credential.user
    const snap       = await getDoc(doc(db, 'users', user.uid))
    const profile    = snap.exists() ? snap.data() : { role: 'founder' }
    return { session: user, profile }
  } catch (e) {
    console.error('[signIn]', e.code, e.message)
    throw e
  }
}

export async function signInWithGoogle(role = 'founder') {
  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const credential = await signInWithPopup(auth, provider)
    const user       = credential.user
    const snap       = await getDoc(doc(db, 'users', user.uid))
    if (!snap.exists()) {
      await saveUserProfile(user.uid, {
        uid:        user.uid,
        email:      user.email,
        name:       user.displayName || '',
        role,
        created_at: new Date().toISOString(),
        provider:   'google',
      })
    } else {
      await saveUserProfile(user.uid, { role, uid: user.uid, email: user.email })
    }
    const profileSnap = await getDoc(doc(db, 'users', user.uid))
    return { user, profile: profileSnap.data() }
  } catch (e) {
    console.error('[signInWithGoogle]', e.code, e.message)
    throw e
  }
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export function getSession() {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub()
      resolve(user || null)
    })
  })
}

export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? snap.data() : null
  } catch (e) {
    console.error('[getUserProfile]', e.code, e.message)
    return null
  }
}

// ── FOUNDING PROGRAM — LIVE COUNTS ────────────────────────────────────────────
// Fetches real registered startup/investor counts from Firestore.
// Used by the Founding 100 badge to show live "X/100 spots left".
export async function getFoundingCounts() {
  try {
    const [startupSnap, investorSnap] = await Promise.all([
      getDocs(query(collection(db, 'startups'),  where('status', 'in', ['approved', 'pending']))),
      getDocs(query(collection(db, 'investors'), where('status', 'in', ['approved', 'pending']))),
    ])
    return {
      startups:  startupSnap.size,
      investors: investorSnap.size,
    }
  } catch (e) {
    console.error('[getFoundingCounts]', e.code, e.message)
    return { startups: 0, investors: 0 }
  }
}
