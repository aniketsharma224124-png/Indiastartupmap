import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStartups } from '../lib/firebase'
import { INDIAN_STATES } from '../data/states'

const SECTORS = ['All', 'Fintech', 'Edtech', 'Healthtech', 'Ecommerce', 'SaaS', 'Agritech', 'Logistics', 'Gaming', 'AI/ML', 'Cleantech', 'Other']

export default function SearchBar() {
  const navigate  = useNavigate()
  const [query,    setQuery]    = useState('')
  const [sector,   setSector]   = useState('All')
  const [results,  setResults]  = useState([])
  const [all,      setAll]      = useState([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const ref = useRef(null)

  // Load all startups once
  useEffect(() => {
    setLoading(true)
    getStartups().then(d => { setAll(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  // Filter on query/sector change
  useEffect(() => {
    if (!query.trim() && sector === 'All') { setResults([]); setOpen(false); return }
    const q = query.toLowerCase()
    const filtered = all.filter(s => {
      const matchName  = s.company_name?.toLowerCase().includes(q)
      const matchState = s.state?.toLowerCase().includes(q)
      const matchDesc  = s.description?.toLowerCase().includes(q)
      const matchSector = sector === 'All' || s.sector === sector
      return (matchName || matchState || matchDesc) && matchSector
    }).slice(0, 8)
    setResults(filtered)
    setOpen(filtered.length > 0 || query.length > 1)
  }, [query, sector, all])

  // Close on outside click
  useEffect(() => {
    const fn = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleSelect = (startup) => {
    setOpen(false)
    setQuery('')
    window.open(startup.website_url || '#', '_blank')
  }

  const handleStateSearch = (stateName) => {
    const state = INDIAN_STATES.find(s => s.name.toLowerCase() === stateName.toLowerCase())
    if (state) { setOpen(false); navigate(`/state/${state.id}`) }
  }

  return (
    <div ref={ref} className="relative w-full max-w-2xl mx-auto">
      <div className="flex gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search startups, states..."
            className="input-field pl-9 pr-4"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-lg leading-none">
              ×
            </button>
          )}
        </div>

        {/* Sector filter */}
        <select
          value={sector}
          onChange={e => setSector(e.target.value)}
          className="input-field w-36 flex-shrink-0 cursor-pointer"
        >
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Dropdown results */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#0D1525] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-up">
          {results.length === 0 && query.length > 1 ? (
            <div className="px-4 py-6 text-center text-white/30 text-sm">
              No startups found for "<span className="text-white/50">{query}</span>"
            </div>
          ) : (
            <>
              {results.map(s => {
                const initials = s.company_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
                const bg = s.brand_color || '#3B7DD8'
                return (
                  <div key={s.id}
                    onClick={() => handleSelect(s)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/[0.05] last:border-0">
                    {/* Logo */}
                    {s.logo_url
                      ? <img src={s.logo_url} alt={s.company_name} className="w-9 h-9 rounded-lg object-contain flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                          style={{ background: bg, fontFamily: 'Playfair Display,serif' }}>
                          {initials}
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm truncate">{s.company_name}</span>
                        {s.is_premium && <span className="badge-premium flex-shrink-0">PRO</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-white/35 truncate">📍 {s.state}</span>
                        {s.description && <span className="text-[11px] text-white/25 truncate hidden sm:block">· {s.description}</span>}
                      </div>
                    </div>
                    <span className="text-white/20 text-xs flex-shrink-0">↗</span>
                  </div>
                )
              })}
              {results.length > 0 && (
                <div className="px-4 py-2 text-[10px] text-white/20 text-center border-t border-white/[0.05]">
                  {results.length} result{results.length > 1 ? 's' : ''} · Click to visit website
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
