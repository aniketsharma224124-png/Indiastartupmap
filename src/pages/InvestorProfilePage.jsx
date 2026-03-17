// InvestorProfilePage.jsx — Public profile page for investors
// Mirrors StartupProfilePage layout with investor-specific details

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { getInvestorById, sendIntroRequest } from '../lib/investorDb'
import { useAuth } from '../context/AuthContext'

// ── Helpers ──────────────────────────────────────────────────────────────────
function SectionHead({ children }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="text-[10px] text-purple-400 tracking-[3px] uppercase font-black">{children}</div>
            <div className="flex-1 h-px bg-white/[0.06]" />
        </div>
    )
}

function Skeleton() {
    return (
        <main className="relative z-10 pt-28 max-w-3xl mx-auto px-6 pb-20">
            <div className="h-8 w-32 bg-white/5 rounded-xl mb-6 animate-pulse" />
            <div className="h-64 bg-white/5 rounded-2xl animate-pulse mb-5" />
            <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
        </main>
    )
}

// ── INTRO MODAL ──────────────────────────────────────────────────────────────
function IntroModal({ investor, onClose }) {
    const { user } = useAuth()
    const [startup, setStartup] = useState('')
    const [email, setEmail] = useState(user?.email || '')
    const [pitch, setPitch] = useState('')
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const MAX = 500

    const handleSend = async () => {
        if (!startup.trim() || !email.trim() || !pitch.trim()) {
            toast.error('Please fill all fields.')
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
        } finally { setSending(false) }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(14px)' }}
            onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl p-6 relative"
                style={{ background: '#0D1628', border: '1px solid rgba(155,111,255,0.3)', animation: 'modalIn 0.2s ease' }}
                onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white text-2xl">×</button>

                {sent ? (
                    <div className="text-center py-8">
                        <div className="text-5xl mb-4">🚀</div>
                        <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>Request Sent!</h3>
                        <p className="text-sm text-white/40">{investor.partner_name} at {investor.firm_name} will receive your pitch shortly.</p>
                    </div>
                ) : (
                    <>
                        <div className="text-[10px] text-purple-400 tracking-[3px] uppercase mb-1">Request Introduction</div>
                        <h3 className="text-xl font-black text-white mb-4" style={{ fontFamily: 'Playfair Display,serif' }}>To {investor.firm_name}</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">Your Startup Name *</label>
                                <input className="input-field" placeholder="Your company name" value={startup} onChange={e => setStartup(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">Your Email *</label>
                                <input className="input-field" type="email" placeholder="founder@startup.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">Your Pitch * <span className="text-white/20 normal-case tracking-normal">(max {MAX} chars)</span></label>
                                <textarea className="input-field resize-none" rows={5}
                                    placeholder={`Tell ${investor.partner_name} what you're building...`}
                                    value={pitch} onChange={e => setPitch(e.target.value.slice(0, MAX))} />
                                <div className={`text-[10px] text-right mt-1 ${pitch.length > 450 ? 'text-red-400' : 'text-white/20'}`}>{pitch.length}/{MAX}</div>
                            </div>
                        </div>
                        <button onClick={handleSend} disabled={sending}
                            className="w-full mt-4 py-3 rounded-xl font-black text-sm text-white transition-all"
                            style={{ background: 'linear-gradient(135deg,#7C3AED,#9B6FFF)', opacity: sending ? 0.6 : 1 }}>
                            {sending ? 'Sending...' : 'Send Introduction Request →'}
                        </button>
                    </>
                )}
            </div>
            <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
    )
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function InvestorProfilePage() {
    const { investorId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [investor, setInvestor] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showIntro, setShowIntro] = useState(false)

    useEffect(() => {
        if (!investorId) return
        setLoading(true)
        getInvestorById(investorId)
            .then(d => setInvestor(d))
            .catch(() => toast.error('Could not load investor'))
            .finally(() => setLoading(false))
    }, [investorId])

    if (loading) return <Skeleton />
    if (!investor) return (
        <main className="relative z-10 pt-28 max-w-3xl mx-auto px-6 pb-20 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white mb-8">← Back to Map</Link>
            <div className="text-6xl mb-5">💰</div>
            <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Playfair Display,serif' }}>Investor Not Found</h2>
            <p className="text-sm text-white/40 mb-6">This investor profile may have been removed or the link is incorrect.</p>
            <Link to="/?mode=investor" className="btn-primary px-6 py-2">Browse Investor Map →</Link>
        </main>
    )

    const planBadge = investor.plan === 'partner_elite'
        ? { label: '👑 PARTNER ELITE', bg: 'rgba(246,201,14,0.15)', color: '#F6C90E', border: '1px solid rgba(246,201,14,0.4)' }
        : investor.plan === 'scout_pro'
            ? { label: '⭐ SCOUT PRO', bg: 'rgba(155,111,255,0.15)', color: '#9B6FFF', border: '1px solid rgba(155,111,255,0.4)' }
            : { label: '🔵 BASIC', bg: 'rgba(74,158,255,0.1)', color: '#4A9EFF', border: '1px solid rgba(74,158,255,0.3)' }

    return (
        <main className="relative z-10 pt-24 max-w-3xl mx-auto px-6 pb-20">
            {showIntro && <IntroModal investor={investor} onClose={() => setShowIntro(false)} />}

            <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white mb-6">← Back to Map</Link>

            {/* ══ HERO CARD ══════════════════════════════════════════ */}
            <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '1px solid rgba(155,111,255,0.2)' }}>
                {/* Banner gradient */}
                <div className="h-28 relative" style={{ background: `linear-gradient(135deg, ${investor.brand_color || '#9B6FFF'}44, ${investor.brand_color || '#9B6FFF'}11)` }}>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(13,21,37,0.9))' }} />
                </div>
                <div className="px-6 pb-6 -mt-12 relative">
                    <div className="flex items-end gap-4 mb-4">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl border-4 border-[#0D1628] overflow-hidden"
                            style={{ background: investor.brand_color || '#9B6FFF', fontFamily: 'Playfair Display,serif' }}>
                            {investor.logo_url
                                ? <img src={investor.logo_url} alt={investor.firm_name} className="w-full h-full object-cover" />
                                : (investor.avatar || investor.firm_name?.[0])}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-black text-white leading-tight" style={{ fontFamily: 'Playfair Display,serif' }}>{investor.firm_name}</h1>
                            <p className="text-sm text-white/40">{investor.partner_name}</p>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-[10px] font-black px-3 py-1 rounded-full" style={{ background: planBadge.bg, color: planBadge.color, border: planBadge.border }}>{planBadge.label}</span>
                        {investor.open_to_pitches && (
                            <span className="text-[10px] font-bold bg-green-500/10 border border-green-500/25 text-green-400 px-3 py-1 rounded-full">✅ OPEN TO PITCHES</span>
                        )}
                        {investor.state && (
                            <span className="text-[10px] bg-white/5 border border-white/10 text-white/40 px-3 py-1 rounded-full">📍 {investor.state}</span>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => user ? setShowIntro(true) : navigate('/?login=founder')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                            style={{ background: 'linear-gradient(135deg,#7C3AED,#9B6FFF)' }}>
                            ✉️ Request Introduction
                        </button>
                        {investor.website_url && (
                            <a href={investor.website_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-white/60 hover:text-white transition-all"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                🌐 Visit Website ↗
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ INVESTMENT DETAILS ═══════════════════════════════════ */}
            <div className="grid gap-4 mb-5 grid-cols-1 sm:grid-cols-3">
                {investor.stage && (
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Stage</div>
                        <div className="text-sm font-bold text-white">📊 {investor.stage}</div>
                    </div>
                )}
                {investor.cheque_size && (
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Cheque Size</div>
                        <div className="text-sm font-bold text-yellow-400">💰 {investor.cheque_size}</div>
                    </div>
                )}
                {investor.state && (
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Location</div>
                        <div className="text-sm font-bold text-white">📍 {investor.state}</div>
                    </div>
                )}
            </div>

            {/* ══ FOCUS SECTORS ═════════════════════════════════════════ */}
            {investor.focus && investor.focus.length > 0 && (
                <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <SectionHead>🎯 Focus Sectors</SectionHead>
                    <div className="flex flex-wrap gap-2">
                        {investor.focus.map(f => (
                            <span key={f} className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1.5 rounded-full font-bold">{f}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* ══ DESCRIPTION ═══════════════════════════════════════════ */}
            {investor.description && (
                <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <SectionHead>📝 About</SectionHead>
                    <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{investor.description}</p>
                </div>
            )}

            {/* ══ LISTING DETAILS ═══════════════════════════════════════ */}
            <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <SectionHead>📋 Listing Details</SectionHead>
                <div className="space-y-3">
                    {[
                        ['Partner Name', investor.partner_name],
                        ['Firm', investor.firm_name],
                        ['Plan', investor.plan?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())],
                        ['Status', investor.open_to_pitches ? '✅ Open to Pitches' : '🔴 Not Accepting'],
                        ['Listed', investor.listing_date ? new Date(investor.listing_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
                    ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label} className="flex justify-between py-2 border-b border-white/[0.04] last:border-0">
                            <span className="text-xs text-white/35">{label}</span>
                            <span className="text-sm font-bold text-white">{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══ SOCIAL ═════════════════════════════════════════════════ */}
            {(investor.linkedin_url || investor.twitter_url || investor.website_url) && (
                <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <SectionHead>🔗 Connect</SectionHead>
                    <div className="flex flex-wrap gap-3">
                        {investor.linkedin_url && (
                            <a href={investor.linkedin_url.startsWith('http') ? investor.linkedin_url : `https://${investor.linkedin_url}`}
                                target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-blue-500/10"
                                style={{ background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.2)', color: '#4A9EFF' }}>
                                🔗 LinkedIn
                            </a>
                        )}
                        {investor.twitter_url && (
                            <a href={investor.twitter_url.startsWith('http') ? investor.twitter_url : `https://${investor.twitter_url}`}
                                target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/5"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                                🐦 Twitter
                            </a>
                        )}
                        {investor.website_url && (
                            <a href={investor.website_url.startsWith('http') ? investor.website_url : `https://${investor.website_url}`}
                                target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-purple-500/10"
                                style={{ background: 'rgba(155,111,255,0.06)', border: '1px solid rgba(155,111,255,0.2)', color: '#9B6FFF' }}>
                                🌐 Website
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* ══ UNLOCK CONTACT — Enterprise only ══════════════════════ */}
            <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <SectionHead>🔓 Contact Information</SectionHead>
                <UnlockContactSection investor={investor} />
            </div>
        </main>
    )
}

// ── UNLOCK CONTACT SUB-COMPONENT ─────────────────────────────────────────────
function UnlockContactSection({ investor }) {
    const { user } = useAuth()
    const [unlocked, setUnlocked] = useState(false)
    const [loading, setLoading] = useState(false)
    const [canUnlock, setCanUnlock] = useState(false)

    useEffect(() => {
        if (!user) return
        const checkPlans = async () => {
            try {
                const { getUserProfile, db } = await import('../lib/firebase')
                const profile = await getUserProfile(user.uid)
                if (['premium', 'enterprise'].includes(profile?.plan)) { setCanUnlock(true); return }
                const { collection, query, where, getDocs } = await import('firebase/firestore')
                // Check both uid and founder_uid fields
                const q1 = query(collection(db, 'startups'), where('uid', '==', user.uid))
                const q2 = query(collection(db, 'startups'), where('founder_uid', '==', user.uid))
                const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)])
                const allDocs = [...snap1.docs, ...snap2.docs]
                if (allDocs.some(d => ['premium', 'enterprise'].includes(d.data().plan))) { setCanUnlock(true); return }
                const { getMyInvestorProfile } = await import('../lib/investorDb')
                const inv = await getMyInvestorProfile(user.uid, user.email)
                if (['scout_pro', 'partner_elite'].includes(inv?.plan)) { setCanUnlock(true); return }
                setCanUnlock(false)
            } catch { setCanUnlock(false) }
        }
        checkPlans()
    }, [user])

    // Auto-unlock for premium/enterprise users
    useEffect(() => {
        if (canUnlock && !unlocked) setUnlocked(true)
    }, [canUnlock])

    const handleUnlock = () => {
        if (!user) {
            toast.error('Please login to unlock contact info')
            return
        }
        if (!canUnlock) {
            toast.error('Upgrade to Premium/Enterprise or Scout Pro/Partner Elite to unlock contacts')
            return
        }
        setLoading(true)
        setTimeout(() => {
            setUnlocked(true)
            setLoading(false)
            toast.success('Contact info unlocked!')
        }, 600)
    }

    if (unlocked && canUnlock) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(0,208,156,0.15)', color: '#00D09C', border: '1px solid rgba(0,208,156,0.3)' }}>
                        🔓 UNLOCKED
                    </span>
                </div>
                {investor.partner_name && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-sm">👤</span>
                        <div>
                            <div className="text-xs text-white/35">Partner</div>
                            <div className="text-sm font-bold text-white">{investor.partner_name}</div>
                        </div>
                    </div>
                )}
                {(investor.contact_email || investor.email) && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-sm">✉️</span>
                        <div>
                            <div className="text-xs text-white/35">Email</div>
                            <a href={`mailto:${investor.contact_email || investor.email}`} className="text-sm font-bold text-blue-400 hover:underline">
                                {investor.contact_email || investor.email}
                            </a>
                        </div>
                    </div>
                )}
                {(investor.linkedin_url || investor.linkedin) && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-sm">🔗</span>
                        <div>
                            <div className="text-xs text-white/35">LinkedIn</div>
                            <a href={(investor.linkedin_url || investor.linkedin).startsWith('http') ? (investor.linkedin_url || investor.linkedin) : `https://${investor.linkedin_url || investor.linkedin}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-sm font-bold text-purple-400 hover:underline">
                                {investor.linkedin_url || investor.linkedin}
                            </a>
                        </div>
                    </div>
                )}
                {!investor.contact_email && !investor.email && !investor.linkedin_url && (
                    <p className="text-xs text-white/30">This investor hasn't shared contact details yet. Use the intro request button above.</p>
                )}
            </div>
        )
    }

    return (
        <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-3"
                style={{ background: 'rgba(246,201,14,0.06)', border: '1px solid rgba(246,201,14,0.15)' }}>
                🔒
            </div>
            <h3 className="text-sm font-black text-white mb-1">Contact Info Locked</h3>
            <p className="text-xs text-white/35 mb-4 max-w-xs mx-auto">
                {!user
                    ? 'Login and upgrade to Premium or Enterprise plan to unlock direct contact details.'
                    : !canUnlock
                        ? 'Upgrade to Premium/Enterprise (startup) or Scout Pro/Partner Elite (investor) to unlock.'
                        : 'Click below to reveal contact information.'}
            </p>
            {canUnlock ? (
                <button onClick={handleUnlock} disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm text-black transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#F6C90E,#d4a500)' }}>
                    {loading ? 'Unlocking...' : '🔓 Unlock Contact Info'}
                </button>
            ) : (
                <Link to="/investor-listing"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)' }}>
                    ⬆️ Upgrade Plan →
                </Link>
            )}
            <p className="text-[9px] text-white/20 mt-3">👑 Premium / Enterprise / Scout Pro / Partner Elite feature</p>
        </div>
    )
}
