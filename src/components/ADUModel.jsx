import { useMemo } from 'react'
import * as THREE from 'three'
import data from '../floorplan-data.json'

// ─── Coordinate System ─────────────────────────────────────────────────────
// +X = East, +Z = South, +Y = Up. Units = feet. Origin at center of main body.
//
// Footprint (viewed from above):
//
//    NW ──────────┐notch┌────────────── BUMP_NE
//    │  Entry/WD  │     │   Bathroom  │  Bed 1  │
//    │            └─────┘             │         │
//    │                                ├─────────┘ BUMP_SE
//    │          Hallway               │
//    ├────────────────────────────────┤ ← partition ~Z=-0.5
//    │                                │
//    │      Living / Kitchen          │
//    │                                │
//    SW ────────────────────────────── SE
//                 25'-0"

// ─── Constants ──────────────────────────────────────────────────────────────
const EXT = 0.5   // exterior wall thickness
const INT = 0.33  // interior wall thickness
const WALL_H = 8.5

const HW = 12.5   // half of 25' main body width
const HD = 13.125  // half of 26'-3" main body depth

// Exterior face coordinates
const W_WALL = -HW            // -12.5
const E_WALL = HW             //  12.5
const BUMP_E = 21.17          //  bump-out east face
const S_WALL = HD             //  13.125
const N_WALL = -HD            // -13.125
const NOTCH_X = -5.13         //  notch N-S wall X
const NOTCH_Z = N_WALL + 1.5  // -11.625 (Bed2 north wall, set back 1.5')
const STEP_Z = -1.0           //  where bump-out begins on east wall

// Interior key coordinates
const PARTITION_Z = -0.5      // E-W partition separating north from south
const HALL_OPEN_L = -4.0      // hallway opening left edge
const HALL_OPEN_R = 0.0       // hallway opening right edge

// Bed2/Bath divider continues south from NOTCH_X as interior wall
const X_BED2_BATH = NOTCH_X                                   // -5.13
// Bath east wall: bath is 5.375' wide interior
const X_BATH_EAST = X_BED2_BATH + INT / 2 + 5.375 + INT / 2  // ~0.535
// Bath south wall Z: 7' south from north interior face at N_WALL
const BATH_N_INTERIOR = N_WALL + EXT / 2                       // -12.875
const BATH_S_Z = BATH_N_INTERIOR + 7.0                         // -5.875
// Bed1 closet wall: 2' deep closet at the south end of Bed1
const BED1_CLOSET_Z = PARTITION_Z - 2.0                        // -2.5

// Colors
const MAT = {
  exterior:   '#c8a882',
  interior:   '#f0e8d8',
  floor:      '#b8935a',
  roof:       '#5c3d1e',
  roofFascia: '#3d2710',
  window:     '#a8d4e8',
  door:       '#6b4c2a',
  trim:       '#e8e0d0',
  concrete:   '#9e9e9e',
  fireplace:  '#2a2a2a',
}

// ─── Helpers ────────────────────────────────────────────────────────────────
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
      {/* Concrete pad */}
      <mesh position={[0, -0.1, depth / 2]} receiveShadow>
        <boxGeometry args={[width + 0.5, 0.25, depth + 0.5]} />
        <meshStandardMaterial color={MAT.concrete} roughness={0.95} />
      </mesh>
      {/* Corner posts */}
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
      {/* Front beam */}
      <mesh position={[0, postH + 0.4, outerZ]}>
        <boxGeometry args={[width + 0.3, 0.5, 0.4]} />
        <meshStandardMaterial color={MAT.trim} roughness={0.6} />
      </mesh>
      {/* Side beams */}
      {[-hw, hw].map((px, i) => (
        <mesh key={`s-${i}`} position={[px, postH + 0.4, outerZ / 2]}>
          <boxGeometry args={[0.3, 0.5, outerZ + 0.4]} />
          <meshStandardMaterial color={MAT.trim} roughness={0.6} />
        </mesh>
      ))}
      {/* Porch roof */}
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

