import { useMemo } from 'react'
import * as THREE from 'three'
import data from '../floorplan-data.json'

// ─── Dimensions ──────────────────────────────────────────────────────────────
// Building: L-shaped footprint. Main body 25' wide × 26'-3" deep.
// NE bump-out for Bedroom 1 extends ~8.5' east of the main east wall.
const W = 25.0
const D = 26.25
const HW = 12.5    // main half-width
const HD = 13.125  // half-depth
const EXT = 0.5
const INT = 0.33
const WALL_H = 8.5

// Interior faces of main rectangle
const NF = -HD + EXT / 2  // -12.875 north interior
const SF =  HD - EXT / 2  //  12.875 south interior
const WF = -HW + EXT / 2  // -12.25  west interior
const EF =  HW - EXT / 2  //  12.25  east interior (main body only)

// ── N-S interior wall X positions (north section, within main body) ──
// Bed2 (6'-11½") | Bath (5'-4½") | Room (10'-6½")
// Bed1 (8'-5") is the bump-out east of the main body
const X_BED2_BATH   = WF + 6.958 + INT / 2                          // -5.127
const X_BATH_ROOM   = X_BED2_BATH + INT / 2 + 5.375 + INT / 2      //  0.578
// Room extends east to the main building east wall.
// Room interior width: EF - (X_BATH_ROOM + INT/2) = 12.25 - 0.743 = 11.507
// (this includes the 3' closet sub-area within the room)

// Room/Bed1 wall is at the main east wall position.
// In the bump-out zone, this becomes an interior wall instead of exterior.
const X_ROOM_BED1 = HW  // 12.5 — coincides with main east wall

// Bump-out for Bed1: 8'-5" = 8.417' interior width
const BED1_W = 8.417
const BUMP_E = HW + BED1_W + EXT / 2  // 21.167 — bump east exterior face

// ── E-W walls ──
// Main partition: 11'-7½" from north interior face
const PZ = NF + 11.625 + INT / 2  // -1.085

// Bathroom south wall: 7' from north interior face
const BATH_SZ = NF + 7.0 + INT / 2  // -5.71

// Bump-out south wall: Bed1 is 10'-6" deep from north interior
const BUMP_SZ = NF + 10.5 + EXT / 2  // -2.125 (exterior face)
// Use the partition Z for the step since Bed1 extends roughly to the partition
const STEP_Z = PZ  // where east wall steps out

// Colors
const MAT = {
  exterior:   '#c8a882',
  interior:   '#f0e8d8',
  floor:      '#b8935a',
  tile:       '#d4cfc8',
  roof:       '#5c3d1e',
  roofFascia: '#3d2710',
  window:     '#a8d4e8',
  door:       '#6b4c2a',
  trim:       '#e8e0d0',
  concrete:   '#9e9e9e',
  counter:    '#8b7d6b',
  fixture:    '#e0ddd8',
  appliance:  '#cccccc',
  fireplace:  '#2a2a2a',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Wall({ position, size, color = MAT.exterior, castShadow = true }) {
  return (
    <mesh position={position} castShadow={castShadow} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.02} />
    </mesh>
  )
}

function WindowMesh({ position, rotation = [0, 0, 0], width = 3, height = 3.5 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[width + 0.3, height + 0.3, 0.3]} />
        <meshStandardMaterial color={MAT.trim} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[width, height, 0.15]} />
        <meshStandardMaterial color={MAT.window} transparent opacity={0.45} roughness={0.05} metalness={0.1} />
      </mesh>
    </group>
  )
}

function DoorMesh({ position, rotation = [0, 0, 0], width = 3, height = 6.83 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[width + 0.4, height + 0.2, 0.35]} />
        <meshStandardMaterial color={MAT.trim} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[width, height, 0.2]} />
        <meshStandardMaterial color={MAT.door} roughness={0.8} />
      </mesh>
    </group>
  )
}

// ─── Foundation ──────────────────────────────────────────────────────────────
function Foundation() {
  // L-shaped foundation: main + bump-out
  return (
    <group>
      {/* Main body foundation */}
      <mesh position={[0, -0.75, 0]} receiveShadow>
        <boxGeometry args={[W + 1, 1.5, D + 1]} />
        <meshStandardMaterial color={MAT.concrete} roughness={0.95} />
      </mesh>
      {/* Bump-out foundation */}
      <mesh position={[(HW + BUMP_E) / 2, -0.75, (-HD + STEP_Z) / 2]} receiveShadow>
        <boxGeometry args={[BUMP_E - HW + 1, 1.5, Math.abs(STEP_Z - (-HD)) + 1]} />
        <meshStandardMaterial color={MAT.concrete} roughness={0.95} />
      </mesh>
    </group>
  )
}

