import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { INDIAN_STATES, REGION_COLORS } from '../data/states'
import { getStartupCountByState, getStartups, getPremiumCountByState } from '../lib/firebase'
import { STATE_PREMIUM_LIMIT } from '../data/premiumSlots'
import LegendaryCard from './LegendaryCard'
import indiaData from '../data/india_official.json'

// ─── NORMALIZE STATE NAME → ID ────────────────────────────────────────────────
const normalizeStateId = (stNm) => {
  if (!stNm) return null
  const n = stNm.toLowerCase().trim()
  if (n.includes('andaman')) return 'andaman-nicobar'
  if (n.includes('jammu')) return 'jammu-kashmir'
  if (n.includes('ladakh')) return 'ladakh'
  if (n.includes('arunachal')) return 'arunachal-pradesh'
  if (n.includes('andhra')) return 'andhra-pradesh'
  if (n.includes('himachal')) return 'himachal-pradesh'
  if (n.includes('madhya')) return 'madhya-pradesh'
  if (n.includes('uttar pradesh')) return 'uttar-pradesh'
  if (n.includes('uttarakhand')) return 'uttarakhand'
  if (n.includes('west bengal')) return 'west-bengal'
  if (n.includes('tamil')) return 'tamil-nadu'
  if (n.includes('dadra')) return 'dadra-nagar-haveli'
  if (n.includes('daman')) return 'daman-diu'
  if (n.includes('chandigarh')) return 'chandigarh'
  if (n.includes('lakshadweep')) return 'lakshadweep'
  if (n.includes('puducherry') || n.includes('pondicherry')) return 'puducherry'
  if (n.includes('nct of delhi') || n === 'delhi') return 'delhi'
  return n.replace(/\s+/g, '-').replace(/&/g, 'and').replace(/[^a-z0-9-]/g, '')
}

import { geoMercator, geoPath } from 'd3-geo'

// ─── D3 PROJECTION & PATH GENERATOR ───────────────────────────────────────────
// We use d3-geo to auto-scale and center the GeoJSON perfectly into the 640x670 viewBox
const projection = geoMercator().scale(1050).center([83.5, 23.5]).translate([320, 335])
const pathGenerator = geoPath().projection(projection)

// Convert a GeoJSON geometry to SVG path string
function geometryToPath(feature) {
  if (!feature) return ''
  return pathGenerator(feature) || ''
}

// Compute centroid from GeoJSON feature
function featureCentroid(feature) {
  if (!feature) return [320, 335]
  const c = pathGenerator.centroid(feature)
  if (!c || isNaN(c[0]) || isNaN(c[1])) return [320, 335]
  return c
}

// ─── SLOT LIMITS & CLUSTER OFFSETS ───────────────────────────────────────────
const STATE_LOGO_LIMIT = STATE_PREMIUM_LIMIT

