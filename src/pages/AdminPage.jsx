import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { getPendingStartups, updateStartupStatus, signIn, signOut, getSession, db } from '../lib/firebase'
import { getPendingInvestors, updateInvestorStatus, getInvestors } from '../lib/investorDb'
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore'

const ADMIN_EMAIL = 'aniketsharma224124@gmail.com'

export default function AdminPage() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoad, setAuthLoad] = useState(false)
  const [startups, setStartups] = useState([])
  const [investors, setInvestors] = useState([])
  const [allStartups, setAllStartups] = useState([])
  const [allInvestors, setAllInvestors] = useState([])
  const [loading, setLoading] = useState(false)
  const [adminTab, setAdminTab] = useState('startups')
  const [confirmDelete, setConfirmDelete] = useState(null) // {type, id, name}

  useEffect(() => { getSession().then(setSession) }, [])
  useEffect(() => { if (session) fetchAll() }, [session])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pendS, pendI] = await Promise.all([getPendingStartups(), getPendingInvestors()])
      setStartups(pendS)
      setInvestors(pendI)
      // Fetch ALL startups
      const sSnap = await getDocs(collection(db, 'startups'))
      const toMs = d => d?.toMillis ? d.toMillis() : d?.seconds ? d.seconds * 1000 : typeof d === 'string' ? new Date(d).getTime() : 0
      const allS = sSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      allS.sort((a, b) => toMs(b.created_at) - toMs(a.created_at))
      setAllStartups(allS)
      // Fetch ALL investors
      const iSnap = await getDocs(collection(db, 'investors'))
      const allI = iSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      allI.sort((a, b) => toMs(b.created_at) - toMs(a.created_at))
      setAllInvestors(allI)
      console.log('[Admin] Loaded:', allS.length, 'startups,', allI.length, 'investors')
    } catch (err) {
      console.error('[Admin] fetchAll error:', err)
      toast.error('Failed to load data: ' + (err.message || ''))
    }
    finally { setLoading(false) }
  }

  const login = async (e) => {
    e.preventDefault()
    setAuthLoad(true)
    if (email.toLowerCase() !== ADMIN_EMAIL) { toast.error('⛔ Access denied.'); setAuthLoad(false); return }
    try {
      const data = await signIn(email, password)
      setSession(data?.session ?? data)
      toast.success('Welcome back, Aniket 👋')
    } catch (err) { toast.error(err?.message || 'Wrong password.') }
    finally { setAuthLoad(false) }
  }

  const actionStartup = async (id, status) => {
    try {
      await updateStartupStatus(id, status)
      setStartups(p => p.filter(s => s.id !== id))
      toast.success(status === 'approved' ? '✅ Startup Approved' : '❌ Startup Rejected')
      fetchAll()
    } catch { toast.error('Action failed') }
  }

  const actionInvestor = async (id, status) => {
    try {
      await updateInvestorStatus(id, status)
      setInvestors(p => p.filter(i => i.id !== id))
      toast.success(status === 'approved' ? '✅ Investor Approved' : '❌ Investor Rejected')
      fetchAll()
    } catch { toast.error('Action failed') }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    const { type, id, name } = confirmDelete
    try {
      await deleteDoc(doc(db, type === 'startup' ? 'startups' : 'investors', id))
      if (type === 'startup') setAllStartups(p => p.filter(s => s.id !== id))
      else setAllInvestors(p => p.filter(i => i.id !== id))
      toast.success(`🗑️ Deleted: ${name}`)
      setConfirmDelete(null)
    } catch (err) { toast.error('Delete failed: ' + (err.message || '')) }
  }

  const fmt = d => {
    if (!d) return '—'
    const date = d?.toDate ? d.toDate() : d?.seconds ? new Date(d.seconds * 1000) : new Date(d)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // ── LOGIN SCREEN ──
  if (!session) return (
    <main className="relative z-10 pt-32 min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-sm animate-fade-up">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-5 text-2xl">🔒</div>
        <h1 className="text-2xl font-black text-white text-center mb-1" style={{ fontFamily: 'Playfair Display,serif' }}>Admin Login</h1>
        <p className="text-xs text-white/30 text-center mb-6">IndiaStartupMap dashboard · Authorized access only</p>
        <form onSubmit={login} className="space-y-3">
          <input className="input-field" type="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input-field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary w-full" disabled={authLoad}>{authLoad ? 'Verifying...' : 'Login →'}</button>
        </form>
      </div>
    </main>
  )

  const TABS = [
    { key: 'startups', label: '🚀 Pending Startups', count: startups.length, color: 'blue' },
    { key: 'investors', label: '💰 Pending Investors', count: investors.length, color: 'purple' },
    { key: 'all-startups', label: '📋 All Startups', count: allStartups.length, color: 'cyan' },
    { key: 'all-investors', label: '📋 All Investors', count: allInvestors.length, color: 'pink' },
  ]

  return (
    <main className="relative z-10 pt-24 max-w-5xl mx-auto px-6 pb-20">

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="card p-8 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-4xl text-center mb-4">⚠️</div>
            <h3 className="text-lg font-black text-white text-center mb-2">Delete {confirmDelete.name}?</h3>
            <p className="text-sm text-white/40 text-center mb-6">This will permanently remove this {confirmDelete.type} from the database. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-white/15 text-white/50 hover:text-white transition-all">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all">🗑️ Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <span className="section-label">Dashboard</span>
          <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>Admin Panel</h1>
          <p className="text-sm text-white/35 mt-1">{allStartups.length} startups · {allInvestors.length} investors total</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={fetchAll}>🔄 Refresh</button>
          <button className="btn-secondary text-sm" onClick={() => { signOut(); setSession(null) }}>Sign Out</button>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setAdminTab(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${adminTab === t.key
              ? `bg-${t.color}-500/15 border-${t.color}-500/40 text-${t.color}-400`
              : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70'}`}
            style={adminTab === t.key ? { background: `rgba(99,179,255,0.1)`, borderColor: `rgba(99,179,255,0.3)`, color: '#63B3FF' } : {}}>
            {t.label}
            {t.count > 0 && <span className="ml-1.5 bg-white/10 text-white/60 text-[10px] font-black px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-white/30">Loading...</div>
      ) : adminTab === 'startups' ? (
        /* PENDING STARTUPS */
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
                  style={{ background: s.brand_color || '#3B7DD8', fontFamily: 'Playfair Display,serif' }}>{s.company_name?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-black text-white text-lg" style={{ fontFamily: 'Playfair Display,serif' }}>{s.company_name}</h3>
                    <span className="badge-premium">{s.plan || 'basic'}</span>
                  </div>
                  <p className="text-xs text-white/35 mb-1">{s.state} · {s.email}</p>
                  {s.description && <p className="text-sm text-white/50 mb-2 line-clamp-2">{s.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => actionStartup(s.id, 'approved')} className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center text-lg">✓</button>
                  <button onClick={() => actionStartup(s.id, 'rejected')} className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center text-lg">✕</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : adminTab === 'investors' ? (
        /* PENDING INVESTORS */
        investors.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>All caught up!</h2>
            <p className="text-sm text-white/35 mt-2">No pending investor applications.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {investors.map(inv => (
              <div key={inv.id} className="card p-5 flex items-start gap-4" style={{ borderColor: 'rgba(155,111,255,0.15)' }}>
                <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-xl"
                  style={{ background: inv.brand_color || '#9B6FFF', fontFamily: 'Playfair Display,serif' }}>{inv.avatar || inv.firm_name?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-black text-white text-lg" style={{ fontFamily: 'Playfair Display,serif' }}>{inv.firm_name}</h3>
                    <span className="text-[9px] font-black tracking-wider bg-purple-400/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded">{inv.plan || 'basic'}</span>
                  </div>
                  <p className="text-xs text-white/35 mb-1">via {inv.partner_name} · {inv.state} · {inv.email}</p>
                  {inv.focus?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-1">
                      {inv.focus.map(f => <span key={f} className="text-[10px] bg-white/5 border border-white/10 text-white/40 px-2 py-0.5 rounded-full">{f}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => actionInvestor(inv.id, 'approved')} className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center text-lg">✓</button>
                  <button onClick={() => actionInvestor(inv.id, 'rejected')} className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center text-lg">✕</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : adminTab === 'all-startups' ? (
        /* ALL STARTUPS */
        <div className="space-y-3">
          <div className="text-xs text-white/30 mb-2">{allStartups.length} total startups in database</div>
          {allStartups.map(s => (
            <div key={s.id} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-sm overflow-hidden"
                style={{ background: s.brand_color || '#3B7DD8' }}>
                {s.logo_url ? <img src={s.logo_url} alt="" className="w-full h-full object-cover" /> : s.company_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm truncate">{s.company_name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${s.status === 'approved' ? 'bg-green-500/15 text-green-400' : s.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>{s.status || 'pending'}</span>
                  <span className="text-[9px] bg-white/5 text-white/30 px-1.5 py-0.5 rounded">{s.plan || 'basic'}</span>
                </div>
                <p className="text-[11px] text-white/30 truncate">{s.email} · {s.state} · Listed: {fmt(s.listing_date || s.created_at)}</p>
              </div>
              <button onClick={() => setConfirmDelete({ type: 'startup', id: s.id, name: s.company_name })}
                className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center text-sm flex-shrink-0" title="Delete">🗑️</button>
            </div>
          ))}
        </div>
      ) : (
        /* ALL INVESTORS */
        <div className="space-y-3">
          <div className="text-xs text-white/30 mb-2">{allInvestors.length} total investors in database</div>
          {allInvestors.map(inv => (
            <div key={inv.id} className="card p-4 flex items-center gap-3" style={{ borderColor: 'rgba(155,111,255,0.1)' }}>
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-sm overflow-hidden"
                style={{ background: inv.brand_color || '#9B6FFF' }}>
                {inv.logo_url ? <img src={inv.logo_url} alt="" className="w-full h-full object-cover" /> : (inv.avatar || inv.firm_name?.[0])}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm truncate">{inv.firm_name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${inv.status === 'approved' ? 'bg-green-500/15 text-green-400' : inv.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>{inv.status || 'pending'}</span>
                  <span className="text-[9px] bg-purple-400/10 text-purple-300 px-1.5 py-0.5 rounded">{inv.plan || 'basic'}</span>
                </div>
                <p className="text-[11px] text-white/30 truncate">{inv.partner_name} · {inv.email} · {inv.state} · Listed: {fmt(inv.listing_date || inv.created_at)}</p>
              </div>
              <button onClick={() => setConfirmDelete({ type: 'investor', id: inv.id, name: inv.firm_name })}
                className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center text-sm flex-shrink-0" title="Delete">🗑️</button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
