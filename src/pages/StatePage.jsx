import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import StateGrid from '../components/StateGrid'
import ListingForm from '../components/ListingForm'
import { getStartups } from '../lib/firebase'
import { getStateById } from '../data/states'
import { STATE_PREMIUM_LIMIT } from '../data/premiumSlots'

export default function StatePage() {
  const { stateId } = useParams()
  // Scroll to top when state changes
  useEffect(() => { window.scrollTo(0, 0) }, [stateId])
  const [startups, setStartups] = useState([])
  const [loading, setLoading]   = useState(true)

  const info = getStateById(stateId)
  const name = info?.name || stateId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  // Premium slot calculations
  const premiumLimit  = STATE_PREMIUM_LIMIT[stateId] || 1
  const premiumUsed   = startups.filter(s => s.is_premium).length
  const premiumLeft   = Math.max(0, premiumLimit - premiumUsed)
  const isFull        = premiumLeft === 0
  const fillPct       = Math.min(100, Math.round((premiumUsed / premiumLimit) * 100))

  useEffect(() => {
    setLoading(true)
    getStartups(name).then(setStartups).catch(console.error).finally(() => setLoading(false))
  }, [name])

  return (
    <main className="relative z-10 pt-16 max-w-7xl mx-auto px-6 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white transition-colors mb-6">
        ← Back to India Map
      </Link>

      <div className="mb-8 animate-fade-up">
        <span className="section-label">📍 State View</span>
        <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>{name}</h1>
        <p className="text-sm text-white/35">
          {loading ? 'Loading...' : `${startups.length} startup${startups.length !== 1 ? 's' : ''} listed · Click any logo to visit their website`}
        </p>
      </div>

      {/* ── PREMIUM SLOTS BANNER — compact ── */}
      {!loading && (
        <div className={`mb-4 rounded-xl border px-4 py-3 flex items-center gap-4 animate-fade-up ${
          isFull ? 'bg-red-500/5 border-red-500/15' : premiumLeft <= 2 ? 'bg-yellow-500/5 border-yellow-500/15' : 'bg-blue-500/4 border-blue-500/10'
        }`}>
          <span className="text-base flex-shrink-0">{isFull ? '⛔' : premiumLeft <= 2 ? '🔥' : '⭐'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-white">
                {isFull ? 'Map Slots Full' : `${premiumLeft} premium slot${premiumLeft!==1?'s':''} left`}
              </span>
              {premiumLeft <= 3 && !isFull && <span className="text-[8px] font-black uppercase bg-yellow-400 text-black px-1.5 py-0.5 rounded">Almost Gone</span>}
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${isFull?'bg-red-500':premiumLeft<=2?'bg-yellow-400':'bg-blue-500'}`}
                style={{ width:`${fillPct}%` }} />
            </div>
            <p className="text-[10px] text-white/30 mt-1">{premiumUsed}/{premiumLimit} premium · 50 basic slots available</p>
          </div>
          <div className={`flex-shrink-0 text-center px-3 py-1.5 rounded-lg border text-xs font-black ${
            isFull?'bg-red-500/10 border-red-500/25 text-red-400':premiumLeft<=2?'bg-yellow-500/10 border-yellow-500/25 text-yellow-400':'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`} style={{ fontFamily:'Playfair Display,serif' }}>
            {isFull ? '0' : premiumLeft}<div className="text-[8px] font-normal text-white/25 -mt-0.5">slots</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StateGrid startups={startups} stateName={name} loading={loading} premiumLimit={premiumLimit} />
        </div>
        <div className="space-y-4">
          {/* Stats card */}
          <div className="card p-5">
            <span className="section-label">Stats</span>
            {[
              ['Basic listed',         startups.filter(s => !s.is_premium).length],
              ['Basic slots left',     Math.max(0, 50 - startups.filter(s => !s.is_premium).length)],
              ['Premium on map',       premiumUsed],
              ['Premium slots left',   premiumLeft],
              ['Total startups',       startups.length],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between items-center py-2 border-b border-white/[0.05] last:border-0">
                <span className="text-xs text-white/35">{l}</span>
                <span className={`text-xl font-black ${
                  l === 'Premium slots left' && isFull ? 'text-red-400' :
                  l === 'Premium slots left' && premiumLeft <= 2 ? 'text-yellow-400' :
                  l === 'Premium on map' ? 'text-yellow-400' : 'text-white'
                }`} style={{ fontFamily: 'Playfair Display,serif' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* CTA card */}
          <div className={`card p-5 ${isFull ? 'border-white/10' : 'border-blue-500/20'}`}>
            <span className="section-label">Your Startup?</span>
            <h3 className="text-lg font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>
              Get on the {name} Map
            </h3>
            {isFull ? (
              <>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
                  <p className="text-xs text-red-400 font-semibold">⛔ Map slots full</p>
                  <p className="text-[11px] text-white/40 mt-0.5">Premium & Enterprise slots are sold out for {name}.</p>
                </div>
                <p className="text-xs text-white/35 leading-relaxed mb-4">
                  Basic listing (₹999) still available — your startup appears in the state grid and search results.
                </p>
                <a href="#list-startup" className="btn-secondary w-full text-center block text-sm">
                  Get Basic Listing →
                </a>
              </>
            ) : (
              <>
                {premiumLeft <= 2 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-yellow-400 font-semibold">🔥 Only {premiumLeft} slot{premiumLeft !== 1 ? 's' : ''} left!</p>
                    <p className="text-[11px] text-white/40 mt-0.5">Claim your spot before it's gone.</p>
                  </div>
                )}
                <p className="text-xs text-white/35 leading-relaxed mb-4">
                  Plans from ₹999. Your logo goes live on the map instantly.
                </p>
                <a href="#list-startup" className="btn-primary w-full text-center block text-sm">
                  Claim Your Spot →
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ListingForm premiumSlotsLeft={premiumLeft} stateId={stateId} />
      </div>
    </main>
  )
}
