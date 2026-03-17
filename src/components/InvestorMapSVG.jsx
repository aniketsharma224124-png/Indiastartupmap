import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { INDIAN_STATES } from '../data/states'
import { getInvestors } from '../lib/investorDb'
import { INVESTORS_BY_STATE } from '../data/investors'
import { STATE_PREMIUM_LIMIT } from '../data/premiumSlots'
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
const projection = geoMercator().scale(1050).center([83.5, 23.5]).translate([320, 335])
const pathGenerator = geoPath().projection(projection)

function geometryToPath(feature) {
  if (!feature) return ''
  return pathGenerator(feature) || ''
}

function featureCentroid(feature) {
  if (!feature) return [320, 335]
  const c = pathGenerator.centroid(feature)
  if (!c || isNaN(c[0]) || isNaN(c[1])) return [320, 335]
  return c
}

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

export default function InvestorMapSVG({ onStateSelect, selectedStateId }) {
  const navigate = useNavigate()
  const svgRef = useRef(null)
  const rafRef = useRef(null)

  const [statePaths, setStatePaths] = useState({})
  const [stateCentroids, setStateCentroids] = useState({})
  const [hovered, setHovered] = useState(null)
  const [counts, setCounts] = useState({})
  const [investors, setInvestors] = useState([])
  const [tip, setTip] = useState({ show: false, x: 0, y: 0, state: null })
  const [logoTip, setLogoTip] = useState(null)

  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)

  const zTarget = useRef(1); const xTarget = useRef(0); const yTarget = useRef(0)
  const zCur = useRef(1); const xCur = useRef(0); const yCur = useRef(0)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })

  // Universal state resolver — handles all DB field formats
  const resolveState = useCallback((inv) => {
    // Try state_id: could be slug "telangana" or display name "Telangana"
    if (inv.state_id) {
      const byId = INDIAN_STATES.find(x => x.id === inv.state_id)
      if (byId) return byId
      const byName = INDIAN_STATES.find(x => x.name === inv.state_id)
      if (byName) return byName
      const byNorm = INDIAN_STATES.find(x => x.id === normalizeStateId(inv.state_id))
      if (byNorm) return byNorm
    }
    // Try state field (display name like "Telangana")
    if (inv.state) {
      const byName = INDIAN_STATES.find(x => x.name === inv.state)
      if (byName) return byName
      const byNorm = INDIAN_STATES.find(x => x.id === normalizeStateId(inv.state))
      if (byNorm) return byNorm
    }
    // Fallback: check local mock data
    const sid = Object.keys(INVESTORS_BY_STATE).find(k => INVESTORS_BY_STATE[k].some(i => i.id === inv.id))
    if (sid) return INDIAN_STATES.find(x => x.id === sid) || null
    return null
  }, [])

  useEffect(() => {
    // Build local investors with state_id injected from the key
    const localInvestors = []
    Object.entries(INVESTORS_BY_STATE).forEach(([stateId, arr]) => {
      arr.forEach(inv => localInvestors.push({ ...inv, state_id: inv.state_id || stateId }))
    })

    // Fetch DB investors and merge with local (deduped by id)
    getInvestors().then(dbInvestors => {
      console.log('[InvestorMap] DB returned', dbInvestors.length, 'investors')
      
      // Merge: DB takes priority, then add local mock entries not in DB
      const byId = new Map()
      dbInvestors.forEach(inv => byId.set(inv.id, inv))
      localInvestors.forEach(inv => { if (!byId.has(inv.id)) byId.set(inv.id, inv) })
      
      const merged = [...byId.values()]
      console.log('[InvestorMap] Merged total:', merged.length)
      setInvestors(merged)

      // Derive counts using the universal resolver
      const c = {}
      merged.forEach(i => {
        const st = resolveState(i)
        if (st) c[st.id] = (c[st.id] || 0) + 1
      })
      console.log('[InvestorMap] Counts:', JSON.stringify(c))
      setCounts(c)
    }).catch(err => {
      console.warn('[InvestorMap] DB fetch failed, using local mock:', err)
      setInvestors(localInvestors)
      const c = {}
      localInvestors.forEach(i => {
        const st = resolveState(i)
        if (st) c[st.id] = (c[st.id] || 0) + 1
      })
      setCounts(c)
    })

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
  }, [resolveState])

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

  const vbW = 640 / zoom; const vbH = 670 / zoom
  const vbX = (640 - vbW) / 2 + panX; const vbY = (670 - vbH) / 2 + panY
  const viewBox = `${vbX.toFixed(3)} ${vbY.toFixed(3)} ${vbW.toFixed(3)} ${vbH.toFixed(3)}`
  const logoScale = 1 / zoom
  const BASIC_ZOOM_THRESHOLD = 2.5

  const logosByState = {}
  const seenIds = new Set()
  ;[...investors]
    .sort((a, b) => { 
      const rank = { partner_elite: 0, scout_pro: 1, angel: 2, lead: 2, basic: 2 }
      return (rank[a.plan] ?? 9) - (rank[b.plan] ?? 9) 
    })
    .filter(inv => {
      const isPremium = inv.plan === 'partner_elite' || inv.plan === 'scout_pro'
      if (!isPremium) return zoom >= BASIC_ZOOM_THRESHOLD
      return true
    })
    .forEach(inv => {
      if (seenIds.has(inv.id)) return
      seenIds.add(inv.id)

      const st = resolveState(inv)
      if (!st) return
      
      if (!logosByState[st.id]) logosByState[st.id] = []
      const limit = STATE_PREMIUM_LIMIT[st.id] || 1
      if (logosByState[st.id].length < limit) logosByState[st.id].push(inv)
    })

  const handleStateClick = (state) => {
    if (dragging.current) return
    onStateSelect?.(state)
  }

  const renderStatePath = (state) => {
    const d = statePaths[state.id]
    if (!d) return null
    
    const isSel = state.id === selectedStateId
    const count = counts[state.id] || counts[state.name] || 0
    const hasLogo = logosByState[state.id]?.length > 0
    
    const fill = isSel ? '#4a3070' : hovered === state.id ? '#352554' : count > 0 ? '#261b3d' : '#1e1c26'
    const stroke = isSel ? 'rgba(180,120,255,1.0)' : hovered === state.id ? 'rgba(180,120,255,0.8)' : count > 0 ? 'rgba(170,110,255,0.5)' : 'rgba(150,100,255,0.3)'
    const sw = isSel ? 1.5 : 0.6
    
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
          style={{ filter: isSel ? 'url(#inv-sglow)' : 'none', cursor: 'pointer', pointerEvents: 'all' }}
        />
        {!hasLogo && (
          <>
            <circle cx={scx} cy={scy}
              r={(isSel ? 5 : count > 0 ? 4 : 2.5) * logoScale}
              fill={isSel ? '#c084fc' : count > 0 ? '#9B6FFF' : 'rgba(155,111,255,0.35)'}
              stroke={isSel ? 'rgba(255,255,255,0.8)' : 'transparent'}
              strokeWidth={1.5 * logoScale} style={{ cursor: 'pointer', pointerEvents: 'all' }}
            />
            {count > 0 && (
              <text x={scx + 7 * logoScale} y={scy - 4 * logoScale}
                fontSize={7 * logoScale} fill="#9B6FFF"
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
              className="w-6 h-6 rounded-md bg-[#1c1a26]/90 border border-white/10 text-white/60 hover:text-white hover:border-purple-400/40 transition-all text-sm font-bold leading-none flex items-center justify-center">
              {b.label}
            </button>
          ))}
        </div>
        {zoom > 1.05 && (
          <button onClick={onDblClick}
            className="text-[9px] text-purple-400/60 hover:text-purple-400 border border-purple-400/20 hover:border-purple-400/50 px-2 py-0.5 rounded transition-all bg-[#1c1a26]/80">
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
          <filter id="inv-sglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="inv-lglow" x="-80%" y="-80%" width="260%" height="260%">
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

          return logos.map((inv, idx) => {
            const [ox, oy] = offsets[idx] || [ 24 * Math.cos(idx * 2.4), 24 * Math.sin(idx * 2.4) ]
            const cx = baseCx + ox; const cy = baseCy + oy
            const isBasic = !(inv.plan === 'partner_elite' || inv.plan === 'scout_pro')
            const isElite = inv.plan === 'partner_elite'
            const baseR = isElite ? 6.5 : isBasic ? 3.5 : 5
            const r = baseR * logoScale
            const bg = inv.brand_color || '#9B6FFF'
            const init = (inv.firm_name || inv.partner_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
            const isHov = logoTip?.id === inv.id

            return (
              <g key={inv.id} style={{ cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); if (!dragging.current) navigate(`/investor/${inv.id}`) }}
                onMouseEnter={e => {
                  const rect = e.currentTarget.closest('svg').getBoundingClientRect()
                  setLogoTip({ id: inv.id, name: inv.firm_name || inv.partner_name, x: e.clientX - rect.left, y: e.clientY - rect.top })
                  setTip({ show: false })
                }}
                onMouseLeave={() => setLogoTip(null)}>
                <circle cx={cx} cy={cy} r={r * 1.55} fill={bg}
                  opacity={isHov ? 0.28 : 0.12}
                  style={{ filter: 'url(#inv-lglow)', pointerEvents: 'none' }} />
                <circle cx={cx} cy={cy} r={r} fill={bg}
                  stroke={isElite ? '#F6C90E' : isBasic ? 'rgba(150,150,150,0.6)' : isHov ? 'rgba(155,111,255,0.9)' : 'rgba(155,111,255,0.45)'}
                  strokeWidth={(isElite ? 1.1 : 0.7) * logoScale} />
                {inv.logo_url
                  ? <image href={inv.logo_url} x={cx - r * 0.82} y={cy - r * 0.82}
                    width={r * 1.64} height={r * 1.64} preserveAspectRatio="xMidYMid meet"
                    style={{ pointerEvents: 'none' }} />
                  : <text x={cx} y={cy + r * 0.36} textAnchor="middle"
                    fontSize={r * 0.75} fill="white" fontFamily="DM Sans,sans-serif" fontWeight="800"
                    style={{ pointerEvents: 'none' }}>{init}</text>
                }
                
                {!isBasic && (
                  <>
                    <circle cx={cx + r * 0.68} cy={cy - r * 0.68} r={r * 0.34}
                      fill={isElite ? '#F6C90E' : 'rgba(155,111,255,0.7)'} stroke="#0A0E1A"
                      strokeWidth={0.35 * logoScale} style={{ pointerEvents: 'none' }} />
                    <text x={cx + r * 0.68} y={cy - r * 0.68 + r * 0.13} textAnchor="middle"
                      fontSize={r * 0.46} fill="#000" fontFamily="DM Sans" fontWeight="900"
                      style={{ pointerEvents: 'none' }}>
                      {isElite ? '★' : '·'}
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
          const tw = 136 * s, th = 36 * s
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={sx - tw / 2} y={sy - th - 8 * s} width={tw} height={th} rx={5 * s}
                fill="rgba(28,26,38,0.97)"
                stroke="rgba(170,110,255,0.4)"
                strokeWidth={0.7 * s} />
              <text x={sx} y={sy - th + 13 * s} textAnchor="middle" fontSize={9.5 * s}
                fill="#E8EAF0" fontFamily="DM Sans,sans-serif" fontWeight="700">
                {tip.state.name}
              </text>
              <text x={sx} y={sy - th + 25 * s} textAnchor="middle" fontSize={7.5 * s}
                fill="rgba(232,234,240,0.45)" fontFamily="DM Sans,sans-serif">
                {(() => {
                  const c = counts[tip.state.id] || counts[tip.state.name] || 0
                  return c > 0
                    ? `${c} investor${c > 1 ? 's' : ''} listed`
                    : 'No investors yet · be first!'
                })()}
              </text>
              <text x={sx} y={sy - 10 * s} textAnchor="middle" fontSize={6.5 * s}
                fill="rgba(155,111,255,0.5)" fontFamily="DM Sans,sans-serif">
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
                fill="rgba(28,26,38,0.97)" stroke="rgba(170,110,255,0.6)" strokeWidth={0.7 * s} />
              <text x={sx} y={sy - th + 9 * s} textAnchor="middle" fontSize={9 * s}
                fill="#c084fc" fontFamily="DM Sans,sans-serif" fontWeight="700">
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
          { color: 'rgba(155,111,255,0.5)', label: 'Click to explore' },
          { color: '#9B6FFF', label: 'Has investors' },
          { color: '#c084fc', label: 'Selected' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.color }} />
            <span>{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-0.5 pt-1 border-t border-white/10">
          <div className="w-3 h-3 rounded-full bg-purple-500 border border-yellow-400 flex-shrink-0" />
          <span className="text-yellow-400/80">Partner Elite · click to explore</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500 border border-purple-400/50 flex-shrink-0 flex items-center justify-center text-[6px]">·</div>
          <span className="text-purple-300/80">Scout Pro</span>
        </div>
        {zoom >= 2.5 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-400/60 flex-shrink-0" />
            <span className="text-white/40">Basic listings</span>
          </div>
        )}
      </div>
    </div>
  )
}