// ─── Foundation (L-shaped) ──────────────────────────────────────────────────
function Foundation() {
  // Main body: full 25' wide, from NOTCH_Z to S_WALL
  const mainCX = (W_WALL + E_WALL) / 2
  const mainCZ = (NOTCH_Z + S_WALL) / 2
  const mainW = E_WALL - W_WALL + 1
  const mainD = S_WALL - NOTCH_Z + 1

  // NE deep section: from NOTCH_X to BUMP_E, from N_WALL to NOTCH_Z
  const neCX = (NOTCH_X + BUMP_E) / 2
  const neCZ = (N_WALL + NOTCH_Z) / 2
  const neW = BUMP_E - NOTCH_X + 1
  const neD = NOTCH_Z - N_WALL + 1

  return (
    <group>
      <mesh position={[mainCX, -0.75, mainCZ]} receiveShadow>
        <boxGeometry args={[mainW, 1.5, mainD]} />
        <meshStandardMaterial color={MAT.concrete} roughness={0.95} />
      </mesh>
      <mesh position={[neCX, -0.75, neCZ]} receiveShadow>
        <boxGeometry args={[neW, 1.5, neD]} />
        <meshStandardMaterial color={MAT.concrete} roughness={0.95} />
      </mesh>
    </group>
  )
}

// ─── Floor (L-shaped) ───────────────────────────────────────────────────────
function InteriorFloor() {
  // Main body floor (inset by half exterior wall)
  const mainW = (E_WALL - W_WALL) - EXT
  const mainD = (S_WALL - NOTCH_Z) - EXT
  const mainCX = (W_WALL + E_WALL) / 2
  const mainCZ = (NOTCH_Z + S_WALL) / 2

  // NE section floor
  const neW = (BUMP_E - NOTCH_X) - EXT
  const neD = (NOTCH_Z - N_WALL) - EXT
  const neCX = (NOTCH_X + BUMP_E) / 2
  const neCZ = (N_WALL + NOTCH_Z) / 2

  return (
    <group>
      <mesh position={[mainCX, 0.02, mainCZ]} receiveShadow>
        <boxGeometry args={[mainW, 0.12, mainD]} />
        <meshStandardMaterial color={MAT.floor} roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[neCX, 0.02, neCZ]} receiveShadow>
        <boxGeometry args={[neW, 0.12, neD]} />
        <meshStandardMaterial color={MAT.floor} roughness={0.7} metalness={0.05} />
      </mesh>
    </group>
  )
}

