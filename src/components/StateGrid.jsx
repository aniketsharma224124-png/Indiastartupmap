import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BASIC_GRID_SIZE = 50

export default function StateGrid({ startups = [], stateName, loading, premiumLimit = 1 }) {
  const [hoveredId, setHoveredId] = useState(null)
  const navigate = useNavigate()

  const premium    = startups.filter(s => s.is_premium)
  const basic      = startups.filter(s => !s.is_premium)
  const emptyBasic = Math.max(0, BASIC_GRID_SIZE - basic.length)

  if (loading) return (
    <div className="card p-6">
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse"
            style={{ animationDelay: `${i * 40}ms` }} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="card p-5 animate-zoom-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <span className="section-label">📍 {stateName}</span>
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>
            Startup Grid
          </h2>
          <p className="text-sm text-white/40 mt-1">
            {basic.length} of {BASIC_GRID_SIZE} basic · {premium.length} of {premiumLimit} premium ·{' '}
            <span className="text-yellow-400 font-semibold">{emptyBasic + Math.max(0, premiumLimit - premium.length)} available</span>
            <span className="text-white/25 ml-2">· Click any logo to view profile</span>
          </p>
        </div>
        <a href="#list-startup" className="btn-primary text-xs whitespace-nowrap">+ Claim Spot</a>
      </div>

      {/* Premium section */}
      {premium.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-yellow-400 text-[10px] font-bold tracking-widest uppercase">⭐ Premium Listings</span>
            <div className="flex-1 h-px bg-yellow-400/20" />
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-2 mb-4">
            {premium.map(s => (
              <Cell key={s.id} startup={s} premium
                hovered={hoveredId === s.id}
                onHover={setHoveredId}
                onClick={() => navigate(`/startup/${s.id}`)} />
            ))}
          </div>
          <div className="glow-line mb-5" />
        </div>
      )}

      {/* Basic grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {basic.map(s => (
          <Cell key={s.id} startup={s}
            hovered={hoveredId === s.id}
            onHover={setHoveredId}
            onClick={() => navigate(`/startup/${s.id}`)} />
        ))}

        {/* Empty basic slots */}
        {Array.from({ length: emptyBasic }).map((_, i) => (
          <a key={`empty-${i}`} href="#list-startup"
            className="aspect-square rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-1 group hover:border-blue-400/40 hover:bg-white/[0.02] transition-all duration-200">
            <span className="text-white/20 group-hover:text-blue-400/50 text-xl leading-none transition-colors">+</span>
            <span className="text-[8px] text-white/15 group-hover:text-white/30 transition-colors">Basic</span>
          </a>
        ))}
      </div>

      {/* Progress bars */}
      <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-2">
        <div>
          <div className="flex justify-between text-[10px] text-white/30 mb-1">
            <span>Basic slots ({basic.length}/{BASIC_GRID_SIZE})</span>
            <span>{Math.round((basic.length / BASIC_GRID_SIZE) * 100)}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-700 to-blue-400 rounded-full transition-all duration-1000"
              style={{ width: `${(basic.length / BASIC_GRID_SIZE) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-white/30 mb-1">
            <span>⭐ Premium map slots ({premium.length}/{premiumLimit})</span>
            <span>{Math.round((premium.length / Math.max(1, premiumLimit)) * 100)}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-1000"
              style={{ width: `${(premium.length / Math.max(1, premiumLimit)) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Cell({ startup, premium = false, hovered, onHover, onClick }) {
  const initials = startup.company_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const bg = startup.brand_color || '#3B7DD8'

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(startup.id)}
      onMouseLeave={() => onHover(null)}
      title={`${startup.company_name} — click to view profile`}
      className={`
        group relative aspect-square rounded-xl flex flex-col items-center justify-center gap-1 p-2
        transition-all duration-200 hover:-translate-y-1.5 hover:scale-110 focus:outline-none
        ${premium
          ? 'border border-yellow-400/40 bg-yellow-400/5 shadow-lg'
          : 'border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'}
      `}
      style={premium && hovered ? { boxShadow: `0 8px 28px ${bg}40` } : {}}
    >
      {premium && (
        <span className="absolute top-1 right-1 text-[8px] font-black bg-yellow-400 text-black px-1.5 py-0.5 rounded leading-none">
          PRO
        </span>
      )}

      {startup.logo_url
        ? <img src={startup.logo_url} alt={startup.company_name} className="w-7 h-7 object-contain rounded-lg" />
        : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs transition-transform group-hover:scale-105"
            style={{ background: bg, fontFamily: 'Playfair Display,serif', boxShadow: premium ? `0 4px 18px ${bg}55` : 'none' }}>
            {initials}
          </div>
      }

      <span className="text-[8px] font-semibold text-white/60 text-center leading-tight line-clamp-1 w-full px-0.5">
        {startup.company_name}
      </span>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-blue-500/20 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-full w-7 h-7 flex items-center justify-center">
          <span className="text-white text-xs">→</span>
        </div>
      </div>
    </button>
  )
}
