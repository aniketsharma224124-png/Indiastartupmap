// FounderDashboard.jsx
// Key changes in this version:
//  1. "Browse Investor Map" links → /investor-map  (not /)
//  2. Loads investor_interest records via getInterestNotificationsForStartup()
//     so founder sees "XYZ marked you as interested — Request Intro" in inbox
//  3. Inbox shows BOTH types: intro requests (direction:investor_to_founder)
//     AND interest marks (type:'interest') — each with correct UI

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  getAllMyStartupProfiles,
  getIntroRequestsByStartup,
  getIntroRequestsByFounderEmail,
  getInvestorInitiatedIntrosForFounder,
  getInterestNotificationsForStartup,
  sendIntroRequest,
} from '../lib/investorDb'
import { PLANS } from '../lib/razorpay'

const timeAgo = iso => {
  if (!iso) return ''
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

// ── SEND INTRO MODAL ─────────────────────────────────────────────────────────
// Used when founder replies to an investor or interest notification from inbox
function SendIntroModal({ entry, user, onClose, onSent }) {
  const [startupName, setStartupName] = useState('')
  const [pitch, setPitch] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const MAX = 500

  const firmName = entry.investor_firm || entry.startup_name || 'Investor'

  const handleSend = async () => {
    if (!startupName.trim()) { toast.error('Please enter your startup name'); return }
    if (!pitch.trim()) { toast.error('Please write a short pitch'); return }
    setSending(true)
    try {
      await sendIntroRequest({
        investorId: entry.investor_uid || entry.investor_id || entry.id || '',
        investorFirm: firmName,
        partnerName: entry.partner_name || '',
        startupId: startupName.toLowerCase().replace(/\s+/g, '-'),
        startupName: startupName.trim(),
        founderEmail: user?.email || '',
        founderContactEmail: user?.email || '',
        founderLinkedin: linkedin.trim(),
        pitch: pitch.trim(),
        direction: 'founder_to_investor',
      })
      setDone(true)
      toast.success(`Intro sent to ${firmName}! 🎉`)
      onSent?.()
      setTimeout(onClose, 2800)
    } catch {
      toast.error('Failed to send. Please try again.')
    } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl relative overflow-hidden"
        style={{ background: '#0D1628', border: '1px solid rgba(74,158,255,0.3)', animation: 'modalIn 0.2s ease' }}
        onClick={e => e.stopPropagation()}>

        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white text-2xl leading-none">×</button>
          <div className="text-[10px] text-blue-400 tracking-[3px] uppercase mb-1 font-black">
            {entry.type === 'interest' ? 'Reply to Interest' : 'Reply to Investor'}
          </div>
          <div className="font-black text-white text-lg" style={{ fontFamily: 'Playfair Display,serif' }}>
            Send Intro to {firmName}
          </div>
          <div className="text-xs text-white/40 mt-1">
            {entry.type === 'interest'
              ? `${firmName} marked your startup as interested`
              : `via ${entry.partner_name} · They want to connect with you`}
          </div>
        </div>

        {done ? (
          <div className="px-6 py-10 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <div className="font-black text-white text-lg mb-2">Intro Sent!</div>
            <div className="text-sm text-white/40">{firmName} will receive your intro request shortly.</div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1.5 font-bold">Your Startup Name *</label>
              <input value={startupName} onChange={e => setStartupName(e.target.value)}
                placeholder="e.g. Acme AI" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1.5 font-bold">Your LinkedIn (optional)</label>
              <input value={linkedin} onChange={e => setLinkedin(e.target.value)}
                placeholder="linkedin.com/in/yourname" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1.5 font-bold">Your Pitch *</label>
              <textarea value={pitch} onChange={e => setPitch(e.target.value.slice(0, MAX))} rows={5}
                placeholder={`Introduce yourself and your startup to ${firmName}. What are you building, what traction do you have?`}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <div className={`text-[10px] text-right mt-1 ${pitch.length > 450 ? 'text-red-400' : 'text-white/20'}`}>{pitch.length}/{MAX}</div>
            </div>

            {/* Context box */}
            <div className="p-3 rounded-xl text-xs text-white/40 leading-relaxed"
              style={{ background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.12)' }}>
              {entry.type === 'interest'
                ? `💡 ${firmName} marked your startup as interested. Send your intro to start the conversation.`
                : `💬 Replying to: ${firmName}${entry.pitch ? ` — "${entry.pitch.slice(0, 80)}${entry.pitch.length > 80 ? '…' : ''}"` : ''}`}
            </div>

            <button onClick={handleSend} disabled={sending}
              className="w-full py-3 rounded-xl font-black text-sm text-white transition-all"
              style={{ background: sending ? 'rgba(74,158,255,0.3)' : 'linear-gradient(135deg,#1a4a8a,#2a6abf)', border: '1px solid rgba(74,158,255,0.3)', opacity: sending ? .7 : 1 }}>
              {sending ? '📤 Sending…' : `✉️ Send Intro to ${firmName} →`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────
const getPlanExpiry = startup => {
  if (startup?.expires_at) return new Date(startup.expires_at)
  const base = startup?.listing_date || startup?.created_at
  if (!base) return null
  const months = PLANS[startup?.plan]?.durationMonths || 12
  const d = new Date(base); d.setMonth(d.getMonth() + months); return d
}
const fmt = d => d ? (d instanceof Date ? d : new Date(d)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const isExpired = d => d && d < new Date()
const isExpiring = d => d && !isExpired(d) && (d - new Date()) < 2 * 86400000

function StatusBadge({ status }) {
  const map = { accepted: 'bg-green-500/15 border-green-500/30 text-green-400', pending: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400', declined: 'bg-red-500/10 border-red-500/25 text-red-400' }
  const lbl = { accepted: '✓ Accepted', pending: '⏳ Pending', declined: '✕ Declined' }
  return <span className={`text-[10px] font-black px-3 py-1 rounded-full border flex-shrink-0 ${map[status] || map.pending}`}>{lbl[status] || status}</span>
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function FounderDashboard() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [allProfiles, setAllProfiles] = useState([])
  const [profileIdx, setProfileIdx] = useState(0)
  const [startup, setStartup] = useState(null)
  const [intros, setIntros] = useState([])          // founder-initiated
  const [investorIntros, setInvestorIntros] = useState([])          // investor-initiated + interest marks
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [replyTarget, setReplyTarget] = useState(null)         // open SendIntroModal

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/?login=founder', { replace: true }); return }
    localStorage.setItem('lastDashboard', 'founder')
  }, [user, authLoading, navigate])



  const loadProfileData = async (found) => {
    console.log('[FounderDashboard] loadProfileData:', { startupId: found.id, email: user?.email })

    // 1. Get ALL intro_requests related to this startup (by startup_id + by email)
    let allReqs = await getIntroRequestsByStartup(found.id)
    if (user?.email) {
      const emailReqs = await getIntroRequestsByFounderEmail(user.email)
      // Merge & deduplicate
      const seen = new Set(allReqs.map(r => r.id))
      emailReqs.forEach(r => { if (!seen.has(r.id)) { allReqs.push(r); seen.add(r.id) } })
    }

    // 2. Split by direction
    // "My Requests" = founder sent to investor (show with status badges)
    const founderReqs = allReqs.filter(r => !r.direction || r.direction === 'founder_to_investor')

    // 3. Inbox items: investor-to-founder + investor_interest + accepted founder intros
    const investorReqs = allReqs.filter(r => r.direction === 'investor_to_founder')
    const acceptedByInvestor = founderReqs.filter(r => r.status === 'accepted')

    // Also fetch investor-initiated intros by founder email
    let invInitiated = []
    if (user?.email) {
      try { invInitiated = await getInvestorInitiatedIntrosForFounder(user.email) } catch { }
    }

    // Interest marks
    let interestMarks = []
    try {
      interestMarks = await getInterestNotificationsForStartup(
        found.id,
        found.uid || user?.uid,
        found.founder_email || found.email || user?.email
      )
    } catch (err) { console.error('[FounderDashboard] interest marks error:', err) }

    // Merge all inbox items (investor reqs + investor-initiated + interest + accepted)
    const allInbox = [...investorReqs, ...invInitiated, ...interestMarks, ...acceptedByInvestor]
    const seenInbox = new Set()
    const dedupedInbox = allInbox.filter(r => { if (seenInbox.has(r.id)) return false; seenInbox.add(r.id); return true })
    dedupedInbox.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

    console.log('[FounderDashboard] inbox:', { founderReqs: founderReqs.length, investorReqs: investorReqs.length, invInitiated: invInitiated.length, interestMarks: interestMarks.length, acceptedByInvestor: acceptedByInvestor.length })

    setIntros(founderReqs)
    setInvestorIntros(dedupedInbox)
  }

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const profiles = await getAllMyStartupProfiles(user.uid, user.email)
        if (profiles.length > 0) {
          setAllProfiles(profiles)
          setStartup(profiles[0])
          await loadProfileData(profiles[0])
        } else {
          setStartup(null); setIntros([]); setInvestorIntros([])
        }
      } catch (err) { console.error('FounderDashboard load:', err); setStartup(null) }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  const switchProfile = async idx => {
    setProfileIdx(idx)
    const found = allProfiles[idx]
    setStartup(found); setLoading(true)
    try { await loadProfileData(found) } catch { }
    setLoading(false)
  }

  if (authLoading || loading) return (
    <main className="relative z-10 pt-32 min-h-screen flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-3 animate-pulse">🚀</div><div className="text-white/30 text-sm">Loading…</div></div>
    </main>
  )
  if (!user) return null

  if (!startup) return (
    <main className="relative z-10 pt-24 max-w-4xl mx-auto px-6 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white mb-8">← Back to Map</Link>
      <div className="card p-12 text-center">
        <div className="text-6xl mb-5">🚀</div>
        <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Playfair Display,serif' }}>No Startup Listed Yet</h2>
        <p className="text-sm text-white/40 mb-8 max-w-md mx-auto leading-relaxed">
          List your startup on the map to unlock your dashboard with live investor data, intro tracking, and analytics.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="/#list-startup" className="px-8 py-3 rounded-xl font-black text-sm text-white" style={{ background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)' }}>🚀 List Your Startup →</a>
          <Link to="/" className="px-8 py-3 rounded-xl font-black text-sm border border-white/15 text-white/60 hover:text-white transition-all">Browse Map →</Link>
        </div>
      </div>
    </main>
  )

  const plan = startup?.plan || 'basic'
  const credits = PLANS[plan]?.intro_credits || 3
  const creditsUsed = intros.filter(r => r.status !== 'declined').length
  const creditsLeft = Math.max(0, credits - creditsUsed)
  const initials = startup?.company_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'S'
  const expiry = getPlanExpiry(startup)
  const expiring = isExpiring(expiry)
  const expired = isExpired(expiry)
  const isTopTier = plan === 'enterprise'
  const totalInbox = investorIntros.length

  const NAV_ITEMS = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'inbox', icon: '📬', label: `Investor Inbox (${totalInbox})`, badge: totalInbox > 0 },
    { id: 'intros', icon: '✉️', label: `My Requests (${intros.length})` },
    { id: 'stats', icon: '📈', label: 'Stats' },
    { id: 'listing', icon: '🏷', label: 'My Listing' },
  ]

  return (
    <main className="relative z-10 pt-24 max-w-7xl mx-auto px-6 pb-20">
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

      {/* Reply modal */}
      {replyTarget && (
        <SendIntroModal entry={replyTarget} user={user}
          onClose={() => setReplyTarget(null)} onSent={() => setReplyTarget(null)} />
      )}

      <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white mb-6">← Back to Map</Link>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 flex-1"
          style={{ background: 'rgba(74,158,255,0.08)', border: '1px solid rgba(74,158,255,0.15)' }}>
          {user.photoURL
            ? <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
            : <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-black">{(user.displayName || 'F')[0].toUpperCase()}</div>}
          <div>
            <div className="text-sm font-bold text-white">Welcome back, {user.displayName?.split(' ')[0] || 'Founder'}! 👋</div>
            <div className="text-xs text-white/35">{user.email} · Founder Account</div>
          </div>
          {totalInbox > 0 && (
            <span className="ml-auto text-[9px] px-2.5 py-1 rounded-full font-black animate-pulse"
              style={{ background: 'rgba(0,208,156,0.2)', border: '1px solid rgba(0,208,156,0.3)', color: '#00D09C' }}>
              🔔 {totalInbox} investor{totalInbox > 1 ? 's' : ''} interested!
            </span>
          )}
        </div>
        <div className="flex gap-1 p-1 rounded-xl border border-white/10 bg-white/[0.03] flex-shrink-0">
          <button className="px-3 py-1.5 rounded-lg text-xs font-black" style={{ background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)', color: 'white' }}>🚀 Startup</button>
          <button onClick={() => navigate('/dashboard/investor')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white/35 hover:text-white/60 transition-all">💰 Investor</button>
        </div>
      </div>

      {/* Multi-startup switcher */}
      {allProfiles.length > 1 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-xs text-white/40 flex-shrink-0">Switch startup:</span>
          <div className="flex gap-2 flex-wrap">
            {allProfiles.map((p, i) => (
              <button key={p.id} onClick={() => switchProfile(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${i === profileIdx ? 'text-white' : 'text-white/35 hover:text-white/60 border border-white/10'}`}
                style={i === profileIdx ? { background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)' } : {}}>
                🚀 {p.company_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status banners */}
      {startup?.status === 'pending' && (
        <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
          <span className="text-xl">⏳</span>
          <div><div className="text-sm font-bold text-yellow-400">Listing Under Review</div><div className="text-xs text-white/40">Your startup will appear on the map within 24 hours.</div></div>
        </div>
      )}
      {expiring && !expired && (
        <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <span className="text-xl">⚠️</span>
          <div className="flex-1"><div className="text-sm font-bold text-orange-400">Plan expiring soon</div><div className="text-xs text-white/40">Expires {fmt(expiry)}. Renew to stay listed.</div></div>
          <Link to="/pricing" className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-black text-orange-400 border border-orange-500/25">Renew →</Link>
        </div>
      )}
      {expired && (
        <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span className="text-xl">⛔</span>
          <div className="flex-1"><div className="text-sm font-bold text-red-400">Plan Expired</div><div className="text-xs text-white/40">Expired {fmt(expiry)}. Renew to keep your startup on the map.</div></div>
          <Link to="/pricing" className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black text-white" style={{ background: 'linear-gradient(135deg,#8a1a1a,#bf2a2a)' }}>🔄 Renew →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

        {/* ── SIDEBAR ── */}
        <div className="flex flex-col gap-4">

          {/* Profile card */}
          <div className="card p-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-3 overflow-hidden"
              style={{ background: startup?.brand_color || '#3B7DD8', fontFamily: 'Playfair Display,serif' }}>
              {startup?.logo_url ? <img src={startup.logo_url} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="font-black text-white text-lg leading-tight" style={{ fontFamily: 'Playfair Display,serif' }}>{startup?.company_name}</div>
            <div className="text-xs text-white/35 mt-0.5 mb-3">{startup?.state} · {startup?.sector}</div>
            {expiry && (
              <div className={`text-[10px] mb-3 px-2 py-1 rounded-lg inline-block ${expired ? 'bg-red-500/15 text-red-400 border border-red-500/25' : expiring ? 'bg-orange-500/10 text-orange-400' : 'bg-white/[0.04] text-white/30'}`}>
                {expired ? '⚠️ Expired ' : '📅 Expires '}{fmt(expiry)}
              </div>
            )}
            <div className="bg-white/[0.04] rounded-xl p-3">
              <div className="text-[9px] text-white/30 uppercase tracking-[2px] mb-1.5">Intro Credits Left</div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl font-black text-blue-400" style={{ fontFamily: 'Playfair Display,serif' }}>{creditsLeft}</span>
                <span className="text-sm text-white/25">/ {credits}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-700"
                  style={{ width: `${credits > 0 ? (creditsLeft / credits) * 100 : 0}%` }} />
              </div>
              <div className="text-[10px] text-white/25">{creditsUsed} used</div>
            </div>
            {!isTopTier && creditsLeft === 0 && (
              <Link to="/pricing" className="block text-center mt-3 py-2 rounded-xl text-xs font-bold text-blue-400 border border-blue-500/25 bg-blue-500/8 hover:bg-blue-500/15 transition-all">Upgrade for more credits →</Link>
            )}
          </div>

          {/* Nav */}
          <div className="card p-3">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left w-full transition-all relative ${activeTab === item.id ? 'bg-blue-500/12 text-blue-400' : 'text-white/35 hover:text-white/70 hover:bg-white/[0.04]'}`}>
                <span>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div className="card p-4">
            <div className="text-[9px] text-white/25 uppercase tracking-widest mb-3">Quick Actions</div>
            <div className="flex flex-col gap-2">
              {/* FIXED: navigate to /investor-map directly, not / */}
              <Link to="/investor-map" className="text-xs text-purple-400 hover:text-purple-300">💰 Browse Investor Map</Link>
              <Link to="/investor-listing" className="text-xs text-purple-400 hover:text-purple-300">📋 List as Investor</Link>
              {!isTopTier && <Link to="/pricing" className="text-xs text-green-400 hover:text-green-300">⬆️ Upgrade Plan</Link>}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex flex-col gap-5">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* Investor interest/intros alert */}
              {investorIntros.length > 0 && (
                <div className="card p-5" style={{ borderColor: 'rgba(0,208,156,0.25)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="font-black text-white text-base">🔔 Investors Are Interested!</h2>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,208,156,0.2)', border: '1px solid rgba(0,208,156,0.3)', color: '#00D09C' }}>
                      {investorIntros.length} new
                    </span>
                  </div>
                  <div className="space-y-3">
                    {investorIntros.slice(0, 2).map(r => (
                      <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(0,208,156,0.04)', border: '1px solid rgba(0,208,156,0.12)' }}>
                        <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center text-green-300 font-black text-sm flex-shrink-0">
                          {(r.investor_firm || r.startup_name || 'I')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white">{r.investor_firm || r.startup_name}</p>
                          <p className="text-xs text-white/35">
                            {r.type === 'interest' ? '🔖 Marked interested' : `via ${r.partner_name}`} · {timeAgo(r.created_at)}
                          </p>
                        </div>
                        <button onClick={() => setActiveTab('inbox')}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
                          style={{ color: '#00D09C', border: '1px solid rgba(0,208,156,0.25)', background: 'rgba(0,208,156,0.08)' }}>
                          View →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* My intros summary */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-white text-base">✉️ My Intro Requests</h2>
                  <button onClick={() => setActiveTab('intros')} className="text-xs text-blue-400 hover:underline">View all →</button>
                </div>
                {intros.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-white/30 mb-3">No intro requests sent yet.</p>
                    <Link to="/investor-map" className="text-xs text-purple-400 hover:underline">Browse Investor Map →</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {intros.slice(0, 3).map(r => (
                      <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 font-black text-sm flex-shrink-0">
                          {r.investor_firm?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white">{r.investor_firm}</p>
                          <p className="text-xs text-white/35">via {r.partner_name} · {timeAgo(r.created_at)}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="card p-5">
                <h2 className="font-black text-white text-base mb-4">📈 Quick Stats</h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { v: intros.length.toString(), l: 'Intros Sent', c: '#4A9EFF' },
                    { v: investorIntros.length.toString(), l: 'Investor Interest', c: '#00D09C' },
                    { v: intros.filter(r => r.status === 'accepted').length.toString(), l: 'Accepted', c: '#9B6FFF' },
                  ].map(({ v, l, c }) => (
                    <div key={l} className="text-center rounded-xl py-4 px-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="text-2xl font-black mb-1" style={{ fontFamily: 'Playfair Display,serif', color: c }}>{v}</div>
                      <div className="text-[10px] text-white/35 leading-tight">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* INVESTOR INBOX TAB */}
          {activeTab === 'inbox' && (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="font-black text-white text-base">📬 Investor Inbox</h2>
                {totalInbox > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,208,156,0.2)', border: '1px solid rgba(0,208,156,0.3)', color: '#00D09C' }}>
                    {totalInbox}
                  </span>
                )}
              </div>

              {investorIntros.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📬</div>
                  <p className="text-sm text-white/30 mb-1">No investor messages yet.</p>
                  <p className="text-xs text-white/20">When an investor marks interest in your startup, it appears here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {investorIntros.map(r => {
                    const isInterest = r.type === 'interest'
                    const isAccepted = r.status === 'accepted' && (!r.direction || r.direction === 'founder_to_investor')
                    const firmName = r.investor_firm || r.startup_name || 'Investor'
                    return (
                      <div key={r.id} className="rounded-2xl overflow-hidden"
                        style={{ background: isAccepted ? 'rgba(0,208,156,0.06)' : isInterest ? 'rgba(155,111,255,0.04)' : 'rgba(0,208,156,0.03)', border: `1px solid ${isAccepted ? 'rgba(0,208,156,0.25)' : isInterest ? 'rgba(155,111,255,0.2)' : 'rgba(0,208,156,0.15)'}` }}>
                        <div className="p-5">
                          <div className="flex items-start gap-3">
                            <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm ${isAccepted ? 'bg-green-500/20 text-green-300' : isInterest ? 'bg-purple-500/20 text-purple-300' : 'bg-green-500/20 text-green-300'}`}>
                              {firmName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-[10px] uppercase tracking-widest mb-1 font-black ${isAccepted ? 'text-green-400' : isInterest ? 'text-purple-400' : 'text-green-400'}`}>
                                {isAccepted ? '✅ Intro Accepted!' : isInterest ? '🔖 Marked as Interested' : '🔔 Investor wants to connect'}
                              </div>
                              <div className="font-black text-white text-sm">{firmName}</div>
                              <div className="text-xs text-white/40">
                                {isAccepted ? `${firmName} accepted your intro request!` : isInterest ? `${firmName} marked your startup as interested` : `via ${r.partner_name}`}
                                {' · '}{timeAgo(r.created_at)}
                              </div>
                            </div>
                          </div>

                          {/* Message / context */}
                          {isAccepted ? (
                            <div className="mt-3 p-3 rounded-xl text-xs leading-relaxed"
                              style={{ background: 'rgba(0,208,156,0.08)', border: '1px solid rgba(0,208,156,0.15)', color: 'rgba(255,255,255,0.6)' }}>
                              🎉 <strong className="text-green-300">{firmName}</strong> has accepted your intro! Check your email for further communication.
                            </div>
                          ) : isInterest ? (
                            <div className="mt-3 p-3 rounded-xl text-xs leading-relaxed"
                              style={{ background: 'rgba(155,111,255,0.06)', border: '1px solid rgba(155,111,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>
                              💡 <strong className="text-purple-300">{firmName}</strong> has bookmarked your startup and may be interested in investing. Send them your intro to start the conversation.
                            </div>
                          ) : r.pitch ? (
                            <div className="mt-3 p-3 rounded-xl text-xs text-white/50 leading-relaxed italic"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              "{r.pitch}"
                            </div>
                          ) : null}

                          {/* Action row */}
                          {!isAccepted && (
                            <div className="mt-4 flex gap-2 items-center">
                              <div className={`flex-1 p-2 rounded-lg text-xs text-center ${isInterest ? 'text-purple-400/70 bg-purple-500/5 border border-purple-500/10' : 'text-green-400/70 bg-green-500/5 border border-green-500/10'}`}>
                                {isInterest ? `📌 ${firmName} marked you as interested` : `✅ ${firmName} wants to connect with you!`}
                              </div>
                              <button onClick={() => setReplyTarget(r)}
                                className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-black text-white transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)' }}>
                                ✉️ Request Intro →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* MY REQUESTS TAB */}
          {activeTab === 'intros' && (
            <div className="card p-5">
              <h2 className="font-black text-white text-base mb-1">✉️ My Intro Requests</h2>
              <p className="text-xs text-white/30 mb-5">{creditsLeft} credit{creditsLeft !== 1 ? 's' : ''} remaining · {creditsUsed} used</p>
              {intros.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">✉️</div>
                  <p className="text-sm text-white/35 mb-4">No intro requests yet.</p>
                  {/* FIXED: /investor-map */}
                  <Link to="/investor-map" className="btn-primary text-sm px-6">Browse Investor Map →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {intros.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-white text-sm" style={{ background: '#9B6FFF' }}>
                        {r.investor_firm?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-sm">{r.investor_firm}</p>
                        <p className="text-xs text-white/35">via {r.partner_name} · {timeAgo(r.created_at)}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === 'stats' && (
            <div className="card p-5">
              <h2 className="font-black text-white text-base mb-5">📈 Profile Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { v: intros.length.toString(), l: 'Intros Sent', c: '#F6C90E', sub: `${creditsLeft} credits left` },
                  { v: intros.filter(r => r.status === 'accepted').length.toString(), l: 'Accepted', c: '#00D09C', sub: 'Check your email' },
                  { v: investorIntros.length.toString(), l: 'Investor Interest', c: '#4A9EFF', sub: 'Investors marked you' },
                  { v: plan.charAt(0).toUpperCase() + plan.slice(1), l: 'Current Plan', c: '#9B6FFF', sub: `${credits} intro credits` },
                  { v: fmt(expiry), l: 'Plan Expires', c: expired ? '#ef4444' : expiring ? '#f97316' : '#ffffff', sub: expired ? '⚠️ Expired' : expiring ? '⚠️ Expiring' : '✓ Active' },
                  { v: fmt(startup?.listing_date || startup?.created_at ? new Date(startup?.listing_date || startup?.created_at) : null), l: 'Listed On', c: '#4A9EFF', sub: 'Listing date' },
                ].map(({ v, l, c, sub }) => (
                  <div key={l} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-lg font-black mb-0.5 break-words" style={{ fontFamily: 'Playfair Display,serif', color: c }}>{v}</div>
                    <div className="text-xs text-white/50 font-semibold mb-0.5">{l}</div>
                    <div className="text-[10px] text-white/25">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LISTING TAB */}
          {activeTab === 'listing' && (
            <div className="card p-5">
              <h2 className="font-black text-white text-base mb-5">🏷 My Listing</h2>
              <div className="flex gap-4 items-start mb-6 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-white text-2xl flex-shrink-0 overflow-hidden" style={{ background: startup?.brand_color || '#3B7DD8' }}>
                  {startup?.logo_url ? <img src={startup.logo_url} alt="" className="w-full h-full object-cover" /> : initials}
                </div>
                <div>
                  <h3 className="font-black text-white text-lg" style={{ fontFamily: 'Playfair Display,serif' }}>{startup?.company_name}</h3>
                  <p className="text-xs text-white/35 mt-0.5">{startup?.state} · {startup?.sector}</p>
                  {startup?.id && (
                    <Link to={`/startup/${startup.id}`} className="text-[10px] text-blue-400 hover:underline mt-1 block">View public profile →</Link>
                  )}
                </div>
              </div>
              {[
                ['Plan', plan.charAt(0).toUpperCase() + plan.slice(1)],
                ['Credits', `${creditsLeft} / ${credits} remaining`],
                ['Map Visibility', startup?.is_premium ? '✅ Showing on India Map' : 'State grid only'],
                ['Status', (startup?.status === 'approved' || startup?.status === 'active') ? '✅ Active' : startup?.status === 'pending' ? '⏳ Pending Review' : startup?.status || 'Draft'],
                ['Listed On', fmt(startup?.listing_date || startup?.created_at ? new Date(startup?.listing_date || startup?.created_at) : null)],
                ['Plan Expires', fmt(expiry)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-3 border-b border-white/[0.05] last:border-0">
                  <span className="text-xs text-white/35">{label}</span>
                  <span className="text-sm font-bold text-white">{value}</span>
                </div>
              ))}
              <div className="mt-5 flex gap-3">
                {!isTopTier
                  ? <Link to="/pricing" className="btn-primary text-sm flex-1 text-center">⬆️ Upgrade Plan →</Link>
                  : <Link to="/pricing" className="text-sm flex-1 text-center py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white transition-all">🔄 Renew Plan →</Link>}
                <a href="/#list-startup" className="btn-secondary text-sm flex-1 text-center">Edit Listing</a>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
