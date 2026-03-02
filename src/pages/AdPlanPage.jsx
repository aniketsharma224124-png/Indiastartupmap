// AdPlanPage.jsx
// Startups already listed on IndiaStartupMap can purchase an ad slot
// on the homepage side panels for ₹499/month via Razorpay.
// Only the email used to list the startup is accepted.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getMyStartupProfile } from '../lib/investorDb'
import { db } from '../lib/firebase'
import { collection, addDoc } from 'firebase/firestore'

const AD_PLAN = {
  name: 'Homepage Ad Slot',
  price: 49900,          // ₹499 in paise
  displayPrice: '₹499',
  period: '/month',
  features: [
    'Your logo + company name in the side ad panel',
    'Shown to every visitor on the homepage',
    'Rotating with other sponsors (3 slots per side)',
    'White card design — stands out against dark map',
    'Links directly to your website',
    'Cancel anytime — month-to-month',
  ],
}

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function AdPlanPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState(user?.email || '')
  const [startup,  setStartup]  = useState(null)   // fetched startup profile
  const [checking, setChecking] = useState(false)
  const [verified, setVerified] = useState(false)
  const [paying,   setPaying]   = useState(false)
  const [done,     setDone]     = useState(false)

  // Step 1 — verify email is tied to a listed startup
  const handleVerify = async () => {
    if (!email.trim()) { toast.error('Enter your startup email'); return }
    setChecking(true)
    try {
      const profile = await getMyStartupProfile(null, email.trim().toLowerCase())
      if (!profile) {
        toast.error('No approved startup found for this email. List your startup first.')
        setChecking(false)
        return
      }
      if (profile.status !== 'approved') {
        toast.error('Your startup listing is pending approval. Try again after it goes live.')
        setChecking(false)
        return
      }
      setStartup(profile)
      setVerified(true)
      toast.success(`Found: ${profile.company_name} ✅`)
    } catch (e) {
      console.error(e)
      toast.error('Could not verify. Please try again.')
    }
    setChecking(false)
  }

  // Step 2 — pay via Razorpay
  const handlePay = async () => {
    if (!startup) return
    setPaying(true)

    const loaded = await loadRazorpay()
    if (!loaded) {
      toast.error('Payment gateway failed to load. Check your internet connection.')
      setPaying(false)
      return
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID
    if (!keyId || keyId.includes('XXXX')) {
      toast.error('Razorpay not configured. Add VITE_RAZORPAY_KEY_ID to your .env file.')
      setPaying(false)
      return
    }

    const options = {
      key: keyId,
      amount: AD_PLAN.price,
      currency: 'INR',
      name: 'IndiaStartupMap',
      description: `Homepage Ad Slot — ${startup.company_name}`,
      image: startup.logo_url || 'https://indiastartupmap.com/logo.png',
      prefill: { name: startup.company_name, email },
      notes: {
        startup_id:   startup.id,
        company_name: startup.company_name,
        type:         'ad_slot',
        plan:         'monthly_499',
      },
      theme: { color: '#3B7DD8' },
      handler: async (response) => {
        try {
          // Save ad purchase to Firestore
          await addDoc(collection(db, 'ad_purchases'), {
            startup_id:    startup.id,
            company_name:  startup.company_name,
            logo_url:      startup.logo_url || '',
            website_url:   startup.website_url || '',
            brand_color:   startup.brand_color || '#3B7DD8',
            tagline:       startup.description?.slice(0, 80) || '',
            email:         email.trim().toLowerCase(),
            payment_id:    response.razorpay_payment_id,
            plan:          'monthly_499',
            amount:        499,
            status:        'active',
            purchased_at:  new Date().toISOString(),
            expires_at:    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          setDone(true)
          toast.success('🎉 Ad slot activated! Your startup will appear in the side panels.')
        } catch (err) {
          console.error(err)
          toast.success(`Payment received (${response.razorpay_payment_id})! We'll activate your slot within 24h.`)
          setDone(true)
        }
        setPaying(false)
      },
      modal: {
        ondismiss: () => { toast('Payment cancelled.'); setPaying(false) },
        escape: true,
        backdropclose: false,
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (res) => {
      toast.error(res.error?.description || 'Payment failed. Try again.')
      setPaying(false)
    })
    rzp.open()
  }

  return (
    <main className="relative z-10 pt-24 max-w-4xl mx-auto px-6 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white mb-8">← Back to Map</Link>

      {done ? (
        /* ── SUCCESS ── */
        <div className="card p-12 text-center">
          <div className="text-6xl mb-5">🎉</div>
          <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Playfair Display,serif' }}>
            Ad Slot Activated!
          </h2>
          <p className="text-sm text-white/40 mb-2 max-w-md mx-auto leading-relaxed">
            <strong className="text-white">{startup?.company_name}</strong> will appear in the homepage side panels, visible to every visitor on IndiaStartupMap.
          </p>
          <p className="text-xs text-white/25 mb-8">Allow up to 24 hours for your slot to go live after review.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/" className="px-8 py-3 rounded-xl font-black text-sm text-white" style={{ background: 'linear-gradient(135deg,#1a4a8a,#2a6abf)' }}>
              🗺 View Map →
            </Link>
            <Link to="/dashboard/founder" className="px-8 py-3 rounded-xl font-black text-sm border border-white/15 text-white/60 hover:text-white transition-all">
              Dashboard →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── LEFT — form ── */}
          <div className="card p-7">
            <span className="text-[10px] text-blue-400 tracking-[3px] uppercase font-black mb-2 block">📢 Advertise</span>
            <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>
              Get Your Startup in the<br />Side Ad Panels
            </h1>
            <p className="text-sm text-white/40 mb-7 leading-relaxed">
              Your logo and company name rotate in the homepage side panels — seen by every founder and investor who visits IndiaStartupMap. Only available to startups already listed on the map.
            </p>

            {/* Step 1 — verify email */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ background: verified ? '#00D09C' : 'rgba(74,158,255,0.3)' }}>
                  {verified ? '✓' : '1'}
                </div>
                <span className="text-sm font-bold text-white">Verify your startup email</span>
              </div>

              {!verified ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1.5">Email used to list your startup *</label>
                    <input
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      type="email"
                      placeholder="founder@yourstartup.com"
                      className="input-field"
                      onKeyDown={e => e.key === 'Enter' && handleVerify()}
                    />
                    <p className="text-[10px] text-white/25 mt-1">Must match the email you used when listing your startup.</p>
                  </div>
                  <button onClick={handleVerify} disabled={checking}
                    className="w-full py-2.5 rounded-xl font-black text-sm text-white transition-all"
                    style={{ background: checking ? 'rgba(74,158,255,0.3)' : 'linear-gradient(135deg,#1a4a8a,#2a6abf)', opacity: checking ? 0.7 : 1 }}>
                    {checking ? '🔍 Checking…' : 'Verify Email →'}
                  </button>
                  <div className="text-center">
                    <Link to="/#list-startup" className="text-xs text-blue-400 hover:underline">Not listed yet? List your startup first →</Link>
                  </div>
                </div>
              ) : (
                /* Verified — show startup card */
                <div className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: 'rgba(0,208,156,0.06)', border: '1px solid rgba(0,208,156,0.2)' }}>
                  <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-lg overflow-hidden"
                    style={{ background: startup?.brand_color || '#3B7DD8' }}>
                    {startup?.logo_url
                      ? <img src={startup.logo_url} alt="" className="w-full h-full object-cover" />
                      : startup?.company_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm">{startup?.company_name}</p>
                    <p className="text-xs text-green-400">✓ Verified listed startup</p>
                  </div>
                  <button onClick={() => { setVerified(false); setStartup(null) }}
                    className="text-white/30 hover:text-white text-sm flex-shrink-0">
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Step 2 — pay */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ background: verified ? 'rgba(74,158,255,0.3)' : 'rgba(255,255,255,0.1)' }}>
                  2
                </div>
                <span className={`text-sm font-bold ${verified ? 'text-white' : 'text-white/30'}`}>Complete payment</span>
              </div>

              {verified && (
                <div className="space-y-4">
                  {/* Order summary */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Order Summary</div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-white/60">Homepage Ad Slot</span>
                      <span className="text-sm font-bold text-white">₹499</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-white/60">Duration</span>
                      <span className="text-sm font-bold text-white">1 Month</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-white/60">Startup</span>
                      <span className="text-sm font-bold text-white">{startup?.company_name}</span>
                    </div>
                    <div className="h-px bg-white/[0.06] my-3" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">Total</span>
                      <span className="text-2xl font-black text-blue-400" style={{ fontFamily: 'Playfair Display,serif' }}>₹499</span>
                    </div>
                  </div>

                  <button onClick={handlePay} disabled={paying}
                    className="w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all"
                    style={{ background: paying ? 'rgba(74,158,255,0.3)' : 'linear-gradient(135deg,#1a4a8a,#2a6abf)', opacity: paying ? 0.7 : 1 }}>
                    {paying
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</>
                      : '🚀 Pay ₹499 & Activate Ad Slot →'}
                  </button>

                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] text-white/20">🔒 Secured by Razorpay</span>
                    <span className="text-white/10">·</span>
                    <span className="text-[10px] text-white/20">UPI · Cards · Netbanking</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT — preview + details ── */}
          <div className="flex flex-col gap-4">
            {/* Ad slot preview */}
            <div className="card p-5">
              <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Preview — Your Ad Card</div>
              <div style={{
                background: '#ffffff', border: '1px solid #e5e7eb',
                borderRadius: 12, padding: '12px 10px 11px',
                textAlign: 'center',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: startup?.brand_color || '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', overflow: 'hidden' }}>
                  {startup?.logo_url
                    ? <img src={startup.logo_url} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                    : <span style={{ fontSize: 18 }}>🚀</span>}
                </div>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 800, fontSize: 11, color: '#111827', marginBottom: 3 }}>
                  {startup?.company_name || 'Your Startup'}
                </div>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 9.5, color: '#6b7280', lineHeight: 1.4 }}>
                  {startup?.description?.slice(0, 55) || 'Your tagline appears here for every visitor.'}
                </div>
              </div>
              <p className="text-[10px] text-white/20 text-center mt-2">Actual card shown to visitors</p>
            </div>

            {/* What you get */}
            <div className="card p-5">
              <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3">What You Get</div>
              <ul className="space-y-2">
                {AD_PLAN.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/50">
                    <span className="text-blue-400 flex-shrink-0 mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing */}
            <div className="card p-5" style={{ borderColor: 'rgba(74,158,255,0.25)' }}>
              <div className="text-center">
                <div className="text-3xl font-black text-blue-400 mb-1" style={{ fontFamily: 'Playfair Display,serif' }}>₹499</div>
                <div className="text-xs text-white/30">per month · cancel anytime</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