const CLUSTER_OFFSETS = {
  1: [[0, 0]],
  2: [[-9, 0], [9, 0]],
  3: [[0, -10], [-9, 7], [9, 7]],
  4: [[-9, -8], [9, -8], [-9, 8], [9, 8]],
  5: [[0, -13], [-11, -4], [11, -4], [-8, 10], [8, 10]],
  6: [[0, 0], [0, -14], [12, -7], [12, 7], [0, 14], [-12, 7]],
  7: [[0, 0], [0, -14], [12, -7], [12, 7], [0, 14], [-12, 7], [-12, -7]],
  8: [[-13, -13], [0, -17], [13, -13], [17, 0], [13, 13], [0, 17], [-13, 13], [-17, 0]],
  9: [[0, 0], [0, -16], [14, -8], [14, 8], [0, 16], [-14, 8], [-14, -8], [8, -14], [-8, -14]],
  10: [[0, 0], [0, -16], [14, -8], [14, 8], [0, 16], [-14, 8], [-14, -8], [8, 14], [-8, 14], [0, -8]],
  11: [[-15, -15], [0, -20], [15, -15], [20, 0], [15, 15], [0, 20], [-15, 15], [-20, 0], [10, -10], [-10, -10], [0, 0]],
  12: [[-15, -15], [0, -20], [15, -15], [20, 0], [15, 15], [0, 20], [-15, 15], [-20, 0], [10, -10], [-10, -10], [10, 10], [-10, 10]],
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function IndiaMap({ onStateSelect }) {
  const navigate = useNavigate()
  const svgRef = useRef(null)
  const rafRef = useRef(null)

  const [statePaths, setStatePaths] = useState({})
  const [stateCentroids, setStateCentroids] = useState({})
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const [counts, setCounts] = useState({})
  const [premiumCounts, setPremiumCounts] = useState({})
  const [startups, setStartups] = useState([])
  const [tip, setTip] = useState({ show: false, x: 0, y: 0, state: null })
  const [logoTip, setLogoTip] = useState(null)
  const [selectedLegendary, setSelectedLegendary] = useState(null)

  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)

  const zTarget = useRef(1); const xTarget = useRef(0); const yTarget = useRef(0)
  const zCur = useRef(1); const xCur = useRef(0); const yCur = useRef(0)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })

  // ── Load everything ────────────────────────────────────────────────────────
  useEffect(() => {
    getStartupCountByState().then(setCounts).catch(() => { })
    getPremiumCountByState().then(setPremiumCounts).catch(() => { })
    getStartups().then(setStartups).catch(() => { })

    const paths = {}
    const centroids = {}
    if (indiaData && indiaData.features) {
      indiaData.features.forEach(feature => {
        const id = normalizeStateId(feature.properties?.ST_NM)
        if (!id) return
        paths[id] = geometryToPath(feature.geometry)
        centroids[id] = featureCentroid(feature)
      })
    }
    setStatePaths(paths)
    setStateCentroids(centroids)

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // ── Animation loop ─────────────────────────────────────────────────────────
  const runAnim = useCallback(() => {
    const EASE = 0.1
    const dz = (zTarget.current - zCur.current) * EASE
    const dx = (xTarget.current - xCur.current) * EASE
    const dy = (yTarget.current - yCur.current) * EASE
    zCur.current += dz; xCur.current += dx; yCur.current += dy
    setZoom(zCur.current); setPanX(xCur.current); setPanY(yCur.current)
    const still = Math.abs(dz) > 0.0003 || Math.abs(dx) > 0.03 || Math.abs(dy) > 0.03
    if (still) { rafRef.current = requestAnimationFrame(runAnim) }
    else {
      zCur.current = zTarget.current; xCur.current = xTarget.current; yCur.current = yTarget.current
      setZoom(zTarget.current); setPanX(xTarget.current); setPanY(yTarget.current)
    }
  }, [])

  const kickAnim = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(runAnim)
  }, [runAnim])

  const clampPan = (px, py, z) => {
    const maxX = (640 - 640 / z) / 2
    const maxY = (670 - 670 / z) / 2
    return [Math.max(-maxX, Math.min(maxX, px)), Math.max(-maxY, Math.min(maxY, py))]
  }

  // ── Wheel zoom ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return
    const onWheel = (e) => {
      e.preventDefault()
      const newZ = Math.max(1, Math.min(16, zTarget.current + (e.deltaY > 0 ? -0.11 : 0.11)))
      if (newZ === zTarget.current) return
      const rect = svg.getBoundingClientRect()
      const mxPct = (e.clientX - rect.left) / rect.width
      const myPct = (e.clientY - rect.top) / rect.height
      const vbW0 = 640 / zTarget.current; const vbH0 = 670 / zTarget.current
      const vbX0 = (640 - vbW0) / 2 + xTarget.current
      const vbY0 = (670 - vbH0) / 2 + yTarget.current
      const svgMX = vbX0 + mxPct * vbW0; const svgMY = vbY0 + myPct * vbH0
      const vbW1 = 640 / newZ; const vbH1 = 670 / newZ
      const [cpx, cpy] = clampPan(
        svgMX - mxPct * vbW1 - (640 - vbW1) / 2,
        svgMY - myPct * vbH1 - (670 - vbH1) / 2, newZ)
      zTarget.current = newZ; xTarget.current = cpx; yTarget.current = cpy
      kickAnim()
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [kickAnim])

  // ── Drag ───────────────────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    if (zTarget.current <= 1) return
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, px: xTarget.current, py: yTarget.current }
  }
  const onMouseMove = (e) => {
    if (!dragging.current) return
    const rect = svgRef.current?.getBoundingClientRect(); if (!rect) return
    const svgPxW = rect.width / (640 / zCur.current)
    const svgPxH = rect.height / (670 / zCur.current)
    const [cpx, cpy] = clampPan(
      dragStart.current.px - (e.clientX - dragStart.current.x) / svgPxW,
      dragStart.current.py - (e.clientY - dragStart.current.y) / svgPxH,
      zTarget.current)
    xTarget.current = cpx; yTarget.current = cpy; kickAnim()
  }
  const onMouseUp = () => { dragging.current = false }
  const onDblClick = (e) => {
    e.stopPropagation()
    zTarget.current = 1; xTarget.current = 0; yTarget.current = 0; kickAnim()
  }
  const adjustZoom = (delta) => {
    const newZ = Math.max(1, Math.min(16, zTarget.current + delta))
    const [cpx, cpy] = clampPan(xTarget.current, yTarget.current, newZ)
    zTarget.current = newZ; xTarget.current = cpx; yTarget.current = cpy; kickAnim()
  }

  // ── ViewBox ────────────────────────────────────────────────────────────────
  const vbW = 640 / zoom; const vbH = 670 / zoom
  const vbX = (640 - vbW) / 2 + panX; const vbY = (670 - vbH) / 2 + panY
  const viewBox = `${vbX.toFixed(3)} ${vbY.toFixed(3)} ${vbW.toFixed(3)} ${vbH.toFixed(3)}`
  const logoScale = 1 / zoom
  const BASIC_ZOOM_THRESHOLD = 2.5

  // ── Group logos by state ───────────────────────────────────────────────────
  const logosByState = {}
    ;[...startups]
      .sort((a, b) => ({ enterprise: 0, premium: 1, basic: 2 }[a.plan] ?? 9) - ({ enterprise: 0, premium: 1, basic: 2 }[b.plan] ?? 9))
      .filter(s => {
        if (!s.is_premium && s.plan !== 'enterprise') return zoom >= BASIC_ZOOM_THRESHOLD
        return s.is_premium
      })
      .forEach(s => {
        const st = INDIAN_STATES.find(x => x.name === s.state)
        if (!st) return
        if (!logosByState[st.id]) logosByState[st.id] = []
        const limit = STATE_LOGO_LIMIT[st.id] || 1
        if (logosByState[st.id].length < limit) logosByState[st.id].push(s)
      })

  const handleStateClick = (state) => {
    if (dragging.current) return
    setSelected(state.id); onStateSelect?.(state)
    navigate(`/state/${state.id}`)
  }

  const getFill = (state) => {
    const c = REGION_COLORS[state.region] || REGION_COLORS.north
    if (selected === state.id) return c.active
    if (hovered === state.id) return c.hover
    return c.fill
  }

  // ── Render one state ───────────────────────────────────────────────────────
  const renderStatePath = (state) => {
    const d = statePaths[state.id]
    if (!d) return null
    const isSel = selected === state.id
    const count = counts[state.name] || 0
    const hasLogo = logosByState[state.id]?.length > 0
    const fill = getFill(state)
    const stroke = 'rgba(99,179,255,0.25)'
    const sw = isSel ? 1.5 : 0.8
    const scx = stateCentroids[state.id]?.[0] ?? state.cx
    const scy = stateCentroids[state.id]?.[1] ?? state.cy

    const handlers = {
      onClick: () => handleStateClick(state),
      onMouseEnter: (e) => {
        setHovered(state.id)
        const r = e.currentTarget.closest('svg').getBoundingClientRect()
        setTip({ show: true, x: e.clientX - r.left, y: e.clientY - r.top, state })
      },
      onMouseLeave: () => { setHovered(null); setTip({ show: false }) },
      onMouseMove: (e) => {
        const r = e.currentTarget.closest('svg').getBoundingClientRect()
        setTip(t => ({ ...t, x: e.clientX - r.left, y: e.clientY - r.top }))
      },
    }

    return (
      <g key={state.id} {...handlers}>
        <path d={d} fill={fill} stroke={stroke} strokeWidth={sw}
          className="india-state"
          style={{ filter: isSel ? 'url(#sglow)' : 'none', cursor: 'pointer', pointerEvents: 'all' }}
        />
        {!hasLogo && (
          <>
            <circle cx={scx} cy={scy}
              r={(isSel ? 5 : count > 0 ? 4 : 2.5) * logoScale}
              fill={isSel ? '#63B3FF' : count > 0 ? '#F6C90E' : 'rgba(99,179,255,0.35)'}
              stroke={isSel ? 'rgba(255,255,255,0.8)' : 'transparent'}
              strokeWidth={1.5 * logoScale} style={{ cursor: 'pointer', pointerEvents: 'all' }}
            />
            {count > 0 && (
              <text x={scx + 7 * logoScale} y={scy - 4 * logoScale}
                fontSize={7 * logoScale} fill="#F6C90E"
                fontFamily="DM Sans,sans-serif" fontWeight="700"
                style={{ pointerEvents: 'none' }}>
                {count}
              </text>
            )}
          </>
        )}
      </g>
    )
  }

  return (
    <div className="relative w-full select-none">

      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1.5">
        <div className="flex flex-col gap-1">
          {[{ label: '+', d: 0.5 }, { label: '−', d: -0.5 }].map(b => (
            <button key={b.label} onClick={() => adjustZoom(b.d)}
              className="w-6 h-6 rounded-md bg-[#0D1525]/90 border border-white/10 text-white/60 hover:text-white hover:border-blue-400/40 transition-all text-sm font-bold leading-none flex items-center justify-center">
              {b.label}
            </button>
          ))}
        </div>
        {zoom > 1.05 && (
          <button onClick={onDblClick}
            className="text-[9px] text-blue-400/60 hover:text-blue-400 border border-blue-400/20 hover:border-blue-400/50 px-2 py-0.5 rounded transition-all bg-[#0D1525]/80">
            Reset
          </button>
        )}
        <span className="text-[8px] text-white/20 text-right leading-tight pointer-events-none">
          Scroll · Drag · Dbl-click
        </span>
      </div>

      <svg ref={svgRef} viewBox={viewBox} className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onDoubleClick={onDblClick}
        style={{ cursor: dragging.current ? 'grabbing' : zoom > 1.05 ? 'grab' : 'default' }}>

        <defs>
          <filter id="sglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="lglow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── STATE PATHS ── */}
        {INDIAN_STATES.map(state => renderStatePath(state))}

        {/* ── LOGOS ── */}
        {INDIAN_STATES.map(state => {
          const logos = logosByState[state.id]; if (!logos?.length) return null
          const n = logos.length
          const offsets = CLUSTER_OFFSETS[Math.min(n, 12)] || CLUSTER_OFFSETS[1]
          const baseCx = stateCentroids[state.id]?.[0] ?? state.cx
          const baseCy = stateCentroids[state.id]?.[1] ?? state.cy

          return logos.map((startup, idx) => {
            const [ox, oy] = offsets[idx] || [0, 0]
            const cx = baseCx + ox; const cy = baseCy + oy
            const isBasic = startup.plan === 'basic'
            const isEnt = startup.plan === 'enterprise'
            const baseR = isEnt ? 8.5 : isBasic ? 5 : 7
            const r = baseR * logoScale
            const bg = startup.brand_color || '#3B7DD8'
            const init = startup.company_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
            const isHov = logoTip?.id === startup.id

            return (
              <g key={startup.id} style={{ cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); navigate(`/startup/${startup.id}`) }}
                onMouseEnter={e => {
                  const rect = e.currentTarget.closest('svg').getBoundingClientRect()
                  setLogoTip({ id: startup.id, name: startup.company_name, x: e.clientX - rect.left, y: e.clientY - rect.top })
                  setTip({ show: false })
                }}
                onMouseLeave={() => setLogoTip(null)}>
                <circle cx={cx} cy={cy} r={r * 1.55} fill={bg}
                  opacity={isHov ? 0.28 : 0.12}
                  style={{ filter: 'url(#lglow)', pointerEvents: 'none' }} />
                <circle cx={cx} cy={cy} r={r} fill={bg}
                  stroke={isEnt ? '#FFD700' : isBasic ? 'rgba(150,150,150,0.6)' : isHov ? '#F6C90E' : 'rgba(255,215,0,0.45)'}
                  strokeWidth={(isEnt ? 1.1 : 0.7) * logoScale} />
                {startup.logo_url
                  ? <image href={startup.logo_url} x={cx - r * 0.82} y={cy - r * 0.82}
                    width={r * 1.64} height={r * 1.64} preserveAspectRatio="xMidYMid meet"
                    style={{ pointerEvents: 'none' }} />
                  : <text x={cx} y={cy + r * 0.36} textAnchor="middle"
                    fontSize={r * 0.75} fill="white" fontFamily="DM Sans,sans-serif" fontWeight="800"
                    style={{ pointerEvents: 'none' }}>{init}</text>
                }
                {!isBasic && (
                  <>
                    <circle cx={cx + r * 0.68} cy={cy - r * 0.68} r={r * 0.34}
                      fill={isEnt ? '#FFD700' : '#F6C90E'} stroke="#0A0E1A"
                      strokeWidth={0.35 * logoScale} style={{ pointerEvents: 'none' }} />
                    <text x={cx + r * 0.68} y={cy - r * 0.68 + r * 0.13} textAnchor="middle"
                      fontSize={r * 0.46} fill="#000" fontFamily="DM Sans" fontWeight="900"
                      style={{ pointerEvents: 'none' }}>
                      {isEnt ? '👑' : '★'}
                    </text>
                  </>
                )}
              </g>
            )
          })
        })}

        {/* ── STATE TOOLTIP ── */}
        {tip.show && tip.state && (() => {
          const rect = svgRef.current?.getBoundingClientRect(); if (!rect) return null
          const sx = vbX + (tip.x / rect.width) * vbW
          const sy = vbY + (tip.y / rect.height) * vbH
          const s = logoScale
          const limit = STATE_LOGO_LIMIT[tip.state.id] || 1
          const usedPremium = premiumCounts[tip.state.name] || 0
          const slotsLeft = Math.max(0, limit - usedPremium)
          const isFull = slotsLeft === 0
          const tw = 136 * s, th = 46 * s
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={sx - tw / 2} y={sy - th - 8 * s} width={tw} height={th} rx={5 * s}
                fill="rgba(13,21,37,0.97)"
                stroke={isFull ? 'rgba(226,55,68,0.5)' : 'rgba(99,179,255,0.3)'}
                strokeWidth={0.7 * s} />
              <text x={sx} y={sy - th + 11 * s} textAnchor="middle" fontSize={9.5 * s}
                fill="#E8EAF0" fontFamily="DM Sans,sans-serif" fontWeight="700">
                {tip.state.name}
              </text>
              <text x={sx} y={sy - th + 22 * s} textAnchor="middle" fontSize={7.5 * s}
                fill="rgba(232,234,240,0.45)" fontFamily="DM Sans,sans-serif">
                {counts[tip.state.name]
                  ? `${counts[tip.state.name]} startup${counts[tip.state.name] > 1 ? 's' : ''} listed`
                  : 'No startups yet · be first!'}
              </text>
              <text x={sx} y={sy - th + 33 * s} textAnchor="middle" fontSize={7.5 * s}
                fill={isFull ? 'rgba(226,55,68,0.9)' : 'rgba(246,201,14,0.9)'}
                fontFamily="DM Sans,sans-serif" fontWeight="700">
                {isFull ? `⛔ Map slots full (${limit}/${limit})` : `⭐ ${slotsLeft} of ${limit} premium slots left`}
              </text>
              <text x={sx} y={sy - 10 * s} textAnchor="middle" fontSize={6.5 * s}
                fill="rgba(99,179,255,0.5)" fontFamily="DM Sans,sans-serif">
                Click to explore →
              </text>
            </g>
          )
        })()}

        {/* ── LOGO TOOLTIP ── */}
        {logoTip && (() => {
          const rect = svgRef.current?.getBoundingClientRect(); if (!rect) return null
          const sx = vbX + (logoTip.x / rect.width) * vbW
          const sy = vbY + (logoTip.y / rect.height) * vbH
          const s = logoScale; const tw = 106 * s, th = 26 * s
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={sx - tw / 2} y={sy - th - 8 * s} width={tw} height={th} rx={5 * s}
                fill="rgba(13,21,37,0.97)" stroke="rgba(246,201,14,0.5)" strokeWidth={0.7 * s} />
              <text x={sx} y={sy - th + 9 * s} textAnchor="middle" fontSize={9 * s}
                fill="#F6C90E" fontFamily="DM Sans,sans-serif" fontWeight="700">
                {logoTip.name?.slice(0, 18)}
              </text>
              <text x={sx} y={sy - 12 * s} textAnchor="middle" fontSize={7.5 * s}
                fill="rgba(232,234,240,0.4)" fontFamily="DM Sans,sans-serif">
                Click to visit ↗
              </text>
            </g>
          )
        })()}
      </svg>

      {/* ── LEGEND ── */}
      <div className="absolute bottom-2 left-2 flex flex-col gap-1 text-[9px] text-white/35">
        {[
          { color: 'rgba(99,179,255,0.5)', label: 'Click to explore' },
          { color: '#F6C90E', label: 'Has startups' },
          { color: '#63B3FF', label: 'Selected' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.color }} />
            <span>{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-0.5 pt-1 border-t border-white/10">
          <div className="w-3 h-3 rounded-full bg-blue-500 border border-yellow-400 flex-shrink-0" />
          <span className="text-yellow-400/80">Premium · click to visit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border border-yellow-300 flex items-center justify-center flex-shrink-0 text-[6px]">👑</div>
          <span className="text-yellow-300/80">Enterprise · Profile Card</span>
        </div>
        {zoom >= 2.5 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-400/60 flex-shrink-0" />
            <span className="text-white/40">Basic listings</span>
          </div>
        )}
      </div>

      {selectedLegendary && (
        <LegendaryCard startup={selectedLegendary} onClose={() => setSelectedLegendary(null)} />
      )}
    </div>
  )
}
