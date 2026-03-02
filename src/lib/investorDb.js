// investorDb.js — all Firestore operations for investors, intros, and interest
// ─────────────────────────────────────────────────────────────────────────────
import {
  getFirestore, collection, query, where,
  getDocs, addDoc, updateDoc, doc,
} from 'firebase/firestore'
import { getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const app = getApps()[0]
const db = getFirestore(app)
export const auth = getAuth(app)

// ── INVESTORS ─────────────────────────────────────────────────────────────────

export async function getInvestors(stateId = null) {
  try {
    const conds = [where('status', '==', 'approved')]
    if (stateId) conds.push(where('state_id', '==', stateId))
    const snap = await getDocs(query(collection(db, 'investors'), ...conds))
    const rank = { partner_elite: 0, scout_pro: 1, basic: 2 }
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (rank[a.plan] ?? 3) - (rank[b.plan] ?? 3))
  } catch (e) {
    console.error('[getInvestors]', e.code, e.message)
    return []
  }
}

export async function getInvestorById(investorId) {
  try {
    const { getDoc } = await import('firebase/firestore')
    const snap = await getDoc(doc(db, 'investors', investorId))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  } catch (e) {
    console.error('[getInvestorById]', e.code, e.message)
    return null
  }
}

export async function getInvestorByUid(uid) {
  try {
    const snap = await getDocs(query(collection(db, 'investors'), where('uid', '==', uid)))
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  } catch (e) {
    console.error('[getInvestorByUid]', e.code, e.message)
    return null
  }
}

export async function getInvestorCountByState() {
  try {
    const snap = await getDocs(query(collection(db, 'investors'), where('status', '==', 'approved')))
    const counts = {}
    snap.docs.forEach(d => {
      const key = d.data().state_id || d.data().state
      if (key) counts[key] = (counts[key] || 0) + 1
    })
    return counts
  } catch (e) {
    console.error('[getInvestorCountByState]', e.code, e.message)
    return {}
  }
}

export async function getPendingInvestors() {
  try {
    const snap = await getDocs(query(collection(db, 'investors'), where('status', '==', 'pending')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('[getPendingInvestors]', e.code, e.message)
    return []
  }
}

export async function submitInvestor(payload) {
  try {
    const ref = await addDoc(collection(db, 'investors'), {
      ...payload,
      status: 'pending',
      created_at: new Date().toISOString(),
      listing_date: new Date().toISOString(),
    })
    return { id: ref.id, ...payload }
  } catch (e) {
    console.error('[submitInvestor]', e.code, e.message)
    throw e
  }
}

export async function updateInvestorStatus(id, status) {
  try {
    await updateDoc(doc(db, 'investors', id), { status })
  } catch (e) {
    console.error('[updateInvestorStatus]', e.code, e.message)
    throw e
  }
}

export async function getMyInvestorProfile(uid, email) {
  try {
    if (uid) {
      const snap = await getDocs(query(collection(db, 'investors'), where('uid', '==', uid)))
      if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() }
    }
    if (email) {
      const snap = await getDocs(query(collection(db, 'investors'), where('email', '==', email)))
      if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() }
    }
    return null
  } catch (e) {
    console.error('[getMyInvestorProfile]', e.code, e.message)
    return null
  }
}

export async function getMyStartupProfile(uid, email) {
  try {
    if (uid) {
      const snap = await getDocs(query(collection(db, 'startups'), where('uid', '==', uid)))
      if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() }
    }
    if (email) {
      const s1 = await getDocs(query(collection(db, 'startups'), where('founder_email', '==', email)))
      if (!s1.empty) return { id: s1.docs[0].id, ...s1.docs[0].data() }
      const s2 = await getDocs(query(collection(db, 'startups'), where('email', '==', email)))
      if (!s2.empty) return { id: s2.docs[0].id, ...s2.docs[0].data() }
    }
    return null
  } catch (e) {
    console.error('[getMyStartupProfile]', e.code, e.message)
    return null
  }
}

