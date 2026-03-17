import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PLANS, INVESTOR_PLANS, INVESTOR_PLANS_NOTE, FOUNDING_PROGRAM } from '../lib/razorpay'
import { getFoundingCounts } from '../lib/firebase'

// ── FOUNDING COUNTER BADGE ─────────────────────────────────────
function FoundingBadge({ program, liveCount = 0, accentColor = '#F6C90E', borderColor = 'rgba(246,201,14,0.35)', bgColor = 'rgba(246,201,14,0.12)' }) {
  const reg = liveCount
  const left = Math.max(0, program.total - reg)
  const pct = Math.min(100, Math.round((reg / program.total) * 100))
  return (
    <div className="rounded-2xl p-5 mb-6"
      style={{ background: `linear-gradient(135deg,${bgColor},rgba(0,0,0,0))`, border: `1px solid ${borderColor}` }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="text-3xl flex-shrink-0">🎉</div>
        <div className="flex-1">
          <span className="text-[10px] font-black tracking-[3px] uppercase px-2.5 py-1 rounded-full inline-block mb-2"
            style={{ background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}55` }}>
            🚀 LAUNCH OFFER
          </span>
          <h3 className="font-black text-white text-lg leading-tight mb-1" style={{ fontFamily: 'Playfair Display,serif' }}>
            {program.label} Program
          </h3>
          <p className="text-xs text-white/50 leading-relaxed">{program.description}</p>
        </div>
        <div className="flex-shrink-0 text-center bg-black/30 rounded-xl px-5 py-3 border min-w-[110px]"
          style={{ borderColor: `${accentColor}30` }}>
          <div className="font-black leading-none mb-0.5" style={{ fontFamily: 'Playfair Display,serif', color: accentColor, fontSize: 24 }}>
            {reg}<span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>/{program.total}</span>
          </div>
          <div className="text-[8px] text-white/35 uppercase tracking-widest">registered</div>
          <div className="text-[9px] font-black mt-0.5" style={{ color: left <= 10 ? '#ff6b6b' : accentColor }}>{left} spots left</div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 w-20 mx-auto overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${accentColor},${accentColor}aa)` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── FOUNDER PLAN CARD ──────────────────────────────────────────
function FounderPlanCard({ planKey, plan }) {
  const isFree = plan.isFounding
  const isEnterprise = planKey === 'enterprise'

  return (
    <div className={`card p-6 relative flex flex-col transition-all duration-300 ${plan.popular ? 'shadow-xl hover:-translate-y-2' : 'hover:-translate-y-1'}`}
      style={{
        borderColor: isEnterprise ? 'rgba(246,201,14,0.5)' : plan.popular ? 'rgba(246,201,14,0.35)' : isFree ? 'rgba(0,208,156,0.35)' : undefined,
        background: isEnterprise ? 'linear-gradient(160deg,rgba(246,201,14,0.06) 0%,transparent 60%)' : undefined,
        boxShadow: isEnterprise ? '0 0 40px rgba(246,201,14,0.07)' : undefined,
      }}>

      {isFree && !isEnterprise && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[2px] whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg,#00D09C,#00a876)', color: '#000' }}>
          🎉 FREE — Founding 100
        </div>
      )}
      {plan.popular && !isFree && !isEnterprise && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-black text-[9px] font-black tracking-[2px] uppercase px-4 py-1.5 rounded-full whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg,#F6C90E,#d4a500)' }}>
          MOST POPULAR
        </div>
      )}
      {isEnterprise && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[2px] whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg,#F6C90E,#f0b429)', color: '#000' }}>
          👑 ENTERPRISE
        </div>
      )}

      <div className="mb-auto pt-1">
        <h3 className="text-xl font-black text-white mt-2 mb-1" style={{ fontFamily: 'Playfair Display,serif' }}>{plan.name}</h3>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black" style={{
            fontFamily: 'Playfair Display,serif',
            color: isEnterprise ? '#F6C90E' : plan.popular ? '#F6C90E' : isFree ? '#00D09C' : '#4A9EFF',
          }}>
            {plan.displayPrice}
          </span>
          {isFree && <span className="text-sm line-through text-white/25">{plan.originalPrice}</span>}
          <span className="text-xs text-white/25">/ {plan.duration}</span>
        </div>

        {isFree && (
          <div className="text-[10px] font-black text-green-400 mb-3 tracking-wide">
            ✓ FREE for first {FOUNDING_PROGRAM.startups.total} startups
          </div>
        )}

        {plan.intro_credits && (
          <div className="rounded-xl border px-4 py-2.5 text-center mb-4 text-sm font-black"
            style={{
              background: isEnterprise ? 'rgba(246,201,14,0.08)' : 'rgba(74,158,255,0.08)',
              borderColor: isEnterprise ? 'rgba(246,201,14,0.25)' : 'rgba(74,158,255,0.2)',
              color: isEnterprise ? '#F6C90E' : '#4A9EFF',
            }}>
            ✉️ {plan.intro_credits} Investor Intro Credit{plan.intro_credits > 1 ? 's' : ''}
          </div>
        )}

        <ul className="space-y-2.5 mb-6">
          {plan.features.map(f => {
            const isGold = isEnterprise || (plan.crown_feature && f.startsWith('👑'))
            return (
              <li key={f}
                className={`flex items-start gap-2 text-xs ${isGold ? 'font-bold' : 'text-white/50'}`}
                style={isGold ? { color: '#F6C90E' } : {}}>
                <span className="mt-0.5 flex-shrink-0" style={{ color: isGold ? '#F6C90E' : '#60a5fa' }}>✓</span>
                {f}
              </li>
            )
          })}
        </ul>
      </div>

      {isFree ? (
        <a href="/?mode=startup#list-startup"
          className="w-full text-center block py-3 rounded-xl font-black text-sm transition-all"
          style={{ background: 'linear-gradient(135deg,#00D09C,#00a876)', color: '#000' }}>
          🚀 Claim Free Spot →
        </a>
      ) : (
        <a href="/?mode=startup#list-startup"
          className="w-full text-center block py-3 rounded-xl font-black text-sm transition-all"
          style={{
            background: isEnterprise || plan.popular
              ? 'linear-gradient(135deg,#F6C90E,#d4a500)'
              : 'rgba(255,255,255,0.06)',
            color: (isEnterprise || plan.popular) ? '#000' : 'rgba(255,255,255,0.7)',
          }}>
          {isEnterprise ? '👑 Get Enterprise →' : 'Get Started →'}
        </a>
      )}
    </div>
  )
}

