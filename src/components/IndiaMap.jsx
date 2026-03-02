import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { INDIAN_STATES, REGION_COLORS } from '../data/states'
import { getStartupCountByState, getStartups, getPremiumCountByState } from '../lib/firebase'
import { STATE_PREMIUM_LIMIT } from '../data/premiumSlots'
import LegendaryCard from './LegendaryCard'

// ─── STATE PATHS ──────────────────────────────────────────────────────────────
const STATE_PATHS = {
  'jammu-kashmir':     'M 215 45 L 255 35 L 290 50 L 300 75 L 280 95 L 255 100 L 225 90 L 205 70 Z',
  'ladakh':            'M 255 35 L 320 18 L 350 48 L 332 78 L 300 75 L 290 50 Z',
  'himachal-pradesh':  'M 255 100 L 295 93 L 308 115 L 297 138 L 270 145 L 250 132 L 245 112 Z',
  'punjab':            'M 215 88 L 255 100 L 250 132 L 228 140 L 208 130 L 204 108 Z',
  'uttarakhand':       'M 270 145 L 308 135 L 322 155 L 312 178 L 286 180 L 265 166 Z',
  'haryana':           'M 208 130 L 250 132 L 260 152 L 250 172 L 224 176 L 204 164 L 200 145 Z',
  'delhi':             'M 250 165 L 270 160 L 274 176 L 255 181 L 247 172 Z',
  'uttar-pradesh':     'M 260 152 L 322 155 L 368 165 L 378 196 L 358 226 L 322 242 L 280 246 L 250 236 L 240 210 L 255 186 L 260 170 Z',
  'rajasthan':         'M 152 158 L 208 145 L 224 176 L 260 176 L 260 216 L 244 262 L 214 286 L 174 296 L 138 270 L 128 234 L 133 195 Z',
  'bihar':             'M 358 226 L 402 216 L 422 236 L 416 266 L 386 280 L 356 276 L 335 256 L 340 236 Z',
  'west-bengal':       'M 416 234 L 452 224 L 468 246 L 462 292 L 446 316 L 420 320 L 400 300 L 394 270 L 410 250 Z',
  'sikkim':            'M 448 194 L 467 189 L 472 206 L 459 216 L 444 209 Z',
  'arunachal-pradesh': 'M 470 175 L 542 164 L 568 186 L 562 212 L 522 219 L 480 216 L 464 200 Z',
  'assam':             'M 470 216 L 522 219 L 542 231 L 537 252 L 506 259 L 474 253 L 459 238 Z',
  'nagaland':          'M 537 229 L 562 226 L 570 243 L 556 256 L 535 251 L 530 239 Z',
  'manipur':           'M 538 253 L 560 249 L 567 269 L 556 283 L 537 281 L 527 266 Z',
  'mizoram':           'M 520 271 L 542 266 L 550 287 L 541 302 L 520 302 L 512 286 Z',
  'tripura':           'M 505 261 L 523 256 L 526 276 L 516 286 L 500 283 L 497 269 Z',
  'meghalaya':         'M 460 249 L 502 245 L 510 259 L 499 271 L 462 269 L 454 256 Z',
  'jharkhand':         'M 385 276 L 422 269 L 437 291 L 432 321 L 406 336 L 380 329 L 364 309 L 368 286 Z',
  'odisha':            'M 380 329 L 406 336 L 437 326 L 452 347 L 447 387 L 416 407 L 385 401 L 359 381 L 354 351 L 368 331 Z',
  'chhattisgarh':      'M 304 286 L 356 276 L 372 296 L 377 337 L 361 372 L 330 383 L 299 376 L 281 350 L 284 316 Z',
  'madhya-pradesh':    'M 214 286 L 280 271 L 310 281 L 320 306 L 316 341 L 290 362 L 254 369 L 219 356 L 189 330 L 184 306 L 200 290 Z',
  'gujarat':           'M 123 230 L 160 219 L 200 224 L 216 251 L 215 286 L 194 311 L 169 326 L 138 321 L 109 300 L 099 274 L 104 250 Z',
  'maharashtra':       'M 189 330 L 256 336 L 286 316 L 291 362 L 275 396 L 254 422 L 219 436 L 184 431 L 163 411 L 153 385 L 159 356 Z',
  'goa':               'M 194 461 L 216 456 L 226 471 L 215 484 L 194 483 L 187 471 Z',
  'karnataka':         'M 219 436 L 260 426 L 292 436 L 302 467 L 296 502 L 270 522 L 239 526 L 209 511 L 193 486 L 196 463 L 209 447 Z',
  'andhra-pradesh':    'M 292 436 L 337 426 L 378 442 L 392 472 L 381 511 L 356 527 L 315 531 L 289 516 L 277 491 L 279 461 Z',
  'telangana':         'M 284 391 L 331 383 L 362 391 L 377 417 L 371 441 L 336 449 L 300 446 L 277 426 L 277 406 Z',
  'tamil-nadu':        'M 254 526 L 300 521 L 336 526 L 362 552 L 356 587 L 330 612 L 299 622 L 268 611 L 247 591 L 239 561 L 244 536 Z',
  'kerala':            'M 224 526 L 254 526 L 247 561 L 239 597 L 229 616 L 209 611 L 199 591 L 199 561 L 209 536 Z',
  'puducherry':        'M 314 546 L 329 543 L 333 556 L 321 559 L 311 553 Z',
}