// ─── Exterior Walls (8 segments, L-shaped) ──────────────────────────────────
function ExteriorWalls() {
  // Front door dead center of south wall
  const doorX = 0.0
  const doorW = 3.0
  const doorH = 6.83
  const headerH = WALL_H - doorH

  return (
    <group>
      {/* 1. South wall — SW to SE, with centered front door */}
      {/* Left of door */}
      <Wall
        position={[(W_WALL + (doorX - doorW / 2)) / 2, WALL_H / 2, S_WALL]}
        size={[(doorX - doorW / 2) - W_WALL, WALL_H, EXT]}
      />
      {/* Right of door */}
      <Wall
        position={[((doorX + doorW / 2) + E_WALL) / 2, WALL_H / 2, S_WALL]}
        size={[E_WALL - (doorX + doorW / 2), WALL_H, EXT]}
      />
      {/* Header above door */}
      <Wall
        position={[doorX, WALL_H - headerH / 2, S_WALL]}
        size={[doorW, headerH, EXT]}
      />

      {/* 2. East wall (main) — SE to step at STEP_Z */}
      <Wall
        position={[E_WALL, WALL_H / 2, (S_WALL + STEP_Z) / 2]}
        size={[EXT, WALL_H, S_WALL - STEP_Z]}
      />

      {/* 3. Step wall — E-W from main east to bump east */}
      <Wall
        position={[(E_WALL + BUMP_E) / 2, WALL_H / 2, STEP_Z]}
        size={[BUMP_E - E_WALL, WALL_H, EXT]}
      />

      {/* 4. Bump east wall — STEP_Z to N_WALL */}
      <Wall
        position={[BUMP_E, WALL_H / 2, (STEP_Z + N_WALL) / 2]}
        size={[EXT, WALL_H, Math.abs(STEP_Z - N_WALL)]}
      />

      {/* 5. North wall east section — BUMP_E to NOTCH_X */}
      <Wall
        position={[(BUMP_E + NOTCH_X) / 2, WALL_H / 2, N_WALL]}
        size={[BUMP_E - NOTCH_X, WALL_H, EXT]}
      />

      {/* 6. Notch N-S wall — steps south from N_WALL to NOTCH_Z */}
      <Wall
        position={[NOTCH_X, WALL_H / 2, (N_WALL + NOTCH_Z) / 2]}
        size={[EXT, WALL_H, NOTCH_Z - N_WALL]}
      />

      {/* 7. North wall west section — NOTCH_X to W_WALL at NOTCH_Z */}
      <Wall
        position={[(NOTCH_X + W_WALL) / 2, WALL_H / 2, NOTCH_Z]}
        size={[NOTCH_X - W_WALL, WALL_H, EXT]}
      />

      {/* 8. West wall — NOTCH_Z to S_WALL */}
      <Wall
        position={[W_WALL, WALL_H / 2, (NOTCH_Z + S_WALL) / 2]}
        size={[EXT, WALL_H, S_WALL - NOTCH_Z]}
      />
    </group>
  )
}

// ─── Interior Walls ─────────────────────────────────────────────────────────
function InteriorWalls() {
  return (
    <group>
      {/* ── E-W Partition (Z = -0.5) — divides north bedrooms from south living ── */}
      {/* West segment: W_WALL to hallway opening */}
      <Wall
        position={[(W_WALL + EXT / 2 + HALL_OPEN_L) / 2, WALL_H / 2, PARTITION_Z]}
        size={[HALL_OPEN_L - (W_WALL + EXT / 2), WALL_H, INT]}
        color={MAT.interior} castShadow={false}
      />
      {/* East segment: hallway opening to E_WALL */}
      <Wall
        position={[(HALL_OPEN_R + E_WALL - EXT / 2) / 2, WALL_H / 2, PARTITION_Z]}
        size={[(E_WALL - EXT / 2) - HALL_OPEN_R, WALL_H, INT]}
        color={MAT.interior} castShadow={false}
      />

      {/* ── N-S: Entry/WD | Bathroom wall (continues south from notch at NOTCH_X) ── */}
      <Wall
        position={[X_BED2_BATH, WALL_H / 2, (NOTCH_Z + PARTITION_Z) / 2]}
        size={[INT, WALL_H, Math.abs(PARTITION_Z - NOTCH_Z)]}
        color={MAT.interior} castShadow={false}
      />

      {/* ── N-S: Bathroom | Bedroom 1 east wall ── */}
      <Wall
        position={[X_BATH_EAST, WALL_H / 2, (N_WALL + PARTITION_Z) / 2]}
        size={[INT, WALL_H, Math.abs(PARTITION_Z - N_WALL)]}
        color={MAT.interior} castShadow={false}
      />

      {/* ── N-S: Bedroom 1 | Bedroom 2 (at main east wall X=12.5) ── */}
      {/* This interior wall runs from N_WALL to STEP_Z where the bump starts */}
      <Wall
        position={[E_WALL, WALL_H / 2, (N_WALL + STEP_Z) / 2]}
        size={[INT, WALL_H, Math.abs(STEP_Z - N_WALL)]}
        color={MAT.interior} castShadow={false}
      />

      {/* ── E-W: Bathroom south wall ── */}
      {/* Spans from Entry/WD divider to Bath/Bed1 divider */}
      <Wall
        position={[(X_BED2_BATH + X_BATH_EAST) / 2, WALL_H / 2, BATH_S_Z]}
        size={[X_BATH_EAST - X_BED2_BATH, WALL_H, INT]}
        color={MAT.interior} castShadow={false}
      />

      {/* ── E-W: Bedroom 1 closet wall (2' deep closet at south end) ── */}
      {/* Spans Bed1 width: from X_BATH_EAST to E_WALL */}
      <Wall
        position={[(X_BATH_EAST + E_WALL) / 2, WALL_H / 2, BED1_CLOSET_Z]}
        size={[E_WALL - X_BATH_EAST, WALL_H, INT]}
        color={MAT.interior} castShadow={false}
      />

      {/* ── Entry hall closet wall (6' wide closet inset on west wall) ── */}
      {/* The closet is 6' wide on the west wall of the Entry/WD room */}
      {/* Closet depth ~2', runs N-S near the west wall */}
      <Wall
        position={[W_WALL + EXT / 2 + 2.0, WALL_H / 2, (NOTCH_Z + NOTCH_Z + 6.0) / 2]}
        size={[INT, WALL_H, 6.0]}
        color={MAT.interior} castShadow={false}
      />
      {/* Closet south return wall */}
      <Wall
        position={[(W_WALL + EXT / 2 + W_WALL + EXT / 2 + 2.0) / 2, WALL_H / 2, NOTCH_Z + 6.0]}
        size={[2.0, WALL_H, INT]}
        color={MAT.interior} castShadow={false}
      />
    </group>
  )
}