export async function getAllMyStartupProfiles(uid, email) {
  const profiles = []
  try {
    if (uid) {
      const snap = await getDocs(query(collection(db, 'startups'), where('uid', '==', uid)))
      snap.docs.forEach(d => profiles.push({ id: d.id, ...d.data() }))
    }
    if (email) {
      const s1 = await getDocs(query(collection(db, 'startups'), where('founder_email', '==', email)))
      s1.docs.forEach(d => { if (!profiles.find(p => p.id === d.id)) profiles.push({ id: d.id, ...d.data() }) })
      const s2 = await getDocs(query(collection(db, 'startups'), where('email', '==', email)))
      s2.docs.forEach(d => { if (!profiles.find(p => p.id === d.id)) profiles.push({ id: d.id, ...d.data() }) })
    }
  } catch (e) {
    console.error('[getAllMyStartupProfiles]', e.code, e.message)
  }
  return profiles
}

export async function getAllMyInvestorProfiles(uid, email) {
  const profiles = []
  try {
    if (uid) {
      const snap = await getDocs(query(collection(db, 'investors'), where('uid', '==', uid)))
      snap.docs.forEach(d => profiles.push({ id: d.id, ...d.data() }))
    }
    if (email) {
      const snap = await getDocs(query(collection(db, 'investors'), where('email', '==', email)))
      snap.docs.forEach(d => { if (!profiles.find(p => p.id === d.id)) profiles.push({ id: d.id, ...d.data() }) })
    }
  } catch (e) {
    console.error('[getAllMyInvestorProfiles]', e.code, e.message)
  }
  return profiles
}

export async function getStartupByUid(uid) {
  try {
    const snap = await getDocs(query(collection(db, 'startups'), where('uid', '==', uid)))
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  } catch (e) {
    console.error('[getStartupByUid]', e.code, e.message)
    return null
  }
}

// ── SAVED STARTUPS ────────────────────────────────────────────────────────────

export async function saveStartupForInvestor(investorUid, startup) {
  try {
    const existing = await getDocs(query(
      collection(db, 'saved_startups'),
      where('investor_uid', '==', investorUid),
      where('startup_id', '==', startup.id),
    ))
    if (!existing.empty) return null
    const ref = await addDoc(collection(db, 'saved_startups'), {
      investor_uid: investorUid,
      startup_id: startup.id,
      company_name: startup.company_name,
      sector: startup.sector || '',
      state: startup.state || '',
      brand_color: startup.brand_color || '#3B7DD8',
      stage: startup.stage || '',
      website_url: startup.website_url || '',
      saved_at: new Date().toISOString(),
    })
    return { id: ref.id }
  } catch (e) {
    console.error('[saveStartupForInvestor]', e.code, e.message)
    return null
  }
}

export async function getSavedStartupsForInvestor(investorUid) {
  try {
    const snap = await getDocs(query(
      collection(db, 'saved_startups'),
      where('investor_uid', '==', investorUid),
    ))
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.saved_at || 0) - new Date(a.saved_at || 0))
  } catch (e) {
    console.error('[getSavedStartupsForInvestor]', e.code, e.message)
    return []
  }
}

export async function isStartupSaved(investorUid, startupId) {
  try {
    const snap = await getDocs(query(
      collection(db, 'saved_startups'),
      where('investor_uid', '==', investorUid),
      where('startup_id', '==', startupId),
    ))
    return !snap.empty
  } catch { return false }
}

// ── INVESTOR INTEREST ─────────────────────────────────────────────────────────
// Investor marks interest → writes to investor_interest.
// Founder reads from inbox via getInterestNotificationsForStartup().

export async function markInvestorInterest(investorUid, investorFirm, partnerName, startup) {
  try {
    // Single-field query + client-side filter to avoid composite index
    const snap = await getDocs(query(
      collection(db, 'investor_interest'),
      where('investor_uid', '==', investorUid),
    ))
    const existing = snap.docs.find(d => d.data().startup_id === startup.id)
    if (existing) return { already: true }

    await addDoc(collection(db, 'investor_interest'), {
      investor_uid: investorUid,
      investor_firm: investorFirm,
      partner_name: partnerName,
      startup_id: startup.id,
      startup_name: startup.company_name,
      startup_logo: startup.logo_url || '',
      brand_color: startup.brand_color || '#9B6FFF',
      founder_email: startup.founder_email || startup.email || '',
      // Store startup owner uid so founder can query by uid too
      startup_uid: startup.uid || '',
      sector: startup.sector || '',
      state: startup.state || '',
      website_url: startup.website_url || '',
      description: startup.description || '',
      created_at: new Date().toISOString(),
    })
    console.log('[markInvestorInterest] success for startup:', startup.id)
    return { success: true }
  } catch (e) {
    console.error('[markInvestorInterest]', e.code, e.message)
    return null
  }
}