// ── INVESTOR PLAN CARD ─────────────────────────────────────────
function InvestorPlanCard({ planKey, plan }) {
  const isFree = plan.isFounding
  return (
    <div className={`card p-6 relative flex flex-col transition-all duration-300 ${plan.popular ? 'shadow-xl hover:-translate-y-2' : 'hover:-translate-y-1'}`}
      style={{ borderColor: isFree ? 'rgba(0,208,156,0.35)' : plan.popular ? `${plan.color}55` : undefined }}>

      {isFree && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[2px] whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg,#00D09C,#00a876)', color: '#000' }}>
          🎉 FREE — Early 50
        </div>
      )}
      {plan.popular && !isFree && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[9px] font-black tracking-[2px] uppercase px-4 py-1.5 rounded-full whitespace-nowrap"
          style={{ background: `linear-gradient(135deg,${plan.color},${plan.color}bb)` }}>
          MOST POPULAR
        </div>
      )}
      {planKey === 'partner_elite' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-black text-[9px] font-black tracking-[2px] uppercase px-4 py-1.5 rounded-full whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg,#F6C90E,#d4a500)' }}>
          ⭐ TOP TIER
        </div>
      )}

      <div className="mb-auto pt-1">
        <div className="text-2xl mb-2 mt-2">{plan.icon}</div>
        <div className="text-[9px] tracking-[2px] uppercase font-bold mb-1" style={{ color: plan.color }}>For Investors</div>
        <h3 className="text-xl font-black text-white mb-0.5" style={{ fontFamily: 'Playfair Display,serif' }}>
          {plan.name}
          {plan.subtitle && <span className="text-sm font-bold text-white/40 ml-1.5">– {plan.subtitle}</span>}
        </h3>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black" style={{ fontFamily: 'Playfair Display,serif', color: isFree ? '#00D09C' : plan.color }}>
            {plan.displayPrice}
          </span>
          {isFree && <span className="text-sm line-through text-white/25">{plan.originalPrice}</span>}
          <span className="text-xs text-white/25">{plan.period}</span>
        </div>
        {isFree && (
          <div className="text-[10px] font-black text-green-400 mb-3 tracking-wide">
            ✓ FREE for first {FOUNDING_PROGRAM.investors.total} investors
          </div>
        )}
        <ul className="space-y-2.5 mb-6 mt-4">
          {plan.features.map(f => {
            const isBold = plan.bold_feature && f === plan.bold_feature
            return (
              <li key={f} className={`flex items-start gap-2 text-xs ${isBold ? 'font-black text-white' : 'text-white/50'}`}>
                <span className="flex-shrink-0 mt-0.5" style={{ color: plan.color }}>✓</span>
                {f}
              </li>
            )
          })}
        </ul>
      </div>

      {isFree ? (
        <Link to={`/investor-listing?plan=${planKey}`}
          className="w-full py-3 rounded-xl font-black text-sm text-black transition-all text-center block"
          style={{ background: 'linear-gradient(135deg,#00D09C,#00a876)' }}>
          🎉 Claim Free Investor Spot →
        </Link>
      ) : (
        <Link to={`/investor-listing?plan=${planKey}`}
          className="w-full py-3 rounded-xl font-black text-sm text-white transition-all text-center block"
          style={{ background: plan.popular ? `linear-gradient(135deg,${plan.color}dd,${plan.color}99)` : 'rgba(255,255,255,0.06)', border: `1px solid ${plan.color}40` }}>
          {planKey === 'scout_pro' ? '🔍 List as Scout Pro →' : '⭐ List as Partner Elite →'}
        </Link>
      )}
    </div>
  )
}