// ─── Doors & Windows ────────────────────────────────────────────────────────
function OpeningsAndDoors() {
  const sZ = S_WALL + 0.01
  const nZ_deep = N_WALL - 0.01
  const nZ_notch = NOTCH_Z - 0.01
  const wX = W_WALL - 0.01
  const eX = E_WALL + 0.01
  const bumpEX = BUMP_E + 0.01

  return (
    <group>
      {/* ── Front door — dead center of south wall ── */}
      <DoorMesh position={[0, 6.83 / 2, sZ]} width={3.0} height={6.83} />

      {/* ── South wall windows (EAST of door) ── */}
      <WindowMesh position={[5.0, 4.5, sZ]} width={4.0} height={4.0} />
      <WindowMesh position={[10.0, 4.5, sZ]} width={3.0} height={3.5} />

      {/* South wall window — west side (kitchen) */}
      <WindowMesh position={[-7.5, 4.5, sZ]} width={4.0} height={3.5} />

      {/* ── West wall windows ── */}
      {/* Kitchen area */}
      <WindowMesh position={[wX, 4.5, 5.0]} rotation={[0, -Math.PI / 2, 0]} width={3.0} height={3.5} />
      {/* Entry/WD area */}
      <WindowMesh position={[wX, 4.5, -5.0]} rotation={[0, -Math.PI / 2, 0]} width={2.5} height={3.0} />

      {/* ── East wall window (living area, below step) ── */}
      <WindowMesh position={[eX, 4.5, 6.0]} rotation={[0, Math.PI / 2, 0]} width={3.5} height={3.5} />

      {/* ── Bump east wall windows (Bedroom 2) ── */}
      <WindowMesh position={[bumpEX, 4.5, -7.0]} rotation={[0, Math.PI / 2, 0]} width={3.0} height={3.5} />

      {/* ── North wall windows — deep section ── */}
      {/* Bedroom 1 */}
      <WindowMesh position={[5.5, 4.5, nZ_deep]} rotation={[0, Math.PI, 0]} width={3.0} height={3.5} />
      {/* Bedroom 2 */}
      <WindowMesh position={[17.0, 4.5, nZ_deep]} rotation={[0, Math.PI, 0]} width={3.0} height={3.5} />
      {/* Bathroom (small high window) */}
      <WindowMesh position={[-2.5, 5.5, nZ_deep]} rotation={[0, Math.PI, 0]} width={2.0} height={2.0} />

      {/* ── North wall window — notch section (Entry/WD) ── */}
      <WindowMesh position={[-9.0, 4.5, nZ_notch]} rotation={[0, Math.PI, 0]} width={3.0} height={3.0} />

      {/* ── Step wall window (south face of bump-out) ── */}
      <WindowMesh position={[(E_WALL + BUMP_E) / 2, 4.5, STEP_Z + 0.01]} width={3.0} height={3.0} />
    </group>
  )
}

