import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import IndiaMap from '../components/IndiaMap'
import InvestorMapSVG from '../components/InvestorMapSVG'
import ListingForm from '../components/ListingForm'
import SearchBar from '../components/SearchBar'
import { INDIAN_STATES } from '../data/states'
import { useAuth } from '../context/AuthContext'
import { getStartups, getStartupCountByState, getFoundingCounts } from '../lib/firebase'
import { PLANS, INVESTOR_PLANS, FOUNDING_PROGRAM } from '../lib/razorpay'
import { getInvestors, getInvestorCountByState, sendIntroRequest, saveStartupForInvestor, hasAlreadySentIntro, markInvestorInterest } from '../lib/investorDb'
import { INVESTORS_BY_STATE } from '../data/investors'

// ── REGION NAV ────────────────────────────────────────────────
const REGION_ORDER = ['north', 'south', 'east', 'west', 'central', 'northeast']
const REGION_LABELS = { north: '🏔 North', south: '🌴 South', east: '🌅 East', west: '🌊 West', central: '🏛 Central', northeast: '🍃 NE' }
const REGION_ACCENT = { north: '#3B7DD8', south: '#2ecc9a', east: '#e67e22', west: '#9b59b6', central: '#e74c3c', northeast: '#1abc9c' }
const statesByRegion = REGION_ORDER.reduce((acc, r) => { acc[r] = INDIAN_STATES.filter(s => s.region === r); return acc }, {})

