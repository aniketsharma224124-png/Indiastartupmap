import { createContext, useContext, useState, useEffect } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { getApps } from 'firebase/app'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined)  // undefined = loading
  const [profile, setProfile] = useState(null)       // { role:'founder'|'investor', name, ... }

  useEffect(() => {
    const app  = getApps()[0]
    if (!app) { setUser(null); return }
    const auth = getAuth(app)
    const db   = getFirestore(app)
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          setProfile(snap.exists() ? snap.data() : { role: 'founder' })
        } catch { setProfile({ role: 'founder' }) }
      } else {
        setUser(null)
        setProfile(null)
      }
    })
    return () => unsub()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
