import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * 112 Allissia — Coach House
 * 795 sq ft, 25'-0" wide x 26'-3" deep
 * All units in feet (1 Three.js unit = 1 foot)
 *
 * Coordinate system (looking down):
 *   +X = East,  -X = West
 *   +Z = South, -Z = North
 *   +Y = Up
 *
 * Floor plan layout (from drawings):
 *   NW: Bedroom 2 + Laundry     (~10' x 11.3')
 *   N center: Bathroom           (~5.5' x 10.5')
 *   NE: Bedroom 1                (~8.5' x 13')
 *   S open: Living / Kitchen     (~25' x 13', vaulted ceiling)
 *   Center: Entry / Hallway
 */

// ─── Dimensions ────────────────────────────────────────────────────────────────
const W = 25        // total width (E-W)
const D = 26.25     // total depth (N-S)
const WALL_H = 8.5  // standard wall height
const VAULT_H = 11  // vaulted section peak
const ROOF_PEAK = WALL_H + 4.5  // gable peak above floor
const T = 0.5       // wall thickness

// Half extents
const HW = W / 2   // 12.5
const HD = D / 2   // 13.125

// Colors — swap these out for texture maps later
const MAT = {
  exterior:    '#c8a882',  // warm siding
  interior:    '#f0e8d8',  // drywall white
  floor:       '#b8935a',  // hardwood
  roof:        '#5c3d1e',  // dark shingle
  roofFascia:  '#3d2710',
  window:      '#a8d4e8',  // glass tint
  door:        '#6b4c2a',  // wood door
  trim:        '#e8e0d0',
  concrete:    '#9e9e9e',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function Wall({ position, size, color = MAT.exterior, castShadow = true }) {
  return (
    <mesh position={position} castShadow={castShadow} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.02} />
    </mesh>
  )
}

function Window({ position, rotation = [0, 0, 0], width = 3, height = 3.5 }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[width + 0.3, height + 0.3, 0.3]} />
        <meshStandardMaterial color={MAT.trim} roughness={0.6} />
      </mesh>
      {/* Glass */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[width, height, 0.15]} />
        <meshStandardMaterial
          color={MAT.window}
          transparent
          opacity={0.45}
          roughness={0.05}
          metalness={0.1}
        />
      </mesh>
    </group>
  )
}

function Door({ position, rotation = [0, 0, 0], width = 3, height = 7 }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[width + 0.4, height + 0.2, 0.35]} />
        <meshStandardMaterial color={MAT.trim} roughness={0.6} />
      </mesh>
      {/* Door panel */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[width, height, 0.2]} />
        <meshStandardMaterial color={MAT.door} roughness={0.8} />
      </mesh>
    </group>
  )
}

// ─── Gabled Roof ───────────────────────────────────────────────────────────────
function GabledRoof() {
  // Ridge runs N-S (Z axis), peak at X=0
  // Pitch: 4.5' rise over 12.5' run
  const run = HW           // 12.5
  const rise = ROOF_PEAK - WALL_H  // 4.5
  const slopeAngle = Math.atan2(rise, run)
  const panelWidth = Math.sqrt(run * run + rise * rise)  // hypotenuse
  const panelDepth = D + 1.5  // overhang front & back
  const panelThick = 0.4

  // Center of each slope panel
  const centerX = run / 2       // 6.25
  const centerY = WALL_H + rise / 2  // 8.5 + 2.25 = 10.75

  // Gable-end triangle shape
  const gableShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-HW - 0.1, WALL_H)
    s.lineTo(0, ROOF_PEAK)
    s.lineTo(HW + 0.1, WALL_H)
    s.closePath()
    return s
  }, [])

  return (
    <group>
      {/* West slope */}
      <mesh
        position={[-centerX, centerY, 0]}
        rotation={[0, 0, slopeAngle]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[panelWidth, panelThick, panelDepth]} />
        <meshStandardMaterial color={MAT.roof} roughness={0.9} />
      </mesh>

      {/* East slope */}
      <mesh
        position={[centerX, centerY, 0]}
        rotation={[0, 0, -slopeAngle]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[panelWidth, panelThick, panelDepth]} />
        <meshStandardMaterial color={MAT.roof} roughness={0.9} />
      </mesh>

      {/* Ridge cap */}
      <mesh position={[0, ROOF_PEAK + 0.1, 0]} castShadow>
        <boxGeometry args={[0.6, 0.3, panelDepth]} />
        <meshStandardMaterial color={MAT.roofFascia} roughness={0.9} />
      </mesh>

      {/* Gable end — South */}
      <mesh position={[0, 0, HD + 0.75]} rotation={[Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[gableShape]} />
        <meshStandardMaterial color={MAT.exterior} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Gable end — North */}
      <mesh position={[0, 0, -HD - 0.75]} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[gableShape]} />
        <meshStandardMaterial color={MAT.exterior} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ─── Foundation ────────────────────────────────────────────────────────────────
function Foundation() {
  return (
    <mesh position={[0, -0.75, 0]} receiveShadow>
      <boxGeometry args={[W + 1, 1.5, D + 1]} />
      <meshStandardMaterial color={MAT.concrete} roughness={0.95} />
    </mesh>
  )
}

// ─── Interior Floor ────────────────────────────────────────────────────────────
function InteriorFloor() {
  return (
    <mesh position={[0, 0.02, 0]} receiveShadow>
      <boxGeometry args={[W - T, 0.12, D - T]} />
      <meshStandardMaterial color={MAT.floor} roughness={0.7} metalness={0.05} />
    </mesh>
  )
}

