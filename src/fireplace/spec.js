// All dimensions in inches. Sources: docs/fireplace-layout/ (builder SketchUp views)
// and the Grandview G800P manual clearance charts (fireplace1.png, fireplace2.png).

export const WALL = { width: 157, height: 96 } // 13'1" wide, 8' to the bottom of the vault
export const DEN_ZONE = 37 // 3'1" left clear for the den entry, wall set back
export const BUILTIN = { x0: 37, width: 120, depth: 21.5 } // 10' bump-out, 1'9½" deep
export const OPENING = { width: 35.875, height: 33.875 } // glass opening, assumed flush with floor
export const SURROUND = 12
export const MANTEL_HEIGHT = 6
export const MANTEL_OVERHANG = 3.75 // from the builder elevation: 67⅜" mantel over a 59⅞" surround

export const VAULT_PEAK = 132 // 11' from floorplan-data.json
export const VAULT_RUN = 150 // half of the 25' building width

export const FP_CENTER = BUILTIN.x0 + BUILTIN.width / 2
export const SURROUND_W = OPENING.width + SURROUND * 2
export const SURROUND_X0 = FP_CENTER - SURROUND_W / 2
export const SURROUND_X1 = FP_CENTER + SURROUND_W / 2
export const OPENING_X0 = FP_CENTER - OPENING.width / 2
export const MANTEL_W = SURROUND_W + MANTEL_OVERHANG * 2
export const MANTEL_X0 = FP_CENTER - MANTEL_W / 2

export const NICHE = {
  stile: 3,
  cabinetTop: 30,
  counter: 1.5,
  archTop: 88,
  depth: 12,
  shelves: [46, 60, 74],
}

// [mantel projection, min clearance from top of opening to underside of mantel]
// The manual's shaded triangle is a straight line between rows, so we interpolate.
const CLEARANCES = {
  wood: [[3, 21], [9, 25.5], [15, 30]],
  masonry: [[3, 6], [9, 9], [15, 13.5]],
}

export function requiredClearance(material, depth) {
  const rows = CLEARANCES[material]
  if (depth <= rows[0][0]) return rows[0][1]
  for (let i = 1; i < rows.length; i++) {
    const [d0, c0] = rows[i - 1]
    const [d1, c1] = rows[i]
    if (depth <= d1) return c0 + ((depth - d0) / (d1 - d0)) * (c1 - c0)
  }
  return null
}

export const PRESETS = [
  { id: 'masonry10', label: 'Masonry, 10"', note: 'Your current drawing', material: 'masonry', clearance: 10 },
  { id: 'wood21', label: 'Wood, 21"', note: "Builder's number (3\"-deep row)", material: 'wood', clearance: 21 },
  { id: 'wood2325', label: 'Wood, 23¼"', note: 'Interpolated min for 6" deep', material: 'wood', clearance: 23.25 },
  { id: 'wood255', label: 'Wood, 25½"', note: 'Conservative (9" row)', material: 'wood', clearance: 25.5 },
]

const FRACTIONS = ['', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞']

export function fmtIn(inches) {
  const eighths = Math.round(inches * 8)
  const whole = Math.floor(eighths / 8)
  return `${whole}${FRACTIONS[eighths % 8]}"`
}

export function fmtFtIn(inches) {
  const eighths = Math.round(inches * 8)
  const ft = Math.floor(eighths / 96)
  const rem = eighths - ft * 96
  return `${ft}'${Math.floor(rem / 8)}${FRACTIONS[rem % 8]}"`
}
