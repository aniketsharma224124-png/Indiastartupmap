// InvestorListingPage.jsx
// Investor listing: Basic (Growth Engine) | Scout Pro | Partner Elite

import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { submitInvestor, updateInvestorStatus } from '../lib/investorDb'
import { initiateInvestorPayment, INVESTOR_PLANS, INVESTOR_PLAN_IDS, INVESTOR_PLANS_NOTE } from '../lib/razorpay'
import { useAuth } from '../context/AuthContext'

const SECTORS = ['SaaS', 'Fintech', 'Edtech', 'Health', 'Consumer', 'B2B', 'Deep Tech', 'AI', 'Agri', 'Impact', 'Ecommerce', 'Logistics', 'D2C', 'Climate', 'Web3']
const STAGES = ['Angel', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+']
const STATES_LIST = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']
const STATE_ID_MAP = {
  'Andhra Pradesh': 'andhra-pradesh', 'Arunachal Pradesh': 'arunachal-pradesh', 'Assam': 'assam',
  'Bihar': 'bihar', 'Chhattisgarh': 'chhattisgarh', 'Delhi': 'delhi', 'Goa': 'goa', 'Gujarat': 'gujarat',
  'Haryana': 'haryana', 'Himachal Pradesh': 'himachal-pradesh', 'Jharkhand': 'jharkhand',
  'Karnataka': 'karnataka', 'Kerala': 'kerala', 'Madhya Pradesh': 'madhya-pradesh', 'Maharashtra': 'maharashtra',
  'Manipur': 'manipur', 'Meghalaya': 'meghalaya', 'Mizoram': 'mizoram', 'Nagaland': 'nagaland',
  'Odisha': 'odisha', 'Punjab': 'punjab', 'Rajasthan': 'rajasthan', 'Sikkim': 'sikkim',
  'Tamil Nadu': 'tamil-nadu', 'Telangana': 'telangana', 'Tripura': 'tripura',
  'Uttar Pradesh': 'uttar-pradesh', 'Uttarakhand': 'uttarakhand', 'West Bengal': 'west-bengal',
}
const BRAND_COLORS = ['#E23744', '#3395FF', '#9B2FE4', '#FC8019', '#00D09C', '#F6C90E', '#2980B9', '#27AE60', '#E67E22', '#16A085']
const INVESTOR_SAVE_KEY = 'investor_listing_draft'

// Plan display helpers
const PLAN_LABELS = {
  basic: '🎉 Claim Free Spot →',
  scout_pro: '🔍 List as Scout Pro →',
  partner_elite: '⭐ List as Partner Elite →',
}
const PLAN_BACK_LABELS = {
  basic: 'Basic',
  scout_pro: 'Scout Pro',
  partner_elite: 'Partner Elite',
}

export default function InvestorListingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [plan, setPlan] = useState(() => {
    const p = new URLSearchParams(location.search).get('plan')
    return INVESTOR_PLAN_IDS.includes(p) ? p : null
  })
  const [step, setStep] = useState(() => {
    const p = new URLSearchParams(location.search).get('plan')
    return INVESTOR_PLAN_IDS.includes(p) ? 2 : 1
  })
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    firm_name: '', partner_name: '',
    email: user?.email || '',
    phone: '', website: '', linkedin: '',
    state: '', focus: [],
    stage_from: 'Seed', stage_to: 'Series B',
    cheque_min: '', cheque_max: '',
    open_to_pitches: true, bio: '',
    avatar: '', brand_color: '#9B6FFF',
    logo_url: '',
  })
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const toggleFocus = f => setForm(p => ({
    ...p, focus: p.focus.includes(f) ? p.focus.filter(x => x !== f) : [...p.focus, f].slice(0, 5)
  }))

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('resume') === 'investor' && user) {
      const saved = sessionStorage.getItem(INVESTOR_SAVE_KEY)
      if (saved) {
        try {
          const { form: sf, plan: sp, step: ss } = JSON.parse(saved)
          setForm(prev => ({ ...prev, ...sf, email: user.email || sf.email }))
          if (sp) setPlan(sp)
          if (ss) setStep(ss)
          sessionStorage.removeItem(INVESTOR_SAVE_KEY)
          toast.success('Welcome back! Your investor listing details are restored.')
        } catch { }
      }
    }
  }, [user, location.search])

  const validate = () => {
    if (!form.firm_name.trim()) { toast.error('Firm name is required'); return false }
    if (!form.partner_name.trim()) { toast.error('Partner name is required'); return false }
    if (!form.email.trim()) { toast.error('Email is required'); return false }
    if (!form.state) { toast.error('Please select a state'); return false }
    if (form.focus.length === 0) { toast.error('Select at least one focus sector'); return false }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    if (!user) {
      sessionStorage.setItem(INVESTOR_SAVE_KEY, JSON.stringify({ form, plan, step: 2 }))
      toast.error('Please login or sign up to continue')
      navigate('/?login=investor&resume=investor')
      return
    }
    setSubmitting(true)
    const toastId = toast.loading('Saving your listing...')
    try {
      const stateId = STATE_ID_MAP[form.state] || form.state.toLowerCase().replace(/\s+/g, '-')
      const chequeSize = form.cheque_min && form.cheque_max
        ? `₹${form.cheque_min}–₹${form.cheque_max}`
        : form.cheque_min ? `₹${form.cheque_min}+` : 'Undisclosed'

      const planDef = INVESTOR_PLANS[plan]
      const flags = planDef?.flags || {}

      const result = await submitInvestor({
        firm_name: form.firm_name.trim(),
        partner_name: form.partner_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        linkedin: form.linkedin.trim(),
        state: form.state,
        state_id: stateId,
        focus: form.focus,
        stage: `${form.stage_from}–${form.stage_to}`,
        cheque_size: chequeSize,
        open_to_pitches: flags.open_to_pitches ?? form.open_to_pitches,
        verified_badge: flags.verified_badge ?? false,
        map_listing: flags.map_listing ?? false,
        accept_decline: flags.accept_decline ?? false,
        detailed_page: flags.detailed_page ?? false,
        aggressive_display: flags.aggressive_display ?? false,
        bookmarking: flags.bookmarking ?? false,
        priority_placement: flags.priority_placement ?? false,
        ai_top20: flags.ai_top20 ?? false,
        advanced_filtering: flags.advanced_filtering ?? false,
        cheque_display: flags.cheque_display ?? false,
        dashboard_access: flags.dashboard_access ?? false,
        featured_states: flags.featured_states ?? 0,
        analytics: flags.analytics ?? false,
        direct_contact: flags.direct_contact ?? false,
        pitch_badge_gold: flags.pitch_badge_gold ?? false,
        deal_flow_report: flags.deal_flow_report ?? false,
        shortlisting_tool: flags.shortlisting_tool ?? false,
        unlimited_states: flags.unlimited_states ?? false,
        bio: form.bio.trim(),
        avatar: form.avatar.trim() || form.firm_name[0]?.toUpperCase() || 'I',
        brand_color: form.brand_color,
        logo_url: form.logo_url || '',
        plan,
        uid: user?.uid || null,
        listed_at: new Date().toISOString(),
        listing_date: new Date().toISOString(),
        status: 'pending_payment',
      })

      toast.dismiss(toastId)

      await initiateInvestorPayment({
        plan,
        firmName: form.firm_name.trim(),
        email: form.email.trim(),
        investorId: result.id,
        onSuccess: async ({ paymentId }) => {
          try { await updateInvestorStatus(result.id, 'pending') } catch { }
          toast.success(`🎉 Payment successful! Your listing is under review. Payment ID: ${paymentId.slice(-8)}`)
          setStep(3)
          setSubmitting(false)
        },
        onFailure: (msg) => {
          toast.error(msg || 'Payment cancelled. Your details are saved — retry anytime.')
          setSubmitting(false)
        },
      })
    } catch (err) {
      toast.dismiss(toastId)
      toast.error('Submission failed. Try again.')
      console.error(err)
      setSubmitting(false)
    }
  }

  const currentPlan = plan ? INVESTOR_PLANS[plan] : null

  return (
    <main className="relative z-10 pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-10 pt-8">
          <Link to="/?mode=investor#list-startup" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 mb-6 transition-colors">
            ← Back to Investor Map
          </Link>
          <div className="section-label mb-3">Join the Map</div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3"
            style={{ fontFamily: 'Playfair Display,serif', letterSpacing: '-2px' }}>
            List as Investor on<br />
            <span style={{ background: 'linear-gradient(135deg,#D4BBFF,#9B6FFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: 'transparent' }}>
              India Startup Map
            </span>
          </h1>
          <p className="text-sm text-white/40 max-w-xl mx-auto leading-relaxed">
            Reach thousands of vetted founders across India. Receive curated pitches, get map visibility, and build your deal flow.
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[{ n: 1, l: 'Choose Plan' }, { n: 2, l: 'Your Details' }, { n: 3, l: 'Submitted!' }].map(s => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= s.n ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/25'}`}>{s.n}</div>
              <span className={`text-xs font-bold hidden sm:block ${step >= s.n ? 'text-white/70' : 'text-white/20'}`}>{s.l}</span>
              {s.n < 3 && <div className="w-8 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Choose Plan ── */}
        {step === 1 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
              {INVESTOR_PLAN_IDS.map(pid => {
                const p = INVESTOR_PLANS[pid]
                const selected = plan === pid
                return (
                  <div key={pid} onClick={() => setPlan(pid)}
                    className="card p-6 cursor-pointer transition-all hover:border-white/20 relative flex flex-col"
                    style={{
                      borderColor: selected ? p.color : 'rgba(255,255,255,0.08)',
                      boxShadow: selected ? `0 0 0 1px ${p.color}40, 0 8px 32px ${p.color}20` : undefined,
                      transform: p.popular ? 'scale(1.02)' : undefined,
                    }}>
                    {p.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black text-white whitespace-nowrap"
                        style={{ background: `linear-gradient(135deg,${p.color},${p.color}bb)` }}>
                        MOST POPULAR
                      </div>
                    )}
                    {p.isFounding && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap"
                        style={{ background: 'linear-gradient(135deg,#00D09C,#00a876)', color: '#000' }}>
                        🎉 FREE — Early 50
                      </div>
                    )}
                    <div className="text-3xl mb-2 mt-1">{p.icon}</div>
                    <div className="font-black text-white text-xl mb-0.5" style={{ fontFamily: 'Playfair Display,serif' }}>
                      {p.name}
                      {p.subtitle && <span className="text-sm font-bold text-white/40 ml-1.5">– {p.subtitle}</span>}
                    </div>
                    <div className="flex items-baseline gap-1 mb-0.5">
                      <span className="text-2xl font-black" style={{ color: p.isFounding ? '#00D09C' : p.color }}>{p.displayPrice}</span>
                      {p.isFounding && <span className="text-xs line-through text-white/25">{p.originalPrice}</span>}
                    </div>
                    <div className="text-xs text-white/30 mb-4">{p.period}</div>
                    <ul className="space-y-2 mb-auto">
                      {p.features.map(f => {
                        const isBold = p.bold_feature && f === p.bold_feature
                        return (
                          <li key={f} className={`flex items-start gap-2 text-xs ${isBold ? 'font-black text-white' : 'text-white/55'}`}>
                            <span className="flex-shrink-0 mt-0.5" style={{ color: p.isFounding ? '#00D09C' : p.color }}>✓</span>
                            {f}
                          </li>
                        )
                      })}
                    </ul>
                    <div className={`w-full mt-5 py-2.5 rounded-xl font-black text-sm text-center transition-all border ${selected ? 'border-transparent' : 'border-white/10 text-white/40 hover:text-white/70'}`}
                      style={selected ? { background: `linear-gradient(135deg,${p.isFounding ? '#00D09C' : p.color}cc,${p.isFounding ? '#00a876' : p.color})`, color: p.isFounding ? '#000' : '#fff' } : {}}>
                      {selected ? '✓ Selected' : PLAN_LABELS[pid]}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-white/30 text-center mb-6 italic">{INVESTOR_PLANS_NOTE}</p>
            <div className="text-center">
              <button onClick={() => { if (!plan) { toast.error('Please select a plan'); return }; setStep(2) }}
                className="px-12 py-3.5 rounded-xl font-black text-white text-sm transition-all"
                style={{ background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)', boxShadow: '0 8px 32px rgba(155,111,255,0.3)' }}>
                Continue with {plan ? INVESTOR_PLANS[plan]?.name : 'a'} Plan →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Fill Form ── */}
        {step === 2 && (
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `${currentPlan?.color}20`, border: `1px solid ${currentPlan?.color}40` }}>
                {currentPlan?.icon}
              </div>
              <div>
                <div className="font-black text-white text-lg">
                  {currentPlan?.name}{currentPlan?.subtitle ? ` – ${currentPlan.subtitle}` : ''} — {currentPlan?.displayPrice}{currentPlan?.period}
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-white/30 hover:text-purple-400 transition-colors">← Change plan</button>
              </div>
            </div>

            {/* Plan flags summary */}
            <div className="mb-6 p-4 rounded-xl grid grid-cols-2 md:grid-cols-3 gap-2"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {currentPlan && [
                ['map_listing', 'Map listing'],
                ['verified_badge', 'Verified badge'],
                ['accept_decline', 'Accept/Decline intros'],
                ['dashboard_access', 'Dashboard access'],
                ['cheque_display', 'Cheque size shown'],
                ['open_to_pitches', 'Open to pitches'],
                ['direct_contact', 'Direct contact unlock'],
                ['advanced_filtering', 'Advanced filtering'],
                ['deal_flow_report', 'AI deal flow report'],
                ['shortlisting_tool', 'Shortlisting tool'],
              ].map(([flag, label]) => {
                const enabled = currentPlan.flags[flag]
                return (
                  <div key={flag} className="flex items-center gap-1.5">
                    <span className={`text-[10px] ${enabled ? 'text-green-400' : 'text-white/20'}`}>{enabled ? '✓' : '✗'}</span>
                    <span className={`text-[10px] ${enabled ? 'text-white/60' : 'text-white/20'}`}>{label}</span>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="md:col-span-2">
                <label className="input-label">Fund / Firm Name *</label>
                <input className="input-field" placeholder="e.g. Sequoia Capital India" value={form.firm_name} onChange={set('firm_name')} />
              </div>
              <div>
                <label className="input-label">Partner / Contact Person *</label>
                <input className="input-field" placeholder="e.g. Rajan Anandan" value={form.partner_name} onChange={set('partner_name')} />
              </div>
              <div>
                <label className="input-label">Email Address *</label>
                <input className="input-field" type="email" placeholder="partner@fund.com" value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className="input-label">Phone (optional)</label>
                <input className="input-field" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
              </div>
              <div>
                <label className="input-label">Website (optional)</label>
                <input className="input-field" placeholder="https://yourfund.com" value={form.website} onChange={set('website')} />
              </div>
              <div className="md:col-span-2">
                <label className="input-label">LinkedIn URL (optional)</label>
                <input className="input-field" placeholder="https://linkedin.com/in/yourprofile" value={form.linkedin} onChange={set('linkedin')} />
              </div>
              <div>
                <label className="input-label">Primary State / HQ *</label>
                <select className="input-field" value={form.state} onChange={set('state')}>
                  <option value="">Select state…</option>
                  {STATES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Map Logo Initials</label>
                <input className="input-field" placeholder="e.g. SEQ" value={form.avatar} onChange={set('avatar')} maxLength={3} />
              </div>
              <div className="md:col-span-2">
                <label className="input-label">Logo Upload <span className="text-white/25 normal-case">(optional — shows on map & profile)</span></label>
                <div className="mt-2 flex items-center gap-4">
                  {form.logo_url ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                      <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      <button onClick={() => setForm(p => ({ ...p, logo_url: '' }))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600">
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:border-purple-400/50"
                      style={{ background: 'rgba(155,111,255,0.06)', border: '2px dashed rgba(155,111,255,0.25)' }}>
                      <span className="text-2xl">📷</span>
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > 5 * 1024 * 1024) { toast.error('Logo must be under 5MB'); return }
                        setUploadingLogo(true)
                        try {
                          const fd = new FormData()
                          fd.append('file', file)
                          fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
                          const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
                          const data = await res.json()
                          if (data.secure_url) {
                            setForm(p => ({ ...p, logo_url: data.secure_url }))
                            toast.success('Logo uploaded!')
                          } else { toast.error('Upload failed') }
                        } catch { toast.error('Upload failed') }
                        setUploadingLogo(false)
                      }} />
                    </label>
                  )}
                  <div>
                    <div className="text-xs text-white/40">{uploadingLogo ? 'Uploading...' : form.logo_url ? 'Logo uploaded ✓' : 'Click to upload logo'}</div>
                    <div className="text-[10px] text-white/20">PNG, JPG up to 5MB. If skipped, initial letter is used.</div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="input-label">Brand Color (shown on map)</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {BRAND_COLORS.map(col => (
                    <button key={col} onClick={() => setForm(p => ({ ...p, brand_color: col }))}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{ background: col, borderColor: form.brand_color === col ? 'white' : 'transparent', transform: form.brand_color === col ? 'scale(1.15)' : 'scale(1)' }} />
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input type="color" value={form.brand_color} onChange={e => setForm(p => ({ ...p, brand_color: e.target.value }))}
                      className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent" />
                    <span className="text-xs text-white/30">Custom</span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="input-label">Focus Sectors * <span className="text-white/25 normal-case">(pick up to 5)</span></label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {SECTORS.map(s => (
                    <button key={s} onClick={() => toggleFocus(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                      style={form.focus.includes(s)
                        ? { background: 'rgba(155,111,255,0.2)', borderColor: 'rgba(155,111,255,0.5)', color: '#c084fc' }
                        : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="input-label">Investment Stage (From)</label>
                <select className="input-field" value={form.stage_from} onChange={set('stage_from')}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Investment Stage (To)</label>
                <select className="input-field" value={form.stage_to} onChange={set('stage_to')}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Cheque Size (Min)</label>
                <input className="input-field" placeholder="e.g. 50L or 1Cr" value={form.cheque_min} onChange={set('cheque_min')} />
              </div>
              <div>
                <label className="input-label">Cheque Size (Max)</label>
                <input className="input-field" placeholder="e.g. 10Cr or 100Cr" value={form.cheque_max} onChange={set('cheque_max')} />
              </div>

              {/* Open to pitches toggle — basic only, others auto-enabled */}
              {plan === 'basic' && (
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div onClick={() => setForm(p => ({ ...p, open_to_pitches: !p.open_to_pitches }))}
                      className="w-11 h-6 rounded-full transition-all relative"
                      style={{ background: form.open_to_pitches ? '#9B6FFF' : 'rgba(255,255,255,0.1)' }}>
                      <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ transform: form.open_to_pitches ? 'translateX(20px)' : 'none' }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Open to Pitches</div>
                      <div className="text-xs text-white/35">Show the "OPEN TO PITCHES" badge on your profile</div>
                    </div>
                  </label>
                </div>
              )}
              {(plan === 'scout_pro' || plan === 'partner_elite') && (
                <div className="md:col-span-2 flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(0,208,156,0.06)', border: '1px solid rgba(0,208,156,0.2)' }}>
                  <span className="text-green-400 text-sm">✓</span>
                  <span className="text-xs text-green-400 font-bold">Open to Pitches is automatically enabled for {INVESTOR_PLANS[plan]?.name} plan.</span>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="input-label">About Your Fund (optional)</label>
                <textarea className="input-field resize-none" rows={4}
                  placeholder="Brief description of your fund, thesis, portfolio companies, etc."
                  value={form.bio} onChange={set('bio')} maxLength={500} />
                <div className="text-[10px] text-right mt-1 text-white/20">{form.bio.length}/500</div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.06]">
              <div className="flex gap-4">
                <button onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl font-bold text-sm text-white/40 border border-white/10 hover:text-white/60 transition-all">
                  ← Back
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 py-3 rounded-xl font-black text-sm text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#4a1a8a,#6a2abf)', opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Submitting…' : `Submit & Pay ${currentPlan?.displayPrice} →`}
                </button>
              </div>
              <p className="text-[10px] text-white/20 text-center mt-3">
                All submissions are reviewed within 24 hours. You'll receive a confirmation once approved.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3: Success ── */}
        {step === 3 && (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-4xl mx-auto mb-6">💰</div>
            <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Playfair Display,serif' }}>Listing Submitted!</h2>
            <p className="text-sm text-white/40 max-w-md mx-auto mb-8 leading-relaxed">
              We'll review your listing within 24 hours and send a confirmation to <strong className="text-white/60">{form.email}</strong>. Once approved, your fund will appear on the Investor Map.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/?mode=investor#list-startup" className="btn-primary px-8 py-3">💰 Explore Investor Map</Link>
              <Link to="/dashboard/investor" className="btn-secondary px-8 py-3">📊 Investor Dashboard</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
