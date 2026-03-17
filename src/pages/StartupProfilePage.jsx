// StartupProfilePage.jsx — /startup/:startupId
// Full company profile: logo, name, visit website, revenue, founder,
// founded date, social links, description, listing details.
// Logged-in founders can request intro directly from this page.

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { getStartupById } from '../lib/firebase'
import { sendIntroRequest, getAllMyInvestorProfiles } from '../lib/investorDb'
import { useAuth } from '../context/AuthContext'

// ── helpers ───────────────────────────────────────────────────────────────────
const pill = (bg, bd, c) => ({ background: bg, border: `1px solid ${bd}`, color: c })

// ── INTRO MODAL ───────────────────────────────────────────────────────────────
function IntroModal({ startup, user, onClose }) {
  const navigate = useNavigate()
  const [myStartup, setMyStartup] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [pitch, setPitch] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  if (!user) return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-8 text-center relative" style={{ background: '#0D1628', border: '1px solid rgba(155,111,255,0.35)' }}>
        <X onClose={onClose} />
        <div className="text-5xl mb-3">🔐</div>
        <h3 className="text-lg font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>Login to Request Intro</h3>
        <p className="text-sm text-white/40 mb-5">Create a free founder account to connect with startups on the map.</p>
        <button onClick={() => { onClose(); navigate('/?login=founder') }}
          className="w-full py-3 rounded-xl font-black text-sm text-white"
          style={{ background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)' }}>
          🚀 Login / Sign Up →
        </button>
      </div>
    </Overlay>
  )

  const send = async () => {
    if (!myStartup.trim()) { toast.error('Enter your startup name'); return }
    if (!pitch.trim()) { toast.error('Write a short message'); return }
    setBusy(true)
    try {
      await sendIntroRequest({
        investorId: startup.uid || startup.id,
        investorFirm: startup.company_name,
        partnerName: startup.founder_name || startup.company_name,
        startupId: myStartup.toLowerCase().replace(/\s+/g, '-'),
        startupName: myStartup.trim(),
        founderEmail: user.email,
        founderContactEmail: user.email,
        founderLinkedin: linkedin.trim(),
        pitch: pitch.trim(),
        direction: 'founder_to_founder',
      })
      setDone(true)
      toast.success(`Intro sent to ${startup.company_name}! 🎉`)
      setTimeout(onClose, 2800)
    } catch { toast.error('Failed to send. Try again.') }
    finally { setBusy(false) }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#0D1628', border: '1px solid rgba(74,158,255,0.35)', animation: 'fadeUp .2s ease' }}>
        <div className="px-6 pt-6 pb-4 border-b relative" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <X onClose={onClose} />
          <div className="text-[10px] text-blue-400 tracking-[3px] uppercase font-black mb-1">Connect with Startup</div>
          <div className="font-black text-white text-lg" style={{ fontFamily: 'Playfair Display,serif' }}>Request Intro · {startup.company_name}</div>
          <div className="text-xs text-white/35 mt-1">Introduce yourself and your startup</div>
        </div>
        {done ? (
          <div className="px-6 py-10 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <div className="font-black text-white text-lg mb-1">Intro Sent!</div>
            <div className="text-sm text-white/40">{startup.company_name} will receive your message shortly.</div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <F label="Your Startup Name *"><input value={myStartup} onChange={e => setMyStartup(e.target.value)} placeholder="e.g. Acme Technologies" className="inp" /></F>
            <F label="Your LinkedIn (optional)"><input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="linkedin.com/in/yourname" className="inp" /></F>
            <F label={`Message * — why connect with ${startup.company_name}?`}>
              <textarea value={pitch} onChange={e => setPitch(e.target.value.slice(0, 500))} rows={4}
                placeholder={`Tell ${startup.company_name} who you are and how you can collaborate.`} className="inp resize-none" />
              <div className={`text-[10px] text-right mt-1 ${pitch.length > 450 ? 'text-red-400' : 'text-white/20'}`}>{pitch.length}/500</div>
            </F>
            <button onClick={send} disabled={busy} className="w-full py-3 rounded-xl font-black text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)', opacity: busy ? .6 : 1 }}>
              {busy ? '📤 Sending…' : `✉️ Send Intro to ${startup.company_name} →`}
            </button>
          </div>
        )}
      </div>
    </Overlay>
  )
}

function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.90)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}
function X({ onClose }) {
  return <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white text-2xl leading-none transition-colors">×</button>
}
function F({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">{label}</label>
      {children}
    </div>
  )
}

