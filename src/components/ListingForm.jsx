// ListingForm.jsx — Step 0: all profile fields | Step 1: plan | Step 2: pay
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { PLANS, initiatePayment } from '../lib/razorpay'
import { submitStartup, activateStartup, uploadLogo } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { INDIAN_STATES } from '../data/states'

const STEPS = ['Details', 'Plan', 'Payment']
const SECTORS = ['Fintech', 'Edtech', 'Healthtech', 'Ecommerce', 'SaaS', 'Agritech',
  'Logistics', 'Gaming', 'AI/ML', 'Cleantech', 'D2C', 'DeepTech', 'Other']
const SAVE_KEY = 'ism_listing_draft'
const CY = new Date().getFullYear()
const YEARS = Array.from({ length: CY - 1990 + 1 }, (_, i) => CY - i)

export default function ListingForm({ premiumSlotsLeft = 99 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const premiumFull = premiumSlotsLeft <= 0
  const [plan, setPlan] = useState(premiumSlotsLeft > 0 ? 'premium' : 'basic')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [startupId, setStartupId] = useState(null)
  const [resuming, setResuming] = useState(false)
  const [form, setForm] = useState({
    company_name: '', website_url: '', state: '', sector: '',
    email: '', brand_color: '#3B7DD8',
    founder_name: '', founded_year: '',
    description: '', all_time_revenue: '',
    linkedin_url: '', twitter_url: '', instagram_url: '',
    funding_raised: '', team_size: '', growth_percent: '', stage: '',
  })
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('resume') === 'listing' && user) {
      const saved = sessionStorage.getItem(SAVE_KEY)
      if (saved) {
        try {
          const { form: f, plan: pl, step: st } = JSON.parse(saved)
          setForm(f); setPlan(pl || plan); setStep(st || 2)
          setResuming(true); sessionStorage.removeItem(SAVE_KEY)
          toast.success('Welcome back! Details restored — complete payment to go live.')
        } catch { }
      }
    }
  }, [user, location.search])

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return }
    setLogoFile(file); setLogoPreview(URL.createObjectURL(file))
  }

  const validate = () => {
    if (!form.company_name.trim()) { toast.error('Company name is required'); return false }
    if (!form.website_url.trim()) { toast.error('Website URL is required'); return false }
    if (!form.website_url.startsWith('http')) { toast.error('Website URL must start with https://'); return false }
    if (!form.state) { toast.error('Please select your state'); return false }
    if (!form.email.trim()) { toast.error('Email is required'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Enter a valid email'); return false }
    if (!form.founder_name.trim()) { toast.error('Founder name is required'); return false }
    if (!form.description.trim()) { toast.error('Description is required — it appears on your profile page'); return false }
    return true
  }

  const requireLogin = (nextStep) => {
    if (!user) {
      sessionStorage.setItem(SAVE_KEY, JSON.stringify({ form, plan, step: nextStep }))
      toast.error('Please login or sign up to continue')
      navigate('/?login=founder&resume=listing')
      return false
    }
    return true
  }

  const handleContinueToPlan = () => { if (!validate()) return; if (!requireLogin(2)) return; setStep(1) }
  const handleContinueToPayment = () => { if (!requireLogin(2)) return; setStep(2) }

  const handlePay = async () => {
    if (!requireLogin(2)) return
    setLoading(true)
    const toastId = toast.loading('Preparing your listing…')
    try {
      let logo_url = null
      if (logoFile) {
        try {
          toast.loading('Uploading logo…', { id: toastId })
          logo_url = await uploadLogo(logoFile, form.company_name)
        } catch (e) {
          console.warn('Logo upload failed:', e)
          toast.error('Logo upload failed — continuing without logo')
        }
      }
      toast.loading('Saving your details…', { id: toastId })
      const startup = await submitStartup({
        ...form, plan,
        is_premium: plan === 'enterprise' || plan === 'premium',
        logo_url,
        founder_email: user.email,
        uid: user.uid,
        listed_at: new Date().toISOString(),
      })
      setStartupId(startup.id)
      toast.dismiss(toastId)
      initiatePayment({
        plan, startupId: startup.id, companyName: form.company_name, email: form.email,
        onSuccess: async ({ paymentId }) => {
          const t2 = toast.loading('Activating your listing…')
          try {
            await activateStartup(startup.id, paymentId, plan)
            toast.dismiss(t2); toast.success('🎉 Your startup is now live on the map!')
            navigate('/success')
          } catch {
            toast.dismiss(t2)
            toast.error(`Payment received! Contact support: ${paymentId}`, { duration: 10000 })
          } finally { setLoading(false) }
        },
        onFailure: (msg) => {
          toast.dismiss(toastId)
          if (msg !== 'Payment was cancelled.') toast.error(msg || 'Payment failed. Try again.')
          setLoading(false)
        },
      })
    } catch (e) {
      toast.dismiss(toastId)
      toast.error(e.message?.includes('not configured') ? 'Firebase not connected. Check your .env file.' : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const selectedPlan = PLANS[plan]

  return (
    <div id="list-startup" className="card p-6 lg:p-8">
      <div className="mb-6">
        <span className="section-label">🚀 Join the Map</span>
        <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>List Your Startup</h2>
        <p className="text-sm text-white/40 mt-1">Get discovered by investors & customers across India.</p>
      </div>

      {resuming && (
        <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-2.5"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <span>✅</span><p className="text-xs text-green-400">Your details are restored. Complete payment to go live.</p>
        </div>
      )}

      {/* Step indicators */}
      <div className="flex items-center gap-1 mb-7">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-400 text-[#0A0E1A]' : 'bg-white/10 text-white/30'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs mx-2 ${i === step ? 'text-white font-medium' : 'text-white/30'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`w-8 h-px mr-2 ${i < step ? 'bg-blue-600' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      {/* ── STEP 0: Details ─────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5 animate-fade-up">

          {/* Logo */}
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-2">Company Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0 bg-white/5">
                {logoPreview ? <img src={logoPreview} alt="preview" className="w-full h-full object-contain p-1" /> : <span className="text-white/20 text-2xl">🖼</span>}
              </div>
              <div className="flex-1">
                <label className="btn-secondary text-xs cursor-pointer inline-block">
                  {logoPreview ? '✓ Change Logo' : '+ Upload Logo'}
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoChange} />
                </label>
                <p className="text-[10px] text-white/25 mt-1.5">PNG, JPG, SVG, WebP · Max 2MB</p>
              </div>
              {logoPreview && <button onClick={() => { setLogoFile(null); setLogoPreview(null) }} className="text-white/30 hover:text-red-400 text-xl flex-shrink-0">×</button>}
            </div>
          </div>

          {/* Company Name + State */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Company Name *</label>
              <input className="input-field" placeholder="e.g. Zepto" value={form.company_name} onChange={set('company_name')} />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">State / UT *</label>
              <select className="input-field" value={form.state} onChange={set('state')}>
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Sector + Brand Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Sector</label>
              <select className="input-field" value={form.sector} onChange={set('sector')}>
                <option value="">Select sector</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Brand Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.brand_color} onChange={set('brand_color')}
                  className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer flex-shrink-0" style={{ padding: '2px' }} />
                <input className="input-field flex-1" placeholder="#3B7DD8" value={form.brand_color} onChange={set('brand_color')} />
              </div>
            </div>
          </div>

          {/* Website + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Website URL *</label>
              <input className="input-field" placeholder="https://yourcompany.com" value={form.website_url} onChange={set('website_url')} type="url" />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Contact Email *</label>
              <input className="input-field" placeholder="founder@yourcompany.com" value={form.email} onChange={set('email')} type="email" />
            </div>
          </div>

          {/* Founder + Founded Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Founder Name *</label>
              <input className="input-field" placeholder="e.g. Rahul Sharma" value={form.founder_name} onChange={set('founder_name')} />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Founded Year</label>
              <select className="input-field" value={form.founded_year} onChange={set('founded_year')}>
                <option value="">Select year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* All-time Revenue */}
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">
              All-Time Revenue <span className="text-white/20 normal-case font-normal">(optional — shown on your startup profile)</span>
            </label>
            <input className="input-field" placeholder="e.g.  ₹2.4 Cr  ·  $500K  ·  ₹10L+"
              value={form.all_time_revenue} onChange={set('all_time_revenue')} />
          </div>

          {/* Advanced Info — used for investor filters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">
                Funding Raised <span className="text-white/20 normal-case font-normal">(optional)</span>
              </label>
              <select className="input-field" value={form.funding_raised} onChange={set('funding_raised')}>
                <option value="">Select range</option>
                <option value="Bootstrapped">Bootstrapped</option>
                <option value="<₹25L">&lt;₹25L</option>
                <option value="₹25L – ₹1Cr">₹25L – ₹1Cr</option>
                <option value="₹1Cr – ₹5Cr">₹1Cr – ₹5Cr</option>
                <option value="₹5Cr – ₹25Cr">₹5Cr – ₹25Cr</option>
                <option value="₹25Cr+">₹25Cr+</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">
                Team Size <span className="text-white/20 normal-case font-normal">(optional)</span>
              </label>
              <select className="input-field" value={form.team_size} onChange={set('team_size')}>
                <option value="">Select size</option>
                <option value="Solo">Solo</option>
                <option value="2–5">2–5</option>
                <option value="6–15">6–15</option>
                <option value="16–50">16–50</option>
                <option value="51–200">51–200</option>
                <option value="200+">200+</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">
                Growth % (YoY) <span className="text-white/20 normal-case font-normal">(optional)</span>
              </label>
              <select className="input-field" value={form.growth_percent} onChange={set('growth_percent')}>
                <option value="">Select range</option>
                <option value="<10%">&lt;10%</option>
                <option value="10–50%">10–50%</option>
                <option value="50–100%">50–100%</option>
                <option value="100–300%">100–300%</option>
                <option value="300%+">300%+</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">
                Stage <span className="text-white/20 normal-case font-normal">(optional)</span>
              </label>
              <select className="input-field" value={form.stage} onChange={set('stage')}>
                <option value="">Select stage</option>
                <option value="Idea">Idea</option>
                <option value="MVP">MVP</option>
                <option value="Pre-Revenue">Pre-Revenue</option>
                <option value="Revenue">Revenue</option>
                <option value="Growth">Growth</option>
                <option value="Scaling">Scaling</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">
              Description * <span className="text-white/20 normal-case font-normal">— appears on your startup profile page</span>
            </label>
            <textarea className="input-field resize-none" rows={4}
              placeholder="What does your startup do? Who do you serve? What's your traction? What makes you unique? Investors & customers will read this."
              value={form.description} onChange={set('description')} maxLength={1000} />
            <p className={`text-[10px] text-right mt-1 ${form.description.length > 900 ? 'text-yellow-400' : 'text-white/20'}`}>
              {form.description.length}/1000
            </p>
          </div>


          <button className="btn-primary w-full" onClick={handleContinueToPlan}>
            {user ? 'Continue to Plan →' : '🔐 Login to Continue →'}
          </button>
          {!user && <p className="text-[10px] text-white/25 text-center">Your details are saved — login and come right back</p>}
        </div>
      )}

      {/* ── STEP 1: Plan ────────────────────────────────────────── */}
      {step === 1 && (
        <div className="animate-fade-up">
          {premiumFull && (
            <div className="rounded-xl p-4 mb-4 flex items-start gap-3"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-xl flex-shrink-0">⛔</span>
              <div>
                <p className="text-sm font-bold text-red-400">Premium map slots are full for this state</p>
                <p className="text-xs text-white/40 mt-1">Basic listing still available — appears in state grid and search.</p>
              </div>
            </div>
          )}
          <div className="space-y-3 mb-5">
            {Object.entries(PLANS).map(([key, p]) => {
              const isLocked = premiumFull && key !== 'basic'
              return (
                <button key={key} onClick={() => !isLocked && setPlan(key)} disabled={isLocked}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-200 relative overflow-hidden
                    ${isLocked ? 'border-white/[0.05] bg-white/[0.01] opacity-50 cursor-not-allowed'
                      : plan === key ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'}`}>
                  {isLocked && <span className="absolute -top-px left-4 text-[9px] font-black tracking-widest uppercase bg-red-600 text-white px-3 py-0.5 rounded-b-md">Map Slots Full</span>}
                  {p.popular && !isLocked && <span className="absolute -top-px left-4 text-[9px] font-black tracking-widest uppercase bg-blue-600 text-white px-3 py-0.5 rounded-b-md">Most Popular</span>}
                  {key === 'enterprise' && !isLocked && <span className="absolute -top-px right-4 text-[9px] font-black tracking-widest uppercase bg-yellow-500 text-black px-3 py-0.5 rounded-b-md">⭐ Premium Card</span>}
                  <div className="flex items-center justify-between mb-2.5 mt-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${isLocked ? 'border-white/10' : plan === key ? 'border-blue-400 bg-blue-400' : 'border-white/20'}`} />
                      <span className={`font-semibold ${isLocked ? 'text-white/30' : 'text-white'}`}>{p.name}</span>
                      {!isLocked && <span className="text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/50">📅 {p.duration}</span>}
                    </div>
                    <span className={`font-black text-xl flex-shrink-0 ${isLocked ? 'text-white/20' : 'text-blue-400'}`} style={{ fontFamily: 'Playfair Display,serif' }}>{p.displayPrice}</span>
                  </div>
                  <ul className="ml-7 space-y-1">
                    {p.features.map(f => (
                      <li key={f} className={`text-[11px] flex items-start gap-1.5 ${isLocked ? 'text-white/20' : 'text-white/45'}`}>
                        <span className={`flex-shrink-0 mt-0.5 ${isLocked ? 'text-white/20' : 'text-blue-400'}`}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>

          {/* Social Links — shown on Step 1 only when Premium or Enterprise is selected */}
          {(plan === 'premium' || plan === 'enterprise') && (
            <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(246,201,14,0.04)', border: '1px solid rgba(246,201,14,0.15)' }}>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-2">
                🔗 Social Media Links
                <span className="ml-2 text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(246,201,14,0.15)', color: '#F6C90E', border: '1px solid rgba(246,201,14,0.3)' }}>
                  {plan === 'enterprise' ? '👑 ENTERPRISE PERK' : '⭐ PREMIUM PERK'}
                </span>
              </label>
              <p className="text-[10px] text-white/25 mb-3">Add your social links — they'll be displayed on your startup profile card.</p>
              <div className="space-y-2">
                {[
                  ['🔗', 'LinkedIn', 'linkedin_url', 'https://linkedin.com/in/yourname'],
                  ['🐦', 'Twitter/X', 'twitter_url', 'https://x.com/yourhandle'],
                  ['📸', 'Instagram', 'instagram_url', 'https://instagram.com/yourhandle'],
                ].map(([icon, label, key, ph]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-sm w-5 flex-shrink-0">{icon}</span>
                    <span className="text-[10px] text-white/30 w-20 flex-shrink-0">{label}</span>
                    <input className="input-field text-xs flex-1" placeholder={ph} value={form[key]} onChange={set(key)} type="url" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setStep(0)}>← Back</button>
            <button className="btn-primary flex-1" onClick={handleContinueToPayment}>Continue →</button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Payment ─────────────────────────────────────── */}
      {step === 2 && (
        <div className="animate-fade-up">
          <div className="rounded-xl p-5 mb-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] text-white/35 uppercase tracking-wider mb-4">Order Summary</p>
            {logoPreview && (
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/[0.06]">
                <img src={logoPreview} alt="logo" className="w-10 h-10 rounded-lg object-contain bg-white/5" />
                <div><p className="text-sm font-semibold text-white">{form.company_name}</p><p className="text-xs text-white/35">Logo uploaded ✓</p></div>
              </div>
            )}
            <div className="space-y-2">
              {[
                ['Company', form.company_name],
                ['Founder', form.founder_name],
                ['State', form.state],
                ['Sector', form.sector || '—'],
                ['Founded', form.founded_year || '—'],
                ['Plan', selectedPlan?.name],
                ['Duration', selectedPlan?.duration],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-sm text-white/40">{l}</span>
                  <span className="text-sm text-white font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="glow-line my-4" />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white">Total</span>
              <span className="text-2xl font-black text-blue-400" style={{ fontFamily: 'Playfair Display,serif' }}>{selectedPlan?.displayPrice}</span>
            </div>
          </div>

          {plan === 'enterprise' && (
            <div className="rounded-xl p-4 mb-5 flex items-start gap-3"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <span className="text-xl flex-shrink-0">⭐</span>
              <div>
                <p className="text-xs font-black text-yellow-400 mb-1">Enterprise Premium Profile Card</p>
                <p className="text-[11px] text-white/40 leading-relaxed">Your logo, description, revenue, founder info and social links will appear on a golden premium card visible to all map visitors.</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setStep(1)} disabled={loading}>← Back</button>
            <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={handlePay} disabled={loading}>
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</> : '🚀 Pay & Go Live'}
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-[10px] text-white/20">🔒 Secured by Razorpay</span>
            <span className="text-white/10">·</span>
            <span className="text-[10px] text-white/20">UPI · Cards · Netbanking · Wallets</span>
          </div>
        </div>
      )}
    </div>
  )
}