// ─── INTELLIGENT PREMIUM SLOT LIMITS ─────────────────────────────────────────
// Calculated from each state's approximate SVG polygon area.
// Extra-large (Rajasthan ~7700px², MP ~6200px²) → 5 slots
// Large (Maharashtra, UP, Gujarat, Karnataka etc.) → 3-4 slots
// Medium → 2 slots
// Small/narrow (Punjab, Haryana, NE states) → 1 slot
// Tiny UTs (Goa, Delhi, Puducherry, Sikkim) → 1 slot
// Use shared premium slot limits (same data used by StatePage + ListingForm)
const STATE_LOGO_LIMIT = STATE_PREMIUM_LIMIT

// ─── LOGO CLUSTER OFFSETS ─────────────────────────────────────────────────────
// Supports up to 12 logos per state.
// Offsets are in fixed SVG units — logos scale DOWN on zoom via logoScale,
// so spacing always looks clean regardless of zoom level.
// Layout philosophy: concentric rings — 1 center, ring of 6, outer ring of 5+
const CLUSTER_OFFSETS = {
  1:  [[0, 0]],
  2:  [[-9, 0],    [9, 0]],
  3:  [[0, -10],   [-9, 7],    [9, 7]],
  4:  [[-9, -8],   [9, -8],    [-9, 8],   [9, 8]],
  5:  [[0, -13],   [-11, -4],  [11, -4],  [-8, 10],  [8, 10]],
  6:  [[0, 0],     [0, -14],   [12, -7],  [12, 7],   [0, 14],   [-12, 7]],
  7:  [[0, 0],     [0, -14],   [12, -7],  [12, 7],   [0, 14],   [-12, 7],  [-12, -7]],
  8:  [[-13, -13], [0, -17],   [13, -13], [17, 0],   [13, 13],  [0, 17],   [-13, 13], [-17, 0]],
  9:  [[0, 0],     [0, -16],   [14, -8],  [14, 8],   [0, 16],   [-14, 8],  [-14, -8], [8, -14],  [-8, -14]],
  10: [[0, 0],     [0, -16],   [14, -8],  [14, 8],   [0, 16],   [-14, 8],  [-14, -8], [8, 14],   [-8, 14],  [0, -8]],
  11: [[-15, -15], [0, -20],   [15, -15], [20, 0],   [15, 15],  [0, 20],   [-15, 15], [-20, 0],  [10, -10], [-10, -10], [0, 0]],
  12: [[-15, -15], [0, -20],   [15, -15], [20, 0],   [15, 15],  [0, 20],   [-15, 15], [-20, 0],  [10, -10], [-10, -10], [10, 10], [-10, 10]],
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function IndiaMap({ onStateSelect }) {
  const navigate = useNavigate()
  const svgRef   = useRef(null)
  const rafRef   = useRef(null)

  const [hovered,           setHovered]           = useState(null)
  const [selected,          setSelected]          = useState(null)
  const [counts,            setCounts]            = useState({})
  const [premiumCounts,     setPremiumCounts]     = useState({})
  const [startups,          setStartups]          = useState([])
  const [tip,               setTip]               = useState({ show: false, x: 0, y: 0, state: null })
  const [logoTip,           setLogoTip]           = useState(null)
  const [selectedLegendary, setSelectedLegendary] = useState(null)

  // Rendered zoom/pan (driven by animation loop)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)

  // Targets (updated instantly, rendered values chase them)
  const zTarget = useRef(1)
  const xTarget = useRef(0)
  const yTarget = useRef(0)
  // Current animated values (refs so RAF closure always has latest)
  const zCur = useRef(1)
  const xCur = useRef(0)
  const yCur = useRef(0)

  // Drag state
  const dragging  = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })

  useEffect(() => {
    getStartupCountByState().then(setCounts).catch(() => {})
    getPremiumCountByState().then(setPremiumCounts).catch(() => {})
    getStartups().then(setStartups).catch(() => {})
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // ── Animation loop ─────────────────────────────────────────────────────────
  const runAnim = useCallback(() => {
    const EASE = 0.1
    const dz = (zTarget.current - zCur.current) * EASE
    const dx = (xTarget.current - xCur.current) * EASE
    const dy = (yTarget.current - yCur.current) * EASE

    zCur.current += dz
    xCur.current += dx
    yCur.current += dy

    setZoom(zCur.current)
    setPanX(xCur.current)
    setPanY(yCur.current)

    const stillMoving =
      Math.abs(dz) > 0.0003 ||
      Math.abs(dx) > 0.03   ||
      Math.abs(dy) > 0.03

    if (stillMoving) {
      rafRef.current = requestAnimationFrame(runAnim)
    } else {
      // Snap to exact target
      zCur.current = zTarget.current
      xCur.current = xTarget.current
      yCur.current = yTarget.current
      setZoom(zTarget.current)
      setPanX(xTarget.current)
      setPanY(yTarget.current)
    }
  }, [])

  const kickAnim = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(runAnim)
  }, [runAnim])

  // ── Clamp pan within valid bounds ──────────────────────────────────────────
  const clampPan = (px, py, z) => {
    const maxX = (640 - 640 / z) / 2
    const maxY = (670 - 670 / z) / 2
    return [
      Math.max(-maxX, Math.min(maxX, px)),
      Math.max(-maxY, Math.min(maxY, py)),
    ]
  }

  // ── Wheel zoom toward cursor ───────────────────────────────────────────────
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const onWheel = (e) => {
      e.preventDefault()
      const MIN = 1, MAX = 4, SPEED = 0.11
      const direction = e.deltaY > 0 ? -SPEED : SPEED
      const newZ = Math.max(MIN, Math.min(MAX, zTarget.current + direction))
      if (newZ === zTarget.current) return

      // Zoom toward cursor position
      const rect  = svg.getBoundingClientRect()
      const mx    = e.clientX - rect.left          // mouse in element px
      const my    = e.clientY - rect.top
      const mxPct = mx / rect.width                // 0..1
      const myPct = my / rect.height

      // Current viewBox
      const vbW0 = 640 / zTarget.current
      const vbH0 = 670 / zTarget.current
      const vbX0 = (640 - vbW0) / 2 + xTarget.current
      const vbY0 = (670 - vbH0) / 2 + yTarget.current

      // SVG point under mouse
      const svgMX = vbX0 + mxPct * vbW0
      const svgMY = vbY0 + myPct * vbH0

      // New viewBox dimensions
      const vbW1 = 640 / newZ
      const vbH1 = 670 / newZ

      // New viewBox origin so that same SVG point stays under mouse
      const vbX1 = svgMX - mxPct * vbW1
      const vbY1 = svgMY - myPct * vbH1

      // Convert back to panX/panY
      const newPX = vbX1 - (640 - vbW1) / 2
      const newPY = vbY1 - (670 - vbH1) / 2

      const [cpx, cpy] = clampPan(newPX, newPY, newZ)
      zTarget.current = newZ
      xTarget.current = cpx
      yTarget.current = cpy
      kickAnim()
    }

    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [kickAnim])

  // ── Mouse drag to pan ──────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    if (zTarget.current <= 1) return
    dragging.current = true
    dragStart.current = {
      x: e.clientX, y: e.clientY,
      px: xTarget.current, py: yTarget.current,
    }
  }

  const onMouseMove = (e) => {
    if (!dragging.current) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    // Convert pixel delta to SVG units
    const svgPxW = rect.width  / (640 / zCur.current)  // px per SVG unit
    const svgPxH = rect.height / (670 / zCur.current)
    const dxSVG  = (e.clientX - dragStart.current.x) / svgPxW
    const dySVG  = (e.clientY - dragStart.current.y) / svgPxH
    const [cpx, cpy] = clampPan(
      dragStart.current.px - dxSVG,
      dragStart.current.py - dySVG,
      zTarget.current
    )
    xTarget.current = cpx
    yTarget.current = cpy
    kickAnim()
  }

  const onMouseUp = () => { dragging.current = false }

  // Double-click to reset
  const onDblClick = (e) => {
    e.stopPropagation()
    zTarget.current = 1
    xTarget.current = 0
    yTarget.current = 0
    kickAnim()
  }

  // Zoom buttons
  const adjustZoom = (delta) => {
    const newZ = Math.max(1, Math.min(4, zTarget.current + delta))
    const [cpx, cpy] = clampPan(xTarget.current, yTarget.current, newZ)
    zTarget.current = newZ
    xTarget.current = cpx
    yTarget.current = cpy
    kickAnim()
  }

  // ── ViewBox ────────────────────────────────────────────────────────────────
  const vbW = 640 / zoom
  const vbH = 670 / zoom
  const vbX = (640 - vbW) / 2 + panX
  const vbY = (670 - vbH) / 2 + panY
  const viewBox = `${vbX.toFixed(3)} ${vbY.toFixed(3)} ${vbW.toFixed(3)} ${vbH.toFixed(3)}`

  // ── KEY INSIGHT: logos are drawn in SVG coordinate space.
  //    When zoom increases, SVG units appear LARGER on screen.
  //    To keep logos visually the same size (or smaller), we divide
  //    their radius by the current zoom level. 
  //    logoScale = 1/zoom → as zoom grows, radius shrinks proportionally.
  //    This means at zoom=2 logos are half the screen-pixel size of zoom=1.
  // ─────────────────────────────────────────────────────────────────────────
  const logoScale = 1 / zoom

  // ── Group logos by state respecting limits ────────────────────────────────
  const logosByState = {}
  ;[...startups]
    // Enterprise first, then premium, basic last
    .sort((a, b) => {
      const rank = { enterprise: 0, premium: 1, basic: 2 }
      return (rank[a.plan] ?? 9) - (rank[b.plan] ?? 9)
    })
    .filter(s => s.is_premium)
    .forEach(s => {
      const st = INDIAN_STATES.find(x => x.name === s.state)
      if (!st) return
      if (!logosByState[st.id]) logosByState[st.id] = []
      const limit = STATE_LOGO_LIMIT[st.id] || 1
      if (logosByState[st.id].length < limit) logosByState[st.id].push(s)
    })

  const handleStateClick = (state) => {
    if (dragging.current) return
    setSelected(state.id)
    onStateSelect?.(state)
    navigate(`/state/${state.id}`)
  }

  const getFill = (state) => {
    const c = REGION_COLORS[state.region] || REGION_COLORS.north
    if (selected === state.id) return c.active
    if (hovered  === state.id) return c.hover
    return c.fill
  }

  return (
    <div className="relative w-full select-none">

      {/* Zoom UI controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1.5">
        {/* +/- buttons */}
        <div className="flex flex-col gap-1">
          {[{ label: '+', d: 0.5 }, { label: '−', d: -0.5 }].map(b => (
            <button
              key={b.label}
              onClick={() => adjustZoom(b.d)}
              className="w-6 h-6 rounded-md bg-[#0D1525]/90 border border-white/10 text-white/60 hover:text-white hover:border-blue-400/40 transition-all text-sm font-bold leading-none flex items-center justify-center"
            >
              {b.label}
            </button>
          ))}
        </div>
        {/* Reset */}
        {zoom > 1.05 && (
          <button
            onClick={onDblClick}
            className="text-[9px] text-blue-400/60 hover:text-blue-400 border border-blue-400/20 hover:border-blue-400/50 px-2 py-0.5 rounded transition-all bg-[#0D1525]/80"
          >
            Reset
          </button>
        )}
        <span className="text-[8px] text-white/20 text-right leading-tight pointer-events-none">
          Scroll · Drag · Dbl-click
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDblClick}
        style={{
          cursor: dragging.current ? 'grabbing' : zoom > 1.05 ? 'grab' : 'default',
        }}
      >
        <defs>
          <filter id="sglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="lglow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── STATE PATHS ── */}
        {INDIAN_STATES.map(state => {
          const d      = STATE_PATHS[state.id]
          if (!d) return null
          const isSel  = selected === state.id
          const count  = counts[state.name] || 0
          const hasLogo = logosByState[state.id]?.length > 0

          return (
            <g key={state.id}>
              <path
                d={d}
                fill={getFill(state)}
                stroke="rgba(99,179,255,0.18)"
                strokeWidth={isSel ? 1.5 : 0.6}
                className="india-state"
                style={{ filter: isSel ? 'url(#sglow)' : 'none' }}
                onClick={() => handleStateClick(state)}
                onMouseEnter={e => {
                  setHovered(state.id)
                  const r = e.currentTarget.closest('svg').getBoundingClientRect()
                  setTip({ show: true, x: e.clientX - r.left, y: e.clientY - r.top, state })
                }}
                onMouseLeave={() => { setHovered(null); setTip({ show: false }) }}
                onMouseMove={e => {
                  const r = e.currentTarget.closest('svg').getBoundingClientRect()
                  setTip(t => ({ ...t, x: e.clientX - r.left, y: e.clientY - r.top }))
                }}
              />

              {/* Dot — only when no logo */}
              {!hasLogo && (
                <>
                  {/* 
                    r is multiplied by logoScale so dots also shrink on zoom,
                    keeping visual size constant regardless of zoom level.
                  */}
                  <circle
                    cx={state.cx} cy={state.cy}
                    r={(isSel ? 5 : count > 0 ? 4 : 2.5) * logoScale}
                    fill={isSel ? '#63B3FF' : count > 0 ? '#F6C90E' : 'rgba(99,179,255,0.35)'}
                    stroke={isSel ? 'rgba(255,255,255,0.8)' : 'transparent'}
                    strokeWidth={1.5 * logoScale}
                    style={{ pointerEvents: 'none' }}
                  />
                  {count > 0 && (
                    <text
                      x={state.cx + 7 * logoScale}
                      y={state.cy - 4 * logoScale}
                      fontSize={7 * logoScale}
                      fill="#F6C90E"
                      fontFamily="DM Sans,sans-serif"
                      fontWeight="700"
                      style={{ pointerEvents: 'none' }}
                    >
                      {count}
                    </text>
                  )}
                </>
              )}
            </g>
          )
        })}

        {/* ── PREMIUM LOGOS ── */}
        {INDIAN_STATES.map(state => {
          const logos = logosByState[state.id]
          if (!logos?.length) return null

          const n       = logos.length
          const offsets = CLUSTER_OFFSETS[n] || CLUSTER_OFFSETS[1]

          return logos.map((startup, idx) => {
            const [ox, oy] = offsets[idx]

            /*
              CRITICAL FORMULA:
              - Offsets are in fixed SVG units (constant regardless of zoom)
              - logoScale = 1/zoom shrinks the logo radius as zoom increases
              - So at zoom=2, each logo is half as many screen-pixels wide
              - The gap between logos (offsets) stays fixed in SVG units,
                meaning they stay nicely spaced and NEVER overlap
            */
            const cx = state.cx + ox
            const cy = state.cy + oy

            // Base radius in SVG units, divided by zoom so screen size stays constant
            const baseR = startup.plan === 'enterprise' ? 8.5 : 7
            const r     = baseR * logoScale

            const isEnt = startup.plan === 'enterprise'
            const bg    = startup.brand_color || '#3B7DD8'
            const init  = startup.company_name?.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() || '?'
            const isHov = logoTip?.id === startup.id

            return (
              <g
                key={startup.id}
                style={{ cursor: 'pointer' }}
                onClick={e => {
                  e.stopPropagation()
                  navigate(`/startup/${startup.id}`)
                }}
                onMouseEnter={e => {
                  const rect = e.currentTarget.closest('svg').getBoundingClientRect()
                  setLogoTip({
                    id: startup.id,
                    name: startup.company_name,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  })
                  setTip({ show: false })
                }}
                onMouseLeave={() => setLogoTip(null)}
              >
                {/* Soft glow aura behind logo */}
                <circle
                  cx={cx} cy={cy}
                  r={r * 1.55}
                  fill={bg}
                  opacity={isHov ? 0.28 : 0.12}
                  style={{ filter: 'url(#lglow)', pointerEvents: 'none' }}
                />

                {/* Main logo circle */}
                <circle
                  cx={cx} cy={cy} r={r}
                  fill={bg}
                  stroke={isEnt ? '#FFD700' : isHov ? '#F6C90E' : 'rgba(255,215,0,0.45)'}
                  strokeWidth={(isEnt ? 1.1 : 0.7) * logoScale}
                />

                {/* Logo image or text initials */}
                {startup.logo_url ? (
                  <image
                    href={startup.logo_url}
                    x={cx - r * 0.82} y={cy - r * 0.82}
                    width={r * 1.64} height={r * 1.64}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ pointerEvents: 'none' }}
                  />
                ) : (
                  <text
                    x={cx} y={cy + r * 0.36}
                    textAnchor="middle"
                    fontSize={r * 0.75}
                    fill="white"
                    fontFamily="DM Sans,sans-serif"
                    fontWeight="800"
                    style={{ pointerEvents: 'none' }}
                  >
                    {init}
                  </text>
                )}

                {/* Badge */}
                <circle
                  cx={cx + r * 0.68} cy={cy - r * 0.68}
                  r={r * 0.34}
                  fill={isEnt ? '#FFD700' : '#F6C90E'}
                  stroke="#0A0E1A"
                  strokeWidth={0.35 * logoScale}
                  style={{ pointerEvents: 'none' }}
                />
                <text
                  x={cx + r * 0.68} y={cy - r * 0.68 + r * 0.13}
                  textAnchor="middle"
                  fontSize={r * 0.46}
                  fill={isEnt ? '#000' : '#000'}
                  fontFamily="DM Sans" fontWeight="900"
                  style={{ pointerEvents: 'none' }}
                >
                  {isEnt ? '👑' : '★'}
                </text>
              </g>
            )
          })
        })}

        {/* ── TOOLTIPS (screen-space, scale-compensated) ── */}
        {tip.show && tip.state && (() => {
          const rect = svgRef.current?.getBoundingClientRect()
          if (!rect) return null
          const sx = vbX + (tip.x / rect.width)  * vbW
          const sy = vbY + (tip.y / rect.height) * vbH
          const s  = logoScale
          // Premium slot data for this state
          const stateId    = tip.state.id
          const limit      = STATE_LOGO_LIMIT[stateId] || 1
          const usedPremium = premiumCounts[tip.state.name] || 0
          const slotsLeft  = Math.max(0, limit - usedPremium)
          const isFull     = slotsLeft === 0
          // Taller tooltip when showing slot info
          const tw = 136 * s
          const th = 46  * s
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect
                x={sx - tw / 2} y={sy - th - 8 * s}
                width={tw} height={th} rx={5 * s}
                fill="rgba(13,21,37,0.97)"
                stroke={isFull ? 'rgba(226,55,68,0.5)' : 'rgba(99,179,255,0.3)'}
                strokeWidth={0.7 * s}
              />
              {/* State name */}
              <text
                x={sx} y={sy - th + 11 * s}
                textAnchor="middle" fontSize={9.5 * s}
                fill="#E8EAF0" fontFamily="DM Sans,sans-serif" fontWeight="700"
              >
                {tip.state.name}
              </text>
              {/* Total startups */}
              <text
                x={sx} y={sy - th + 22 * s}
                textAnchor="middle" fontSize={7.5 * s}
                fill="rgba(232,234,240,0.45)" fontFamily="DM Sans,sans-serif"
              >
                {counts[tip.state.name]
                  ? `${counts[tip.state.name]} startup${counts[tip.state.name] > 1 ? 's' : ''} listed`
                  : 'No startups yet · be first!'}
              </text>
              {/* Premium slots line */}
              <text
                x={sx} y={sy - th + 33 * s}
                textAnchor="middle" fontSize={7.5 * s}
                fill={isFull ? 'rgba(226,55,68,0.9)' : 'rgba(246,201,14,0.9)'}
                fontFamily="DM Sans,sans-serif" fontWeight="700"
              >
                {isFull
                  ? `⛔ Map slots full (${limit}/${limit})`
                  : `⭐ ${slotsLeft} of ${limit} premium slots left`}
              </text>
              {/* Click hint */}
              <text
                x={sx} y={sy - 10 * s}
                textAnchor="middle" fontSize={6.5 * s}
                fill="rgba(99,179,255,0.5)" fontFamily="DM Sans,sans-serif"
              >
                Click to explore →
              </text>
            </g>
          )
        })()}

        {logoTip && (() => {
          const rect = svgRef.current?.getBoundingClientRect()
          if (!rect) return null
          const sx = vbX + (logoTip.x / rect.width)  * vbW
          const sy = vbY + (logoTip.y / rect.height) * vbH
          const s  = logoScale
          const tw = 106 * s
          const th = 26  * s
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect
                x={sx - tw / 2} y={sy - th - 8 * s}
                width={tw} height={th} rx={5 * s}
                fill="rgba(13,21,37,0.97)"
                stroke="rgba(246,201,14,0.5)"
                strokeWidth={0.7 * s}
              />
              <text
                x={sx} y={sy - th + 9 * s}
                textAnchor="middle" fontSize={9 * s}
                fill="#F6C90E" fontFamily="DM Sans,sans-serif" fontWeight="700"
              >
                {logoTip.name?.slice(0, 18)}
              </text>
              <text
                x={sx} y={sy - 12 * s}
                textAnchor="middle" fontSize={7.5 * s}
                fill="rgba(232,234,240,0.4)" fontFamily="DM Sans,sans-serif"
              >
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
          { color: '#F6C90E',              label: 'Has startups' },
          { color: '#63B3FF',              label: 'Selected' },
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
      </div>

    </div>
  )
}
