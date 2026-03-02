import { useEffect } from 'react'

export default function StartupModal({ startup, onClose }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [onClose])

  const initials = startup.company_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const bg = startup.brand_color || '#3B7DD8'

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-[#0D1525] border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-zoom-in"
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all">
          ✕
        </button>

        <div className="text-center mb-5">
          {startup.logo_url
            ? <img src={startup.logo_url} alt={startup.company_name} className="w-20 h-20 rounded-2xl mx-auto mb-4 object-contain" />
            : <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black text-3xl"
                style={{ background: bg, boxShadow: `0 12px 40px ${bg}60`, fontFamily: 'Playfair Display,serif' }}>
                {initials}
              </div>
          }
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Playfair Display,serif' }}>
              {startup.company_name}
            </h2>
            {startup.is_premium && <span className="badge-premium">PRO</span>}
          </div>
          <p className="text-sm text-white/40">📍 {startup.state}</p>
        </div>

        {startup.description && (
          <p className="text-sm text-white/55 text-center leading-relaxed mb-5">{startup.description}</p>
        )}

        <div className="flex justify-center gap-2 mb-5">
          <span className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/40 uppercase tracking-widest">
            {startup.plan || 'Basic'} Plan
          </span>
          <span className="text-[10px] bg-blue-400/10 border border-blue-400/20 px-3 py-1 rounded-full text-blue-400 uppercase tracking-widest">
            {startup.state}
          </span>
        </div>

        <a href={startup.website_url || '#'} target="_blank" rel="noopener noreferrer"
          className="btn-primary w-full flex items-center justify-center gap-2 mb-2">
          🌐 Visit Website →
        </a>
        <button onClick={onClose} className="btn-secondary w-full">Close</button>
      </div>
    </div>
  )
}
