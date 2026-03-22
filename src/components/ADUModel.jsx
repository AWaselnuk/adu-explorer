import { useMemo } from 'react'
import * as THREE from 'three'
import data from '../floorplan-data.json'

// ─── Building Footprint ──────────────────────────────────────────────────────
// L-shaped with NE bump-out (Bed1) and NW notch (porch recess).
//
// Outline (viewed from above, +Z = south):
//
//       NOTCH_X
//          │
//   NW ────┤ notch ├──────────────── BUMP NE
//   │porch │       │  Room  │  Bed1  │
//   ├──────┘       │        │        │
//   │ Bed2 │ Bath  │        │        │
//   │      │       │        ├────────┘ BUMP SE
//   │   Hallway    │        │
//   ├──────────────┴────────┤
//   │                       │
//   │   Living / Kitchen    │
//   │                       │
//   SW ─────────────────── SE
//            25'-0"

const EXT = 0.5
const INT = 0.33
const WALL_H = 8.5
const HW = 12.5    // half of 25' main body width
const HD = 13.125  // half of 26'-3" main body depth

// ── Key X coordinates (exterior faces) ──
const W_WALL  = -HW          // -12.5  west exterior
const E_WALL  =  HW          //  12.5  main east exterior
const BUMP_E  =  HW + 8.417 + EXT / 2  // ~21.17  bump-out east exterior

// NW notch X: only Bed2 is set back, not Bath. Porch extends past notch.
const NOTCH_X = -5.127  // Bed2/Bath wall — notch is ~7.4' wide, porch (13'1") extends past it

// ── Key Z coordinates (exterior faces) ──
const S_WALL  =  HD          //  13.125  south exterior
const N_WALL  = -HD          // -13.125  north exterior (Room/Bed1 section)
const NOTCH_Z = N_WALL + 1.5 // -11.625  north wall of Bed2 (set back ~1.5' from Room/Bed1 north wall)

// East wall step: where the bump-out begins (roughly at the partition line)
const STEP_Z  = -1.0

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

// ─── Foundation (L-shaped) ───────────────────────────────────────────────────
function Foundation() {
  return (
    <group>
      {/* Main body */}
      <mesh position={[0, -0.75, (S_WALL + NOTCH_Z) / 2]} receiveShadow>
        <boxGeometry args={[25 + 1, 1.5, S_WALL - NOTCH_Z + 1]} />
        <meshStandardMaterial color={MAT.concrete} roughness={0.95} />
      </mesh>
      {/* North-east deep section (Room + Bed1) */}
      <mesh position={[(NOTCH_X + BUMP_E) / 2, -0.75, (NOTCH_Z + N_WALL) / 2]} receiveShadow>
        <boxGeometry args={[BUMP_E - NOTCH_X + 1, 1.5, NOTCH_Z - N_WALL + 1]} />
        <meshStandardMaterial color={MAT.concrete} roughness={0.95} />
      </mesh>
    </group>
  )
}

// ─── Floor (L-shaped) ────────────────────────────────────────────────────────
function InteriorFloor() {
  return (
    <group>
      {/* Main body floor */}
      <mesh position={[0, 0.02, (S_WALL + NOTCH_Z) / 2]} receiveShadow>
        <boxGeometry args={[25 - EXT, 0.12, S_WALL - NOTCH_Z - EXT]} />
        <meshStandardMaterial color={MAT.floor} roughness={0.7} metalness={0.05} />
      </mesh>
      {/* NE deep section floor */}
      <mesh position={[(NOTCH_X + BUMP_E) / 2, 0.02, (NOTCH_Z + N_WALL) / 2]} receiveShadow>
        <boxGeometry args={[BUMP_E - NOTCH_X - EXT, 0.12, NOTCH_Z - N_WALL - EXT]} />
        <meshStandardMaterial color={MAT.floor} roughness={0.7} metalness={0.05} />
      </mesh>
    </group>
  )
}