// ─── Interior Floor ──────────────────────────────────────────────────────────
function InteriorFloor() {
  return (
    <group>
      {/* Main body floor */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[W - EXT, 0.12, D - EXT]} />
        <meshStandardMaterial color={MAT.floor} roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Bump-out floor */}
      <mesh position={[(HW + BUMP_E) / 2, 0.02, (-HD + STEP_Z) / 2]} receiveShadow>
        <boxGeometry args={[BUMP_E - HW - EXT / 2, 0.12, Math.abs(STEP_Z - (-HD)) - EXT]} />
        <meshStandardMaterial color={MAT.floor} roughness={0.7} metalness={0.05} />
      </mesh>
    </group>
  )
}

// ─── Exterior Walls (L-shaped) ───────────────────────────────────────────────
function ExteriorWalls() {
  // Front door: center-right of south wall
  const doorX = 3.0
  const doorW = 3.0
  const doorH = 6.83
  const doorL = doorX - doorW / 2
  const doorR = doorX + doorW / 2
  const headerH = WALL_H - doorH

  // The L-shape: main body + NE bump-out
  // East wall splits: south section (living) is main east wall,
  // north section opens into bump-out

  const bumpW = BUMP_E - HW  // width of bump-out exterior

  return (
    <group>
      {/* ── South wall (25' wide, with door) ── */}
      <Wall position={[(-HW + doorL) / 2, WALL_H / 2, HD]} size={[doorL + HW, WALL_H, EXT]} />
      <Wall position={[(doorR + HW) / 2, WALL_H / 2, HD]} size={[HW - doorR, WALL_H, EXT]} />
      <Wall position={[doorX, WALL_H - headerH / 2, HD]} size={[doorW, headerH, EXT]} />

      {/* ── West wall (full depth) ── */}
      <Wall position={[-HW, WALL_H / 2, 0]} size={[EXT, WALL_H, D]} />

      {/* ── East wall — LOWER section (living area, from south to step) ── */}
      {(() => {
        const segH = HD + STEP_Z  // from south wall to step
        const segCenter = (HD + STEP_Z) / 2
        return (
          <Wall position={[HW, WALL_H / 2, segCenter]} size={[EXT, WALL_H, segH]} />
        )
      })()}

      {/* ── Step wall (E-W, connects main east wall to bump east wall) ── */}
      <Wall
        position={[(HW + BUMP_E) / 2, WALL_H / 2, STEP_Z]}
        size={[bumpW, WALL_H, EXT]}
      />

      {/* ── Bump-out east wall ── */}
      {(() => {
        const segH = Math.abs(STEP_Z - (-HD))
        const segCenter = (STEP_Z + (-HD)) / 2
        return (
          <Wall position={[BUMP_E, WALL_H / 2, segCenter]} size={[EXT, WALL_H, segH]} />
        )
      })()}

      {/* ── North wall (full width including bump-out) ── */}
      <Wall
        position={[(-HW + BUMP_E) / 2, WALL_H / 2, -HD]}
        size={[BUMP_E + HW, WALL_H, EXT]}
      />
    </group>
  )
}

// ─── Interior Walls ──────────────────────────────────────────────────────────
function InteriorWalls() {
  // Hallway opening in partition: ~4' wide, centered between N-S walls
  const hallCX = (X_BED2_BATH + X_BATH_ROOM) / 2 + 2  // shifted east toward center
  const hallOpenW = 4.0

  return (
    <group>
      {/* ═══ E-W Partition (Z = PZ) — across main body width ═══ */}
      {/* West segment (Bed2 south wall) */}
      <Wall
        position={[(-HW + (hallCX - hallOpenW / 2)) / 2, WALL_H / 2, PZ]}
        size={[(hallCX - hallOpenW / 2) + HW, WALL_H, INT]}
        color={MAT.interior} castShadow={false}
      />
      {/* East segment (Room south wall, up to main east wall) */}
      <Wall
        position={[((hallCX + hallOpenW / 2) + HW) / 2, WALL_H / 2, PZ]}
        size={[HW - (hallCX + hallOpenW / 2), WALL_H, INT]}
        color={MAT.interior} castShadow={false}
      />

      {/* ═══ N-S Walls ═══ */}

      {/* Bed2 | Bath (X = X_BED2_BATH) — north wall to partition */}
      <Wall
        position={[X_BED2_BATH, WALL_H / 2, (-HD + PZ) / 2]}
        size={[INT, WALL_H, Math.abs(PZ - (-HD))]}
        color={MAT.interior} castShadow={false}
      />

      {/* Bath | Room (X = X_BATH_ROOM) — north wall to partition */}
      <Wall
        position={[X_BATH_ROOM, WALL_H / 2, (-HD + PZ) / 2]}
        size={[INT, WALL_H, Math.abs(PZ - (-HD))]}
        color={MAT.interior} castShadow={false}
      />

      {/* Room | Bed1 — at main east wall line, but interior wall in bump zone */}
      {/* This wall runs from north wall to bump south wall (STEP_Z) */}
      <Wall
        position={[X_ROOM_BED1, WALL_H / 2, (-HD + STEP_Z) / 2]}
        size={[INT, WALL_H, Math.abs(STEP_Z - (-HD))]}
        color={MAT.interior} castShadow={false}
      />

      {/* ═══ Bathroom south wall (Z = BATH_SZ) ═══ */}
      {/* Runs between Bed2/Bath wall and Bath/Room wall */}
      <Wall
        position={[(X_BED2_BATH + X_BATH_ROOM) / 2, WALL_H / 2, BATH_SZ]}
        size={[X_BATH_ROOM - X_BED2_BATH, WALL_H, INT]}
        color={MAT.interior} castShadow={false}
      />
    </group>
  )
}

