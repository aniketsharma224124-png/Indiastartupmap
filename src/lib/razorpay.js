// razorpay.js — plan definitions + payment initiators

// ── FOUNDING 100 STARTUPS PROGRAM ─────────────────────────────
export const FOUNDING_PROGRAM = {
  startups: {
    total: 100,
    claimed: 0,
    freeValue: '₹999',
    label: 'Founding 100 Startups',
    description: 'Free listing (worth ₹999) — only for first 100 startups',
  },
  investors: {
    total: 50,
    claimed: 0,
    freeValue: '₹999',
    label: 'Early 50 Investors',
    description: 'Free listing for early 50 investors',
  },
}

// ── STARTUP PLANS ─────────────────────────────────────────────
export const PLANS = {
  basic: {
    name: 'Basic',
    isFounding: true,
    price: 99900,
    displayPrice: '₹0',
    originalPrice: '₹999',
    grids: 1,
    duration: '1 Year',
    durationMonths: 12,
    intro_credits: 5,
    popular: false,
    socialLinks: false,           // no social links for basic
    features: [
      '1 grid spot on state map',
      'Logo + company name displayed',
      'Direct click to your website',
      '5 investor intro requests',
      '1 year listing',
    ],
  },
  premium: {
    name: 'Premium',
    isFounding: false,
    price: 299900,
    displayPrice: '₹2,999',
    originalPrice: null,
    grids: 3,
    duration: '1 Year',
    durationMonths: 12,
    intro_credits: 20,
    popular: true,
    socialLinks: true,            // ← social links enabled
    features: [
      'Logo shown on India homepage map',
      'Priority placement in grid',
      'Direct click to your website',
      '✉️ 20 Investor Intro Credits',
      '1 year listing',
      '⭐ PRO badge',
      'Investors can mark interest',
      '👑 Social media links on premium profile card',
    ],
    crown_feature: '👑 Social media links on premium profile card',
  },
  enterprise: {
    name: 'Enterprise',
    isFounding: false,
    price: 799900,
    displayPrice: '₹7,999',
    originalPrice: null,
    grids: 5,
    duration: '1 Year',
    durationMonths: 12,
    intro_credits: 40,
    popular: false,
    socialLinks: true,            // ← social links enabled
    features: [
      '👑 Largest logo on India map',
      '👑 Top placement guaranteed',
      '👑 Premium Profile Card',
      '👑 ✉️ 40 Investor Intro Credits',
      '👑 1 year listing',
      '👑 Social media links on profile card',
      '👑 Analytics dashboard',
      '👑 ⭐ PRO badge',
      '👑 Priority support',
    ],
    all_gold: true,
  },
}

// ── INVESTOR PLANS ─────────────────────────────────────────────
// Exactly matching the reference image:
//   Basic – Growth Engine | Scout Pro | Partner Elite
export const INVESTOR_PLANS = {
  basic: {
    name: 'Basic',
    subtitle: 'Growth Engine',
    isFounding: true,
    price: 99900,
    displayPrice: '₹0',
    originalPrice: '₹999',
    period: '/year (inc. tax)',
    durationMonths: 12,
    color: '#4A9EFF',
    icon: '📋',
    popular: false,
    features: [
      'Basic investor profile',
      'Listed on Investor Map',
      'Sector & stage tags',
      'Receive intro requests (manual email)',
      'Limited visibility (below paid users)',
    ],
    flags: {
      open_to_pitches: false,
      verified_badge: false,
      map_listing: true,
      accept_decline: false,
      detailed_page: false,
      aggressive_display: false,
      bookmarking: false,
      priority_placement: false,
      ai_top20: false,
      advanced_filtering: false,
      cheque_display: false,
      dashboard_access: false,
      featured_states: 0,
      analytics: false,
      direct_contact: false,
      pitch_badge_gold: false,
      deal_flow_report: false,
      shortlisting_tool: false,
      unlimited_states: false,
    },
  },
  scout_pro: {
    name: 'Scout Pro',
    subtitle: '',
    isFounding: false,
    price: 499900,
    displayPrice: '₹4,999',
    originalPrice: null,
    period: '/year (inc. tax)',
    durationMonths: 12,
    color: '#9B6FFF',
    icon: '🔍',
    popular: true,
    features: [
      'Everything in Free',
      'Listed on map as premium',
      'Accept / decline intros via dashboard',
      'Verified Investor badge',
      '3 featured states',
      'Cheque size publicly displayed',
      'Dashboard access',
      'Open to pitch batch',
      'Basic analytics (profile views, intro count)',
    ],
    flags: {
      open_to_pitches: true,
      verified_badge: true,
      map_listing: true,
      accept_decline: true,
      detailed_page: true,
      aggressive_display: true,
      bookmarking: false,
      priority_placement: false,
      ai_top20: false,
      advanced_filtering: false,
      cheque_display: true,
      dashboard_access: true,
      featured_states: 3,
      analytics: true,
      direct_contact: false,
      pitch_badge_gold: false,
      deal_flow_report: false,
      shortlisting_tool: false,
      unlimited_states: false,
    },
  },
  partner_elite: {
    name: 'Partner Elite',
    subtitle: '',
    isFounding: false,
    price: 999900,
    displayPrice: '₹9,999',
    originalPrice: null,
    period: '/year (inc. tax)',
    durationMonths: 12,
    color: '#F6C90E',
    icon: '⭐',
    popular: false,
    features: [
      'Everything in Scout Pro +',
      'Priority placement on map',
      'Direct founder contact unlock',
      'Unlimited featured states',
      '"Open to Pitch" gold badge',
      'Advanced filters: Revenue range, Funding raised, Growth %, Team size',
      'Monthly curated deal flow report (AI ranked)',
      'Startup shortlisting tool (bookmark + notes)',
    ],
    bold_feature: 'Startup shortlisting tool (bookmark + notes)',
    flags: {
      open_to_pitches: true,
      verified_badge: true,
      map_listing: true,
      accept_decline: true,
      detailed_page: true,
      aggressive_display: true,
      bookmarking: true,
      priority_placement: true,
      ai_top20: true,
      advanced_filtering: true,
      cheque_display: true,
      dashboard_access: true,
      featured_states: -1,        // -1 = unlimited
      analytics: true,
      direct_contact: true,
      pitch_badge_gold: true,
      deal_flow_report: true,
      shortlisting_tool: true,
      unlimited_states: true,
    },
  },
}