// ─── Electric Fireplace ─────────────────────────────────────────────────────
function ElectricFireplace() {
  // Thin dark box on the east interior wall of the living area
  const fpX = E_WALL - EXT / 2 - 0.15
  return (
    <mesh position={[fpX, 3.5, 6.0]} receiveShadow>
      <boxGeometry args={[0.4, 3.5, 4.0]} />
      <meshStandardMaterial color={MAT.fireplace} roughness={0.4} metalness={0.1} />
    </mesh>
  )
}

// ─── Roof (split gable from floorplan-data.json) ────────────────────────────
function SplitGableRoof() {
  const overhang = data.roof.overhang || 1.0
  const panelThick = 0.4
  const panelDepth = 26.25 + overhang * 2

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
            {/* West slope */}
            <mesh
              position={[(sec.westEaveX + sec.ridgeX) / 2, sec.eaveHeight + rise / 2, 0]}
              rotation={[0, 0, wAngle]}
              castShadow receiveShadow
            >
              <boxGeometry args={[wHyp, panelThick, panelDepth]} />
              <meshStandardMaterial color={MAT.roof} roughness={0.9} />
            </mesh>
            {/* East slope */}
            <mesh
              position={[(sec.ridgeX + sec.eastEaveX) / 2, sec.eaveHeight + rise / 2, 0]}
              rotation={[0, 0, -eAngle]}
              castShadow receiveShadow
            >
              <boxGeometry args={[eHyp, panelThick, panelDepth]} />
              <meshStandardMaterial color={MAT.roof} roughness={0.9} />
            </mesh>
            {/* Ridge cap */}
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
          {/* South gable */}
          <mesh position={[0, 0, S_WALL + 0.5]}>
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial color={MAT.exterior} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          {/* North gable */}
          <mesh position={[0, 0, N_WALL - 0.5]}>
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial color={MAT.exterior} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── Root Component ─────────────────────────────────────────────────────────
export default function ADUModel({ roofVisible = true }) {
  // Front entry porch: 6' deep × 15'-10.5" wide, east edge flush with SE (X=12.5)
  const frontPorchW = 15.875
  const frontPorchX = E_WALL - frontPorchW / 2  // center X so east edge = 12.5

  // NW covered porch: 13'-1" wide × 5' deep, extends north from notch area
  // Wider than the notch — overhangs in front of bathroom's north wall too
  // Center it so west edge aligns with W_WALL
  const nwPorchW = 13.083
  const nwPorchX = W_WALL + nwPorchW / 2

  return (
    <group>
      <Foundation />
      <InteriorFloor />
      <ExteriorWalls />
      <InteriorWalls />
      <OpeningsAndDoors />
      <ElectricFireplace />
      {roofVisible && <SplitGableRoof />}

      {/* Front entry porch — 15'-10.5" wide × 6' deep, east edge at SE corner */}
      <CoveredPorch
        position={[frontPorchX, 0, S_WALL]}
        width={frontPorchW}
        depth={6}
        roofVisible={roofVisible}
      />

      {/* NW covered porch — 13'-1" wide × 5' deep, extends north */}
      <CoveredPorch
        position={[nwPorchX, 0, NOTCH_Z]}
        rotation={[0, Math.PI, 0]}
        width={nwPorchW}
        depth={5}
        roofVisible={roofVisible}
      />
    </group>
  )
}