function StatesNavbar({ onSelect }) {
  const [activeRegion, setActiveRegion] = useState(null)
  const visibleStates = activeRegion ? statesByRegion[activeRegion] : INDIAN_STATES
  return (
    <div className="mb-3 select-none">
      <div className="flex gap-1 mb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {REGION_ORDER.map(r => {
          const active = activeRegion === r
          return (
            <button key={r} onClick={() => setActiveRegion(active ? null : r)}
              className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border"
              style={{ background: active ? `${REGION_ACCENT[r]}20` : 'transparent', borderColor: active ? `${REGION_ACCENT[r]}55` : 'rgba(255,255,255,0.07)', color: active ? REGION_ACCENT[r] : 'rgba(255,255,255,0.3)' }}>
              {REGION_LABELS[r]}
            </button>
          )
        })}
        {activeRegion && <button onClick={() => setActiveRegion(null)} className="flex-shrink-0 px-2 py-1 text-[10px] text-white/20 hover:text-white/50">✕ All</button>}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {visibleStates.map(state => (
          <button key={state.id} onClick={() => onSelect(state)}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-150 border border-white/[0.07] hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.08] text-white/45 hover:text-white whitespace-nowrap">
            {state.name}
            {state.isUT && <span className="text-[8px] text-white/20 border border-white/10 rounded px-0.5">UT</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── INTRO REQUEST MODAL ───────────────────────────────────────
function IntroModal({ investor, onClose, onSent }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [startup, setStartup] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [linkedin, setLinkedin] = useState('')
  const [phone, setPhone] = useState('')
  const [pitch, setPitch] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const MAX = 500

  // Not logged in → show login gate instead
  if (!user) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)' }} onClick={onClose}>
        <div className="w-full max-w-sm rounded-2xl p-8 text-center relative"
          style={{ background: '#0D1628', border: '1px solid rgba(155,111,255,0.35)', animation: 'modalIn 0.2s ease' }}
          onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white text-2xl">×</button>
          <div className="text-5xl mb-4">🔐</div>
          <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>Login to Request Intro</h3>
          <p className="text-sm text-white/40 mb-5">You need an account to send intro requests to investors. It's free to sign up.</p>
          <button onClick={() => { onClose(); navigate('/?login=founder') }}
            className="w-full py-3 rounded-xl font-black text-sm text-white mb-3 transition-all"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#9B6FFF)' }}>
            🚀 Login / Sign Up →
          </button>
          <p className="text-[10px] text-white/25">Requesting intro to <strong className="text-white/40">{investor.firm_name}</strong></p>
        </div>
      </div>
    )
  }

  const handleSend = async () => {
    if (!startup.trim() || !email.trim() || !pitch.trim()) { toast.error('Please fill in all fields.'); return }
    setSending(true)
    try {
      await sendIntroRequest({
        investorId: investor.id, investorFirm: investor.firm_name,
        partnerName: investor.partner_name,
        startupId: startup.toLowerCase().replace(/\s+/g, '-'),
        startupName: startup, founderEmail: email, pitch,
        founderLinkedin: linkedin,
        founderPhone: phone,
        founderContactEmail: email,
      })
      setSent(true)
      onSent?.(investor.id)
      toast.success(`Intro request sent to ${investor.firm_name}!`)
      setTimeout(onClose, 3000)
    } catch { toast.error('Failed to send. Try again.') }
    finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(14px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6 relative overflow-y-auto"
        style={{ background: '#0D1628', border: '1px solid rgba(155,111,255,0.3)', animation: 'modalIn 0.2s ease', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white text-2xl">×</button>
        {sent ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>Request Sent!</h3>
            <p className="text-sm text-white/40">{investor.partner_name} at {investor.firm_name} will see your pitch and contact details.</p>
            <p className="text-xs text-white/25 mt-2">Track status in your Founder Dashboard.</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="text-[10px] text-purple-400 tracking-[3px] uppercase mb-1">Request Introduction</div>
              <h3 className="text-xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>To {investor.firm_name}</h3>
              <p className="text-xs text-white/35 mt-0.5">via {investor.partner_name}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">Your Startup Name *</label>
                <input className="input-field" placeholder="Your company name" value={startup} onChange={e => setStartup(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">Contact Email *</label>
                  <input className="input-field" type="email" placeholder="founder@startup.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">Phone (optional)</label>
                  <input className="input-field" type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">LinkedIn Profile (optional)</label>
                <input className="input-field" placeholder="linkedin.com/in/yourname" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">Your Pitch * <span className="text-white/20 normal-case">(max {MAX} chars)</span></label>
                <textarea className="input-field resize-none" rows={4} placeholder={`Tell ${investor.partner_name} what you're building…`}
                  value={pitch} onChange={e => setPitch(e.target.value.slice(0, MAX))} />
                <div className={`text-[10px] text-right mt-1 ${pitch.length > 450 ? 'text-red-400' : 'text-white/20'}`}>{pitch.length}/{MAX}</div>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-xl bg-purple-500/8 border border-purple-500/15">
              <p className="text-[10px] text-purple-300/60">📋 Your contact details (email, phone, LinkedIn) will be shared with {investor.partner_name} so they can reach you directly.</p>
            </div>
            <button onClick={handleSend} disabled={sending}
              className="w-full mt-4 py-3 rounded-xl font-black text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#9B6FFF)', opacity: sending ? 0.6 : 1 }}>
              {sending ? 'Sending…' : 'Send Introduction Request →'}
            </button>
            <p className="text-[10px] text-white/20 text-center mt-2">Uses 1 intro credit · Tracked in Founder Dashboard</p>
          </>
        )}
      </div>
    </div>
  )
}

// ── STATE SIDE PANEL ─────────────────────────────────────────────
function StatePanel({ stateId, stateName, startupCounts, investorCounts, onClose }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(profile?.role === 'investor' ? 'startups' : 'investors')
  const [startups, setStartups] = useState([])
  const [investors, setInvestors] = useState([])
  const [loadingS, setLoadingS] = useState(false)
  const [loadingI, setLoadingI] = useState(false)
  const [introTarget, setIntroTarget] = useState(null)
  const [sentIntros, setSentIntros] = useState({})   // investorId → true
  const [savedSt, setSavedSt] = useState({})   // startupId  → true
  const [marked, setMarked] = useState({})

  useEffect(() => {
    setLoadingS(true)
    getStartups(stateName).then(setStartups).catch(() => setStartups([])).finally(() => setLoadingS(false))
    setLoadingI(true)
    getInvestors(stateId).then(data => {
      setInvestors(data.length > 0 ? data : (INVESTORS_BY_STATE[stateId] || []))
    }).catch(() => setInvestors(INVESTORS_BY_STATE[stateId] || [])).finally(() => setLoadingI(false))
  }, [stateId, stateName])

  // Pre-load which intros have already been sent (by logged-in founder email)
  useEffect(() => {
    if (!user?.email) return
    const { getIntroRequestsByFounderEmail } = import('../lib/investorDb').catch(() => ({}))
    import('../lib/investorDb').then(({ getIntroRequestsByFounderEmail }) => {
      getIntroRequestsByFounderEmail(user.email).then(reqs => {
        const map = {}
        reqs.forEach(r => { map[r.investor_id] = true })
        setSentIntros(map)
      }).catch(() => { })
    })
  }, [user?.email])

  const handleSaveStartup = async (s) => {
    if (!user) { toast.error('Login as investor to save startups'); return }
    const { saveStartupForInvestor } = await import('../lib/investorDb')
    const result = await saveStartupForInvestor(user.uid, s)
    if (result) {
      setSavedSt(p => ({ ...p, [s.id]: true }))
      toast.success(`${s.company_name} saved to your dashboard!`)
    } else {
      setSavedSt(p => ({ ...p, [s.id]: true }))
      toast.success(`${s.company_name} already saved`)
    }
  }

  const sCount = startupCounts[stateId] ?? startups.length
  const iCount = investorCounts[stateId] ?? (INVESTORS_BY_STATE[stateId]?.length ?? 0)

  return (
    <>
      {introTarget && (
        <IntroModal
          investor={introTarget}
          onClose={() => setIntroTarget(null)}
          onSent={(invId) => setSentIntros(p => ({ ...p, [invId]: true }))}
        />
      )}

      <div className="flex flex-col overflow-hidden"
        style={{ background: '#0B0B1A', border: '1px solid rgba(155,111,255,0.18)', borderRadius: '16px', height: '100%', maxHeight: '74vh', animation: 'panelIn 0.22s ease' }}>

        {/* HEADER */}
        <div className="flex-shrink-0 px-6 pt-6 pb-0">
          <div className="flex justify-between items-start mb-1">
            <div>
              <div className="text-[9px] tracking-[3px] uppercase font-black mb-2" style={{ color: '#9B6FFF' }}>INVESTOR MAP</div>
              <h2 className="text-3xl font-black text-white leading-none mb-3" style={{ fontFamily: 'Playfair Display,serif' }}>{stateName}</h2>
              <div className="flex gap-5 mb-4">
                <span className="text-sm text-white/50">🚀 {sCount} startups</span>
                <span className="text-sm text-white/50">💰 {iCount} investors</span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white text-2xl leading-none mt-1 flex-shrink-0">×</button>
          </div>

          <div className="flex gap-2 mb-0">
            <button onClick={() => setTab('startups')}
              className="flex-1 py-3 rounded-xl text-sm font-black transition-all"
              style={tab === 'startups' ? { background: 'rgba(74,158,255,0.1)', color: '#7bb8ff', border: '1px solid rgba(74,158,255,0.2)' } : { background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }}>
              🚀 Startups ({sCount})
            </button>
            <button onClick={() => setTab('investors')}
              className="flex-1 py-3 rounded-xl text-sm font-black transition-all"
              style={tab === 'investors' ? { background: 'rgba(155,111,255,0.18)', color: '#c084fc', border: '1px solid rgba(155,111,255,0.4)' } : { background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }}>
              💰 Investors ({iCount})
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 mx-6 mt-0 mb-0 h-px bg-white/[0.06]" />

        {/* SCROLLABLE LIST */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(155,111,255,0.2) transparent' }}>

          {/* STARTUPS TAB */}
          {tab === 'startups' && (
            loadingS ? (
              <div className="text-center py-12 text-white/25 text-sm">Loading startups…</div>
            ) : startups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">🚀</div>
                <p className="text-sm text-white/25 mb-3">No startups listed yet.</p>
                <a href="/?mode=startup#list-startup" className="text-xs text-blue-400 hover:underline">Be the first startup here →</a>
              </div>
            ) : startups.map(s => (
              <div key={s.id}
                onClick={() => navigate(`/startup/${s.id}`)}
                className="rounded-xl p-4 transition-all hover:border-blue-500/30 cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex gap-3 items-start mb-3">
                  <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-sm overflow-hidden"
                    style={{ background: s.brand_color || '#3B7DD8', fontFamily: 'Playfair Display,serif' }}>
                    {s.logo_url ? <img src={s.logo_url} alt={s.company_name} className="w-full h-full object-cover" /> : s.company_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-black text-white text-sm">{s.company_name}</span>
                      {s.sector && <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{s.sector}</span>}
                      {s.is_premium && <span className="text-[9px] bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 px-2 py-0.5 rounded-full font-black">⭐ PRO</span>}
                    </div>
                    {s.description && <p className="text-xs text-white/40 line-clamp-2">{s.description}</p>}
                    {s.stage && <p className="text-[10px] text-white/25 mt-1">Stage: {s.stage}</p>}
                  </div>
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  {/* View Profile */}
                  <button onClick={() => navigate(`/startup/${s.id}`)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/15 hover:border-blue-500/40 transition-all cursor-pointer">
                    View Profile →
                  </button>
                  {/* Intro — sends notification to founder inbox */}
                  <button onClick={async () => {
                    if (!user) { navigate('/?login=investor'); return }
                    if (marked[s.id]) return
                    setMarked(p => ({ ...p, [s.id]: true }))
                    toast.success(`Intro sent! ${s.company_name} founder will be notified.`)
                    try {
                      const { sendIntroToFounder, getMyInvestorProfile } = await import('../lib/investorDb')
                      const invPro = await getMyInvestorProfile(user.uid, user.email)
                      await sendIntroToFounder(invPro?.id || user.uid, invPro?.firm_name || user.displayName || 'Investor', invPro?.partner_name || user.displayName || 'Investor', s)
                    } catch (err) { console.error(err) }
                  }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${marked[s.id] ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400 cursor-default' : 'bg-white/[0.04] border border-white/10 text-white/50 hover:border-blue-500/30 hover:text-blue-400'}`}>
                    {marked[s.id] ? '✓ Intro Sent' : '✉️ Intro'}
                  </button>
                  {/* Mark Interest — saves to investor dashboard */}
                  <button onClick={async () => {
                    if (!user) { navigate('/?login=investor'); return }
                    if (savedSt[s.id]) return
                    setSavedSt(p => ({ ...p, [s.id]: true }))
                    toast.success(`${s.company_name} saved to your Marked Interest!`)
                    try {
                      const { markInvestorInterest, getMyInvestorProfile } = await import('../lib/investorDb')
                      const invPro = await getMyInvestorProfile(user.uid, user.email)
                      await markInvestorInterest(user.uid, invPro?.firm_name || user.displayName || 'Investor', invPro?.partner_name || user.displayName || 'Investor', s)
                    } catch (err) { console.error(err) }
                  }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${savedSt[s.id] ? 'bg-green-500/15 border border-green-500/30 text-green-400 cursor-default' : 'bg-white/[0.04] border border-white/10 text-white/50 hover:border-green-500/30 hover:text-green-400'}`}>
                    {savedSt[s.id] ? '✓ Interested' : '👀 Interest'}
                  </button>
                  {s.website_url && (
                    <a href={s.website_url} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg text-xs font-bold bg-white/[0.04] border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all">
                      ↗
                    </a>
                  )}
                </div>
              </div>
            ))
          )}

          {/* INVESTORS TAB */}
          {tab === 'investors' && (
            loadingI ? (
              <div className="text-center py-12 text-white/25 text-sm">Loading investors…</div>
            ) : investors.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">💰</div>
                <p className="text-sm text-white/25 mb-3">No investors listed yet.</p>
                <Link to="/investor-listing" className="text-xs text-purple-400 hover:underline">💰 List as Investor</Link>
              </div>
            ) : investors.map(inv => (
              <div key={inv.id} className="rounded-xl p-4 transition-all"
                style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${inv.open_to_pitches ? 'rgba(0,208,156,0.15)' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="flex gap-3 items-start mb-3">
                  <Link to={`/investor/${inv.id}`}
                    className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-lg hover:opacity-80 transition-opacity overflow-hidden"
                    style={{ background: inv.brand_color || '#9B6FFF', fontFamily: 'Playfair Display,serif' }}>
                    {inv.logo_url
                      ? <img src={inv.logo_url} alt={inv.firm_name} className="w-full h-full object-cover rounded-xl" />
                      : (inv.avatar || inv.firm_name?.[0])}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link to={`/investor/${inv.id}`} className="font-black text-white text-sm leading-tight hover:text-purple-300 transition-colors">{inv.firm_name}</Link>
                      {inv.open_to_pitches && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full border"
                          style={{ background: 'rgba(0,208,156,0.1)', borderColor: 'rgba(0,208,156,0.3)', color: '#00D09C' }}>
                          OPEN TO PITCHES
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mb-2">via {inv.partner_name}</p>
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {(inv.focus || []).map(f => (
                        <span key={f} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>{f}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-white/35">📊 {inv.stage}</span>
                      <span className="text-[10px] font-bold" style={{ color: '#F6C90E' }}>💰 {inv.cheque_size}</span>
                    </div>
                  </div>
                </div>
                {/* Request Introduction — disabled + labeled if already sent */}
                <button
                  onClick={() => { if (!sentIntros[inv.id]) setIntroTarget(inv) }}
                  disabled={!!sentIntros[inv.id]}
                  className="w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                  style={sentIntros[inv.id] ? {
                    background: 'rgba(0,208,156,0.08)', border: '1px solid rgba(0,208,156,0.25)', color: '#00D09C', cursor: 'default'
                  } : {
                    background: 'rgba(30,50,120,0.6)', border: '1px solid rgba(74,158,255,0.2)', color: '#7bb8ff'
                  }}>
                  {sentIntros[inv.id] ? '✓ Intro Requested' : '✉️ Request Introduction'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

// ── STARTUP LISTING PANEL — right panel in startup mode ──────────
// Shows "Browse Startups" tab + "List Your Startup" tab
function StartupListingPanel() {
  const location = useLocation()
  const navigate = useNavigate()
  const [view, setView] = useState(() => {
    const p = new URLSearchParams(location.search)
    return p.get('browse') === 'startups' ? 'browse' : 'form'
  })
  const [stateFilter, setStateFilter] = useState('')
  const [startups, setStartups] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState({})
  const [marked, setMarked] = useState({})
  const [shortlisted, setShortlisted] = useState({})
  const { user } = useAuth()
  const [isEliteInvestor, setIsEliteInvestor] = useState(false)
  const [advFilters, setAdvFilters] = useState({ revenue: '', funding: '', growth: '', teamSize: '', stage: '' })

  // Check if user is elite investor
  useEffect(() => {
    if (!user) return
    import('../lib/investorDb').then(({ getMyInvestorProfile }) => {
      getMyInvestorProfile(user.uid, user.email).then(inv => {
        setIsEliteInvestor(inv?.plan === 'partner_elite' || inv?.plan === 'scout_pro')
      }).catch(() => { })
    }).catch(() => { })
  }, [user])

  const loadStartups = async (stateName) => {
    setLoading(true)
    try {
      const data = stateName ? await getStartups(stateName) : await getStartups()
      setStartups(data)
    } catch { setStartups([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (view === 'browse') loadStartups(stateFilter || undefined)
  }, [view, stateFilter])

  // Elite Filters helper
  const applyEliteFilters = (list) => {
    let filtered = list
    if (advFilters.revenue) {
      const ranges = { '0-1L': [0, 100000], '1L-10L': [100000, 1000000], '10L-50L': [1000000, 5000000], '50L-1Cr': [5000000, 10000000], '1Cr+': [10000000, Infinity] }
      const r = ranges[advFilters.revenue] || [0, Infinity]
      filtered = filtered.filter(s => { const v = parseFloat(s.revenue) || 0; return v >= r[0] && v < r[1] })
    }
    if (advFilters.funding) {
      if (advFilters.funding === 'bootstrapped') {
        filtered = filtered.filter(s => !s.funding_raised || s.funding_raised === 'bootstrapped' || parseFloat(s.funding_raised) === 0)
      } else {
        const ranges = { '0-25L': [0, 2500000], '25L-1Cr': [2500000, 10000000], '1Cr-5Cr': [10000000, 50000000], '5Cr+': [50000000, Infinity] }
        const r = ranges[advFilters.funding] || [0, Infinity]
        filtered = filtered.filter(s => { const v = parseFloat(s.funding_raised) || 0; return v >= r[0] && v < r[1] })
      }
    }
    if (advFilters.growth) {
      const ranges = { '0-10': [0, 10], '10-50': [10, 50], '50-100': [50, 100], '100+': [100, Infinity] }
      const r = ranges[advFilters.growth] || [0, Infinity]
      filtered = filtered.filter(s => { const v = parseFloat(s.growth_rate || s.growth) || 0; return v >= r[0] && v < r[1] })
    }
    if (advFilters.teamSize) {
      const ranges = { 'solo': [1, 1], '2-5': [2, 5], '6-20': [6, 20], '21-50': [21, 50], '50+': [50, Infinity] }
      const r = ranges[advFilters.teamSize] || [0, Infinity]
      filtered = filtered.filter(s => { const v = parseInt(s.team_size) || 1; return v >= r[0] && v <= r[1] })
    }
    if (advFilters.stage) {
      filtered = filtered.filter(s => (s.stage || '').toLowerCase().trim().split(' ').join('_') === advFilters.stage)
    }
    return filtered
  }

  const filteredStartups = applyEliteFilters(startups)

  return (
    <div className="card flex flex-col" style={{ minHeight: '520px' }}>
      {/* Tab switcher */}
      <div className="flex gap-1 p-1.5 m-4 mb-0 bg-white/[0.03] rounded-xl border border-white/[0.07]">
        <button onClick={() => setView('form')}
          className="flex-1 py-2 rounded-lg text-xs font-black transition-all"
          style={view === 'form' ? { background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)', color: 'white' } : { color: 'rgba(255,255,255,0.35)' }}>
          🚀 List Your Startup
        </button>
        <button onClick={() => setView('browse')}
          className="flex-1 py-2 rounded-lg text-xs font-black transition-all"
          style={view === 'browse' ? { background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)', color: 'white' } : { color: 'rgba(255,255,255,0.35)' }}>
          📋 Browse Startups
        </button>
      </div>

      {view === 'form' ? (
        <div className="flex-1"><ListingForm /></div>
      ) : (
        <div className="flex flex-col flex-1 p-4 pt-3">
          {/* State filter */}
          <div className="mb-3">
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              className="input-field text-xs py-2">
              <option value="">All States</option>
              {INDIAN_STATES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          {/* Elite Advanced Filters */}
          {isEliteInvestor && (
            <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(246,201,14,0.04)', border: '1px solid rgba(246,201,14,0.15)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-black text-yellow-400/70 uppercase tracking-[1.5px]">👑 Elite Filters</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={advFilters.revenue} onChange={e => setAdvFilters(p => ({ ...p, revenue: e.target.value }))} className="input-field text-[10px] py-1.5">
                  <option value="">Revenue (Any)</option>
                  <option value="0-1L">₹0 – ₹1L</option><option value="1L-10L">₹1L – ₹10L</option><option value="10L-50L">₹10L – ₹50L</option><option value="50L-1Cr">₹50L – ₹1Cr</option><option value="1Cr+">₹1Cr+</option>
                </select>
                <select value={advFilters.funding} onChange={e => setAdvFilters(p => ({ ...p, funding: e.target.value }))} className="input-field text-[10px] py-1.5">
                  <option value="">Funding (Any)</option>
                  <option value="bootstrapped">Bootstrapped</option><option value="0-25L">₹0 – ₹25L</option><option value="25L-1Cr">₹25L – ₹1Cr</option><option value="1Cr-5Cr">₹1Cr – ₹5Cr</option><option value="5Cr+">₹5Cr+</option>
                </select>
                <select value={advFilters.growth} onChange={e => setAdvFilters(p => ({ ...p, growth: e.target.value }))} className="input-field text-[10px] py-1.5">
                  <option value="">Growth % (Any)</option>
                  <option value="0-10">0 – 10%</option><option value="10-50">10 – 50%</option><option value="50-100">50 – 100%</option><option value="100+">100%+</option>
                </select>
                <select value={advFilters.teamSize} onChange={e => setAdvFilters(p => ({ ...p, teamSize: e.target.value }))} className="input-field text-[10px] py-1.5">
                  <option value="">Team Size (Any)</option>
                  <option value="solo">Solo</option><option value="2-5">2 – 5</option><option value="6-20">6 – 20</option><option value="21-50">21 – 50</option><option value="50+">50+</option>
                </select>
                <select value={advFilters.stage} onChange={e => setAdvFilters(p => ({ ...p, stage: e.target.value }))} className="input-field text-[10px] py-1.5 col-span-2">
                  <option value="">Stage (Any)</option>
                  <option value="idea">Idea</option><option value="mvp">MVP</option><option value="early_revenue">Early Revenue</option><option value="growth">Growth</option><option value="scaling">Scaling</option>
                </select>
              </div>
            </div>
          )}
          {/* Startup list */}
          <div className="flex-1 overflow-y-auto space-y-3" style={{ maxHeight: '55vh', scrollbarWidth: 'thin', scrollbarColor: 'rgba(74,158,255,0.2) transparent' }}>
            {loading ? (
              <div className="text-center py-12 text-white/25 text-sm">Loading startups…</div>
            ) : filteredStartups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">🚀</div>
                <p className="text-sm text-white/30">No startups found{stateFilter ? ` in ${stateFilter}` : ''}.</p>
              </div>
            ) : filteredStartups.map(s => (
              <div key={s.id} className="rounded-xl p-3 transition-all hover:border-white/15"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex gap-3 items-start mb-2">
                  <Link to={`/startup/${s.id}`} className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-sm overflow-hidden hover:ring-2 hover:ring-blue-500/40 transition-all cursor-pointer"
                    style={{ background: s.brand_color || '#3B7DD8', fontFamily: 'Playfair Display,serif' }}>
                    {s.logo_url ? <img src={s.logo_url} alt="" className="w-full h-full object-cover" /> : s.company_name?.[0]}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <Link to={`/startup/${s.id}`} className="font-black text-white text-sm hover:text-blue-400 transition-colors">{s.company_name}</Link>
                      {s.sector && <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">{s.sector}</span>}
                      {s.is_premium && <span className="text-[9px] bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 px-1.5 py-0.5 rounded-full font-black">⭐</span>}
                    </div>
                    <p className="text-[10px] text-white/35">{s.state}{s.stage ? ` · ${s.stage}` : ''}</p>
                    {s.description && <p className="text-xs text-white/30 line-clamp-1 mt-0.5">{s.description}</p>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={async () => {
                    if (!user) { navigate('/?login=investor'); return }
                    if (saved[s.id]) return
                    setSaved(p => ({ ...p, [s.id]: true }))
                    toast.success(`Intro sent to ${s.company_name}! Founder notified.`)
                    try {
                      const { sendIntroToFounder, getMyInvestorProfile } = await import('../lib/investorDb')
                      const invPro = await getMyInvestorProfile(user.uid, user.email)
                      await sendIntroToFounder(user.uid, invPro?.firm_name || user.displayName || 'Investor', invPro?.partner_name || user.displayName || 'Investor', s)
                    } catch (e) { console.error(e) }
                  }}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${saved[s.id] ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400 cursor-default' : 'bg-white/[0.04] border border-white/10 text-white/45 hover:border-blue-500/30 hover:text-blue-400'}`}>
                    {saved[s.id] ? '✓ Intro Sent' : '✉️ Intro'}
                  </button>
                  <button onClick={async () => {
                    if (!user) { navigate('/?login=investor'); return }
                    if (marked[s.id]) return
                    setMarked(p => ({ ...p, [s.id]: true }))
                    toast.success(`${s.company_name} marked as interested! Saved to your dashboard.`)
                    try {
                      const { markInvestorInterest, getMyInvestorProfile } = await import('../lib/investorDb')
                      const invPro = await getMyInvestorProfile(user.uid, user.email)
                      await markInvestorInterest(user.uid, invPro?.firm_name || user.displayName || 'Investor', invPro?.partner_name || user.displayName || 'Investor', s)
                    } catch (e) { console.error(e) }
                  }}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${marked[s.id] ? 'bg-green-500/15 border border-green-500/30 text-green-400 cursor-default' : 'bg-white/[0.04] border border-white/10 text-white/45 hover:border-green-500/30 hover:text-green-400'}`}>
                    {marked[s.id] ? '✓ Interested' : '👀 Mark Interest'}
                  </button>
                  {s.website_url && (
                    <a href={s.website_url} target="_blank" rel="noopener noreferrer"
                      className="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-white/[0.04] border border-white/10 text-white/40 hover:text-white transition-all">
                      ↗
                    </a>
                  )}
                  <button onClick={async () => {
                    if (!user) { navigate('/?login=investor'); return }
                    if (shortlisted[s.id]) return
                    setShortlisted(p => ({ ...p, [s.id]: true }))
                    toast.success(`${s.company_name} shortlisted!`)
                    try {
                      const { saveStartupForInvestor } = await import('../lib/investorDb')
                      await saveStartupForInvestor(user.uid, s)
                    } catch (e) { console.error(e) }
                  }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${shortlisted[s.id] ? 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 cursor-default' : 'bg-white/[0.04] border border-white/10 text-white/45 hover:border-yellow-500/30 hover:text-yellow-400'}`}>
                    {shortlisted[s.id] ? '✓ Saved' : '📌'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-white/20 text-center mt-3">{startups.length} startup{startups.length !== 1 ? 's' : ''} found{stateFilter ? ` in ${stateFilter}` : ' across India'}</p>
        </div>
      )}
    </div>
  )
}

// ── HOME PAGE ─────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
  const [mode, setMode] = useState(() => localStorage.getItem('ism_map_mode') || 'startup')
  const [selectedState, setSelectedState] = useState(null)
  // Auto-switch mode when linked from dashboard or Pricing page
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const modeParam = params.get('mode')
    if (modeParam === 'investor') {
      setMode('investor')
      localStorage.setItem('ism_map_mode', 'investor')
      setTimeout(() => {
        document.getElementById('list-startup')?.scrollIntoView({ behavior: 'smooth' })
      }, 200)
    } else if (modeParam === 'startup') {
      setMode('startup')
      localStorage.setItem('ism_map_mode', 'startup')
    }
  }, [location.search])
  const [startupCounts, setStartupCounts] = useState({})
  const [investorCounts, setInvestorCounts] = useState({})
  const [foundingCounts, setFoundingCounts] = useState({ startups: 0, investors: 0 })

  useEffect(() => {
    getStartupCountByState().then(counts => {
      const byId = {}
      INDIAN_STATES.forEach(s => { if (counts[s.name]) byId[s.id] = counts[s.name] })
      setStartupCounts(byId)
    }).catch(() => { })
    getInvestorCountByState().then(setInvestorCounts).catch(() => {
      const local = {}
      Object.entries(INVESTORS_BY_STATE).forEach(([id, arr]) => { local[id] = arr.length })
      setInvestorCounts(local)
    })
    // Fetch live founding program counts
    getFoundingCounts().then(setFoundingCounts).catch(() => { })
  }, [])

  const handleModeSwitch = (newMode) => { setMode(newMode); setSelectedState(null); localStorage.setItem('ism_map_mode', newMode) }
  const selectedStateObj = selectedState ? INDIAN_STATES.find(s => s.id === selectedState) : null
  const totalInvestors = Math.max(200, Object.values(investorCounts).reduce((a, b) => a + b, 0) + 184)

  return (
    <main className="relative z-10 pt-20">

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-6 text-center relative">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs tracking-widest uppercase mb-5 border transition-all duration-300"
          style={{ background: mode === 'investor' ? 'rgba(155,111,255,0.1)' : 'rgba(74,158,255,0.1)', borderColor: mode === 'investor' ? 'rgba(155,111,255,0.25)' : 'rgba(74,158,255,0.25)', color: mode === 'investor' ? '#9B6FFF' : '#4A9EFF' }}>
          India's First Dual Discovery Platform
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-[1.08] mb-4"
          style={{
            fontFamily: 'Playfair Display,serif',
            letterSpacing: '-2px',
            backgroundImage: mode === 'investor'
              ? 'linear-gradient(135deg,#fff 0%,#D4BBFF 50%,#9B6FFF 100%)'
              : 'linear-gradient(135deg,#fff 0%,#B8D4FF 50%,#63B3FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
            display: 'inline-block',
            width: '100%',
          }}>
          Startups meet Investors.<br />State by State. 🇮🇳
        </h1>
        <p className="text-base text-white/45 max-w-xl mx-auto leading-relaxed mb-6">
          Switch between Startup Map and Investor Map. Click any state to explore, connect with VCs, and request warm introductions.
        </p>
        <div className="flex justify-center gap-8 mb-6 flex-wrap">
          {[{ v: '1,200+', l: 'Startups', c: '#4A9EFF' }, { v: `${totalInvestors}+`, l: 'Investors', c: '#9B6FFF' }, { v: '36', l: 'States', c: '#00D09C' }, { v: '12K+', l: 'Intros Sent', c: '#F6C90E' }].map(({ v, l, c }) => (
            <div key={l} className="text-center">
              <div className="text-2xl font-black" style={{ fontFamily: 'Playfair Display,serif', color: c }}>{v}</div>
              <div className="text-[10px] text-white/30 uppercase tracking-widest">{l}</div>
            </div>
          ))}
        </div>
        <div className="mb-6"><SearchBar /></div>
      </section>

      {/* ── MAP TOGGLE ── */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-white/[0.04] border border-white/[0.08] rounded-2xl p-1.5 gap-1.5">
          <button onClick={() => handleModeSwitch('startup')}
            className="px-7 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2"
            style={mode === 'startup' ? { background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)', color: '#fff', boxShadow: '0 4px 20px rgba(74,158,255,0.25)' } : { color: 'rgba(255,255,255,0.4)', background: 'transparent' }}>
            🚀 Startup Map
          </button>
          <button onClick={() => handleModeSwitch('investor')}
            className="px-7 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2"
            style={mode === 'investor' ? { background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)', color: '#fff', boxShadow: '0 4px 20px rgba(155,111,255,0.25)' } : { color: 'rgba(255,255,255,0.4)', background: 'transparent' }}>
            💰 Investor Map
          </button>
        </div>
      </div>

      {/* ── MAP + RIGHT PANEL (50/50) ── */}
      <section className="max-w-7xl mx-auto px-6 pb-10" id="list-startup">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* LEFT — Map */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-[2px] uppercase font-bold" style={{ color: mode === 'investor' ? '#9B6FFF' : '#4A9EFF' }}>
                {mode === 'investor' ? '💰 Active Investors by State · Click to explore' : '🚀 Startups by State · Click to explore'}
              </span>
            </div>

            {mode === 'startup' && (
              <div className="mt-1 mb-1">
                <StatesNavbar onSelect={(state) => navigate(`/state/${state.id}`)} />
              </div>
            )}

            {/* DIFFERENT MAP PER MODE */}
            {mode === 'startup' ? (
              <IndiaMap onStateSelect={(s) => navigate(`/state/${s.id}`)} />
            ) : (
              <InvestorMapSVG
                selectedStateId={selectedState}
                onStateSelect={(s) => setSelectedState(prev => prev === s.id ? null : s.id)}
              />
            )}
          </div>

          {/* RIGHT — panel changes per mode */}
          {mode === 'investor' ? (
            selectedStateObj ? (
              <StatePanel
                key={selectedState}
                stateId={selectedState}
                stateName={selectedStateObj.name}
                startupCounts={startupCounts}
                investorCounts={investorCounts}
                onClose={() => setSelectedState(null)}
              />
            ) : (
              /* Investor mode — no state selected: prompt + Join CTA */
              <div className="card p-7 flex flex-col"
                style={{ borderColor: 'rgba(155,111,255,0.15)', minHeight: '400px' }}>
                <div className="text-[9px] text-purple-400 tracking-[3px] uppercase font-bold mb-3">💰 Investor Map</div>
                <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>
                  Explore Investors
                </h3>
                <p className="text-sm text-white/40 leading-relaxed mb-5">
                  Click any highlighted state on the map to see all active investors — their firm, focus sectors, cheque sizes, and request warm introductions directly.
                </p>

                {/* State dropdown */}
                <div className="mb-5">
                  <div className="text-[9px] text-white/25 uppercase tracking-widest mb-2">Choose a State</div>
                  <select
                    onChange={e => { if (e.target.value) setSelectedState(e.target.value) }}
                    className="input-field w-full text-sm mb-3"
                    defaultValue="">
                    <option value="" disabled>Select state to explore investors</option>
                    {INDIAN_STATES.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{investorCounts[s.id] ? ` (${investorCounts[s.id]} investors)` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Quick nav — states with investors */}
                <div className="mb-5">
                  <div className="text-[9px] text-white/25 uppercase tracking-widest mb-2">States with investors</div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.keys(INVESTORS_BY_STATE).slice(0, 8).map(id => {
                      const stateObj = INDIAN_STATES.find(s => s.id === id)
                      if (!stateObj) return null
                      return (
                        <button key={id} onClick={() => setSelectedState(id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all hover:border-purple-400/40 hover:bg-purple-500/10"
                          style={{ borderColor: 'rgba(155,111,255,0.2)', color: '#9B6FFF', background: 'rgba(155,111,255,0.06)' }}>
                          {stateObj.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-2">
                  {user ? (
                    <Link to="/investor-listing"
                      className="w-full py-3 rounded-xl font-black text-sm text-white text-center transition-all"
                      style={{ background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)' }}>
                      💰 List as Investor →
                    </Link>
                  ) : (
                    <button onClick={() => navigate('/?login=investor')}
                      className="w-full py-3 rounded-xl font-black text-sm text-white transition-all"
                      style={{ background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)' }}>
                      💰 Join as Investor →
                    </button>
                  )}
                  <button onClick={() => handleModeSwitch('startup')}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white/40 border border-white/10 hover:text-white/70 hover:border-white/20 transition-all">
                    Switch to Startup Map
                  </button>
                </div>
              </div>
            )
          ) : (
            <StartupListingPanel />
          )}
        </div>
      </section>

      {/* ── DASHBOARD SECTION — Auth-aware ── */}
      <section id="dashboard" className="max-w-7xl mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <span className="section-label">Dashboard Access</span>
          <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>
            {user ? `Welcome back, ${user.displayName?.split(' ')[0] || 'there'}! 👋` : 'Login to Your Dashboard'}
          </h2>
          <p className="text-sm text-white/35">Founders track intros · Investors manage their inbox</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* Founder card */}
          <Link to={user ? "/dashboard/founder" : "/?login=founder"} className="card p-6 hover:border-blue-500/30 transition-all group block">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-2xl mb-4">🚀</div>
            <h3 className="font-black text-white text-lg mb-1" style={{ fontFamily: 'Playfair Display,serif' }}>Founder Dashboard</h3>
            <p className="text-sm text-white/40 mb-4 leading-relaxed">
              {user && profile?.role === 'founder'
                ? 'View your startup stats, intro requests, and investor interest in real-time.'
                : 'Track intro requests, view investor interest, manage listing and credits.'}
            </p>
            <div className="flex gap-2 flex-wrap mb-4">
              {['✉️ Intro Requests', '📈 Stats', '💳 Credits', '🏷 Listing'].map(f => (
                <span key={f} className="text-[10px] bg-blue-500/8 border border-blue-500/15 text-blue-400/70 px-2.5 py-1 rounded-full">{f}</span>
              ))}
            </div>
            <div className="w-full py-2.5 rounded-xl font-bold text-sm text-white text-center"
              style={{ background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)' }}>
              {user && profile?.role === 'founder' ? '→ My Dashboard' : 'Founder Login →'}
            </div>
          </Link>

          {/* Investor card — shows Join or Dashboard based on auth */}
          {user && profile?.role === 'investor' ? (
            // Logged in as investor → go to dashboard
            <Link to="/dashboard/investor" className="card p-6 hover:border-purple-500/30 transition-all group block"
              style={{ borderColor: 'rgba(155,111,255,0.25)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-2xl">💰</div>
                <div>
                  <div className="font-black text-white text-lg" style={{ fontFamily: 'Playfair Display,serif' }}>Investor Dashboard</div>
                  <div className="text-xs text-purple-400">{user.displayName || user.email}</div>
                </div>
              </div>
              <p className="text-sm text-white/40 mb-4 leading-relaxed">You're logged in as an investor. View your pitch inbox, saved startups, and deal flow.</p>
              <div className="flex gap-2 flex-wrap mb-4">
                {['📥 Pitch Inbox', '⭐ Saved', '📊 Deal Flow', '🗺 Map'].map(f => (
                  <span key={f} className="text-[10px] bg-purple-500/8 border border-purple-500/15 text-purple-400/70 px-2.5 py-1 rounded-full">{f}</span>
                ))}
              </div>
              <div className="w-full py-2.5 rounded-xl font-bold text-sm text-white text-center"
                style={{ background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)' }}>
                → My Investor Dashboard
              </div>
            </Link>
          ) : (
            // Not logged in or logged in as founder → show Join as Investor CTA
            <div className="card p-6 hover:border-purple-500/30 transition-all"
              style={{ borderColor: 'rgba(155,111,255,0.1)' }}>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-2xl mb-4">💰</div>
              <h3 className="font-black text-white text-lg mb-1" style={{ fontFamily: 'Playfair Display,serif' }}>Join as Investor</h3>
              <p className="text-sm text-white/40 mb-4 leading-relaxed">List your firm on the Investor Map. Receive curated pitches from vetted founders across India.</p>
              <div className="flex gap-2 flex-wrap mb-4">
                {['🗺 Map Listing', '📥 Pitch Inbox', '⭐ Save Startups', '📊 Analytics'].map(f => (
                  <span key={f} className="text-[10px] bg-purple-500/8 border border-purple-500/15 text-purple-400/70 px-2.5 py-1 rounded-full">{f}</span>
                ))}
              </div>
              {user ? (
                <Link to="/investor-listing"
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white text-center block transition-all"
                  style={{ background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)' }}>
                  💰 List as Investor →
                </Link>
              ) : (
                <button onClick={() => navigate('/?login=investor')}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)' }}>
                  💰 Join as Investor →
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <span className="section-label">How It Works</span>
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>Four Simple Steps</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: '🗺', t: 'Switch Maps', d: 'Toggle between Startup Map (blue) and Investor Map (purple) — two completely different views.' },
            { icon: '📍', t: 'Click a State', d: 'See all startups & investors in that state with counts, profiles, and cheque sizes.' },
            { icon: '✉️', t: 'Request Intro', d: 'Founders send a 500-char pitch to request a warm email intro to any VC.' },
            { icon: '👀', t: 'Mark Interest', d: 'Investors mark interest on startups — founders are notified instantly.' },
          ].map(item => (
            <div key={item.t} className="card p-5 text-center hover:border-white/15 transition-all">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-black text-white text-base mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>{item.t}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING (inline) ── */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <span className="section-label">Pricing</span>
          <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>Simple, Transparent Plans</h2>
          <p className="text-sm text-white/35">For startups and investors. No hidden fees.</p>
        </div>

        {/* ── Startup plans ── */}
        <div className="mb-10">
          <div className="text-center mb-5">
            <div className="section-label text-blue-400">For Startups</div>
            <h3 className="text-xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>List Your Startup</h3>
          </div>

          {/* Founding 100 Banner — live Firebase data */}
          {(() => {
            const total = FOUNDING_PROGRAM.startups.total
            const reg = foundingCounts.startups
            const left = Math.max(0, total - reg)
            const pct = Math.min(100, Math.round((reg / total) * 100))
            return (
              <div className="rounded-2xl p-4 mb-5 flex flex-col sm:flex-row items-center gap-4"
                style={{ background: 'linear-gradient(135deg,rgba(246,201,14,0.1),rgba(246,201,14,0.03))', border: '1px solid rgba(246,201,14,0.3)' }}>
                <div className="text-2xl flex-shrink-0">🎉</div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-black tracking-[3px] uppercase px-2 py-0.5 rounded-full inline-block mb-1"
                    style={{ background: 'rgba(246,201,14,0.2)', color: '#F6C90E', border: '1px solid rgba(246,201,14,0.4)' }}>🚀 LAUNCH OFFER</span>
                  <div className="font-black text-white text-sm" style={{ fontFamily: 'Playfair Display,serif' }}>Founding 100 Startups Program</div>
                  <div className="text-xs text-white/40">Free listing worth ₹999 — only for first 100 startups</div>
                </div>
                <div className="flex-shrink-0 text-center bg-black/40 rounded-xl px-4 py-2.5 border border-yellow-500/20 min-w-[110px]">
                  <div className="font-black leading-none mb-0.5" style={{ fontFamily: 'Playfair Display,serif', color: '#F6C90E', fontSize: 22 }}>
                    {reg}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>/{total}</span>
                  </div>
                  <div className="text-[8px] uppercase tracking-widest text-white/35">registered</div>
                  <div className="text-[9px] font-black mt-0.5" style={{ color: left <= 10 ? '#ff6b6b' : '#F6C90E' }}>{left} spots left</div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/10 w-20 mx-auto overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#F6C90E,#f0b429)' }} />
                  </div>
                </div>
              </div>
            )
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(PLANS).map(([key, plan]) => {
              const isFree = plan.isFounding
              const isEnt = key === 'enterprise'
              return (
                <div key={key}
                  className={`card p-5 relative flex flex-col transition-all duration-300 ${plan.popular ? 'shadow-xl hover:-translate-y-2' : 'hover:-translate-y-1'}`}
                  style={{
                    borderColor: isEnt ? 'rgba(246,201,14,0.5)' : plan.popular ? 'rgba(246,201,14,0.35)' : isFree ? 'rgba(0,208,156,0.35)' : undefined,
                    background: isEnt ? 'linear-gradient(160deg,rgba(246,201,14,0.06) 0%,transparent 55%)' : undefined,
                  }}>
                  {isFree && !isEnt && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[2px] whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg,#00D09C,#00a876)', color: '#000' }}>🎉 FREE — Founding 100</div>
                  )}
                  {plan.popular && !isFree && !isEnt && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-black text-[9px] font-black tracking-[2px] uppercase px-3 py-1 rounded-full whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg,#F6C90E,#d4a500)' }}>MOST POPULAR</div>
                  )}
                  {isEnt && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[2px] whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg,#F6C90E,#f0b429)', color: '#000' }}>👑 ENTERPRISE</div>
                  )}
                  <div className="mb-auto pt-2">
                    <h4 className="text-lg font-black text-white mt-2 mb-1" style={{ fontFamily: 'Playfair Display,serif' }}>{plan.name}</h4>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-3xl font-black" style={{ color: isEnt ? '#F6C90E' : plan.popular ? '#F6C90E' : isFree ? '#00D09C' : '#4A9EFF' }}>
                        {plan.displayPrice}
                      </span>
                      {isFree && <span className="text-sm line-through text-white/25">{plan.originalPrice}</span>}
                      <span className="text-xs text-white/25">/ {plan.duration}</span>
                    </div>
                    {isFree && <div className="text-[9px] font-black text-green-400 mb-2">✓ FREE for first 100 startups</div>}
                    {plan.intro_credits && (
                      <div className="rounded-lg border px-3 py-1.5 text-center mb-3 text-xs font-black"
                        style={{ background: isEnt ? 'rgba(246,201,14,0.08)' : 'rgba(74,158,255,0.08)', borderColor: isEnt ? 'rgba(246,201,14,0.2)' : 'rgba(74,158,255,0.2)', color: isEnt ? '#F6C90E' : '#4A9EFF' }}>
                        ✉️ {plan.intro_credits} Investor Intro Credits
                      </div>
                    )}
                    <ul className="space-y-1.5 mb-4 flex-1">
                      {plan.features.map(f => {
                        const isGold = isEnt
                        return (
                          <li key={f} className="flex items-start gap-2 text-xs"
                            style={{ color: isGold ? '#F6C90E' : f.startsWith('👑') ? '#F6C90E' : 'rgba(255,255,255,0.5)', fontWeight: isGold ? 600 : undefined }}>
                            <span className="flex-shrink-0 mt-0.5" style={{ color: isGold ? '#F6C90E' : '#60a5fa' }}>✓</span>
                            {f}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  {isFree ? (
                    <a href="/#list-startup"
                      className="w-full text-center block py-2.5 rounded-xl font-black text-sm transition-all"
                      style={{ background: 'linear-gradient(135deg,#00D09C,#00a876)', color: '#000' }}>
                      🚀 Claim Free Spot →
                    </a>
                  ) : (
                    <a href="/#list-startup"
                      className="w-full text-center block py-2.5 rounded-xl font-black text-sm transition-all"
                      style={{ background: isEnt || plan.popular ? 'linear-gradient(135deg,#F6C90E,#d4a500)' : 'rgba(255,255,255,0.06)', color: (isEnt || plan.popular) ? '#000' : 'rgba(255,255,255,0.7)' }}>
                      {isEnt ? '👑 Get Enterprise →' : 'Get Started →'}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t border-white/[0.06] mb-10" />

        {/* ── Investor plans ── */}
        <div>
          <div className="text-center mb-5">
            <div className="section-label" style={{ color: '#9B6FFF' }}>For Investors</div>
            <h3 className="text-xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>Join the Investor Map</h3>
          </div>

          {/* Early 50 Investors Banner — live Firebase data */}
          {(() => {
            const total = FOUNDING_PROGRAM.investors.total
            const reg = foundingCounts.investors
            const left = Math.max(0, total - reg)
            const pct = Math.min(100, Math.round((reg / total) * 100))
            return (
              <div className="rounded-2xl p-4 mb-5 flex flex-col sm:flex-row items-center gap-4"
                style={{ background: 'linear-gradient(135deg,rgba(155,111,255,0.1),rgba(155,111,255,0.03))', border: '1px solid rgba(155,111,255,0.3)' }}>
                <div className="text-2xl flex-shrink-0">💰</div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-black tracking-[3px] uppercase px-2 py-0.5 rounded-full inline-block mb-1"
                    style={{ background: 'rgba(155,111,255,0.2)', color: '#9B6FFF', border: '1px solid rgba(155,111,255,0.4)' }}>🚀 LAUNCH OFFER</span>
                  <div className="font-black text-white text-sm" style={{ fontFamily: 'Playfair Display,serif' }}>Early 50 Investors Program</div>
                  <div className="text-xs text-white/40">Free listing worth ₹999 — only for first 50 investors</div>
                </div>
                <div className="flex-shrink-0 text-center bg-black/40 rounded-xl px-4 py-2.5 border border-purple-500/20 min-w-[110px]">
                  <div className="font-black leading-none mb-0.5" style={{ fontFamily: 'Playfair Display,serif', color: '#9B6FFF', fontSize: 22 }}>
                    {reg}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>/{total}</span>
                  </div>
                  <div className="text-[8px] uppercase tracking-widest text-white/35">registered</div>
                  <div className="text-[9px] font-black mt-0.5" style={{ color: left <= 5 ? '#ff6b6b' : '#9B6FFF' }}>{left} spots left</div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/10 w-20 mx-auto overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#9B6FFF,#6a2abf)' }} />
                  </div>
                </div>
              </div>
            )
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(INVESTOR_PLANS).map(([key, plan]) => {
              const isFree = plan.isFounding
              return (
                <div key={key}
                  className={`card p-5 relative flex flex-col transition-all duration-300 ${plan.popular ? 'shadow-xl hover:-translate-y-2' : 'hover:-translate-y-1'}`}
                  style={{ borderColor: isFree ? 'rgba(0,208,156,0.35)' : plan.popular ? `${plan.color}55` : undefined }}>
                  {isFree && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[2px] whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg,#00D09C,#00a876)', color: '#000' }}>🎉 FREE — Early 50</div>
                  )}
                  {plan.popular && !isFree && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap"
                      style={{ background: `linear-gradient(135deg,${plan.color},${plan.color}bb)` }}>MOST POPULAR</div>
                  )}
                  <div className="mb-auto pt-2">
                    <div className="text-xl mb-1.5 mt-1">{plan.icon}</div>
                    <h4 className="text-lg font-black text-white mb-1" style={{ fontFamily: 'Playfair Display,serif' }}>{plan.name}</h4>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-3xl font-black" style={{ color: isFree ? '#00D09C' : plan.color }}>{plan.displayPrice}</span>
                      {isFree && <span className="text-sm line-through text-white/25">{plan.originalPrice}</span>}
                      <span className="text-xs text-white/25">{plan.period}</span>
                    </div>
                    {isFree && <div className="text-[9px] font-black text-green-400 mb-2">✓ FREE for first 50 investors</div>}
                    <ul className="space-y-1.5 mb-4 flex-1 mt-2">
                      {plan.features.map(f => {
                        const isBold = plan.bold_feature && f === plan.bold_feature
                        return (
                          <li key={f} className="flex items-start gap-2 text-xs"
                            style={{ color: isBold ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: isBold ? 900 : undefined }}>
                            <span className="flex-shrink-0 mt-0.5" style={{ color: plan.color }}>✓</span>
                            {f}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  {isFree ? (
                    <Link to={`/investor-listing?plan=${key}`}
                      className="w-full py-2.5 rounded-xl font-black text-sm text-black text-center block transition-all"
                      style={{ background: 'linear-gradient(135deg,#00D09C,#00a876)' }}>
                      🎉 Claim Free Investor Spot →
                    </Link>
                  ) : (
                    <Link to={`/investor-listing?plan=${key}`}
                      className="w-full py-2.5 rounded-xl font-black text-sm text-white text-center block transition-all"
                      style={{ background: plan.popular ? `linear-gradient(135deg,${plan.color}dd,${plan.color}99)` : 'rgba(255,255,255,0.06)', border: `1px solid ${plan.color}40` }}>
                      {key === 'scout_pro' ? '🔍 List as Scout Pro →' : '⭐ List as Partner Elite →'}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-white/25 text-center mt-4 italic">* Funding Investors: 2026 → Lifetime pricing lock. Price will increase after 2026.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-white/25">© 2025 IndiaStartupMap · Made with ❤️ in India 🇮🇳</div>
          <div className="flex gap-6">
            {[{ label: 'Privacy', path: '/privacy' }, { label: 'Terms', path: '/terms' }, { label: 'Contact', path: '/contact' }].map(l => (
              <Link key={l.path} to={l.path} className="text-xs text-white/25 hover:text-white/60 transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes panelIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
      `}</style>
    </main>
  )
}