// ─── Exterior Walls (8-segment L-shape) ──────────────────────────────────────
function ExteriorWalls() {
  // Front door at X=3
  const doorX = 3.0
  const doorW = 3.0
  const doorH = 6.83
  const headerH = WALL_H - doorH

  return (
    <group>
      {/* 1. South wall (25' wide, with door) */}
      <Wall position={[(W_WALL + doorX - doorW / 2) / 2, WALL_H / 2, S_WALL]} size={[doorX - doorW / 2 - W_WALL, WALL_H, EXT]} />
      <Wall position={[(doorX + doorW / 2 + E_WALL) / 2, WALL_H / 2, S_WALL]} size={[E_WALL - doorX - doorW / 2, WALL_H, EXT]} />
      <Wall position={[doorX, WALL_H - headerH / 2, S_WALL]} size={[doorW, headerH, EXT]} />

      {/* 2. Main east wall — from south to STEP_Z */}
      <Wall
        position={[E_WALL, WALL_H / 2, (S_WALL + STEP_Z) / 2]}
        size={[EXT, WALL_H, S_WALL - STEP_Z]}
      />

      {/* 3. Step wall — E-W connecting main east to bump east */}
      <Wall
        position={[(E_WALL + BUMP_E) / 2, WALL_H / 2, STEP_Z]}
        size={[BUMP_E - E_WALL, WALL_H, EXT]}
      />

      {/* 4. Bump-out east wall — from STEP_Z to north */}
      <Wall
        position={[BUMP_E, WALL_H / 2, (STEP_Z + N_WALL) / 2]}
        size={[EXT, WALL_H, Math.abs(N_WALL - STEP_Z)]}
      />

      {/* 5. North wall east section — from BUMP_E to NOTCH_X */}
      <Wall
        position={[(BUMP_E + NOTCH_X) / 2, WALL_H / 2, N_WALL]}
        size={[BUMP_E - NOTCH_X, WALL_H, EXT]}
      />

      {/* 6. Notch wall (N-S) — steps south from N_WALL to NOTCH_Z */}
      <Wall
        position={[NOTCH_X, WALL_H / 2, (N_WALL + NOTCH_Z) / 2]}
        size={[EXT, WALL_H, NOTCH_Z - N_WALL]}
      />

      {/* 7. North wall west section (Bed2/Bath) — from NOTCH_X to west */}
      <Wall
        position={[(NOTCH_X + W_WALL) / 2, WALL_H / 2, NOTCH_Z]}
        size={[NOTCH_X - W_WALL, WALL_H, EXT]}
      />

      {/* 8. West wall — from NOTCH_Z to south */}
      <Wall
        position={[W_WALL, WALL_H / 2, (NOTCH_Z + S_WALL) / 2]}
        size={[EXT, WALL_H, S_WALL - NOTCH_Z]}
      />
    </group>
  )
}

