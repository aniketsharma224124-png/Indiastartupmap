import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { INDIAN_STATES, REGION_COLORS } from '../data/states'
import { getStartups, getStartupCountByState } from '../lib/firebase'
import { getInvestors, getInvestorCountByState, sendIntroRequest, markInvestorInterest, sendIntroToFounder, getMyInvestorProfile } from '../lib/investorDb'
import { INVESTORS_BY_STATE } from '../data/investors'
import { useAuth } from '../context/AuthContext'

// ── STATE PATHS (same SVG as IndiaMap) ────────────────────────
const STATE_PATHS = {
  'jammu-kashmir': 'M 215 45 L 255 35 L 290 50 L 300 75 L 280 95 L 255 100 L 225 90 L 205 70 Z',
  'ladakh': 'M 255 35 L 320 18 L 350 48 L 332 78 L 300 75 L 290 50 Z',
  'himachal-pradesh': 'M 255 100 L 295 93 L 308 115 L 297 138 L 270 145 L 250 132 L 245 112 Z',
  'punjab': 'M 215 88 L 255 100 L 250 132 L 228 140 L 208 130 L 204 108 Z',
  'uttarakhand': 'M 270 145 L 308 135 L 322 155 L 312 178 L 286 180 L 265 166 Z',
  'haryana': 'M 208 130 L 250 132 L 260 152 L 250 172 L 224 176 L 204 164 L 200 145 Z',
  'delhi': 'M 250 165 L 270 160 L 274 176 L 255 181 L 247 172 Z',
  'uttar-pradesh': 'M 260 152 L 322 155 L 368 165 L 378 196 L 358 226 L 322 242 L 280 246 L 250 236 L 240 210 L 255 186 L 260 170 Z',
  'rajasthan': 'M 152 158 L 208 145 L 224 176 L 260 176 L 260 216 L 244 262 L 214 286 L 174 296 L 138 270 L 128 234 L 133 195 Z',
  'bihar': 'M 358 226 L 402 216 L 422 236 L 416 266 L 386 280 L 356 276 L 335 256 L 340 236 Z',
  'west-bengal': 'M 416 234 L 452 224 L 468 246 L 462 292 L 446 316 L 420 320 L 400 300 L 394 270 L 410 250 Z',
  'sikkim': 'M 448 194 L 467 189 L 472 206 L 459 216 L 444 209 Z',
  'arunachal-pradesh': 'M 470 175 L 542 164 L 568 186 L 562 212 L 522 219 L 480 216 L 464 200 Z',
  'assam': 'M 470 216 L 522 219 L 542 231 L 537 252 L 506 259 L 474 253 L 459 238 Z',
  'nagaland': 'M 537 229 L 562 226 L 570 243 L 556 256 L 535 251 L 530 239 Z',
  'manipur': 'M 538 253 L 560 249 L 567 269 L 556 283 L 537 281 L 527 266 Z',
  'mizoram': 'M 520 271 L 542 266 L 550 287 L 541 302 L 520 302 L 512 286 Z',
  'tripura': 'M 505 261 L 523 256 L 526 276 L 516 286 L 500 283 L 497 269 Z',
  'meghalaya': 'M 460 249 L 502 245 L 510 259 L 499 271 L 462 269 L 454 256 Z',
  'jharkhand': 'M 385 276 L 422 269 L 437 291 L 432 321 L 406 336 L 380 329 L 364 309 L 368 286 Z',
  'odisha': 'M 380 329 L 406 336 L 437 326 L 452 347 L 447 387 L 416 407 L 385 401 L 359 381 L 354 351 L 368 331 Z',
  'chhattisgarh': 'M 304 286 L 356 276 L 372 296 L 377 337 L 361 372 L 330 383 L 299 376 L 281 350 L 284 316 Z',
  'madhya-pradesh': 'M 214 286 L 280 271 L 310 281 L 320 306 L 316 341 L 290 362 L 254 369 L 219 356 L 189 330 L 184 306 L 200 290 Z',
  'gujarat': 'M 123 230 L 160 219 L 200 224 L 216 251 L 215 286 L 194 311 L 169 326 L 138 321 L 109 300 L 099 274 L 104 250 Z',
  'maharashtra': 'M 189 330 L 256 336 L 286 316 L 291 362 L 275 396 L 254 422 L 219 436 L 184 431 L 163 411 L 153 385 L 159 356 Z',
  'goa': 'M 194 461 L 216 456 L 226 471 L 215 484 L 194 483 L 187 471 Z',
  'karnataka': 'M 219 436 L 260 426 L 292 436 L 302 467 L 296 502 L 270 522 L 239 526 L 209 511 L 193 486 L 196 463 L 209 447 Z',
  'andhra-pradesh': 'M 292 436 L 337 426 L 378 442 L 392 472 L 381 511 L 356 527 L 315 531 L 289 516 L 277 491 L 279 461 Z',
  'telangana': 'M 284 391 L 331 383 L 362 391 L 377 417 L 371 441 L 336 449 L 300 446 L 277 426 L 277 406 Z',
  'tamil-nadu': 'M 254 526 L 300 521 L 336 526 L 362 552 L 356 587 L 330 612 L 299 622 L 268 611 L 247 591 L 239 561 L 244 536 Z',
  'kerala': 'M 224 526 L 254 526 L 247 561 L 239 597 L 229 616 L 209 611 L 199 591 L 199 561 L 209 536 Z',
  'puducherry': 'M 314 546 L 329 543 L 333 556 L 321 559 L 311 553 Z',
}

