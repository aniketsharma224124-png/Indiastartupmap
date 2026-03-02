import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { getPendingStartups, updateStartupStatus, signIn, signOut, getSession } from '../lib/firebase'
import { getPendingInvestors, updateInvestorStatus } from '../lib/investorDb'

const ADMIN_EMAIL = 'aniketsharma224124@gmail.com'

export default function AdminPage() {
  const [session,          setSession]          = useState(null)
  const [email,            setEmail]            = useState('')
  const [password,         setPassword]         = useState('')
  const [authLoad,         setAuthLoad]         = useState(false)
  const [startups,         setStartups]         = useState([])
  const [investors,        setInvestors]        = useState([])   // ← NEW
  const [loading,          setLoading]          = useState(false)
  const [adminTab,         setAdminTab]         = useState('startups') // ← NEW: 'startups' | 'investors'

  useEffect(() => { getSession().then(setSession) }, [])
  useEffect(() => { if (session) fetchPending() }, [session])

  const fetchPending = async () => {
    setLoading(true)
    try {
      const [pendingStartups, pendingInvestors] = await Promise.all([
        getPendingStartups(),
        getPendingInvestors(),
      ])
      setStartups(pendingStartups)
      setInvestors(pendingInvestors)
    } catch {
      toast.error('Failed to load pending items')
    } finally {
      setLoading(false)
    }
  }

  const login = async (e) => {
    e.preventDefault()
    setAuthLoad(true)
    if (email.toLowerCase() !== ADMIN_EMAIL) {
      toast.error('⛔ Access denied.')
      setAuthLoad(false)
      return
    }
    try {
      const data = await signIn(email, password)
      const session = data?.session ?? data
      setSession(session)
      toast.success('Welcome back, Aniket 👋')
    } catch (err) {
      toast.error(err?.message || 'Wrong password.')
    } finally {
      setAuthLoad(false)
    }
  }

  // Startup approve/reject
  const actionStartup = async (id, status) => {
    try {
      await updateStartupStatus(id, status)
      setStartups(p => p.filter(s => s.id !== id))
      toast.success(status === 'approved' ? '✅ Startup Approved' : '❌ Startup Rejected')
    } catch { toast.error('Action failed') }
  }

  // Investor approve/reject
  const actionInvestor = async (id, status) => {
    try {
      await updateInvestorStatus(id, status)
      setInvestors(p => p.filter(i => i.id !== id))
      toast.success(status === 'approved' ? '✅ Investor Approved' : '❌ Investor Rejected')
    } catch { toast.error('Action failed') }
  }

  // ── LOGIN SCREEN ───────────────────────────────────────────────
  if (!session) return (
    <main className="relative z-10 pt-32 min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-sm animate-fade-up">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-5 text-2xl">🔒</div>
        <h1 className="text-2xl font-black text-white text-center mb-1" style={{ fontFamily: 'Playfair Display,serif' }}>Admin Login</h1>
        <p className="text-xs text-white/30 text-center mb-6">IndiaStartupMap dashboard · Authorized access only</p>
        <form onSubmit={login} className="space-y-3">
          <input className="input-field" type="email" placeholder="Admin email"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input-field" type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary w-full" disabled={authLoad}>
            {authLoad ? 'Verifying...' : 'Login →'}
          </button>
        </form>
      </div>
    </main>
  )

  // ── ADMIN PANEL ────────────────────────────────────────────────
  return (
    <main className="relative z-10 pt-24 max-w-4xl mx-auto px-6 pb-20">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <span className="section-label">Dashboard</span>
          <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>Admin Panel</h1>
          <p className="text-sm text-white/35 mt-1">
            {startups.length} startup{startups.length !== 1 ? 's' : ''} · {investors.length} investor{investors.length !== 1 ? 's' : ''} pending
          </p>
        </div>
        <button className="btn-secondary text-sm" onClick={() => { signOut(); setSession(null) }}>
          Sign Out
        </button>
      </div>

      {/* ── TAB TOGGLE (new) ── */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setAdminTab('startups')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            adminTab === 'startups'
              ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
              : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70'
          }`}
        >
          🚀 Startups {startups.length > 0 && (
            <span className="ml-2 bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {startups.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAdminTab('investors')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            adminTab === 'investors'
              ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
              : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70'
          }`}
        >
          💰 Investors {investors.length > 0 && (
            <span className="ml-2 bg-purple-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {investors.length}
            </span>
          )}
        </button>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="text-center py-20 text-white/30">Loading...</div>
      ) : adminTab === 'startups' ? (

        /* ── STARTUPS TAB (original, unchanged) ── */
        startups.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>All caught up!</h2>
            <p className="text-sm text-white/35 mt-2">No pending startup submissions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {startups.map(s => (
              <div key={s.id} className="card p-5 flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-xl"
                  style={{ background: s.brand_color || '#3B7DD8', fontFamily: 'Playfair Display,serif' }}>
                  {s.company_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-black text-white text-lg" style={{ fontFamily: 'Playfair Display,serif' }}>{s.company_name}</h3>
                    <span className="badge-premium">{s.plan || 'basic'}</span>
                  </div>
                  <p className="text-xs text-white/35 mb-1">{s.state} · {s.email}</p>
                  {s.description && <p className="text-sm text-white/50 mb-2 line-clamp-2">{s.description}</p>}
                  <a href={s.website_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline">{s.website_url} ↗</a>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => actionStartup(s.id, 'approved')}
                    className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center text-lg">
                    ✓
                  </button>
                  <button onClick={() => actionStartup(s.id, 'rejected')}
                    className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center text-lg">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )

      ) : (

        /* ── INVESTORS TAB (new) ── */
        investors.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>All caught up!</h2>
            <p className="text-sm text-white/35 mt-2">No pending investor applications.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {investors.map(inv => (
              <div key={inv.id} className="card p-5 flex items-start gap-4"
                style={{ borderColor: 'rgba(155,111,255,0.15)' }}>
                <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-xl"
                  style={{ background: inv.brand_color || '#9B6FFF', fontFamily: 'Playfair Display,serif' }}>
                  {inv.avatar || inv.firm_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-black text-white text-lg" style={{ fontFamily: 'Playfair Display,serif' }}>{inv.firm_name}</h3>
                    <span className="text-[9px] font-black tracking-wider bg-purple-400/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded">
                      {inv.plan || 'basic'}
                    </span>
                    {inv.open_to_pitches && (
                      <span className="text-[9px] font-black tracking-wider bg-green-400/10 text-green-400 border border-green-400/20 px-2 py-0.5 rounded">
                        OPEN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/35 mb-1">
                    via {inv.partner_name} · {inv.state} · {inv.email}
                  </p>
                  {inv.focus?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-1">
                      {inv.focus.map(f => (
                        <span key={f} className="text-[10px] bg-white/5 border border-white/10 text-white/40 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-white/30">
                    {inv.stage} · {inv.cheque_size}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => actionInvestor(inv.id, 'approved')}
                    className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center text-lg">
                    ✓
                  </button>
                  <button onClick={() => actionInvestor(inv.id, 'rejected')}
                    className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center text-lg">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </main>
  )
}