export const INVESTOR_PLAN_IDS = ['basic', 'scout_pro', 'partner_elite']

export const INVESTOR_PLANS_NOTE = '* Funding Investors: 2026 → Lifetime pricing lock. Price will increase after 2026.'

// ── Razorpay loader ────────────────────────────────────────────
function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

// ── Startup payment ────────────────────────────────────────────
export async function initiatePayment({ plan, startupId, companyName, email, onSuccess, onFailure }) {
  const p = PLANS[plan]
  if (!p) { onFailure?.('Invalid plan.'); return }
  if (p.isFounding) {
    onSuccess?.({ paymentId: 'FOUNDING_FREE', orderId: '', signature: '', plan })
    return
  }
  const loaded = await loadRazorpay()
  if (!loaded) { onFailure?.('Payment gateway failed to load.'); return }
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID
  if (!keyId || keyId.includes('XXXX')) {
    onFailure?.('Razorpay key not configured. Add VITE_RAZORPAY_KEY_ID to .env')
    return
  }
  const rzp = new window.Razorpay({
    key: keyId, amount: p.price, currency: 'INR',
    name: 'IndiaStartupMap',
    description: `${p.name} Plan — ${companyName}`,
    prefill: { name: companyName, email },
    notes: { startup_id: startupId, plan, company: companyName },
    theme: { color: '#3B7DD8' },
    handler: (r) => onSuccess?.({ paymentId: r.razorpay_payment_id, orderId: r.razorpay_order_id, signature: r.razorpay_signature, plan }),
    modal: { ondismiss: () => onFailure?.('Payment was cancelled.'), escape: true, backdropclose: false },
  })
  rzp.on('payment.failed', (r) => onFailure?.(r.error?.description || 'Payment failed.'))
  rzp.open()
}

// ── Investor payment ───────────────────────────────────────────
export async function initiateInvestorPayment({ plan, firmName, email, investorId, onSuccess, onFailure }) {
  const p = INVESTOR_PLANS[plan]
  if (!p) { onFailure?.('Invalid investor plan.'); return }
  if (p.isFounding) {
    onSuccess?.({ paymentId: 'FOUNDING_FREE', orderId: '', signature: '', plan })
    return
  }
  const loaded = await loadRazorpay()
  if (!loaded) { onFailure?.('Payment gateway failed to load.'); return }
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID
  if (!keyId || keyId.includes('XXXX')) {
    onFailure?.('Razorpay key not configured.')
    return
  }
  const rzp = new window.Razorpay({
    key: keyId, amount: p.price, currency: 'INR',
    name: 'IndiaStartupMap',
    description: `Investor ${p.name} Plan — ${firmName}`,
    prefill: { name: firmName, email },
    notes: { firm_name: firmName, plan, type: 'investor', investor_id: investorId || '' },
    theme: { color: '#9B6FFF' },
    handler: (r) => onSuccess?.({ paymentId: r.razorpay_payment_id, orderId: r.razorpay_order_id, signature: r.razorpay_signature, plan }),
    modal: { ondismiss: () => onFailure?.('Payment was cancelled.'), escape: true, backdropclose: false },
  })
  rzp.on('payment.failed', (r) => onFailure?.(r.error?.description || 'Payment failed.'))
  rzp.open()
}