// ── INVESTOR FILL COLORS (purple theme) ───────────────────────
const INVESTOR_FILLS = {
  'karnataka': '#2a1045', 'maharashtra': '#1a0a35', 'delhi': '#2d1050',
  'tamil-nadu': '#1e0840', 'telangana': '#1a0e38', 'gujarat': '#22083a',
  'west-bengal': '#1a0e32', 'rajasthan': '#280840', 'uttar-pradesh': '#1e0a38',
  'kerala': '#1a0e3a', 'bihar': '#1e0a30', 'andhra-pradesh': '#1a0e35',
}
const DEFAULT_INVESTOR_FILL = '#120828'

// ── INTRO MODAL ────────────────────────────────────────────────
function IntroModal({ investor, onClose }) {
  const [startup, setStartup] = useState('')
  const [email, setEmail] = useState('')
  const [pitch, setPitch] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const MAX = 500

  const handleSend = async () => {
    if (!startup.trim() || !email.trim() || !pitch.trim()) {
      toast.error('Please fill in all fields.')
      return
    }
    setSending(true)
    try {
      await sendIntroRequest({
        investorId: investor.id,
        investorFirm: investor.firm_name,
        partnerName: investor.partner_name,
        startupId: startup.toLowerCase().replace(/\s+/g, '-'),
        startupName: startup,
        founderEmail: email,
        pitch,
      })
      setSent(true)
      toast.success(`Intro request sent to ${investor.firm_name}!`)
      setTimeout(onClose, 2500)
    } catch {
      toast.error('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="w-full max-w-md card p-7 relative animate-fade-up"
        style={{ borderColor: 'rgba(155,111,255,0.25)' }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white text-2xl leading-none transition-colors">
          ×
        </button>

        {sent ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>
              Request Sent!
            </h3>
            <p className="text-sm text-white/40 leading-relaxed">
              {investor.partner_name} at {investor.firm_name} will receive your pitch shortly.
              You'll be CC'd on the intro email.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <div className="text-[10px] text-purple-400 tracking-[3px] uppercase mb-1">Request Introduction</div>
              <h3 className="text-xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>
                To {investor.firm_name}
              </h3>
              <p className="text-xs text-white/35 mt-0.5">via {investor.partner_name}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">
                  Your Startup Name *
                </label>
                <input className="input-field" placeholder="Your company name"
                  value={startup} onChange={e => setStartup(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">
                  Your Email *
                </label>
                <input className="input-field" type="email" placeholder="founder@yourstartup.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">
                  Your Pitch * <span className="text-white/20 normal-case tracking-normal">(max {MAX} chars)</span>
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={5}
                  placeholder={`Tell ${investor.partner_name} what you're building, your traction, and why ${investor.firm_name} is the right fit...`}
                  value={pitch}
                  onChange={e => setPitch(e.target.value.slice(0, MAX))}
                />
                <div className={`text-[10px] text-right mt-1 ${pitch.length > 450 ? 'text-red-400' : 'text-white/20'}`}>
                  {pitch.length} / {MAX}
                </div>
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full mt-4 py-3 rounded-xl font-black text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#9B6FFF)', opacity: sending ? 0.6 : 1 }}
            >
              {sending ? 'Sending...' : 'Send Introduction Request →'}
            </button>
            <p className="text-[10px] text-white/20 text-center mt-2">
              Uses 1 of your intro credits · {investor.firm_name} will receive your pitch via email
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ── STATE SIDE PANEL ───────────────────────────────────────────
function StatePanel({ stateId, stateName, startupCount, investorCount, mode, onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(mode === 'investor' ? 'investors' : 'startups')
  const [startups, setStartups] = useState([])
  const [investors, setInvestors] = useState([])
  const [loadingS, setLoadingS] = useState(false)
  const [loadingI, setLoadingI] = useState(false)
  const [introTarget, setIntroTarget] = useState(null)
  const [marked, setMarked] = useState({})
  const [introed, setIntroed] = useState({})

  const stateName_ = INDIAN_STATES.find(s => s.id === stateId)?.name || stateName

  useEffect(() => {
    // Load startups
    setLoadingS(true)
    getStartups(stateName_)
      .then(setStartups)
      .catch(() => setStartups([]))
      .finally(() => setLoadingS(false))

    // Load investors — try Firestore first, fall back to local data
    setLoadingI(true)
    getInvestors(stateId)
      .then(data => {
        if (data.length > 0) setInvestors(data)
        else setInvestors(INVESTORS_BY_STATE[stateId] || [])
      })
      .catch(() => setInvestors(INVESTORS_BY_STATE[stateId] || []))
      .finally(() => setLoadingI(false))
  }, [stateId, stateName_])

  // Switch default tab when mode changes
  useEffect(() => {
    setTab(mode === 'investor' ? 'investors' : 'startups')
  }, [mode])

  const handleMarkInterest = async (startup) => {
    if (!user) { navigate('/?login=investor'); return }
    if (marked[startup.id]) return
    setMarked(prev => ({ ...prev, [startup.id]: true }))
    toast.success(`Interest marked! ${startup.company_name} saved to your investor dashboard.`)
    try {
      const invPro = await getMyInvestorProfile(user.uid, user.email)
      await markInvestorInterest(user.uid, invPro?.firm_name || user.displayName || 'Investor', invPro?.partner_name || user.displayName || 'Investor', startup)
    } catch (err) { console.error('markInterest error:', err) }
  }

  const handleSendIntro = async (startup) => {
    if (!user) { navigate('/?login=investor'); return }
    if (introed[startup.id]) return
    setIntroed(prev => ({ ...prev, [startup.id]: true }))
    toast.success(`Intro sent to ${startup.company_name}! Founder will be notified.`)
    try {
      const invPro = await getMyInvestorProfile(user.uid, user.email)
      await sendIntroToFounder(user.uid, invPro?.firm_name || user.displayName || 'Investor', invPro?.partner_name || user.displayName || 'Investor', startup)
    } catch (err) { console.error('sendIntro error:', err) }
  }

  const activeTabClass = mode === 'investor'
    ? 'bg-purple-500/15 border-b-2 border-purple-400 text-purple-300'
    : 'bg-blue-500/15 border-b-2 border-blue-400 text-blue-300'

  return (
    <>
      {introTarget && (
        <IntroModal investor={introTarget} onClose={() => setIntroTarget(null)} />
      )}

      <div className="card overflow-hidden flex flex-col h-full" style={{
        borderColor: mode === 'investor' ? 'rgba(155,111,255,0.2)' : 'rgba(74,158,255,0.2)',
        animation: 'fadeSlideIn 0.22s ease',
      }}>
        {/* Panel Header */}
        <div className="p-4 pb-0">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-[9px] tracking-[3px] uppercase mb-1 font-bold"
                style={{ color: mode === 'investor' ? '#9B6FFF' : '#4A9EFF' }}>
                {mode === 'investor' ? 'Investor Map' : 'Startup Map'}
              </div>
              <h3 className="text-xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>
                {stateName_}
              </h3>
              <div className="flex gap-3 mt-1">
                <span className="text-xs text-white/35">🚀 {startupCount} startups</span>
                <span className="text-xs text-white/35">💰 {investorCount} investors</span>
              </div>
            </div>
            <button onClick={onClose}
              className="text-white/30 hover:text-white transition-colors text-2xl leading-none mt-1">
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.08]">
            <button
              onClick={() => setTab('startups')}
              className={`flex-1 py-2.5 text-xs font-bold transition-all ${tab === 'startups' ? activeTabClass : 'text-white/30 hover:text-white/60'}`}
            >
              🚀 Startups ({startupCount})
            </button>
            <button
              onClick={() => setTab('investors')}
              className={`flex-1 py-2.5 text-xs font-bold transition-all ${tab === 'investors' ? activeTabClass : 'text-white/30 hover:text-white/60'}`}
            >
              💰 Investors ({investorCount})
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3 h-full" style={{ scrollbarWidth: 'thin' }}>

          {/* ── STARTUPS TAB ── */}
          {tab === 'startups' && (
            loadingS ? (
              <div className="text-center py-10 text-white/25 text-sm">Loading startups...</div>
            ) : startups.length === 0 ? (
              <div className="text-center py-10 text-white/25 text-sm">
                No startups listed yet in {stateName_}.
                <br />
                <a href="/?mode=startup#list-startup" className="text-blue-400 hover:underline text-xs mt-2 block">
                  Be the first →
                </a>
              </div>
            ) : (
              startups.map(s => (
                <div key={s.id}
                  onClick={() => navigate(`/startup/${s.id}`)}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 hover:border-blue-500/30 transition-colors cursor-pointer">
                  <div className="flex gap-3 items-start mb-2">
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-sm overflow-hidden"
                      style={{ background: s.brand_color || '#3B7DD8', fontFamily: 'Playfair Display,serif' }}>
                      {s.logo_url
                        ? <img src={s.logo_url} alt={s.company_name} className="w-full h-full rounded-xl object-cover" />
                        : s.company_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-white text-sm">{s.company_name}</span>
                        {s.sector && (
                          <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                            {s.sector}
                          </span>
                        )}
                        {s.is_premium && (
                          <span className="text-[9px] bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 px-2 py-0.5 rounded-full font-black">
                            ⭐ PRO
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{s.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Buttons in investor mode */}
                  {mode === 'investor' ? (
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleSendIntro(s)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${introed[s.id]
                          ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400 cursor-default'
                          : 'bg-white/[0.04] border border-white/10 text-white/50 hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/8'
                          }`}>
                        {introed[s.id] ? '✓ Intro Sent' : '✉️ Intro'}
                      </button>
                      <button
                        onClick={() => handleMarkInterest(s)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${marked[s.id]
                          ? 'bg-green-500/15 border border-green-500/30 text-green-400 cursor-default'
                          : 'bg-white/[0.04] border border-white/10 text-white/50 hover:border-green-500/30 hover:text-green-400 hover:bg-green-500/8'
                          }`}>
                        {marked[s.id] ? '✓ Interested' : '👀 Mark Interest'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/startup/${s.id}`)}
                        className="flex-1 py-2 rounded-lg text-xs font-bold bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/15 hover:border-blue-500/40 transition-all text-center cursor-pointer">
                        View Profile →
                      </button>
                      {s.website_url && (
                        <a href={s.website_url} target="_blank" rel="noopener noreferrer"
                          className="py-2 px-3 rounded-lg text-xs font-bold bg-white/[0.04] border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all">
                          ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))
            )
          )}

          {/* ── INVESTORS TAB ── */}
          {tab === 'investors' && (
            loadingI ? (
              <div className="text-center py-10 text-white/25 text-sm">Loading investors...</div>
            ) : investors.length === 0 ? (
              <div className="text-center py-10 text-white/25 text-sm">
                No investors listed for {stateName_} yet.
                <br />
                <Link to="/pricing" className="text-purple-400 hover:underline text-xs mt-2 block">
                  Join as Investor →
                </Link>
              </div>
            ) : (
              investors.map(inv => (
                <div key={inv.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 hover:border-white/15 transition-colors"
                  style={{ borderColor: inv.open_to_pitches ? 'rgba(0,208,156,0.12)' : undefined }}>
                  <div className="flex gap-3 items-start mb-3">
                    <Link to={`/investor/${inv.id}`}
                      className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-sm hover:opacity-80 transition-opacity overflow-hidden"
                      style={{ background: inv.brand_color || '#9B6FFF', fontFamily: 'Playfair Display,serif' }}>
                      {inv.logo_url
                        ? <img src={inv.logo_url} alt={inv.firm_name} className="w-full h-full object-cover rounded-xl" />
                        : (inv.avatar || inv.firm_name?.[0])}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <Link to={`/investor/${inv.id}`} className="font-bold text-white text-sm hover:text-purple-300 transition-colors">{inv.firm_name}</Link>
                        {inv.open_to_pitches && (
                          <span className="text-[9px] bg-green-500/10 border border-green-500/25 text-green-400 px-2 py-0.5 rounded-full font-bold">
                            OPEN TO PITCHES
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/35 mb-1.5">via {inv.partner_name}</p>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {(inv.focus || []).map(f => (
                          <span key={f} className="text-[9px] bg-white/5 border border-white/10 text-white/40 px-1.5 py-0.5 rounded-full">
                            {f}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <span className="text-[10px] text-white/35">📊 {inv.stage}</span>
                        <span className="text-[10px] text-yellow-400/70">💰 {inv.cheque_size}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIntroTarget(inv)}
                    className="w-full py-2 rounded-lg text-xs font-bold transition-all border"
                    style={{
                      background: 'rgba(74,158,255,0.08)',
                      borderColor: 'rgba(74,158,255,0.25)',
                      color: '#4A9EFF',
                    }}
                  >
                    ✉️ Request Introduction
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────────
export default function InvestorMap() {
  const svgRef = useRef(null)
  const rafRef = useRef(null)

  const [mode, setMode] = useState('startup')   // 'startup' | 'investor'
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const [startupCounts, setStartupCounts] = useState({})
  const [investorCounts, setInvestorCounts] = useState({})
  const [tip, setTip] = useState({ show: false, x: 0, y: 0, state: null })
  const [allInvestorsByState, setAllInvestorsByState] = useState({})
  const navigate = useNavigate()

  // Zoom/pan (same system as IndiaMap)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const zTarget = useRef(1); const xTarget = useRef(0); const yTarget = useRef(0)
  const zCur = useRef(1); const xCur = useRef(0); const yCur = useRef(0)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })

  useEffect(() => {
    getStartupCountByState().then(counts => {
      // counts keys are state names — convert to ids
      const byId = {}
      INDIAN_STATES.forEach(s => { if (counts[s.name]) byId[s.id] = counts[s.name] })
      setStartupCounts(byId)
    }).catch(() => { })

    // Fetch investor counts and normalize keys to state IDs
    getInvestorCountByState().then(raw => {
      const normalized = {}
      Object.entries(raw).forEach(([key, count]) => {
        // Try matching by name first, then normalize
        const byName = INDIAN_STATES.find(s => s.name === key)
        if (byName) { normalized[byName.id] = (normalized[byName.id] || 0) + count; return }
        const byId = INDIAN_STATES.find(s => s.id === key)
        if (byId) { normalized[byId.id] = (normalized[byId.id] || 0) + count; return }
        // Normalize the key (e.g. "Madhya Pradesh" -> "madhya-pradesh")
        const normKey = key.toLowerCase().trim().replace(/\s+/g, '-').replace(/&/g, 'and').replace(/[^a-z0-9-]/g, '')
        const byNorm = INDIAN_STATES.find(s => s.id === normKey)
        if (byNorm) { normalized[byNorm.id] = (normalized[byNorm.id] || 0) + count; return }
        // Fallback: just use the key as-is
        normalized[key] = (normalized[key] || 0) + count
      })
      setInvestorCounts(normalized)
    }).catch(() => {
      const local = {}
      Object.entries(INVESTORS_BY_STATE).forEach(([id, arr]) => { local[id] = arr.length })
      setInvestorCounts(local)
    })

    // Fetch all investors for map bubbles — resolve state properly
    getInvestors().then(all => {
      const byState = {}
      all.forEach(inv => {
        let sid = null
        // Try state_id (could be slug or display name)
        if (inv.state_id) {
          const byId = INDIAN_STATES.find(s => s.id === inv.state_id)
          if (byId) sid = byId.id
          else {
            const byName = INDIAN_STATES.find(s => s.name === inv.state_id)
            if (byName) sid = byName.id
            else {
              const normKey = inv.state_id.toLowerCase().trim().replace(/\s+/g, '-').replace(/&/g, 'and').replace(/[^a-z0-9-]/g, '')
              const byNorm = INDIAN_STATES.find(s => s.id === normKey)
              if (byNorm) sid = byNorm.id
            }
          }
        }
        // Try state field (display name)
        if (!sid && inv.state) {
          const byName = INDIAN_STATES.find(s => s.name === inv.state)
          if (byName) sid = byName.id
          else {
            const normKey = inv.state.toLowerCase().trim().replace(/\s+/g, '-').replace(/&/g, 'and').replace(/[^a-z0-9-]/g, '')
            const byNorm = INDIAN_STATES.find(s => s.id === normKey)
            if (byNorm) sid = byNorm.id
          }
        }
        if (!sid) return
        if (!byState[sid]) byState[sid] = []
        byState[sid].push(inv)
      })
      // Also merge local mock investors
      Object.entries(INVESTORS_BY_STATE).forEach(([stateId, arr]) => {
        if (!byState[stateId]) byState[stateId] = []
        arr.forEach(inv => {
          if (!byState[stateId].some(x => x.id === inv.id)) {
            byState[stateId].push(inv)
          }
        })
      })
      setAllInvestorsByState(byState)
    }).catch(() => { })

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // ── Animation ─────────────────────────────────────────────
  const runAnim = useCallback(() => {
    const EASE = 0.1
    const dz = (zTarget.current - zCur.current) * EASE
    const dx = (xTarget.current - xCur.current) * EASE
    const dy = (yTarget.current - yCur.current) * EASE
    zCur.current += dz; xCur.current += dx; yCur.current += dy
    setZoom(zCur.current); setPanX(xCur.current); setPanY(yCur.current)
    const still = Math.abs(dz) < 0.0003 && Math.abs(dx) < 0.03 && Math.abs(dy) < 0.03
    if (!still) rafRef.current = requestAnimationFrame(runAnim)
    else { setZoom(zTarget.current); setPanX(xTarget.current); setPanY(yTarget.current) }
  }, [])
  const kickAnim = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(runAnim)
  }, [runAnim])

  const clampPan = (px, py, z) => {
    const maxX = (640 - 640 / z) / 2
    const maxY = (670 - 670 / z) / 2
    return [Math.max(-maxX, Math.min(maxX, px)), Math.max(-maxY, Math.min(maxY, py))]
  }

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e) => {
      e.preventDefault()
      const newZ = Math.max(1, Math.min(4, zTarget.current + (e.deltaY > 0 ? -0.11 : 0.11)))
      if (newZ === zTarget.current) return
      const rect = svg.getBoundingClientRect()
      const mxPct = (e.clientX - rect.left) / rect.width
      const myPct = (e.clientY - rect.top) / rect.height
      const vbW0 = 640 / zTarget.current; const vbH0 = 670 / zTarget.current
      const vbX0 = (640 - vbW0) / 2 + xTarget.current
      const vbY0 = (670 - vbH0) / 2 + yTarget.current
      const svgMX = vbX0 + mxPct * vbW0; const svgMY = vbY0 + myPct * vbH0
      const vbW1 = 640 / newZ; const vbH1 = 670 / newZ
      const [cpx, cpy] = clampPan(svgMX - mxPct * vbW1 - (640 - vbW1) / 2, svgMY - myPct * vbH1 - (670 - vbH1) / 2, newZ)
      zTarget.current = newZ; xTarget.current = cpx; yTarget.current = cpy
      kickAnim()
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [kickAnim])

  const onMouseDown = (e) => {
    if (zTarget.current <= 1) return
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, px: xTarget.current, py: yTarget.current }
  }
  const onMouseMove = (e) => {
    if (!dragging.current) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const svgPxW = rect.width / (640 / zCur.current)
    const svgPxH = rect.height / (670 / zCur.current)
    const [cpx, cpy] = clampPan(
      dragStart.current.px - (e.clientX - dragStart.current.x) / svgPxW,
      dragStart.current.py - (e.clientY - dragStart.current.y) / svgPxH,
      zTarget.current
    )
    xTarget.current = cpx; yTarget.current = cpy; kickAnim()
  }
  const onMouseUp = () => { dragging.current = false }
  const resetZoom = () => {
    zTarget.current = 1; xTarget.current = 0; yTarget.current = 0; kickAnim()
  }
  const adjustZoom = (d) => {
    const newZ = Math.max(1, Math.min(4, zTarget.current + d))
    const [cpx, cpy] = clampPan(xTarget.current, yTarget.current, newZ)
    zTarget.current = newZ; xTarget.current = cpx; yTarget.current = cpy; kickAnim()
  }

  const vbW = 640 / zoom; const vbH = 670 / zoom
  const vbX = (640 - vbW) / 2 + panX; const vbY = (670 - vbH) / 2 + panY
  const viewBox = `${vbX.toFixed(3)} ${vbY.toFixed(3)} ${vbW.toFixed(3)} ${vbH.toFixed(3)}`
  const s = 1 / zoom  // scale for dots/text

  const getFill = (state) => {
    if (mode === 'investor') {
      if (selected === state.id) return '#5a1a8a'
      if (hovered === state.id) return '#3a1a6a'
      return INVESTOR_FILLS[state.id] || DEFAULT_INVESTOR_FILL
    } else {
      const c = REGION_COLORS[state.region] || REGION_COLORS.north
      if (selected === state.id) return c.active
      if (hovered === state.id) return c.hover
      return c.fill
    }
  }

  const handleStateClick = (state) => {
    if (dragging.current) return
    setSelected(prev => prev === state.id ? null : state.id)
  }

  const handleModeSwitch = (newMode) => {
    setMode(newMode)
    setSelected(null)
    setTip({ show: false })
  }

  const getCount = (stateId) => mode === 'investor'
    ? (investorCounts[stateId] || 0)
    : (startupCounts[stateId] || 0)

  const selectedState = selected ? INDIAN_STATES.find(s => s.id === selected) : null

  return (
    <main className="relative z-10 pt-20">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs tracking-widest uppercase mb-5 border"
          style={{
            background: mode === 'investor' ? 'rgba(155,111,255,0.1)' : 'rgba(74,158,255,0.1)',
            borderColor: mode === 'investor' ? 'rgba(155,111,255,0.25)' : 'rgba(74,158,255,0.25)',
            color: mode === 'investor' ? '#9B6FFF' : '#4A9EFF',
            transition: 'all 0.3s',
          }}>
          {mode === 'investor' ? '💰 India\'s Investor Discovery Platform' : '🚀 India\'s Startup Discovery Platform'}
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-[1.05] mb-3"
          style={{
            fontFamily: 'Playfair Display,serif', letterSpacing: '-2px',
            background: mode === 'investor'
              ? 'linear-gradient(135deg,#fff 0%,#D4BBFF 50%,#9B6FFF 100%)'
              : 'linear-gradient(135deg,#fff 0%,#B8D4FF 50%,#63B3FF 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            transition: 'all 0.3s',
          }}>
          {mode === 'investor' ? 'Startups meet Investors.' : 'Every Startup.'}
          <br />
          {mode === 'investor' ? 'State by State. 🇮🇳' : 'Every State. One Map.'}
        </h1>
        <p className="text-base text-white/40 max-w-md mx-auto leading-relaxed mb-6">
          {mode === 'investor'
            ? 'Switch between Startup Map and Investor Map. Click any state to explore VCs, request warm introductions, and connect with founders.'
            : 'Click any state on India\'s map to explore startups. Secure your grid spot and get discovered nationwide.'}
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-6">
          {[
            { v: '1,200+', l: 'Startups', c: '#4A9EFF' },
            { v: Object.values(investorCounts).reduce((a, b) => a + b, 0) || '50+', l: 'Investors', c: '#9B6FFF' },
            { v: '36', l: 'States', c: '#00D09C' },
          ].map(({ v, l, c }) => (
            <div key={l} className="text-center">
              <div className="text-2xl font-black" style={{ fontFamily: 'Playfair Display,serif', color: c }}>{v}</div>
              <div className="text-[10px] text-white/30 uppercase tracking-widest">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODE TOGGLE ──────────────────────────────────────── */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-white/[0.04] border border-white/[0.08] rounded-2xl p-1.5 gap-1.5">
          <button
            onClick={() => handleModeSwitch('startup')}
            className="px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-250"
            style={mode === 'startup' ? {
              background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(74,158,255,0.25)',
            } : { color: 'rgba(255,255,255,0.4)', background: 'transparent' }}
          >
            🚀 Startup Map
          </button>
          <button
            onClick={() => handleModeSwitch('investor')}
            className="px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-250"
            style={mode === 'investor' ? {
              background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(155,111,255,0.25)',
            } : { color: 'rgba(255,255,255,0.4)', background: 'transparent' }}
          >
            💰 Investor Map
          </button>
        </div>
      </div>

      {/* ── MAP + PANEL ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className={`grid gap-5 items-stretch ${selected ? 'grid-cols-1 lg:grid-cols-[1.2fr_1fr]' : 'grid-cols-1'}`}>

          {/* MAP CARD */}
          <div className="card p-4 relative select-none flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="section-label px-1" style={{ color: mode === 'investor' ? '#9B6FFF' : '#4A9EFF' }}>
                {mode === 'investor' ? '💰 Active Investors by State · Click to explore' : '🗺 Startups by State · Click to explore'}
              </span>
              <span className="text-[10px] text-white/20">
                Mode: <strong style={{ color: mode === 'investor' ? '#9B6FFF' : '#4A9EFF' }}>
                  {mode === 'investor' ? 'Investors' : 'Startups'}
                </strong>
              </span>
            </div>

            {/* Zoom buttons */}
            <div className="absolute top-10 right-6 z-10 flex flex-col gap-1">
              {[{ l: '+', d: 0.5 }, { l: '−', d: -0.5 }].map(b => (
                <button key={b.l} onClick={() => adjustZoom(b.d)}
                  className="w-6 h-6 rounded-md bg-[#0D1525]/90 border border-white/10 text-white/60 hover:text-white text-sm font-bold flex items-center justify-center transition-all">
                  {b.l}
                </button>
              ))}
              {zoom > 1.05 && (
                <button onClick={resetZoom}
                  className="text-[9px] border px-1.5 py-0.5 rounded transition-all mt-0.5"
                  style={{ color: mode === 'investor' ? '#9B6FFF' : '#4A9EFF', borderColor: mode === 'investor' ? 'rgba(155,111,255,0.3)' : 'rgba(74,158,255,0.3)' }}>
                  Reset
                </button>
              )}
            </div>

            <svg ref={svgRef} viewBox={viewBox} className="w-full h-auto"
              xmlns="http://www.w3.org/2000/svg"
              onMouseDown={onMouseDown} onMouseMove={onMouseMove}
              onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              onDoubleClick={resetZoom}
              style={{ cursor: dragging.current ? 'grabbing' : zoom > 1.05 ? 'grab' : 'default' }}>
              <defs>
                <filter id="iglow">
                  <feGaussianBlur stdDeviation="4" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {INDIAN_STATES.map(state => {
                const d = STATE_PATHS[state.id]
                if (!d) return null
                const isSel = selected === state.id
                const count = getCount(state.id)
                const accent = mode === 'investor' ? '#9B6FFF' : '#4A9EFF'

                return (
                  <g key={state.id}>
                    <path
                      d={d}
                      fill={getFill(state)}
                      stroke={isSel
                        ? (mode === 'investor' ? 'rgba(155,111,255,0.8)' : 'rgba(74,158,255,0.8)')
                        : 'rgba(99,179,255,0.12)'}
                      strokeWidth={isSel ? 1.5 : 0.6}
                      className="india-state"
                      style={{ filter: isSel ? 'url(#iglow)' : 'none' }}
                      onClick={() => handleStateClick(state)}
                      onMouseEnter={e => {
                        setHovered(state.id)
                        const r = e.currentTarget.closest('svg').getBoundingClientRect()
                        setTip({ show: true, x: e.clientX - r.left, y: e.clientY - r.top, state })
                      }}
                      onMouseLeave={() => { setHovered(null); setTip({ show: false }) }}
                      onMouseMove={e => {
                        const r = e.currentTarget.closest('svg').getBoundingClientRect()
                        setTip(t => ({ ...t, x: e.clientX - r.left, y: e.clientY - r.top }))
                      }}
                    />
                    {/* Dot marker */}
                    <circle
                      cx={state.cx} cy={state.cy}
                      r={(isSel ? 6 : count > 0 ? 5 : 3) * s}
                      fill={isSel ? accent : count > 0 ? accent : `${accent}40`}
                      stroke={isSel ? 'rgba(255,255,255,0.7)' : 'transparent'}
                      strokeWidth={1.5 * s}
                      style={{ pointerEvents: 'none' }}
                    />
                    {count > 0 && (
                      <text x={state.cx} y={state.cy + 3.5 * s}
                        textAnchor="middle" fontSize={5.5 * s}
                        fill="#fff" fontFamily="DM Sans,sans-serif" fontWeight="900"
                        style={{ pointerEvents: 'none' }}>
                        {count}
                      </text>
                    )}
                    {isSel && (
                      <circle cx={state.cx} cy={state.cy} r={14 * s}
                        fill="none" stroke={accent} strokeWidth={1.5 * s} opacity={0.5}
                        style={{ pointerEvents: 'none' }} />
                    )}
                  </g>
                )
              })}

              {/* Investor logo bubbles on map */}
              {mode === 'investor' && INDIAN_STATES.map(state => {
                const invs = allInvestorsByState[state.id]
                if (!invs || invs.length === 0) return null
                const s = 1 / zoom
                const shown = invs.slice(0, 3)
                return shown.map((inv, idx) => {
                  const angle = (idx * 120 - 90) * (Math.PI / 180)
                  const dist = 16 * s
                  const bx = state.cx + Math.cos(angle) * dist
                  const by = state.cy + Math.sin(angle) * dist
                  const r = 7 * s
                  return (
                    <g key={inv.id} onClick={(e) => { e.stopPropagation(); navigate(`/investor/${inv.id}`) }}
                      style={{ cursor: 'pointer' }}>
                      <circle cx={bx} cy={by} r={r + 1 * s} fill="rgba(13,22,40,0.9)" />
                      <circle cx={bx} cy={by} r={r} fill={inv.brand_color || '#9B6FFF'} />
                      {inv.logo_url ? (
                        <image href={inv.logo_url} x={bx - r * 0.7} y={by - r * 0.7}
                          width={r * 1.4} height={r * 1.4} clipPath={`circle(${r * 0.7}px)`}
                          preserveAspectRatio="xMidYMid slice" />
                      ) : (
                        <text x={bx} y={by + 2.5 * s} textAnchor="middle" fontSize={5 * s}
                          fill="#fff" fontFamily="DM Sans,sans-serif" fontWeight="900"
                          style={{ pointerEvents: 'none' }}>
                          {(inv.avatar || inv.firm_name?.[0] || 'I').slice(0, 2)}
                        </text>
                      )}
                    </g>
                  )
                })
              })}

              {/* Tooltip */}
              {tip.show && tip.state && (() => {
                const rect = svgRef.current?.getBoundingClientRect()
                if (!rect) return null
                const sx = vbX + (tip.x / rect.width) * vbW
                const sy = vbY + (tip.y / rect.height) * vbH
                const sc = 1 / zoom
                const tw = 130 * sc; const th = 40 * sc
                const accent = mode === 'investor' ? '#9B6FFF' : '#4A9EFF'
                const cnt = getCount(tip.state.id)
                return (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect x={sx - tw / 2} y={sy - th - 8 * sc} width={tw} height={th} rx={5 * sc}
                      fill="rgba(13,21,37,0.97)" stroke={`${accent}50`} strokeWidth={0.7 * sc} />
                    <text x={sx} y={sy - th + 11 * sc} textAnchor="middle" fontSize={9.5 * sc}
                      fill="#E8EAF0" fontFamily="DM Sans,sans-serif" fontWeight="700">
                      {tip.state.name}
                    </text>
                    <text x={sx} y={sy - th + 22 * sc} textAnchor="middle" fontSize={7.5 * sc}
                      fill="rgba(232,234,240,0.45)" fontFamily="DM Sans,sans-serif">
                      {cnt
                        ? `${cnt} ${mode === 'investor' ? 'investor' : 'startup'}${cnt > 1 ? 's' : ''} · click to explore`
                        : 'No listings yet · click to view'}
                    </text>
                    <text x={sx} y={sy - 10 * sc} textAnchor="middle" fontSize={6.5 * sc}
                      fill={`${accent}70`} fontFamily="DM Sans,sans-serif">
                      Click to explore →
                    </text>
                  </g>
                )
              })()}
            </svg>

            {/* Legend */}
            <div className="flex gap-4 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: mode === 'investor' ? '#9B6FFF' : '#4A9EFF' }} />
                <span className="text-[10px] text-white/35">Has {mode === 'investor' ? 'investors' : 'startups'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white/20" />
                <span className="text-[10px] text-white/35">Click to explore</span>
              </div>
            </div>
          </div>

          {/* STATE PANEL */}
          {selectedState && (
            <StatePanel
              key={`${selectedState.id}-${mode}`}
              stateId={selectedState.id}
              stateName={selectedState.name}
              startupCount={startupCounts[selectedState.id] || 0}
              investorCount={investorCounts[selectedState.id] || INVESTORS_BY_STATE[selectedState.id]?.length || 0}
              mode={mode}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-8">
          <span className="section-label">How It Works</span>
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>
            Startups meet Investors
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: '🗺', t: 'Switch Maps', d: 'Toggle between Startup Map (blue) and Investor Map (purple) from the same view.' },
            { icon: '📍', t: 'Click a State', d: 'See startups & investors in that state with profiles, focus areas, and cheque sizes.' },
            { icon: '✉️', t: 'Request Intro', d: 'Founders send a short pitch to request warm email introductions to VCs.' },
            { icon: '👀', t: 'Mark Interest', d: 'Investors mark interest on startups. Founders get notified instantly.' },
          ].map(item => (
            <div key={item.t} className="card p-5 text-center hover:border-white/15 transition-all">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-black text-white text-base mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>{item.t}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 flex gap-4 justify-center flex-wrap">
          <Link to="/pricing" className="btn-primary px-8 py-3">
            💰 Join as Investor →
          </Link>
          <a href="/#list-startup" className="btn-secondary px-8 py-3">
            🚀 List Your Startup →
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
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
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </main>
  )
}