// ─── Exterior Walls ────────────────────────────────────────────────────────────
function ExteriorWalls() {
  return (
    <group>
      {/* South wall — front facade with door + windows */}
      {/* West section of south wall */}
      <Wall
        position={[-7.5, WALL_H / 2, HD]}
        size={[8, WALL_H, T]}
      />
      {/* Door opening: centered around X=-3.5 */}
      {/* East of door on south wall */}
      <Wall
        position={[5.5, WALL_H / 2, HD]}
        size={[13, WALL_H, T]}
      />
      {/* Above door on south wall */}
      <Wall
        position={[-3.5, WALL_H - 1, HD]}
        size={[3.5, 2, T]}
      />

      {/* North wall */}
      <Wall position={[0, WALL_H / 2, -HD]} size={[W, WALL_H, T]} />

      {/* West wall */}
      <Wall position={[-HW, WALL_H / 2, 0]} size={[T, WALL_H, D]} />

      {/* East wall with electric fireplace niche */}
      <Wall position={[HW, WALL_H / 2, 0]} size={[T, WALL_H, D]} />
    </group>
  )
}

// ─── Interior Walls ────────────────────────────────────────────────────────────
/**
 * Simplified interior partitions based on floor plan:
 *   - N-S dividing wall separating bedrooms from living area (Z ≈ -0.5)
 *   - E-W wall separating bedroom 2 from bathroom (X ≈ -2.5)
 *   - E-W wall separating bathroom from bedroom 1 corridor (X ≈ 3)
 */
function InteriorWalls() {
  return (
    <group>
      {/* Main E-W partition — separates N bedrooms from S living area */}
      {/* West half */}
      <Wall
        position={[-5.5, WALL_H / 2, -0.5]}
        size={[13.5, WALL_H, T]}
        color={MAT.interior}
        castShadow={false}
      />
      {/* Door gap ~3' centered around X=0 */}
      {/* East half */}
      <Wall
        position={[5.5, WALL_H / 2, -0.5]}
        size={[6, WALL_H, T]}
        color={MAT.interior}
        castShadow={false}
      />
      {/* Above door header */}
      <Wall
        position={[0, WALL_H - 1, -0.5]}
        size={[4, 2, T]}
        color={MAT.interior}
        castShadow={false}
      />

      {/* N-S partition — bedroom 2 / laundry vs bathroom (X ≈ -2.5) */}
      <Wall
        position={[-2.5, WALL_H / 2, (-HD - 0.5) / 2]}
        size={[T, WALL_H, HD - 0.5]}
        color={MAT.interior}
        castShadow={false}
      />

      {/* N-S partition — bathroom vs bedroom 1 corridor (X ≈ 3.5) */}
      {/* North section up to partition */}
      <Wall
        position={[3.5, WALL_H / 2, -4.5]}
        size={[T, WALL_H, 8]}
        color={MAT.interior}
        castShadow={false}
      />

      {/* Bathroom inner walls hint */}
      <Wall
        position={[0.5, WALL_H / 2, -8]}
        size={[6, WALL_H, T]}
        color={MAT.interior}
        castShadow={false}
      />
    </group>
  )
}

// ─── Windows & Doors ──────────────────────────────────────────────────────────
function OpeningsAndDoors() {
  const southZ = HD + 0.01
  const northZ = -HD - 0.01
  const westX  = -HW - 0.01
  const eastX  =  HW + 0.01

  return (
    <group>
      {/* === SOUTH (FRONT) FACADE === */}
      {/* Front door — slightly west of center */}
      <Door
        position={[-3.5, 3.5, southZ]}
        rotation={[0, 0, 0]}
        width={3}
        height={7}
      />
      {/* Large triple window — living area, east side of front */}
      <Window position={[6, 4.5, southZ]} rotation={[0, 0, 0]} width={6} height={4} />
      {/* Single window — west bedroom */}
      <Window position={[-9.5, 4.5, southZ]} rotation={[0, 0, 0]} width={2.5} height={3.5} />

      {/* === NORTH (REAR) FACADE === */}
      {/* Bedroom 1 — rear window */}
      <Window position={[7.5, 4.5, northZ]} rotation={[0, Math.PI, 0]} width={3} height={3.5} />
      {/* Sliding patio / rear door to living */}
      <Door
        position={[-4, 3.5, northZ]}
        rotation={[0, Math.PI, 0]}
        width={4}
        height={7}
      />
      {/* Laundry / utility window */}
      <Window position={[-9, 4.5, northZ]} rotation={[0, Math.PI, 0]} width={2} height={2} />

      {/* === WEST WALL === */}
      <Window position={[westX, 4.5, -6]} rotation={[0, -Math.PI / 2, 0]} width={2.5} height={3.5} />

      {/* === EAST WALL === */}
      {/* Bedroom 1 east window */}
      <Window position={[eastX, 4.5, -5]} rotation={[0, Math.PI / 2, 0]} width={3} height={3.5} />
      {/* Living area east window */}
      <Window position={[eastX, 4.5, 6]} rotation={[0, Math.PI / 2, 0]} width={3} height={3.5} />
    </group>
  )
}

// ─── Deck / Step ──────────────────────────────────────────────────────────────
function FrontStep() {
  return (
    <group>
      {/* Small concrete step at front door */}
      <mesh position={[-3.5, -0.15, HD + 2]} receiveShadow>
        <boxGeometry args={[5, 0.3, 3]} />
        <meshStandardMaterial color={MAT.concrete} roughness={0.95} />
      </mesh>
    </group>
  )
}

// ─── Root Component ────────────────────────────────────────────────────────────
export default function ADUModel() {
  return (
    <group position={[0, 0, 0]}>
      <Foundation />
      <InteriorFloor />
      <ExteriorWalls />
      <InteriorWalls />
      <OpeningsAndDoors />
      <GabledRoof />
      <FrontStep />
    </group>
  )
}