// ─── Doors & Windows ─────────────────────────────────────────────────────────
function OpeningsAndDoors() {
  const sZ = HD + 0.01
  const nZ = -HD - 0.01
  const wX = -HW - 0.01
  const eMainX = HW + 0.01
  const eBumpX = BUMP_E + 0.01

  return (
    <group>
      {/* Front door */}
      <DoorMesh position={[3.0, 6.83 / 2, sZ]} width={3.0} height={6.83} />

      {/* South windows */}
      <WindowMesh position={[-7.0, 4.5, sZ]} width={4.0} height={3.5} />
      <WindowMesh position={[9.0, 4.5, sZ]} width={4.0} height={4.0} />

      {/* North windows */}
      <WindowMesh position={[-9.0, 4.5, nZ]} rotation={[0, Math.PI, 0]} width={3.0} height={3.0} />
      <WindowMesh position={[(X_BED2_BATH + X_BATH_ROOM) / 2, 5.5, nZ]} rotation={[0, Math.PI, 0]} width={2.0} height={2.0} />
      <WindowMesh position={[6.0, 4.5, nZ]} rotation={[0, Math.PI, 0]} width={3.0} height={3.5} />
      <WindowMesh position={[(HW + BUMP_E) / 2, 4.5, nZ]} rotation={[0, Math.PI, 0]} width={3.0} height={3.5} />

      {/* West windows */}
      <WindowMesh position={[wX, 4.5, -8.0]} rotation={[0, -Math.PI / 2, 0]} width={2.5} height={3.5} />
      <WindowMesh position={[wX, 4.5, 5.0]} rotation={[0, -Math.PI / 2, 0]} width={3.0} height={3.5} />

      {/* Main east wall windows (living area, south of step) */}
      <WindowMesh position={[eMainX, 4.5, 5.0]} rotation={[0, Math.PI / 2, 0]} width={3.0} height={3.5} />

      {/* Bump-out east wall window (Bed1) */}
      <WindowMesh position={[eBumpX, 4.5, -7.0]} rotation={[0, Math.PI / 2, 0]} width={3.0} height={3.5} />
    </group>
  )
}

// ─── Electric Fireplace (east wall of living area) ───────────────────────────
function ElectricFireplace() {
  return (
    <mesh position={[EF - 0.15, 3.5, 3.0]} receiveShadow>
      <boxGeometry args={[0.5, 4.0, 3.0]} />
      <meshStandardMaterial color={MAT.fireplace} roughness={0.4} metalness={0.1} />
    </mesh>
  )
}

// ─── Split Gable Roof ────────────────────────────────────────────────────────
function SplitGableRoof() {
  const overhang = 1.0
  const panelThick = 0.4
  const panelDepth = D + overhang * 2

  return (
    <group>
      {data.roof.sections.map((sec) => {
        const rise = sec.ridgeHeight - sec.eaveHeight
        const wRun = sec.ridgeX - sec.westEaveX
        const wAngle = Math.atan2(rise, wRun)
        const wHyp = Math.sqrt(wRun * wRun + rise * rise)
        const eRun = sec.eastEaveX - sec.ridgeX
        const eAngle = Math.atan2(rise, eRun)
        const eHyp = Math.sqrt(eRun * eRun + rise * rise)

        return (
          <group key={sec.id}>
            <mesh position={[(sec.westEaveX + sec.ridgeX) / 2, sec.eaveHeight + rise / 2, 0]} rotation={[0, 0, wAngle]} castShadow receiveShadow>
              <boxGeometry args={[wHyp, panelThick, panelDepth]} />
              <meshStandardMaterial color={MAT.roof} roughness={0.9} />
            </mesh>
            <mesh position={[(sec.ridgeX + sec.eastEaveX) / 2, sec.eaveHeight + rise / 2, 0]} rotation={[0, 0, -eAngle]} castShadow receiveShadow>
              <boxGeometry args={[eHyp, panelThick, panelDepth]} />
              <meshStandardMaterial color={MAT.roof} roughness={0.9} />
            </mesh>
            <mesh position={[sec.ridgeX, sec.ridgeHeight + 0.1, 0]} castShadow>
              <boxGeometry args={[0.6, 0.3, panelDepth]} />
              <meshStandardMaterial color={MAT.roofFascia} roughness={0.9} />
            </mesh>
          </group>
        )
      })}
      <GableEnds />
    </group>
  )
}

