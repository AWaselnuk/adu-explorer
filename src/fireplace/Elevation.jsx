import {
  WALL, DEN_ZONE, BUILTIN, OPENING, NICHE, MANTEL_HEIGHT,
  SURROUND_X0, SURROUND_X1, SURROUND_W, OPENING_X0, MANTEL_W, MANTEL_X0,
  fmtIn, fmtFtIn,
} from './spec'

const Y = (y) => WALL.height - y
const VIEW = { x: -6, y: -10, w: WALL.width + 72, h: WALL.height + 22 }

function DimV({ x, y0, y1, label, accent }) {
  const mid = (y0 + y1) / 2
  const cls = accent ? 'dim dim-accent' : 'dim'
  return (
    <g className={cls}>
      <line x1={x} x2={x} y1={Y(y0)} y2={Y(y1)} />
      <line x1={x - 1.5} x2={x + 1.5} y1={Y(y0)} y2={Y(y0)} />
      <line x1={x - 1.5} x2={x + 1.5} y1={Y(y1)} y2={Y(y1)} />
      <text x={x + 2.5} y={Y(mid) + 1.1}>{label}</text>
    </g>
  )
}

function DimH({ y, x0, x1, label }) {
  return (
    <g className="dim">
      <line x1={x0} x2={x1} y1={Y(y)} y2={Y(y)} />
      <line x1={x0} x2={x0} y1={Y(y) - 1.5} y2={Y(y) + 1.5} />
      <line x1={x1} x2={x1} y1={Y(y) - 1.5} y2={Y(y) + 1.5} />
      <text x={(x0 + x1) / 2} y={Y(y) + 4} textAnchor="middle">{label}</text>
    </g>
  )
}

function TilePattern() {
  return (
    <pattern id="tile" width="12" height="8" patternUnits="userSpaceOnUse" y={Y(0) % 8}>
      <rect width="12" height="8" fill="var(--tile)" />
      <path d="M0 0H12M0 4H12M0 0V4M6 4V8" stroke="var(--grout)" strokeWidth="0.35" fill="none" />
    </pattern>
  )
}

function Niche({ x0 }) {
  const w = BUILTIN.x0 + BUILTIN.width - SURROUND_X1 // both columns are this wide
  const ix0 = x0 + NICHE.stile
  const iw = w - NICHE.stile * 2
  const r = iw / 2
  const base = NICHE.cabinetTop + NICHE.counter
  const spring = NICHE.archTop - r
  const arch = `M${ix0} ${Y(base)} V${Y(spring)} A${r} ${r} 0 0 1 ${ix0 + iw} ${Y(spring)} V${Y(base)} Z`
  const doorW = (w - 3) / 2
  return (
    <g>
      <rect x={x0} y={Y(WALL.height)} width={w} height={WALL.height} className="builtin" />
      <path d={arch} className="niche" />
      {NICHE.shelves.map((s) => (
        <rect key={s} x={ix0} y={Y(s + 1.5)} width={iw} height={1.5} className="shelf" />
      ))}
      <rect x={x0 - 0.5} y={Y(base)} width={w + 1} height={NICHE.counter} className="counter" />
      {[0, 1].map((i) => (
        <rect key={i} x={x0 + 1 + i * (doorW + 1)} y={Y(NICHE.cabinetTop - 1)} width={doorW}
          height={NICHE.cabinetTop - 5} className="door" />
      ))}
      <rect x={x0} y={Y(4)} width={w} height={4} className="toekick" />
    </g>
  )
}

function Person({ x, height = 66 }) {
  const s = height / 66
  return (
    <g className="person" transform={`translate(${x} ${Y(0)}) scale(${s})`}>
      <circle cx="0" cy="-61" r="4.6" />
      <path d="M-8 -54 Q0 -56.5 8 -54 L9 -32 L6 -32 L5 0 L1 0 L0 -28 L-1 0 L-5 0 L-6 -32 L-9 -32 Z" />
      <text x="0" y="-68" textAnchor="middle">5'6" person</text>
    </g>
  )
}

