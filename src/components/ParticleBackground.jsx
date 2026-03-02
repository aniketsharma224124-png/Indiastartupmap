import { useMemo } from 'react'

export default function ParticleBackground() {
  const particles = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      dur: `${Math.random() * 14 + 7}s`,
      delay: `${Math.random() * 6}s`,
      color: i % 3 === 0 ? 'rgba(99,179,255,0.5)' : i % 3 === 1 ? 'rgba(59,125,216,0.4)' : 'rgba(246,201,14,0.3)',
    })), [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(59,125,216,0.07) 0%, transparent 70%)' }} />
      {particles.map(p => (
        <div key={p.id} className="particle absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color, '--dur': p.dur, '--delay': p.delay }} />
      ))}
      <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#63B3FF" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}