// ─── Interior Walls ──────────────────────────────────────────────────────────
function InteriorWalls() {
  // N-S wall positions
  const X_BED2_BATH = NOTCH_X   // -5.127 (same as notch wall, continues south as interior)
  const X_BATH_ROOM = X_BED2_BATH + INT / 2 + 5.375 + INT / 2  // ~0.578
  const X_ROOM_BED1 = E_WALL    // 12.5 (at main east wall line)

  // E-W partition: separates bedrooms from living. ~13' living depth from south.
  const PZ = S_WALL - EXT / 2 - 13.0 - INT / 2  // ≈ -0.29
  // Bathroom south wall: 7' from Bed2 north interior face
  const BED2_NF = NOTCH_Z + EXT / 2  // Bed2 north interior
  const BATH_SZ = BED2_NF + 7.0 + INT / 2

  // Hallway opening in partition (~4' wide, centered around X = -2)
  const hallL = -4.0
  const hallR = 0.0

  return (
    <group>
      {/* ── E-W Partition ── */}
      {/* West of hallway (Bed2 south wall) */}
      <Wall position={[(W_WALL + hallL) / 2, WALL_H / 2, PZ]} size={[hallL - W_WALL, WALL_H, INT]} color={MAT.interior} castShadow={false} />
      {/* East of hallway (Room + Bed1 south wall, to main east wall) */}
      <Wall position={[(hallR + E_WALL) / 2, WALL_H / 2, PZ]} size={[E_WALL - hallR, WALL_H, INT]} color={MAT.interior} castShadow={false} />

      {/* ── N-S: Bed2 | Bath ── */}
      {/* This continues south from the exterior notch wall */}
      <Wall
        position={[X_BED2_BATH, WALL_H / 2, (NOTCH_Z + PZ) / 2]}
        size={[INT, WALL_H, Math.abs(PZ - NOTCH_Z)]}
        color={MAT.interior} castShadow={false}
      />

      {/* ── N-S: Bath | Room ── */}
      <Wall
        position={[X_BATH_ROOM, WALL_H / 2, (N_WALL + PZ) / 2]}
        size={[INT, WALL_H, Math.abs(PZ - N_WALL)]}
        color={MAT.interior} castShadow={false}
      />

      {/* ── N-S: Room | Bed1 (at main east wall line) ── */}
      <Wall
        position={[X_ROOM_BED1, WALL_H / 2, (N_WALL + STEP_Z) / 2]}
        size={[INT, WALL_H, Math.abs(STEP_Z - N_WALL)]}
        color={MAT.interior} castShadow={false}
      />

      {/* ── Bathroom south wall ── */}
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
  const sZ = S_WALL + 0.01
  const bumpEX = BUMP_E + 0.01
  const wX = W_WALL - 0.01

  return (
    <group>
      {/* Front door */}
      <DoorMesh position={[3.0, 6.83 / 2, sZ]} width={3.0} height={6.83} />

      {/* South windows */}
      <WindowMesh position={[-7.0, 4.5, sZ]} width={4.0} height={3.5} />
      <WindowMesh position={[9.0, 4.5, sZ]} width={4.0} height={4.0} />

      {/* North windows — east section */}
      <WindowMesh position={[6.0, 4.5, N_WALL - 0.01]} rotation={[0, Math.PI, 0]} width={3.0} height={3.5} />
      <WindowMesh position={[(E_WALL + BUMP_E) / 2, 4.5, N_WALL - 0.01]} rotation={[0, Math.PI, 0]} width={3.0} height={3.5} />

      {/* North windows — west section (Bed2) */}
      <WindowMesh position={[-8.0, 4.5, NOTCH_Z - 0.01]} rotation={[0, Math.PI, 0]} width={3.0} height={3.0} />

      {/* West wall windows */}
      <WindowMesh position={[wX, 4.5, -4.0]} rotation={[0, -Math.PI / 2, 0]} width={2.5} height={3.5} />
      <WindowMesh position={[wX, 4.5, 6.0]} rotation={[0, -Math.PI / 2, 0]} width={3.0} height={3.5} />

      {/* East wall window (living area) */}
      <WindowMesh position={[E_WALL + 0.01, 4.5, 6.0]} rotation={[0, Math.PI / 2, 0]} width={3.0} height={3.5} />

      {/* Bump east wall window (Bed1) */}
      <WindowMesh position={[bumpEX, 4.5, -7.0]} rotation={[0, Math.PI / 2, 0]} width={3.0} height={3.5} />
    </group>
  )
}

// ─── Electric Fireplace ──────────────────────────────────────────────────────
function ElectricFireplace() {
  const ef = E_WALL - EXT / 2 - 0.15
  return (
    <mesh position={[ef, 3.5, 3.0]} receiveShadow>
      <boxGeometry args={[0.5, 4.0, 3.0]} />
      <meshStandardMaterial color={MAT.fireplace} roughness={0.4} metalness={0.1} />
    </mesh>
  )
}

// ─── Roof ────────────────────────────────────────────────────────────────────
function SplitGableRoof() {
  const overhang = 1.0
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
          <mesh position={[0, 0, S_WALL + 0.5]}>
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial color={MAT.exterior} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, N_WALL - 0.5]}>
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
  // NW porch sits in the notch: centered between W_WALL and NOTCH_X
  const porchCenterX = (W_WALL + NOTCH_X) / 2

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
      <CoveredPorch position={[3.0, 0, S_WALL]} width={8} depth={6} roofVisible={roofVisible} />

      {/* NW porch — 13'-1" wide × 5' deep, extends north past the notch */}
      <CoveredPorch
        position={[(W_WALL + W_WALL + 13.083) / 2, 0, NOTCH_Z]}
        rotation={[0, Math.PI, 0]}
        width={13.083}
        depth={5}
        roofVisible={roofVisible}
      />
    </group>
  )
}