// ── SKELETON ──────────────────────────────────────────────────────────────────
function Skeleton() {
  const p = 'animate-pulse rounded-xl'
  return (
    <main className="relative z-10 pt-24 max-w-3xl mx-auto px-6 pb-20">
      <div className={`${p} h-4 w-16 bg-white/5 mb-8`} />
      <div className="rounded-3xl p-8 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex gap-5">
          <div className={`${p} w-24 h-24 bg-white/5 rounded-2xl flex-shrink-0`} />
          <div className="flex-1 space-y-3 pt-1">
            <div className={`${p} h-9 bg-white/5 w-48`} />
            <div className="flex gap-2">{[80, 100, 90].map(w => <div key={w} className={`${p} h-6 bg-white/5 rounded-full`} style={{ width: w }} />)}</div>
            <div className={`${p} h-10 w-36 bg-white/5`} />
          </div>
        </div>
      </div>
      {[120, 80, 200].map(h => <div key={h} className={`${p} bg-white/[0.03] mb-4`} style={{ height: h, borderRadius: 16 }} />)}
    </main>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function StartupProfilePage() {
  const { startupId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [startup, setStartup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showIntro, setShowIntro] = useState(false)
  const [investorPlan, setInvestorPlan] = useState(null)   // investor plan string or null
  const [contactUnlocked, setContactUnlocked] = useState(false)

  useEffect(() => {
    if (!startupId) return
    setLoading(true)
    getStartupById(startupId)
      .then(d => setStartup(d))
      .catch(() => toast.error('Could not load startup'))
      .finally(() => setLoading(false))
  }, [startupId])

  // Check if logged-in user is an investor + what plan they have
  useEffect(() => {
    if (!user) return
    getAllMyInvestorProfiles(user.uid, user.email)
      .then(profiles => {
        if (profiles.length > 0) {
          // Use the highest-tier plan found
          const plans = profiles.map(p => p.plan).filter(Boolean)
          if (plans.includes('partner_elite')) setInvestorPlan('partner_elite')
          else if (plans.includes('scout_pro')) setInvestorPlan('scout_pro')
          else if (plans.length > 0) setInvestorPlan(plans[0])
        }
      })
      .catch(() => { })
  }, [user])

  if (loading) return <Skeleton />
  if (!startup) return (
    <main className="relative z-10 pt-28 max-w-3xl mx-auto px-6 pb-20 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Playfair Display,serif' }}>Startup not found</h2>
      <p className="text-white/40 mb-8">This listing may have expired or been removed.</p>
      <Link to="/" className="btn-primary px-8">← Back to Map</Link>
    </main>
  )

  const isEnt = startup.plan === 'enterprise'
  const isPro = startup.is_premium || startup.plan === 'premium'
  const bg = startup.brand_color || '#3B7DD8'
  const ini = startup.company_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const canIntro = user && profile?.role === 'founder' && startup.uid !== user.uid

  const socials = [
    startup.linkedin_url && { href: startup.linkedin_url, label: 'LinkedIn', icon: 'in', c: '#60a5fa', bg2: 'rgba(10,102,194,0.18)', bd: 'rgba(10,102,194,0.3)' },
    startup.twitter_url && { href: startup.twitter_url, label: 'Twitter/X', icon: '𝕏', c: '#7dd3fc', bg2: 'rgba(29,155,240,0.15)', bd: 'rgba(29,155,240,0.25)' },
    startup.instagram_url && { href: startup.instagram_url, label: 'Instagram', icon: 'ig', c: '#f9a8d4', bg2: 'rgba(225,48,108,0.15)', bd: 'rgba(225,48,108,0.25)' },
  ].filter(Boolean)

  const borderClr = isEnt ? 'rgba(245,158,11,0.4)' : isPro ? 'rgba(74,158,255,0.3)' : 'rgba(255,255,255,0.09)'
  const heroBg = isEnt ? 'linear-gradient(160deg,#0f1724 0%,#090d18 100%)' : 'rgba(255,255,255,0.025)'
  const nameGrad = isEnt ? 'linear-gradient(135deg,#fde68a,#fbbf24)' : isPro ? 'linear-gradient(135deg,#93c5fd,#60a5fa)' : 'linear-gradient(135deg,#ffffff,#e2e8f0)'
  const visitBtn = isEnt
    ? { background: 'linear-gradient(135deg,#d97706,#fbbf24)', color: '#0f1724', boxShadow: '0 4px 18px rgba(245,158,11,0.35)' }
    : { background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)', color: '#fff', border: '1px solid rgba(74,158,255,0.35)', boxShadow: '0 4px 18px rgba(74,158,255,0.2)' }

  return (
    <main className="relative z-10 pt-24 pb-20">
      <style>{`
        .inp{width:100%;padding:10px 12px;border-radius:12px;font-size:13px;color:#fff;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);outline:none;font-family:inherit}
        .inp:focus{border-color:rgba(74,158,255,0.5)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {showIntro && <IntroModal startup={startup} user={user} onClose={() => setShowIntro(false)} />}

      <div className="max-w-3xl mx-auto px-6">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white mb-8 transition-colors">
          ← Back
        </button>

        {/* ══ HERO CARD ══════════════════════════════════════════════ */}
        <div className="relative rounded-3xl overflow-hidden mb-5"
          style={{ background: heroBg, border: `1px solid ${borderClr}`, boxShadow: isEnt ? '0 0 60px rgba(245,158,11,0.07)' : 'none' }}>

          {/* Enterprise gold stripe */}
          {isEnt && <div style={{ height: 3, background: 'linear-gradient(90deg,#d97706,#fbbf24,#d97706)' }} />}

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">

              {/* Logo */}
              <div className="flex-shrink-0">
                {startup.logo_url
                  ? <img src={startup.logo_url} alt={startup.company_name} className="w-24 h-24 rounded-2xl object-contain"
                    style={{ background: '#fff', border: `2px solid ${borderClr}`, boxShadow: isEnt ? '0 0 24px rgba(251,191,36,0.3)' : 'none' }} />
                  : <div className="w-24 h-24 rounded-2xl flex items-center justify-center font-black text-3xl"
                    style={{ background: bg, border: `2px solid ${borderClr}`, boxShadow: `0 0 20px ${bg}44`, fontFamily: 'Playfair Display,serif', color: '#fff' }}>
                    {ini}
                  </div>
                }
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">

                {/* Plan badge */}
                <div className="flex flex-wrap gap-2 mb-1">
                  {isEnt && <span className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest" style={pill('rgba(245,158,11,0.18)', 'rgba(245,158,11,0.4)', '#fbbf24')}>⭐ Enterprise</span>}
                  {isPro && !isEnt && <span className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest" style={pill('rgba(74,158,255,0.15)', 'rgba(74,158,255,0.35)', '#60a5fa')}>⭐ Pro</span>}
                </div>

                {/* Company name */}
                <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-3"
                  style={{ fontFamily: 'Playfair Display,serif', background: nameGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {startup.company_name}
                </h1>

                {/* Meta pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {startup.sector && <MetaPill>🏷 {startup.sector}</MetaPill>}
                  {startup.state && <MetaPill>📍 {startup.state}</MetaPill>}
                  {(startup.founded_year || startup.founded_date) && <MetaPill>📅 Founded {startup.founded_year || startup.founded_date}</MetaPill>}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  {startup.website_url && (
                    <a href={startup.website_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                      style={visitBtn}>
                      🌐 Visit Website ↗
                    </a>
                  )}
                  {canIntro && (
                    <button onClick={() => setShowIntro(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      ✉️ Request Intro
                    </button>
                  )}
                  {/* Scout Pro / Partner Elite — Unlock Contact */}
                  {user && ['scout_pro', 'partner_elite'].includes(investorPlan) && !contactUnlocked && (
                    <button onClick={() => { setContactUnlocked(true); toast.success('Contact details unlocked! 🔓') }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(135deg,#F6C90E,#d4a500)', color: '#000' }}>
                      🔓 Unlock Contact
                    </button>
                  )}
                  {/* Non-qualifying investor — upgrade prompt */}
                  {user && profile?.role === 'investor' && investorPlan && !['scout_pro', 'partner_elite'].includes(investorPlan) && (
                    <Link to="/investor-listing?plan=partner_elite"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-white/50 hover:text-white transition-all"
                      style={{ background: 'rgba(246,201,14,0.08)', border: '1px solid rgba(246,201,14,0.25)' }}>
                      🔒 Upgrade to Scout Pro or Partner Elite to unlock contact
                    </Link>
                  )}
                  {!user && (
                    <button onClick={() => navigate('/?login=founder')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-white/50 hover:text-white transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      🔐 Login to Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ UNLOCKED CONTACT INFO (Partner Elite) ════════════════════════ */}
        {contactUnlocked && (
          <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(135deg,rgba(246,201,14,0.06),rgba(246,201,14,0.02))', border: '1px solid rgba(246,201,14,0.25)' }}>
            <SectionHead>🔓 Contact Details</SectionHead>
            <div className="space-y-3">
              {(startup.founder_email || startup.email) && (
                <div className="flex items-center gap-3">
                  <span className="text-base">✉️</span>
                  <div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest">Email</div>
                    <a href={`mailto:${startup.founder_email || startup.email}`} className="text-sm font-bold text-blue-400 hover:underline">{startup.founder_email || startup.email}</a>
                  </div>
                </div>
              )}
              {startup.phone && (
                <div className="flex items-center gap-3">
                  <span className="text-base">📞</span>
                  <div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest">Phone</div>
                    <a href={`tel:${startup.phone}`} className="text-sm font-bold text-green-400 hover:underline">{startup.phone}</a>
                  </div>
                </div>
              )}
              {startup.linkedin_url && (
                <div className="flex items-center gap-3">
                  <span className="text-base">🔗</span>
                  <div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest">LinkedIn</div>
                    <a href={startup.linkedin_url.startsWith('http') ? startup.linkedin_url : `https://${startup.linkedin_url}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-purple-400 hover:underline">{startup.linkedin_url}</a>
                  </div>
                </div>
              )}
              {!startup.founder_email && !startup.email && !startup.phone && !startup.linkedin_url && (
                <p className="text-sm text-white/40">No contact details available for this startup yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ══ REVENUE + FOUNDER ══════════════════════════════════════ */}
        {(startup.all_time_revenue || startup.founder_name) && (
          <div className={`grid gap-4 mb-5 ${startup.all_time_revenue && startup.founder_name ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>

            {startup.all_time_revenue && (
              <InfoCard border="rgba(245,158,11,0.22)" bg="rgba(245,158,11,0.07)">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.18)' }}>
                  <span className="text-xl">📈</span>
                </div>
                <div>
                  <div className="text-[10px] text-white/35 uppercase tracking-widest font-black mb-1">All-Time Revenue</div>
                  <div className="text-2xl font-black text-yellow-400" style={{ fontFamily: 'Playfair Display,serif' }}>{startup.all_time_revenue}</div>
                </div>
              </InfoCard>
            )}

            {startup.founder_name && (
              <InfoCard>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
                  style={{ background: bg + '33', color: bg, fontFamily: 'Playfair Display,serif' }}>
                  {startup.founder_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-white/35 uppercase tracking-widest font-black mb-1">Founder</div>
                  <div className="text-base font-black text-white truncate">{startup.founder_name}</div>
                </div>
                {socials.length > 0 && (
                  <div className="flex gap-2 flex-shrink-0">
                    {socials.map(s => (
                      <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-transform hover:scale-110"
                        style={{ background: s.bg2, border: `1px solid ${s.bd}`, color: s.c }}>
                        {s.icon}
                      </a>
                    ))}
                  </div>
                )}
              </InfoCard>
            )}
          </div>
        )}

        {/* Social links standalone when no founder name */}
        {socials.length > 0 && !startup.founder_name && (
          <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <SectionHead>Connect</SectionHead>
            <div className="flex flex-wrap gap-3">
              {socials.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                  style={{ background: s.bg2, border: `1px solid ${s.bd}`, color: s.c }}>
                  {s.icon} {s.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ══ ABOUT / DESCRIPTION ════════════════════════════════════ */}
        {startup.description && (
          <div className="rounded-2xl p-6 mb-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <SectionHead>🏢 About {startup.company_name}</SectionHead>
            <p className="text-white/70 leading-relaxed text-sm whitespace-pre-line">{startup.description}</p>
          </div>
        )}

        {/* ══ LISTING DETAILS ════════════════════════════════════════ */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <SectionHead>Listing Details</SectionHead>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {[
              ['Plan', (startup.plan || 'basic').charAt(0).toUpperCase() + (startup.plan || 'basic').slice(1)],
              ['State', startup.state || '—'],
              ['Sector', startup.sector || '—'],
              ['Founded', startup.founded_year || startup.founded_date || '—'],
              ['Listed', startup.listing_date ? new Date(startup.listing_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'],
              ['Status', startup.status === 'approved' ? '✅ Live' : '⏳ Pending'],
            ].map(([lbl, val]) => (
              <div key={lbl}>
                <div className="text-[10px] text-white/25 uppercase tracking-wider mb-0.5">{lbl}</div>
                <div className="text-sm font-bold text-white/65">{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ LOGIN PROMPT ═══════════════════════════════════════════ */}
        {!user && (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.18)' }}>
            <div className="text-4xl mb-3">🤝</div>
            <div className="font-black text-white text-lg mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>Want to Connect?</div>
            <p className="text-sm text-white/40 mb-5 max-w-xs mx-auto">
              Login as a founder to send an intro request to {startup.company_name}.
            </p>
            <button onClick={() => navigate('/?login=founder')} className="btn-primary px-8">🚀 Login / Sign Up →</button>
          </div>
        )}

      </div>
    </main>
  )
}

// ── tiny atoms ────────────────────────────────────────────────────────────────
function MetaPill({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50 px-3 py-1 rounded-full"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
      {children}
    </span>
  )
}
function InfoCard({ children, border = 'rgba(255,255,255,0.08)', bg = 'rgba(255,255,255,0.03)' }) {
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: bg, border: `1px solid ${border}` }}>
      {children}
    </div>
  )
}
function SectionHead({ children }) {
  return <div className="text-[10px] text-white/35 uppercase tracking-widest font-black mb-3">{children}</div>
}
