import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  getAllMyInvestorProfiles, getIntroRequestsByInvestor,
  updateIntroRequestStatus, getSavedStartupsForInvestor,
  getMarkedInterestByInvestor, sendInvestorIntroToStartup,
} from '../lib/investorDb'
import { INVESTOR_PLANS } from '../lib/razorpay'

const timeAgo = (iso) => {
  if (!iso) return ''
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000)
  if (d === 0) return 'Today'; if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d ago`; return `${Math.floor(d / 7)}w ago`
}

// Compute expiry from listing_date OR created_at + plan duration
const getPlanExpiry = (inv) => {
  const base = inv?.listing_date || inv?.created_at
  if (!base) return null
  const months = INVESTOR_PLANS[inv?.plan]?.durationMonths || 12
  const d = new Date(base)
  d.setMonth(d.getMonth() + months)
  return d
}

const fmt = (d) => d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const isExpired = (d) => d && d < new Date()
const isExpiring = (d) => d && !isExpired(d) && (d - new Date()) < 2 * 86400000

export default function InvestorDashboard() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [allProfiles, setAllProfiles] = useState([])
  const [profileIdx, setProfileIdx] = useState(0)
  const [investor, setInvestor] = useState(null)
  const [inbox, setInbox] = useState([])
  const [marked, setMarked] = useState([])
  const [saved, setSaved] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('inbox')
  const [expanded, setExpanded] = useState({})
  const [showExpiredPopup, setShowExpiredPopup] = useState(false)
  const [introTarget, setIntroTarget] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/?login=investor', { replace: true }); return }
    localStorage.setItem('lastDashboard', 'investor')
  }, [user, authLoading, navigate])

  const loadForProfile = async (inv) => {
    console.log('[InvestorDashboard] loadForProfile:', { investorId: inv.id, uid: user.uid, email: user.email, plan: inv.plan })
    const [requests, savedList, markedList] = await Promise.all([
      getIntroRequestsByInvestor(inv.id, user.uid),
      getSavedStartupsForInvestor(user.uid),
      getMarkedInterestByInvestor(user.uid),
    ])
    console.log('[InvestorDashboard] inbox results:', requests.length, 'saved:', savedList.length, 'marked:', markedList.length)
    if (requests.length > 0) console.log('[InvestorDashboard] first request:', requests[0])
    requests.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    setInbox(requests)
    setSaved(savedList)
    setMarked(markedList)
  }

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const profiles = await getAllMyInvestorProfiles(user.uid, user.email)
        if (profiles.length > 0) {
          setAllProfiles(profiles)
          const inv = profiles[0]
          setInvestor(inv)
          await loadForProfile(inv)
          const expiry = getPlanExpiry(inv)
          if (expiry && isExpired(expiry)) setShowExpiredPopup(true)
        } else {
          // No profile — show empty state with CTA
          setInvestor(null)
          setInbox([]); setSaved([]); setMarked([])
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
        setInvestor(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const switchProfile = async (idx) => {
    setProfileIdx(idx)
    const inv = allProfiles[idx]
    setInvestor(inv)
    setLoading(true)
    try { await loadForProfile(inv) } catch { }
    setLoading(false)
  }

  const handleAction = async (id, status) => {
    const prevStatus = inbox.find(r => r.id === id)?.status
    setInbox(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    try {
      await updateIntroRequestStatus(id, status)
      toast.success(status === 'accepted' ? '✓ Accepted! Founder will be notified.' : 'Request declined.')
    } catch (err) {
      console.error('[handleAction] error:', err)
      setInbox(prev => prev.map(r => r.id === id ? { ...r, status: prevStatus || 'pending' } : r))
      toast.error('Failed to update: ' + (err.message || 'Check console'))
    }
  }

  const handleSendInvestorIntro = async (startup) => {
    if (!investor) return
    const msg = `Hi, I'm ${investor.partner_name} from ${investor.firm_name}. We're interested in connecting regarding a potential investment opportunity. Reply to ${investor.email || user.email} to start the conversation.`
    try {
      await sendInvestorIntroToStartup({
        investorId: investor.id, investorFirm: investor.firm_name,
        partnerName: investor.partner_name,
        startupId: startup.startup_id || startup.id,
        startupName: startup.startup_name || startup.company_name,
        founderEmail: startup.startup_email || startup.email || '',
        message: msg,
      })
      setIntroTarget(null)
      toast.success(`Intro request sent to ${startup.startup_name || startup.company_name}!`)
    } catch { toast.error('Failed to send intro.') }
  }

  if (authLoading || loading) return (
    <main className="relative z-10 pt-32 min-h-screen flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-3 animate-pulse">💰</div><div className="text-white/30 text-sm">Loading…</div></div>
    </main>
  )
  if (!user) return null

  // If no investor profile yet — show CTA
  if (!investor) return (
    <main className="relative z-10 pt-24 max-w-4xl mx-auto px-6 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white mb-8">← Back to Map</Link>
      <div className="card p-12 text-center">
        <div className="text-6xl mb-5">💰</div>
        <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Playfair Display,serif' }}>No Investor Profile Yet</h2>
        <p className="text-sm text-white/40 mb-8 max-w-md mx-auto leading-relaxed">List your fund on the Investor Map to start receiving curated pitch requests from verified founders across India.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/investor-listing" className="px-8 py-3 rounded-xl font-black text-sm text-white transition-all" style={{ background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)' }}>💰 List as Investor →</Link>
          <Link to="/" className="px-8 py-3 rounded-xl font-black text-sm border border-white/15 text-white/60 hover:text-white transition-all">Browse Map →</Link>
        </div>
      </div>
    </main>
  )

  const pendingCount = inbox.filter(r => r.status === 'pending').length
  const expiry = getPlanExpiry(investor)
  const expiring = isExpiring(expiry)
  const expired = isExpired(expiry)
  const isTopTier = investor?.plan === 'scout_pro' || investor?.plan === 'partner_elite'
  const isPartnerElite = investor?.plan === 'partner_elite'

  const NAV_ITEMS = [
    { id: 'inbox', icon: '📥', label: `Inbox (${pendingCount} new)` },
    { id: 'marked', icon: '👀', label: `Marked Interest (${marked.length})` },
    ...(isPartnerElite ? [{ id: 'shortlist', icon: '📌', label: `Shortlist (${saved.length})` }] : []),
    { id: 'flow', icon: '📊', label: 'Deal Flow' },
    { id: 'listing', icon: '🗺', label: 'My Listing' },
  ]

  return (
    <main className="relative z-10 pt-24 max-w-7xl mx-auto px-6 pb-20">

      {/* Expired plan popup */}
      {showExpiredPopup && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}>
          <div className="w-full max-w-md rounded-2xl p-8 text-center" style={{ background: '#0D1628', border: '1px solid rgba(226,55,68,0.4)' }}>
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>Plan Expired</h3>
            <p className="text-sm text-white/50 mb-6">Your investor listing plan expired on <strong className="text-white/70">{fmt(expiry)}</strong>. Renew to keep your listing active on the map.</p>
            <div className="flex gap-3">
              <Link to="/investor-listing" onClick={() => setShowExpiredPopup(false)}
                className="flex-1 py-3 rounded-xl font-black text-sm text-white text-center"
                style={{ background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)' }}>
                🔄 Continue Plan →
              </Link>
              <button onClick={() => setShowExpiredPopup(false)}
                className="flex-1 py-3 rounded-xl font-black text-sm border border-red-500/25 text-red-400/70 hover:text-red-400 hover:bg-red-500/8 transition-all">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intro-to-startup modal */}
      {introTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(14px)' }} onClick={() => setIntroTarget(null)}>
          <div className="w-full max-w-md rounded-2xl p-6 relative" style={{ background: '#0D1628', border: '1px solid rgba(155,111,255,0.3)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setIntroTarget(null)} className="absolute top-4 right-4 text-white/30 hover:text-white text-2xl">×</button>
            <div className="text-[10px] text-purple-400 tracking-[3px] uppercase mb-1">Send Intro Request</div>
            <h3 className="text-xl font-black text-white mb-4" style={{ fontFamily: 'Playfair Display,serif' }}>To {introTarget.startup_name || introTarget.company_name}</h3>
            <p className="text-sm text-white/50 mb-5 leading-relaxed">We'll notify the founder that <strong className="text-white/70">{investor.firm_name}</strong> is interested in connecting. They'll see it in their dashboard inbox.</p>
            <button onClick={() => handleSendInvestorIntro(introTarget)} className="w-full py-3 rounded-xl font-black text-sm text-white" style={{ background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)' }}>
              💌 Send Intro Request →
            </button>
          </div>
        </div>
      )}

      <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white mb-6">← Back to Map</Link>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 bg-purple-500/8 border border-purple-500/15 rounded-xl px-4 py-3 flex-1">
          {user.photoURL ? <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
            : <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-black">{(user.displayName || 'I')[0].toUpperCase()}</div>}
          <div>
            <div className="text-sm font-bold text-white">Welcome back, {user.displayName?.split(' ')[0] || 'Investor'}! 👋</div>
            <div className="text-xs text-white/35">{user.email} · Investor Account</div>
          </div>
          {pendingCount > 0 && <span className="ml-auto text-[9px] bg-purple-500/20 border border-purple-500/35 text-purple-300 px-2.5 py-1 rounded-full font-black">{pendingCount} pending</span>}
        </div>
        <div className="flex gap-1 p-1 rounded-xl border border-white/10 bg-white/[0.03] flex-shrink-0">
          <button onClick={() => navigate('/dashboard/founder')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white/35 hover:text-white/60 transition-all">🚀 Startup</button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-black transition-all" style={{ background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)', color: 'white' }}>💰 Investor</button>
        </div>
      </div>

      {/* Multi-profile switcher */}
      {allProfiles.length > 1 && (
        <div className="mb-4 flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3">
          <span className="text-xs text-white/40 flex-shrink-0">Switch profile:</span>
          <div className="flex gap-2 flex-wrap">
            {allProfiles.map((p, i) => (
              <button key={p.id} onClick={() => switchProfile(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${i === profileIdx ? 'text-white' : 'text-white/35 hover:text-white/60 border border-white/10'}`}
                style={i === profileIdx ? { background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)' } : {}}>
                💰 {p.firm_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Banners */}
      {investor?.status === 'pending' && (
        <div className="mb-4 flex items-center gap-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl px-4 py-3">
          <span className="text-xl">⏳</span>
          <div><div className="text-sm font-bold text-yellow-400">Profile Under Review</div><div className="text-xs text-white/40">You'll appear on the map within 24 hours.</div></div>
        </div>
      )}
      {expiring && !expired && (
        <div className="mb-4 flex items-center gap-3 bg-orange-500/8 border border-orange-500/20 rounded-xl px-4 py-3">
          <span className="text-xl">⚠️</span>
          <div className="flex-1"><div className="text-sm font-bold text-orange-400">Plan expiring soon</div><div className="text-xs text-white/40">Your plan expires on <strong>{fmt(expiry)}</strong>. Renew to keep your listing active.</div></div>
          <Link to="/investor-listing" className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-black text-orange-400 border border-orange-500/25 hover:bg-orange-500/10 transition-all">Renew →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl mb-3"
              style={{ background: investor?.brand_color || '#9B6FFF', fontFamily: 'Playfair Display,serif' }}>
              {investor?.logo_url ? <img src={investor.logo_url} alt="" className="w-full h-full rounded-2xl object-cover" /> : (investor?.avatar || investor?.firm_name?.[0])}
            </div>
            <div className="font-black text-white text-base leading-tight mb-0.5" style={{ fontFamily: 'Playfair Display,serif' }}>{investor?.firm_name}</div>
            <div className="text-xs text-white/35 mb-1">{investor?.partner_name}</div>
            {isPartnerElite && (
              <span className="inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full mb-2"
                style={{ background: 'rgba(246,201,14,0.15)', color: '#F6C90E', border: '1px solid rgba(246,201,14,0.3)' }}>
                👑 PARTNER ELITE
              </span>
            )}
            {!isPartnerElite && (
              <span className="inline-block text-[9px] font-bold px-2.5 py-0.5 rounded-full mb-2"
                style={{ background: 'rgba(155,111,255,0.1)', color: '#9B6FFF', border: '1px solid rgba(155,111,255,0.25)' }}>
                {investor?.plan?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Plan
              </span>
            )}
            {expiry && (
              <div className={`text-[10px] mb-3 px-2 py-1 rounded-lg inline-block ${expired ? 'bg-red-500/15 text-red-400 border border-red-500/25' : expiring ? 'bg-orange-500/10 text-orange-400' : 'bg-white/[0.04] text-white/30'}`}>
                {expired ? '⚠️ Expired ' : '📅 Expires '}{fmt(expiry)}
              </div>
            )}
            <div className="bg-purple-500/8 border border-purple-500/15 rounded-xl p-3">
              <div className="text-[9px] text-purple-300/60 uppercase tracking-[2px] mb-1">Pending Requests</div>
              <div className="text-3xl font-black text-purple-300 mb-0.5" style={{ fontFamily: 'Playfair Display,serif' }}>{pendingCount}</div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${investor?.open_to_pitches ? 'bg-green-400' : 'bg-red-400/60'}`} />
              <span className="text-[10px] text-white/40">{investor?.open_to_pitches ? 'Open to pitches' : 'Not accepting pitches'}</span>
            </div>
            {investor?.id && (
              <Link to={`/investor/${investor.id}`} className="mt-3 text-[10px] text-purple-400 hover:underline block">View public profile →</Link>
            )}
          </div>

          <div className="card p-3">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left w-full transition-all ${activeTab === item.id ? 'bg-purple-500/12 text-purple-400' : 'text-white/35 hover:text-white/70 hover:bg-white/[0.04]'}`}>
                <span>{item.icon}</span><span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="card p-4">
            <div className="text-[9px] text-white/25 uppercase tracking-widest mb-3">Quick Actions</div>
            <div className="flex flex-col gap-2">
              <Link to="/?browse=startups" className="text-xs text-blue-400 hover:text-blue-300">📋 Browse Startups</Link>
              <Link to="/" className="text-xs text-purple-400 hover:text-purple-300">🗺 Investor Map</Link>
              {!isTopTier && <Link to="/investor-listing" className="text-xs text-green-400 hover:text-green-300">⬆️ Upgrade Plan</Link>}
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex flex-col gap-5">

          {/* INBOX */}
          {activeTab === 'inbox' && (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="font-black text-white text-base">📥 Intro Requests Inbox</h2>
                {pendingCount > 0 && <span className="text-[10px] bg-purple-500 text-white font-black px-2 py-0.5 rounded-full">{pendingCount} new</span>}
              </div>
              {inbox.length === 0 ? (
                <div className="text-center py-10"><div className="text-4xl mb-3">📭</div><p className="text-sm text-white/30">No intro requests yet.</p></div>
              ) : (
                <div className="space-y-4">
                  {inbox.map(r => (
                    <div key={r.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
                      style={{ borderColor: r.status === 'accepted' ? 'rgba(0,208,156,0.2)' : r.status === 'declined' ? 'rgba(226,55,68,0.15)' : undefined }}>
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-sm"
                            style={{ background: r.color || '#9B6FFF', fontFamily: 'Playfair Display,serif' }}>
                            {r.logo || r.startup_name?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-black text-white text-sm">{r.startup_name}</span>
                              {r.sector && <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{r.sector}</span>}
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${r.status === 'accepted' ? 'bg-green-500/15 text-green-400' : r.status === 'declined' ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                {r.status === 'accepted' ? '✓ Accepted' : r.status === 'declined' ? '✕ Declined' : '⏳ Pending'}
                              </span>
                            </div>
                            <div className="text-xs text-white/35">{timeAgo(r.created_at)}</div>
                          </div>
                          <button onClick={() => setExpanded(p => ({ ...p, [r.id]: !p[r.id] }))} className="text-white/25 hover:text-white text-xs ml-2 flex-shrink-0">
                            {expanded[r.id] ? '▲' : '▼ Pitch'}
                          </button>
                        </div>

                        {/* Contact details + pitch */}
                        {(r.status === 'accepted' || expanded[r.id]) && (
                          <div className="mt-3 space-y-2">
                            {r.pitch && <div className="p-3 rounded-xl text-xs text-white/50 leading-relaxed italic" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>"{r.pitch}"</div>}
                            <div className="p-3 rounded-xl bg-purple-500/8 border border-purple-500/15 space-y-1.5">
                              <div className="text-[9px] text-purple-300/60 uppercase tracking-[2px] mb-1.5">Founder Contact</div>
                              {(r.founder_contact_email || r.founder_email) && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px]">✉️</span>
                                  <a href={`mailto:${r.founder_contact_email || r.founder_email}`} className="text-xs text-blue-400 hover:underline">{r.founder_contact_email || r.founder_email}</a>
                                </div>
                              )}
                              {r.founder_phone && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px]">📞</span>
                                  <a href={`tel:${r.founder_phone}`} className="text-xs text-green-400 hover:underline">{r.founder_phone}</a>
                                </div>
                              )}
                              {r.founder_linkedin && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px]">🔗</span>
                                  <a href={r.founder_linkedin.startsWith('http') ? r.founder_linkedin : `https://${r.founder_linkedin}`} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:underline truncate">{r.founder_linkedin}</a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {r.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => handleAction(r.id, 'accepted')} className="flex-1 py-2 rounded-lg text-xs font-black text-white" style={{ background: 'linear-gradient(135deg,#00a876,#00D09C)' }}>✓ Accept</button>
                            <button onClick={() => handleAction(r.id, 'declined')} className="flex-1 py-2 rounded-lg text-xs font-black border border-red-500/25 text-red-400/70 hover:text-red-400 hover:bg-red-500/8 transition-all">✕ Decline</button>
                          </div>
                        )}
                        {r.status === 'accepted' && (
                          <div className="mt-3 p-2 rounded-lg bg-green-500/8 border border-green-500/15 text-xs text-green-400/70 text-center">
                            ✓ Accepted — reach out via contact details above
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MARKED INTEREST */}
          {activeTab === 'marked' && (
            <div className="card p-5">
              <h2 className="font-black text-white text-base mb-2">👀 Marked Interest</h2>
              <p className="text-xs text-white/30 mb-5">Startups you've marked interest in. Send them a direct intro request.</p>
              {marked.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">👀</div>
                  <p className="text-sm text-white/30 mb-3">No startups marked yet.</p>
                  <Link to="/" className="inline-block text-xs text-blue-400 px-4 py-2 rounded-xl border border-blue-500/20 bg-blue-500/8 hover:bg-blue-500/15 transition-all">Browse Startup Map →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {marked.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-green-500/20 transition-colors">
                      <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-sm" style={{ background: s.brand_color || '#3B7DD8' }}>
                        {(s.startup_name || s.company_name)?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm">{s.startup_name || s.company_name}</p>
                        <p className="text-xs text-white/35">{s.sector}{s.state ? ` · ${s.state}` : ''} · {timeAgo(s.created_at)}</p>
                      </div>
                      <button onClick={() => setIntroTarget(s)}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{ background: 'rgba(74,158,255,0.08)', border: '1px solid rgba(74,158,255,0.25)', color: '#4A9EFF' }}>
                        ✉️ Intro
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* SHORTLIST — Partner Elite only */}
          {activeTab === 'shortlist' && isPartnerElite && (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="font-black text-white text-base">📌 Shortlisted Startups</h2>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(246,201,14,0.15)', color: '#F6C90E', border: '1px solid rgba(246,201,14,0.3)' }}>👑 PARTNER ELITE</span>
              </div>
              {saved.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📌</div>
                  <p className="text-sm text-white/35 mb-3">No startups shortlisted yet.</p>
                  <p className="text-xs text-white/25">Save startups from the map to build your shortlist.</p>
                  <Link to="/" className="inline-block mt-4 text-xs text-purple-400 hover:underline">Browse Startup Map →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {saved.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(246,201,14,0.03)', border: '1px solid rgba(246,201,14,0.12)' }}>
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-sm"
                        style={{ background: s.brand_color || '#3B7DD8', fontFamily: 'Playfair Display,serif' }}>
                        {s.company_name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm">{s.company_name}</p>
                        <p className="text-xs text-white/35">{s.sector}{s.state ? ` · ${s.state}` : ''}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleSendInvestorIntro(s)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(74,158,255,0.08)', border: '1px solid rgba(74,158,255,0.25)', color: '#4A9EFF' }}>
                          ✉️ Send Intro
                        </button>
                        {s.website_url && <a href={s.website_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-2.5 py-1.5 rounded-lg border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>↗</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DEAL FLOW */}
          {activeTab === 'flow' && (
            <div className="card p-5">
              <h2 className="font-black text-white text-base mb-5">📊 Deal Flow Analytics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { v: inbox.length.toString(), l: 'Total Pitches', c: '#9B6FFF' },
                  { v: pendingCount.toString(), l: 'Pending Review', c: '#F6C90E' },
                  { v: inbox.filter(r => r.status === 'accepted').length.toString(), l: 'Accepted', c: '#00D09C' },
                  { v: (saved.length + marked.length).toString(), l: 'Tracked Startups', c: '#4A9EFF' },
                ].map(({ v, l, c }) => (
                  <div key={l} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-2xl font-black mb-0.5" style={{ fontFamily: 'Playfair Display,serif', color: c }}>{v}</div>
                    <div className="text-[10px] text-white/35">{l}</div>
                  </div>
                ))}
              </div>

              {/* Partner Elite advanced analytics */}
              {isPartnerElite && (
                <>
                  {/* Conversion funnel */}
                  <div className="rounded-xl p-5 mb-5" style={{ background: 'rgba(246,201,14,0.03)', border: '1px solid rgba(246,201,14,0.12)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="font-black text-white text-sm">📈 Conversion Funnel</h3>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(246,201,14,0.15)', color: '#F6C90E', border: '1px solid rgba(246,201,14,0.3)' }}>👑 ELITE</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Total Pitches Received', value: inbox.length, width: 100, color: '#9B6FFF' },
                        { label: 'Reviewed (Non-Pending)', value: inbox.filter(r => r.status !== 'pending').length, width: inbox.length > 0 ? (inbox.filter(r => r.status !== 'pending').length / inbox.length * 100) : 0, color: '#4A9EFF' },
                        { label: 'Accepted', value: inbox.filter(r => r.status === 'accepted').length, width: inbox.length > 0 ? (inbox.filter(r => r.status === 'accepted').length / inbox.length * 100) : 0, color: '#00D09C' },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/50">{item.label}</span>
                            <span className="font-bold text-white">{item.value}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(item.width, 2)}%`, background: item.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sector breakdown */}
                  <div className="rounded-xl p-5 mb-5" style={{ background: 'rgba(155,111,255,0.03)', border: '1px solid rgba(155,111,255,0.12)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="font-black text-white text-sm">🎯 Sector Breakdown</h3>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(246,201,14,0.15)', color: '#F6C90E', border: '1px solid rgba(246,201,14,0.3)' }}>👑 ELITE</span>
                    </div>
                    {(() => {
                      const sectors = {}
                        ;[...inbox, ...marked, ...saved].forEach(item => {
                          const s = item.sector || item.startup_sector || 'Other'
                          if (s) sectors[s] = (sectors[s] || 0) + 1
                        })
                      const sorted = Object.entries(sectors).sort((a, b) => b[1] - a[1])
                      if (sorted.length === 0) return <p className="text-xs text-white/30">No sector data yet. Interact with startups to see breakdown.</p>
                      const max = sorted[0][1]
                      return (
                        <div className="space-y-2">
                          {sorted.slice(0, 6).map(([name, count]) => (
                            <div key={name} className="flex items-center gap-3">
                              <span className="text-xs text-white/50 w-24 flex-shrink-0 truncate">{name}</span>
                              <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, background: 'linear-gradient(90deg, #9B6FFF, #7C3AED)' }} />
                              </div>
                              <span className="text-xs font-bold text-white w-6 text-right">{count}</span>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Deal flow report summary */}
                  <div className="rounded-xl p-5 mb-5" style={{ background: 'rgba(0,208,156,0.03)', border: '1px solid rgba(0,208,156,0.12)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="font-black text-white text-sm">📋 Deal Flow Summary</h3>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(246,201,14,0.15)', color: '#F6C90E', border: '1px solid rgba(246,201,14,0.3)' }}>👑 ELITE</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Acceptance Rate', value: inbox.length > 0 ? `${Math.round(inbox.filter(r => r.status === 'accepted').length / inbox.length * 100)}%` : '—', icon: '✅' },
                        { label: 'Avg. Response Time', value: 'Real-time', icon: '⚡' },
                        { label: 'Shortlisted', value: saved.length.toString(), icon: '📌' },
                        { label: 'Interests Marked', value: marked.length.toString(), icon: '👀' },
                      ].map(item => (
                        <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <div className="text-lg mb-0.5">{item.icon}</div>
                          <div className="text-sm font-black text-white">{item.value}</div>
                          <div className="text-[10px] text-white/30">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Partner Elite — Direct Contact Unlock */}
              {isPartnerElite && inbox.filter(r => r.status === 'accepted').length > 0 && (
                <div className="rounded-xl p-5 mb-5" style={{ background: 'rgba(246,201,14,0.03)', border: '1px solid rgba(246,201,14,0.12)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-black text-white text-sm">📞 Direct Founder Contacts</h3>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(246,201,14,0.15)', color: '#F6C90E', border: '1px solid rgba(246,201,14,0.3)' }}>👑 ELITE</span>
                  </div>
                  <p className="text-xs text-white/40 mb-3">Accepted founders' contact info is unlocked for you.</p>
                  <div className="space-y-2">
                    {inbox.filter(r => r.status === 'accepted').slice(0, 5).map(r => (
                      <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs" style={{ background: r.color || '#3B7DD8' }}>{r.startup_name?.[0]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white">{r.startup_name}</p>
                          {(r.founder_contact_email || r.founder_email) && (
                            <a href={`mailto:${r.founder_contact_email || r.founder_email}`} className="text-[10px] text-blue-400 hover:underline">
                              ✉️ {r.founder_contact_email || r.founder_email}
                            </a>
                          )}
                        </div>
                        {r.founder_linkedin && (
                          <a href={r.founder_linkedin.startsWith('http') ? r.founder_linkedin : `https://${r.founder_linkedin}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-purple-400 hover:underline flex-shrink-0">🔗 LinkedIn</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {!isTopTier && (
                <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(246,201,14,0.05)', border: '1px solid rgba(246,201,14,0.15)' }}>
                  <div className="text-2xl mb-2">⭐</div>
                  <div className="text-sm font-black text-white mb-1">Upgrade to Partner Elite</div>
                  <div className="text-xs text-white/40 mb-4 leading-relaxed">Unlock AI Top 20 placement, startup bookmarking, and priority placement.</div>
                  <Link to="/investor-listing?plan=partner_elite"
                    className="inline-block px-6 py-2.5 rounded-xl font-black text-sm text-black transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#F6C90E,#d4a500)' }}>
                    ⭐ Upgrade to Partner Elite →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* LISTING */}
          {activeTab === 'listing' && (
            <div className="card p-5">
              <h2 className="font-black text-white text-base mb-5">🗺 My Listing</h2>
              <div className="flex gap-4 items-start mb-6 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl flex-shrink-0"
                  style={{ background: investor?.brand_color || '#9B6FFF', fontFamily: 'Playfair Display,serif' }}>
                  {investor?.avatar || investor?.firm_name?.[0]}
                </div>
                <div>
                  <h3 className="font-black text-white text-lg" style={{ fontFamily: 'Playfair Display,serif' }}>{investor?.firm_name}</h3>
                  <p className="text-xs text-white/35 mt-0.5">{investor?.partner_name} · {investor?.plan} plan</p>
                </div>
              </div>
              {[['Plan', investor?.plan?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'], ['Status', investor?.open_to_pitches ? 'Open to Pitches' : 'Closed'], ['State', investor?.state || '—'], ['Listed on', fmt(investor?.listing_date || investor?.created_at ? new Date(investor?.listing_date || investor?.created_at) : null)], ['Plan Expires', fmt(expiry)]].map(([l, v]) => (
                <div key={l} className="flex justify-between py-3 border-b border-white/[0.05] last:border-0">
                  <span className="text-xs text-white/35">{l}</span>
                  <span className="text-sm font-bold text-white">{v}</span>
                </div>
              ))}

              {/* Partner Elite — Plan Perks Overview */}
              {isPartnerElite && (
                <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(246,201,14,0.04)', border: '1px solid rgba(246,201,14,0.15)' }}>
                  <div className="text-[9px] text-yellow-400/70 uppercase tracking-[2px] mb-2 font-bold">👑 Your Partner Elite Perks</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: '📌', label: 'Priority Map Placement' },
                      { icon: '📞', label: 'Direct Contact Unlock' },
                      { icon: '📋', label: 'Deal Flow Reports' },
                      { icon: '⭐', label: 'Gold Badge' },
                      { icon: '📌', label: 'Shortlisting Tool' },
                      { icon: '🌍', label: 'Unlimited States' },
                      { icon: '🤖', label: 'AI Top 20 Ranking' },
                    ].map(p => (
                      <div key={p.label} className="flex items-center gap-1.5 text-[10px] text-white/50">
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <Link to="/investor-listing" className="btn-primary text-sm flex-1 text-center" style={{ background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)' }}>
                  {isTopTier ? '🔄 Renew Plan →' : '⬆️ Upgrade Plan →'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
    </main >
  )
}