export default function Elevation({ clearance, material, woodMin, masonryMin, showArt }) {
  const underside = OPENING.height + clearance
  const top = underside + MANTEL_HEIGHT
  const aboveMantel = WALL.height - top
  const artH = Math.min(36, aboveMantel - 12)
  const artW = artH * 0.75
  const ghostUnderside = OPENING.height + 10

  return (
    <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className="elevation" role="img"
      aria-label="Fireplace wall elevation drawn to scale">
      <defs><TilePattern /></defs>

      <rect x="0" y={Y(WALL.height)} width={DEN_ZONE} height={WALL.height} className="wall-setback" />
      <text x={DEN_ZONE / 2} y={Y(88)} textAnchor="middle" className="note">den entry</text>
      <text x={DEN_ZONE / 2} y={Y(84)} textAnchor="middle" className="note">(wall set back 21½")</text>

      <Niche x0={BUILTIN.x0} />
      <Niche x0={SURROUND_X1} />

      <rect x={SURROUND_X0} y={Y(WALL.height)} width={SURROUND_W} height={WALL.height} className="breast" />
      <rect x={SURROUND_X0} y={Y(underside)} width={SURROUND_W} height={underside} fill="url(#tile)" />
      <rect x={OPENING_X0} y={Y(OPENING.height)} width={OPENING.width} height={OPENING.height} className="firebox" />
      <ellipse cx={OPENING_X0 + OPENING.width / 2} cy={Y(5)} rx={OPENING.width * 0.32} ry={5} className="flame" />

      {showArt && artH > 8 && (
        <g>
          <rect x={MANTEL_X0 + MANTEL_W / 2 - artW / 2} y={Y(top + 6 + artH)} width={artW} height={artH} className="art-frame" />
          <rect x={MANTEL_X0 + MANTEL_W / 2 - artW / 2 + 3} y={Y(top + 6 + artH - 3)} width={artW - 6} height={artH - 6} className="art" />
        </g>
      )}

      {clearance !== 10 && (
        <rect x={MANTEL_X0} y={Y(ghostUnderside + MANTEL_HEIGHT)} width={MANTEL_W} height={MANTEL_HEIGHT} className="ghost" />
      )}
      <rect x={MANTEL_X0} y={Y(top)} width={MANTEL_W} height={MANTEL_HEIGHT}
        className={material === 'wood' ? 'mantel' : 'mantel mantel-masonry'} />

      {[['wood', woodMin], ['masonry', masonryMin]].map(([m, min]) => min != null && (
        <g key={m} className={`minline minline-${m}`}>
          <line x1={MANTEL_X0 - 4} x2={MANTEL_X0 + MANTEL_W + 4} y1={Y(OPENING.height + min)} y2={Y(OPENING.height + min)} />
          <text x={MANTEL_X0 - 5} y={Y(OPENING.height + min) + 1} textAnchor="end">{m} min {fmtIn(min)}</text>
        </g>
      ))}

      <line x1="-4" x2={WALL.width + 4} y1={Y(0)} y2={Y(0)} className="floor" />
      <line x1="0" x2={WALL.width} y1={Y(WALL.height)} y2={Y(WALL.height)} className="ceiling" />
      <text x={WALL.width - 1} y={Y(WALL.height) - 1.5} textAnchor="end" className="note">vault starts here ↑</text>

      <Person x={18} />

      <DimV x={WALL.width + 6} y0={0} y1={OPENING.height} label={`${fmtIn(OPENING.height)} opening`} />
      <DimV x={WALL.width + 6} y0={OPENING.height} y1={underside} label={`${fmtIn(clearance)} clearance`} accent />
      <DimV x={WALL.width + 6} y0={underside} y1={top} label={`${fmtIn(MANTEL_HEIGHT)} mantel`} />
      <DimV x={WALL.width + 6} y0={top} y1={WALL.height} label={`${fmtIn(aboveMantel)} to ceiling`} />
      <DimV x={WALL.width + 40} y0={0} y1={underside} label={`${fmtFtIn(underside)} AFF`} />
      <DimH y={-5} x0={0} x1={WALL.width} label={fmtFtIn(WALL.width)} />
    </svg>
  )
}
