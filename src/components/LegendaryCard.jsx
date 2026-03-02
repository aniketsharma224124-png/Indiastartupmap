import { useState } from 'react'
import { X, Linkedin, Twitter, Instagram, Globe, TrendingUp } from 'lucide-react'

export default function LegendaryCard({ startup, onClose }) {
  if (!startup) return null

  const words = startup.description?.trim().split(/\s+/) || []
  const shortDesc = words.slice(0, 50).join(' ') + (words.length > 50 ? '…' : '')

  const socials = [
    { key: 'linkedin_url',  href: startup.linkedin_url,  Icon: Linkedin,  label: 'LinkedIn',  bg: 'rgba(10,102,194,0.18)',  border: 'rgba(10,102,194,0.35)',  color: '#60a5fa' },
    { key: 'twitter_url',   href: startup.twitter_url,   Icon: Twitter,   label: 'Twitter/X', bg: 'rgba(29,155,240,0.15)',  border: 'rgba(29,155,240,0.3)',   color: '#7dd3fc' },
    { key: 'instagram_url', href: startup.instagram_url, Icon: Instagram, label: 'Instagram', bg: 'rgba(225,48,108,0.15)',  border: 'rgba(225,48,108,0.3)',   color: '#f9a8d4' },
  ].filter(s => s.href)

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      {/* ── CARD ──────────────────────────────────────────── */}
      <div
        className="relative w-full max-w-sm"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'cardPop 0.22s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {/* Golden glow border */}
        <div style={{
          position: 'absolute', inset: '-1.5px',
          borderRadius: '22px',
          background: 'linear-gradient(135deg, #f59e0b, #fbbf24, #f59e0b, #d97706)',
          filter: 'blur(1px)',
          opacity: 0.7,
        }} />

        {/* Card body */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(160deg, #0f1724 0%, #090d18 100%)',
          borderRadius: '20px',
          overflow: 'hidden',
        }}>

          {/* ── HEADER BANNER ─────────────────────────── */}
          <div style={{
            position: 'relative',
            height: '110px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(251,191,36,0.1) 50%, rgba(217,119,6,0.15) 100%)',
            borderBottom: '1px solid rgba(245,158,11,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Corner brackets */}
            {[['top-3 left-3','border-t-2 border-l-2'],['top-3 right-3','border-t-2 border-r-2'],
              ['bottom-3 left-3','border-b-2 border-l-2'],['bottom-3 right-3','border-b-2 border-r-2']].map(([pos, cls]) => (
              <div key={pos} className={`absolute ${pos} ${cls} w-4 h-4 border-yellow-400/50`} />
            ))}

            {/* ENTERPRISE badge top-right */}
            <div style={{
              position: 'absolute', top: 10, right: 14,
              fontSize: '8px', fontWeight: 800, letterSpacing: '1.5px',
              textTransform: 'uppercase', color: '#fbbf24',
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '5px', padding: '2px 7px',
            }}>⭐ Enterprise</div>

            {/* Logo */}
            {startup.logo_url ? (
              <img
                src={startup.logo_url}
                alt={startup.company_name}
                style={{
                  width: '68px', height: '68px', borderRadius: '50%',
                  border: '2.5px solid #fbbf24',
                  boxShadow: '0 0 20px rgba(251,191,36,0.4)',
                  objectFit: 'contain', background: '#fff',
                }}
              />
            ) : (
              <div style={{
                width: '68px', height: '68px', borderRadius: '50%',
                border: '2.5px solid #fbbf24',
                boxShadow: '0 0 20px rgba(251,191,36,0.4)',
                background: startup.brand_color || '#1a3a6a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', fontWeight: 900, color: '#fbbf24',
                fontFamily: 'Playfair Display, serif',
              }}>
                {startup.company_name?.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* ── CONTENT ───────────────────────────────── */}
          <div style={{ padding: '20px 22px 22px' }}>

            {/* Company name */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '22px', fontWeight: 900,
                background: 'linear-gradient(135deg, #fde68a, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: '2px', lineHeight: 1.2,
              }}>
                {startup.company_name}
              </h2>
              {startup.sector && (
                <div style={{ fontSize: '10px', color: 'rgba(251,191,36,0.5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
                  {startup.sector}
                </div>
              )}
            </div>

            {/* Description — 50 words max */}
            {shortDesc && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
                padding: '11px 13px',
                marginBottom: '14px',
              }}>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, marginBottom: '5px' }}>About</div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{shortDesc}</p>
              </div>
            )}

            {/* All-time Revenue (optional) */}
            {startup.all_time_revenue && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(245,158,11,0.07)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: '10px',
                padding: '10px 13px',
                marginBottom: '14px',
              }}>
                <TrendingUp size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '9px', color: 'rgba(251,191,36,0.5)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>All-Time Revenue</div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.3px' }}>{startup.all_time_revenue}</div>
                </div>
              </div>
            )}

            {/* Founder + Social */}
            {(startup.founder_name || socials.length > 0) && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
                padding: '11px 13px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}>
                <div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, marginBottom: '3px' }}>Founded by</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{startup.founder_name || '—'}</div>
                </div>
                {socials.length > 0 && (
                  <div style={{ display: 'flex', gap: '7px', flexShrink: 0 }}>
                    {socials.map(({ key, href, Icon, label, bg, border, color }) => (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={label}
                        style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: bg, border: `1px solid ${border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'transform 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Icon size={15} color={color} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Visit Website */}
            {startup.website_url && (
              <a
                href={startup.website_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%',
                  background: 'linear-gradient(135deg, #d97706, #f59e0b, #fbbf24)',
                  color: '#0f1724',
                  fontWeight: 800, fontSize: '13px',
                  padding: '12px', borderRadius: '10px',
                  textDecoration: 'none',
                  transition: 'opacity 0.15s, transform 0.15s',
                  boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <Globe size={16} />
                Visit Website
              </a>
            )}

          </div>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%', width: '36px', height: '36px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
      >
        <X size={18} />
      </button>

      <style>{`
        @keyframes cardPop {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
