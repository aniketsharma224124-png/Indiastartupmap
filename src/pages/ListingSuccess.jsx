import { Link } from 'react-router-dom'

export default function ListingSuccess() {
  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <div className="card p-10 max-w-md w-full text-center animate-zoom-in">
        <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6 text-4xl animate-pulse-glow">
          ✅
        </div>
        <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>
          You're on the Map! 🗺️
        </h1>
        <p className="text-sm text-white/40 leading-relaxed mb-8">
          Your startup is now live on IndiaStartupMap. Visitors across India can discover and visit your website.
        </p>
        <div className="space-y-3">
          <Link to="/" className="btn-primary w-full flex items-center justify-center gap-2">
            🗺️ View the Map
          </Link>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "We're on IndiaStartupMap!", url: window.location.origin })
              } else {
                navigator.clipboard.writeText(window.location.origin)
                alert('Link copied! Share it 🚀')
              }
            }}
            className="btn-secondary w-full">
            📤 Share with Network
          </button>
        </div>
        <p className="text-[10px] text-white/20 mt-6">Confirmation sent to your email.</p>
      </div>
    </main>
  )
}