// ── PRICING PAGE ───────────────────────────────────────────────
export default function PricingPage() {
  const [foundingCounts, setFoundingCounts] = useState({ startups: 0, investors: 0 })
  useEffect(() => {
    getFoundingCounts().then(setFoundingCounts).catch(() => { })
  }, [])
  return (
    <main className="relative z-10 pt-24 max-w-7xl mx-auto px-6 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white transition-colors mb-10">
        ← Back to Map
      </Link>

      {/* FOUNDER PLANS */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <div className="section-label mb-2">For Founders</div>
          <h2 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>List Your Startup</h2>
          <p className="text-sm text-white/35">Map visibility + investor intro credits. One-time fee. No subscriptions.</p>
        </div>
        <FoundingBadge program={FOUNDING_PROGRAM.startups} liveCount={foundingCounts.startups} accentColor="#F6C90E" borderColor="rgba(246,201,14,0.35)" bgColor="rgba(246,201,14,0.12)" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Object.entries(PLANS).map(([key, plan]) => (
            <FounderPlanCard key={key} planKey={key} plan={plan} />
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-blue-500/15 bg-blue-500/5 p-5 text-center">
          <p className="text-sm text-white/50 leading-relaxed">
            <span className="text-blue-400 font-bold">✉️ Intro Credits</span> — Use them on the{' '}
            <Link to="/" className="text-blue-400 hover:underline">Map</Link> to send warm pitches to VCs.
            One credit = one intro request to an investor.
          </p>
        </div>
      </section>

      <div className="border-t border-white/[0.06] mb-16" />

      {/* INVESTOR PLANS */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <div className="section-label mb-2" style={{ color: '#9B6FFF' }}>For Investors & VCs</div>
          <h2 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>Join the Investor Map</h2>
          <p className="text-sm text-white/35">Get inbound deal flow from verified founders across India.</p>
        </div>
        <FoundingBadge program={FOUNDING_PROGRAM.investors} liveCount={foundingCounts.investors} accentColor="#9B6FFF" borderColor="rgba(155,111,255,0.35)" bgColor="rgba(155,111,255,0.12)" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Object.entries(INVESTOR_PLANS).map(([key, plan]) => (
            <InvestorPlanCard key={key} planKey={key} plan={plan} />
          ))}
        </div>
        <p className="text-xs text-white/30 text-center mt-5 italic">{INVESTOR_PLANS_NOTE}</p>
      </section>

      {/* FAQ */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <div className="section-label mb-2">FAQ</div>
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>Common Questions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {[
            { q: 'What is the Founding 100 program?', a: 'The first 100 startups and first 50 investors get listed for FREE — no payment needed. This is our launch offer to build an early community of quality founders and VCs.' },
            { q: 'What is an intro credit?', a: 'One credit lets you send a 500-char pitch to a VC on the Investor Map. If they accept, we facilitate a warm email introduction — no cold outreach.' },
            { q: 'Do credits expire?', a: "Credits are valid for your entire listing period. Unused credits don't roll over on renewal." },
            { q: 'How long until my listing goes live?', a: 'Submissions are reviewed within 24 hours. Premium listings typically go live within a few hours.' },
            { q: 'What does Scout vs Scout Pro give investors?', a: 'Scout gets map listing, verified badge, and dashboard. Scout Pro adds AI Top 20 placement, advanced filtering, startup bookmarking, and priority placement.' },
            { q: 'Is there a refund policy?', a: 'Listings are non-refundable once approved. Rejected submissions receive a full refund within 5–7 business days.' },
          ].map(({ q, a }) => (
            <div key={q} className="card p-5">
              <h4 className="font-black text-white text-sm mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>{q}</h4>
              <p className="text-xs text-white/40 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="card p-10 text-center">
        <h3 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Playfair Display,serif' }}>Ready to get discovered?</h3>
        <p className="text-sm text-white/40 mb-6 max-w-md mx-auto">Join 1,200+ startups and 50+ investors on India's most focused startup discovery platform.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="/?mode=startup#list-startup" className="btn-primary px-8 py-3">🚀 List Your Startup</a>
          <Link to="/?mode=investor#list-startup" className="btn-secondary px-8 py-3">💰 Explore Investor Map</Link>
        </div>
      </div>
    </main>
  )
}