function GableEnds() {
  const shapes = useMemo(() => {
    return data.roof.sections.map((sec) => {
      const s = new THREE.Shape()
      s.moveTo(sec.westEaveX, sec.eaveHeight)
      s.lineTo(sec.ridgeX, sec.ridgeHeight)
      s.lineTo(sec.eastEaveX, sec.eaveHeight)
      s.closePath()
      return { id: sec.id, shape: s }
    })
  }, [])

  return (
    <group>
      {shapes.map(({ id, shape }) => (
        <group key={id}>
          <mesh position={[0, 0, HD + 0.5]}>
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial color={MAT.exterior} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, -HD - 0.5]}>
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial color={MAT.exterior} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── Covered Porch ──────────────────────────────────────────────────────────
function CoveredPorch({ position, rotation = [0, 0, 0], width, depth, roofVisible }) {
  const postSize = 0.35
  const postH = 7.5
  const roofOverhang = 0.8
  const roofW = width + roofOverhang * 2
  const roofD = depth + roofOverhang
  const roofPitch = 1.2
  const hw = width / 2 - 0.4
  const outerZ = depth - 0.4

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, -0.1, depth / 2]} receiveShadow>
        <boxGeometry args={[width + 0.5, 0.25, depth + 0.5]} />
        <meshStandardMaterial color={MAT.concrete} roughness={0.95} />
      </mesh>
      {[[-hw, outerZ], [hw, outerZ]].map(([px, pz], i) => (
        <group key={i}>
          <mesh position={[px, postH / 2, pz]} castShadow>
            <boxGeometry args={[postSize, postH, postSize]} />
            <meshStandardMaterial color={MAT.trim} roughness={0.6} />
          </mesh>
          <mesh position={[px, postH + 0.15, pz]}>
            <boxGeometry args={[0.6, 0.3, 0.6]} />
            <meshStandardMaterial color={MAT.trim} roughness={0.6} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, postH + 0.4, outerZ]}>
        <boxGeometry args={[width + 0.3, 0.5, 0.4]} />
        <meshStandardMaterial color={MAT.trim} roughness={0.6} />
      </mesh>
      {[-hw, hw].map((px, i) => (
        <mesh key={`s-${i}`} position={[px, postH + 0.4, outerZ / 2]}>
          <boxGeometry args={[0.3, 0.5, outerZ + 0.4]} />
          <meshStandardMaterial color={MAT.trim} roughness={0.6} />
        </mesh>
      ))}
      {roofVisible && (
        <group>
          <mesh position={[0, postH + 0.7 + roofPitch / 2, depth / 2]} rotation={[Math.atan2(roofPitch, roofD), 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[roofW, 0.3, Math.sqrt(roofD * roofD + roofPitch * roofPitch)]} />
            <meshStandardMaterial color={MAT.roof} roughness={0.9} />
          </mesh>
          <mesh position={[0, postH + 0.55, depth + roofOverhang / 2]} castShadow>
            <boxGeometry args={[roofW, 0.5, 0.2]} />
            <meshStandardMaterial color={MAT.roofFascia} roughness={0.9} />
          </mesh>
        </group>
      )}
    </group>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────
export default function ADUModel({ roofVisible = true }) {
  return (
    <group>
      <Foundation />
      <InteriorFloor />
      <ExteriorWalls />
      <InteriorWalls />
      <OpeningsAndDoors />
      <ElectricFireplace />
      {roofVisible && <SplitGableRoof />}

      {/* Front porch — 6' deep, centered on door */}
      <CoveredPorch position={[3.0, 0, HD]} width={8} depth={6} roofVisible={roofVisible} />

      {/* NW covered porch — 13'-1" × 5' */}
      <CoveredPorch position={[-6.0, 0, -HD]} rotation={[0, Math.PI, 0]} width={13.08} depth={5} roofVisible={roofVisible} />
    </group>
  )
}