export async function getMarkedInterestByInvestor(investorUid) {
  try {
    const snap = await getDocs(query(
      collection(db, 'investor_interest'),
      where('investor_uid', '==', investorUid),
    ))
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  } catch (e) {
    console.error('[getMarkedInterestByInvestor]', e.code, e.message)
    return []
  }
}

export async function getInterestNotificationsForStartup(startupId, startupUid = null, founderEmail = null) {
  console.log('[getInterestNotificationsForStartup] querying:', { startupId, startupUid, founderEmail })
  try {
    const results = new Map()

    // 1. Query by startup_id
    const snap = await getDocs(query(
      collection(db, 'investor_interest'),
      where('startup_id', '==', startupId),
    ))
    snap.docs.forEach(d => results.set(d.id, { id: d.id, ...d.data(), type: 'interest' }))
    console.log('[getInterestNotificationsForStartup] by startup_id:', snap.docs.length)

    // 2. Fallback: query by startup_uid
    if (startupUid) {
      try {
        const snap2 = await getDocs(query(
          collection(db, 'investor_interest'),
          where('startup_uid', '==', startupUid),
        ))
        snap2.docs.forEach(d => results.set(d.id, { id: d.id, ...d.data(), type: 'interest' }))
        console.log('[getInterestNotificationsForStartup] by startup_uid:', snap2.docs.length)
      } catch { /* optional */ }
    }

    // 3. Fallback: query by founder_email
    if (founderEmail) {
      try {
        const snap3 = await getDocs(query(
          collection(db, 'investor_interest'),
          where('founder_email', '==', founderEmail),
        ))
        snap3.docs.forEach(d => results.set(d.id, { id: d.id, ...d.data(), type: 'interest' }))
        console.log('[getInterestNotificationsForStartup] by founder_email:', snap3.docs.length)
      } catch { /* optional */ }
    }

    const arr = [...results.values()].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    console.log('[getInterestNotificationsForStartup] total results:', arr.length)
    return arr
  } catch (e) {
    console.error('[getInterestNotificationsForStartup]', e.code, e.message)
    if (e.code === 'permission-denied') {
      console.warn('[getInterestNotificationsForStartup] Permission denied. Run: firebase deploy --only firestore:rules')
    }
    return []
  }
}

// ── INTRO REQUESTS ────────────────────────────────────────────────────────────

/**
 * Universal intro sender — works for all directions:
 *   founder_to_investor   (default)
 *   investor_to_founder
 *   founder_to_founder    (new — startup profile page intro)
 */
