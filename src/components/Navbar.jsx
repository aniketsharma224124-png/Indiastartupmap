import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { signIn, signUpWithEmail, signInWithGoogle, signOut } from '../lib/firebase'

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function AuthModal({ defaultRole, onClose }) {
  const navigate = useNavigate()
  const { setProfile } = useAuth()
  const [tab, setTab] = useState('login')
  const [role, setRole] = useState(defaultRole || 'founder')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const accent = role === 'investor' ? '#9B6FFF' : '#4A9EFF'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) { toast.error('Please fill all fields.'); return }
    if (tab === 'signup' && !name.trim()) { toast.error('Please enter your name.'); return }
    setLoading(true)
    try {
      if (tab === 'signup') {
        await signUpWithEmail({ email, password, name, role })
        toast.success(`Welcome, ${name.split(' ')[0]}! 🎉`)
        onClose()
        navigate(role === 'investor' ? '/dashboard/investor' : '/dashboard/founder')
      } else {
        // signIn now returns profile so we can redirect to the CORRECT dashboard
        const { profile: loadedProfile } = await signIn(email, password)
        setProfile(loadedProfile)
        toast.success('Welcome back!')
        onClose()
        const resolvedRole = loadedProfile?.role || role
        navigate(resolvedRole === 'investor' ? '/dashboard/investor' : '/dashboard/founder')
      }
    } catch (err) {
      const msg =
        err.code === 'auth/wrong-password' ? 'Incorrect password.' :
          err.code === 'auth/user-not-found' ? 'No account found with that email.' :
            err.code === 'auth/email-already-in-use' ? 'Email already registered — try logging in.' :
              err.code === 'auth/weak-password' ? 'Password must be at least 6 characters.' :
                err.code === 'auth/invalid-credential' ? 'Invalid email or password.' :
                  err.message
      toast.error(msg)
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setGLoading(true)
    try {
      const { profile } = await signInWithGoogle(role)
      const resolvedRole = profile?.role || role
      setProfile(profile)
      toast.success('Signed in with Google!')
      onClose()
      navigate(resolvedRole === 'investor' ? '/dashboard/investor' : '/dashboard/founder')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') toast.error('Google sign-in failed. Try again.')
    } finally { setGLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}>
      <div className="w-full max-w-[400px] rounded-2xl p-7 relative"
        style={{ background: '#0D1628', border: `1px solid ${accent}28`, animation: 'modalIn 0.2s ease' }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white text-2xl leading-none">×</button>

        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5 mx-auto"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
          {role === 'investor' ? '💰' : '🚀'}
        </div>

        {/* Login / Sign up toggle */}
        <div className="flex rounded-xl overflow-hidden border border-white/[0.08] mb-5">
          {[['login', 'Login'], ['signup', 'Sign Up']].map(([t, lbl]) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-all"
              style={{ background: tab === t ? `${accent}22` : 'transparent', color: tab === t ? accent : 'rgba(255,255,255,0.3)' }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Role toggle */}
        <div className="mb-5">
          <div className="text-[9px] text-white/30 uppercase tracking-widest mb-2 font-bold">I am a</div>
          <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
            {[['founder', '🚀 Founder', '#4A9EFF'], ['investor', '💰 Investor', '#9B6FFF']].map(([r, lbl, c], i) => (
              <button key={r} onClick={() => setRole(r)}
                className="flex-1 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1.5"
                style={{
                  background: role === r ? `${c}22` : 'transparent',
                  color: role === r ? c : 'rgba(255,255,255,0.3)',
                  borderRight: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mb-4">
          {tab === 'signup' && (
            <div>
              <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">Full Name *</label>
              <input className="input-field" placeholder={role === 'investor' ? 'Rajan Anandan' : 'Your full name'}
                value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">Email *</label>
            <input className="input-field" type="email" placeholder={role === 'investor' ? 'partner@fund.com' : 'founder@startup.com'}
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">Password *</label>
            <input className="input-field" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-black text-sm text-white transition-all"
            style={{ background: `linear-gradient(135deg,${accent}cc,${accent})`, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Please wait…' : tab === 'login'
              ? `Login as ${role === 'investor' ? 'Investor' : 'Founder'} →`
              : `Create ${role === 'investor' ? 'Investor' : 'Founder'} Account →`}
          </button>
        </form>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-[10px] text-white/20">or</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        <button onClick={handleGoogle} disabled={gLoading}
          className="w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 border border-white/[0.1] hover:border-white/20 hover:bg-white/[0.04]"
          style={{ color: 'rgba(255,255,255,0.75)', opacity: gLoading ? 0.6 : 1 }}>
          <GoogleLogo />
          {gLoading ? 'Connecting…' : 'Continue with Google'}
        </button>

        <p className="text-center text-[11px] text-white/25 mt-4">
          {tab === 'login' ? "Don't have an account? " : 'Already registered? '}
          <button onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
            className="font-bold hover:underline" style={{ color: accent }}>
            {tab === 'login' ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

function UserMenu({ user, profile }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  // Determine current dashboard context from path
  const isOnInvestorDash = location.pathname.includes('/dashboard/investor')
  const isOnFounderDash = location.pathname.includes('/dashboard/founder')

  // Use a dedicated key for navbar role that only changes when user
  // explicitly visits a dashboard — NOT when navigating to map
  const getNavRole = () => {
    if (isOnInvestorDash) return 'investor'
    if (isOnFounderDash) return 'founder'
    // On other pages: use what was last explicitly set
    const saved = typeof window !== 'undefined' ? localStorage.getItem('navbarRole') : null
    return saved || profile?.role || 'founder'
  }
  const role = getNavRole()

  // Persist when on a dashboard page
  useEffect(() => {
    if (isOnInvestorDash) localStorage.setItem('navbarRole', 'investor')
    if (isOnFounderDash) localStorage.setItem('navbarRole', 'founder')
  }, [isOnInvestorDash, isOnFounderDash])
  const accent = role === 'investor' ? '#9B6FFF' : '#4A9EFF'
  const roleLabel = role === 'investor' ? '💰 Investor' : '🚀 Founder'
  const initials = (user.displayName || user.email || 'U').slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
    toast.success('Signed out.')
    navigate('/')
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all"
        style={{ borderColor: `${accent}35`, background: `${accent}10` }}>
        {user.photoURL
          ? <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
          : <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white" style={{ background: accent }}>{initials}</div>}
        <div className="flex flex-col items-start leading-none">
          <span className="text-xs font-bold max-w-[80px] truncate" style={{ color: accent }}>
            {user.displayName?.split(' ')[0] || 'Account'}
          </span>
          <span className="text-[9px] font-bold opacity-70" style={{ color: accent }}>{roleLabel}</span>
        </div>
        <span className="text-white/30 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/[0.1] z-50 overflow-hidden shadow-2xl"
            style={{ background: '#0D1628' }}>
            <div className="px-4 py-3 border-b border-white/[0.07]">
              <div className="text-xs font-bold text-white truncate">{user.displayName || 'User'}</div>
              <div className="text-[10px] text-white/40 truncate mt-0.5">{user.email}</div>
              <div className="text-[9px] mt-1.5 font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block"
                style={{ background: `${accent}18`, color: accent }}>
                {role === 'investor' ? '💰 Investor' : '🚀 Founder'}
              </div>
            </div>
            <div className="p-2">
              {/* Role toggle */}
              <div className="flex items-center gap-1 mb-1 px-1">
                <button onClick={() => { localStorage.setItem('navbarRole', 'founder'); navigate('/dashboard/founder'); setOpen(false) }}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-black text-center transition-all"
                  style={role === 'founder' ? { background: 'rgba(74,158,255,0.15)', color: '#4A9EFF', border: '1px solid rgba(74,158,255,0.3)' } : { background: 'transparent', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  🚀 Founder
                </button>
                <button onClick={() => { localStorage.setItem('navbarRole', 'investor'); navigate('/dashboard/investor'); setOpen(false) }}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-black text-center transition-all"
                  style={role === 'investor' ? { background: 'rgba(155,111,255,0.15)', color: '#9B6FFF', border: '1px solid rgba(155,111,255,0.3)' } : { background: 'transparent', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  💰 Investor
                </button>
              </div>
              <button onClick={() => { navigate(role === 'investor' ? '/dashboard/investor' : '/dashboard/founder'); setOpen(false) }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-white/60 hover:text-white hover:bg-white/[0.05] transition-all">
                📊 {role === 'investor' ? 'Investor' : 'Founder'} Dashboard
              </button>
              <button onClick={handleSignOut}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.08] transition-all">
                ↩ Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authModal, setAuthModal] = useState(null)
  const location = useLocation()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => setMobileOpen(false), [location])

  // Auto-open auth modal from ?login=founder or ?login=investor URL param
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    const loginParam = p.get('login')
    if (loginParam === 'founder' || loginParam === 'investor') {
      if (!user) setAuthModal(loginParam)
      else {
        // Already logged in — close modal and redirect if resume param present
        const resume = p.get('resume')
        if (resume === 'listing') {
          // Navigate to home with resume signal (clean URL)
          window.location.replace('/?resume=listing')
        }
      }
    }
  }, [location.search, user])

  const isOnInvDash = location.pathname.includes('/dashboard/investor')
  const isOnFndDash = location.pathname.includes('/dashboard/founder')
  const mapPath = isOnFndDash ? '/?mode=startup' : isOnInvDash ? '/?mode=investor' : '/'
  const tabs = [
    { label: '🗺 Map', path: mapPath },
    { label: '📊 Dashboard', path: typeof window !== 'undefined' && localStorage.getItem('lastDashboard') === 'investor' ? '/dashboard/investor' : '/dashboard/founder' },
  ]
  // "How it works" scrolls to section on home page or navigates there
  const scrollHowItWorks = () => {
    if (window.location.pathname === '/') {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.location.href = '/#how-it-works'
    }
  }

  const isActive = (path) =>
    path === '/' ? location.pathname === '/'
      : location.pathname.startsWith(path.replace('/founder', '').replace('/investor', ''))

  const handleDashboardClick = (e) => {
    if (!user) {
      e.preventDefault()
      setAuthModal('founder')
    }
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${scrolled ? 'bg-[#05090F]/95 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-[#05090F]/80 backdrop-blur-md'}`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 flex-shrink-0">
              <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <defs>
                  <radialGradient id="nb2" cx="50%" cy="45%" r="60%"><stop offset="0%" stopColor="#0F1D35" /><stop offset="100%" stopColor="#040810" /></radialGradient>
                  <linearGradient id="ngo2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFE066" /><stop offset="50%" stopColor="#F6A800" /><stop offset="100%" stopColor="#D4820A" /></linearGradient>
                  <linearGradient id="nbl2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#4A9EFF" /><stop offset="100%" stopColor="#1A5FC8" /></linearGradient>
                  <filter id="ngf2"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <circle cx="200" cy="200" r="185" fill="url(#nb2)" />
                <g transform="translate(106,62) scale(0.59)">
                  <path d="M110 10 L155 5 L195 15 L215 35 L210 65 L235 70 L255 55 L280 60 L290 90 L275 115 L285 140 L270 165 L290 180 L285 210 L265 235 L270 265 L255 290 L235 310 L210 330 L195 360 L175 385 L155 395 L135 385 L115 370 L95 345 L80 315 L70 285 L55 260 L50 230 L60 200 L45 175 L55 150 L75 135 L65 110 L75 85 L90 65 L95 40 Z" fill="url(#nbl2)" opacity="0.88" />
                </g>
                <circle cx="178" cy="266" r="6" fill="#F6C90E" filter="url(#ngf2)" opacity="0.95" />
                <circle cx="162" cy="233" r="4.5" fill="#63B3FF" filter="url(#ngf2)" opacity="0.9" />
                <g transform="translate(218,120)">
                  <path d="M18 0 C8 0 0 8 0 18 C0 30 18 50 18 50 C18 50 36 30 36 18 C36 8 28 0 18 0Z" fill="url(#ngo2)" />
                  <circle cx="18" cy="18" r="9" fill="#0A0E1A" opacity="0.65" />
                  <circle cx="18" cy="18" r="5" fill="url(#ngo2)" opacity="0.9" />
                </g>
                <circle cx="200" cy="200" r="185" fill="none" stroke="url(#ngo2)" strokeWidth="1.2" opacity="0.15" />
              </svg>
            </div>
            <div>
              <div className="text-base font-black text-white" style={{ fontFamily: 'Playfair Display,serif', letterSpacing: '-0.5px' }}>IndiaStartupMap</div>
              <div className="text-[9px] text-white/30 tracking-[2px] uppercase">Discover · Connect · Grow</div>
            </div>
          </Link>

          {/* Center tabs */}
          <div className="hidden md:flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1">
            {tabs.map(({ label, path }) => {
              const active = isActive(path)
              return (
                <Link key={path} to={path}
                  onClick={path.includes('dashboard') ? handleDashboardClick : undefined}
                  className="px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 border"
                  style={{
                    background: active ? 'rgba(74,158,255,0.14)' : 'transparent',
                    borderColor: active ? 'rgba(74,158,255,0.3)' : 'transparent',
                    color: active ? '#4A9EFF' : 'rgba(255,255,255,0.42)',
                  }}>
                  {label}
                </Link>
              )
            })}
          </div>

          {/* How it works + Admin */}
          <div className="hidden md:flex items-center gap-2 mr-1">
            <button onClick={scrollHowItWorks}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white/35 hover:text-white/70 transition-all border border-transparent hover:border-white/10">
              ❓ How it works
            </button>
            <Link to="/admin"
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border"
              style={{ borderColor: "rgba(226,55,68,0.2)", color: "rgba(226,55,68,0.6)", background: "rgba(226,55,68,0.05)" }}
              title="Admin panel">
              🔐 Admin
            </Link>
          </div>

          {/* Right — login or user */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {loading ? (
              <div className="w-28 h-8 rounded-xl bg-white/[0.05] animate-pulse" />
            ) : user ? (
              <UserMenu user={user} profile={profile} />
            ) : (
              <>
                <button onClick={() => setAuthModal('founder')}
                  className="px-4 py-2 rounded-xl text-xs font-black border transition-all hover:bg-blue-500/10"
                  style={{ borderColor: 'rgba(74,158,255,0.2)', color: '#4A9EFF', background: 'rgba(74,158,255,0.06)' }}>
                  🚀 Founder
                </button>
                <button onClick={() => setAuthModal('investor')}
                  className="px-4 py-2 rounded-xl text-xs font-black border transition-all hover:bg-purple-500/10"
                  style={{ borderColor: 'rgba(155,111,255,0.2)', color: '#9B6FFF', background: 'rgba(155,111,255,0.06)' }}>
                  💰 Investor
                </button>
              </>
            )}
          </div>

          <button className="md:hidden text-white/60 hover:text-white text-2xl" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-[#05090F]/95 backdrop-blur-xl border-t border-white/[0.06] px-6 py-5 flex flex-col gap-3 relative">
            {tabs.map(({ label, path }) => (
              <Link key={path} to={path} className="text-sm font-bold text-white/60 hover:text-white py-1">{label}</Link>
            ))}
            <button onClick={() => { scrollHowItWorks(); setMobileOpen(false) }} className="text-sm font-bold text-white/40 hover:text-white/70 text-left py-1">❓ How it works</button>
            <Link to="/admin" className="text-sm font-bold py-1" style={{ color: 'rgba(226,55,68,0.7)' }}>🔐 Admin</Link>
            <div className="border-t border-white/[0.06] pt-4 mt-1 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="text-xs text-white/40 truncate">{user.email}</div>
                  <Link to={profile?.role === 'investor' ? '/dashboard/investor' : '/dashboard/founder'} className="text-sm font-bold text-blue-400">📊 My Dashboard</Link>
                  <button onClick={() => { signOut(); toast.success('Signed out.') }} className="text-sm font-bold text-red-400/70 text-left">↩ Sign Out</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setAuthModal('founder'); setMobileOpen(false) }} className="btn-primary text-sm text-center py-2.5">🚀 Founder Login</button>
                  <button onClick={() => { setAuthModal('investor'); setMobileOpen(false) }}
                    className="text-sm font-black text-purple-400 py-2.5 rounded-xl border border-purple-500/20 bg-purple-500/8">
                    💰 Investor Login
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {authModal && <AuthModal defaultRole={authModal} onClose={() => setAuthModal(null)} />}
    </>
  )
}