export async function sendIntroRequest({
  investorId,
  investorFirm,
  partnerName,
  startupId,
  startupName,
  founderEmail,
  pitch,
  direction = 'founder_to_investor',
  founderLinkedin = '',
  founderPhone = '',
  founderContactEmail = '',
  recipientUid = '',   // optional — used for founder_to_founder
  investorUid = '',    // optional — investor's auth uid for inbox matching
}) {
  try {
    const ref = await addDoc(collection(db, 'intro_requests'), {
      investor_id: investorId,
      investor_uid: investorUid,
      investor_firm: investorFirm,
      partner_name: partnerName,
      startup_id: startupId,
      startup_name: startupName,
      founder_email: founderEmail,
      founder_linkedin: founderLinkedin,
      founder_phone: founderPhone,
      founder_contact_email: founderContactEmail || founderEmail,
      recipient_uid: recipientUid,  // for founder_to_founder reads
      pitch,
      direction,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    return { id: ref.id, status: 'pending' }
  } catch (e) {
    console.error('[sendIntroRequest]', e.code, e.message)
    throw e
  }
}

export async function sendInvestorIntroToStartup({
  investorId, investorFirm, partnerName,
  startupId, startupName, founderEmail, message,
}) {
  return sendIntroRequest({
    investorId, investorFirm, partnerName,
    startupId, startupName, founderEmail,
    pitch: message,
    direction: 'investor_to_founder',
  })
}

export async function sendIntroToFounder(investorUid, investorFirm, partnerName, startup) {
  try {
    const founderEmail = startup.founder_email || startup.email || ''
    if (!founderEmail) return { error: 'no_email' }

    // Single-field query to avoid composite index, filter client-side
    const snap = await getDocs(query(
      collection(db, 'intro_requests'),
      where('investor_id', '==', investorUid),
    ))
    const existing = snap.docs.find(d => {
      const data = d.data()
      return data.startup_id === startup.id && data.direction === 'investor_to_founder'
    })
    if (existing) return { already: true }

    await addDoc(collection(db, 'intro_requests'), {
      investor_id: investorUid,
      investor_uid: investorUid,
      investor_firm: investorFirm,
      partner_name: partnerName,
      startup_id: startup.id,
      startup_name: startup.company_name,
      founder_email: founderEmail,
      pitch: `${investorFirm} is interested in ${startup.company_name} and wants to connect.`,
      direction: 'investor_to_founder',
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    return { success: true }
  } catch (e) {
    console.error('[sendIntroToFounder]', e.code, e.message)
    return null
  }
}

// ── INTRO REQUEST READS ───────────────────────────────────────────────────────

export async function getIntroRequestsByFounderEmail(founderEmail) {
  try {
    const snap = await getDocs(query(
      collection(db, 'intro_requests'),
      where('founder_email', '==', founderEmail),
    ))
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  } catch (e) {
    console.error('[getIntroRequestsByFounderEmail]', e.code, e.message)
    return []
  }
}

export async function getIntroRequestsByStartup(startupId) {
  console.log('[getIntroRequestsByStartup] querying:', startupId)
  try {
    const snap = await getDocs(query(
      collection(db, 'intro_requests'),
      where('startup_id', '==', startupId),
    ))
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  } catch (e) {
    console.error('[getIntroRequestsByStartup]', e.code, e.message)
    return []
  }
}

export async function getIntroRequestsByInvestor(investorId, investorUid = null) {
  console.log('[getIntroRequestsByInvestor] querying:', { investorId, investorUid })
  try {
    // Query by investor_id (Firestore doc ID)
    const snap1 = await getDocs(query(
      collection(db, 'intro_requests'),
      where('investor_id', '==', investorId),
    ))
    const results = new Map()
    snap1.docs.forEach(d => results.set(d.id, { id: d.id, ...d.data() }))

    // Also query by investor_uid if provided (auth UID fallback)
    if (investorUid) {
      const snap2 = await getDocs(query(
        collection(db, 'intro_requests'),
        where('investor_uid', '==', investorUid),
      ))
      snap2.docs.forEach(d => results.set(d.id, { id: d.id, ...d.data() }))

      // Also check investor_id matching uid (old records)
      const snap3 = await getDocs(query(
        collection(db, 'intro_requests'),
        where('investor_id', '==', investorUid),
      ))
      snap3.docs.forEach(d => results.set(d.id, { id: d.id, ...d.data() }))
    }

    const arr = [...results.values()]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    console.log('[getIntroRequestsByInvestor] total results:', arr.length)
    return arr
  } catch (e) {
    console.error('[getIntroRequestsByInvestor]', e.code, e.message)
    return []
  }
}

export async function getInvestorInitiatedIntrosForFounder(founderEmail) {
  console.log('[getInvestorInitiatedIntrosForFounder] querying:', founderEmail)
  try {
    // Single-field query to avoid composite index requirement
    const snap = await getDocs(query(
      collection(db, 'intro_requests'),
      where('founder_email', '==', founderEmail),
    ))
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(r => r.direction === 'investor_to_founder')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  } catch (e) {
    console.error('[getInvestorInitiatedIntrosForFounder]', e.code, e.message)
    return []
  }
}

export async function hasAlreadySentIntro(founderEmail, investorId) {
  try {
    const snap = await getDocs(query(
      collection(db, 'intro_requests'),
      where('founder_email', '==', founderEmail),
      where('investor_id', '==', investorId),
    ))
    return !snap.empty
  } catch { return false }
}

export async function updateIntroRequestStatus(requestId, status) {
  try {
    await updateDoc(doc(db, 'intro_requests', requestId), { status })
  } catch (e) {
    console.error('[updateIntroRequestStatus]', e.code, e.message)
    throw e
  }
}
