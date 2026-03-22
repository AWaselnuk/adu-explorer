import { useMemo } from 'react'
import * as THREE from 'three'
import data from '../floorplan-data.json'

// ─── Dimensions from data spec ───────────────────────────────────────────────
const W = data.building.exteriorWidth       // 29.0
const D = data.building.exteriorDepth       // 27.42
const HW = data.building.halfWidth          // 14.5
const HD = data.building.halfDepth          // 13.71
const EXT = data.building.wallThickness.exterior  // 0.5
const INT = data.building.wallThickness.interior  // 0.42
const WALL_H = data.heights.standard        // 8.5
const VAULT_H = data.heights.vaultPeak      // 11.0

// Partition Z (E-W wall separating bedrooms from living area)
const PZ = -2.67

// N-S wall X positions
const NS_BED2_BATH = -3.92
const NS_BATH_CLOSET = 1.46
const NS_CLOSET_BED1 = 4.12

// Bathroom south wall Z
const BATH_SOUTH_Z = -5.96

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

function WallWithOpening({ position, size, openingWidth, openingHeight, color = MAT.exterior }) {
  const [wallW, wallH, wallD] = size
  const headerH = wallH - openingHeight
  const sideW = (wallW - openingWidth) / 2

  return (
    <group position={position}>
      {/* Left side */}
      {sideW > 0.01 && (
        <Wall
          position={[-(wallW - sideW) / 2, 0, 0]}
          size={[sideW, wallH, wallD]}
          color={color}
        />
      )}
      {/* Right side */}
      {sideW > 0.01 && (
        <Wall
          position={[(wallW - sideW) / 2, 0, 0]}
          size={[sideW, wallH, wallD]}
          color={color}
        />
      )}
      {/* Header above opening */}
      {headerH > 0.01 && (
        <Wall
          position={[0, (wallH - headerH) / 2, 0]}
          size={[openingWidth, headerH, wallD]}
          color={color}
        />
      )}
    </group>
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
  return (
    <mesh position={[0, -0.75, 0]} receiveShadow>
      <boxGeometry args={[W + 1, 1.5, D + 1]} />
      <meshStandardMaterial color={MAT.concrete} roughness={0.95} />
    </mesh>
  )
}

// ─── Interior Floor ──────────────────────────────────────────────────────────
function InteriorFloor() {
  return (
    <group>
      {/* Main floor */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[W - EXT, 0.12, D - EXT]} />
        <meshStandardMaterial color={MAT.floor} roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Bathroom tile floor */}
      <mesh position={[-1.23, 0.04, -9.71]} receiveShadow>
        <boxGeometry args={[4.96, 0.1, 7.29]} />
        <meshStandardMaterial color={MAT.tile} roughness={0.6} />
      </mesh>
    </group>
  )
}

// ─── Exterior Walls ──────────────────────────────────────────────────────────
function ExteriorWalls() {
  // South wall openings: front door at X=-5.0 (3' wide), windows at X=-9, 5.5, 10.5
  // Build south wall in segments around the door opening
  const doorX = -5.0
  const doorW = 3.0
  const doorH = 6.83

  // South wall: left of door, right of door, header above door
  const leftEnd = doorX - doorW / 2    // -6.5
  const rightStart = doorX + doorW / 2 // -3.5
  const leftW = leftEnd - (-HW)        // -6.5 - (-14.5) = 8.0
  const rightW = HW - rightStart       // 14.5 - (-3.5) = 18.0
  const headerH = WALL_H - doorH       // 1.67

  return (
    <group>
      {/* ── South wall (front) ── */}
      {/* Left of door */}
      <Wall
        position={[(-HW + leftEnd) / 2, WALL_H / 2, HD]}
        size={[leftW, WALL_H, EXT]}
      />
      {/* Right of door */}
      <Wall
        position={[(rightStart + HW) / 2, WALL_H / 2, HD]}
        size={[rightW, WALL_H, EXT]}
      />
      {/* Header above door */}
      <Wall
        position={[doorX, WALL_H - headerH / 2, HD]}
        size={[doorW, headerH, EXT]}
      />

      {/* ── North wall ── */}
      <Wall position={[0, WALL_H / 2, -HD]} size={[W, WALL_H, EXT]} />

      {/* ── West wall ── */}
      <Wall position={[-HW, WALL_H / 2, 0]} size={[EXT, WALL_H, D]} />

      {/* ── East wall ── */}
      <Wall position={[HW, WALL_H / 2, 0]} size={[EXT, WALL_H, D]} />
    </group>
  )
}

// ─── Interior Walls ──────────────────────────────────────────────────────────
function InteriorWalls() {
  // Hallway opening: 3' wide centered at X=0, from X=-1.5 to X=1.5
  const hallOpenW = 3.0
  const hallOpenCenter = 0

  // Door openings in partition walls
  const bed2DoorX = -5.5
  const bed2DoorW = 2.67
  const bed1DoorX = 5.5
  const bed1DoorW = 2.67
  const bathDoorX = -1.5
  const bathDoorW = 2.5
  const closetDoorX = 2.8
  const closetDoorW = 2.0
  const doorH = 6.67
  const headerH = WALL_H - doorH  // 1.83

  return (
    <group>
      {/* ═══ Main E-W Partition (Z = -2.67) ═══ */}

      {/* partition_w: south wall of Bedroom 2 — from west wall to NS_BED2_BATH */}
      {/* Split around bed2 door at X=-5.5, 2.67' wide */}
      {(() => {
        const segStart = -HW
        const segEnd = NS_BED2_BATH
        const segW = segEnd - segStart
        const dLeft = bed2DoorX - bed2DoorW / 2 - segStart
        const dRight = segEnd - (bed2DoorX + bed2DoorW / 2)
        return (
          <>
            {/* Left of bed2 door */}
            <Wall
              position={[segStart + dLeft / 2, WALL_H / 2, PZ]}
              size={[dLeft, WALL_H, INT]}
              color={MAT.interior}
              castShadow={false}
            />
            {/* Right of bed2 door */}
            <Wall
              position={[segEnd - dRight / 2, WALL_H / 2, PZ]}
              size={[dRight, WALL_H, INT]}
              color={MAT.interior}
              castShadow={false}
            />
            {/* Header above bed2 door */}
            <Wall
              position={[bed2DoorX, WALL_H - headerH / 2, PZ]}
              size={[bed2DoorW, headerH, INT]}
              color={MAT.interior}
              castShadow={false}
            />
          </>
        )
      })()}

      {/* partition_cw: west of hallway opening — from NS_BED2_BATH to X=-1.5 */}
      <Wall
        position={[(NS_BED2_BATH + (-hallOpenW / 2)) / 2, WALL_H / 2, PZ]}
        size={[(-hallOpenW / 2) - NS_BED2_BATH, WALL_H, INT]}
        color={MAT.interior}
        castShadow={false}
      />

      {/* partition_ce: east of hallway opening — from X=1.5 to NS_CLOSET_BED1 */}
      <Wall
        position={[(hallOpenW / 2 + NS_CLOSET_BED1) / 2, WALL_H / 2, PZ]}
        size={[NS_CLOSET_BED1 - hallOpenW / 2, WALL_H, INT]}
        color={MAT.interior}
        castShadow={false}
      />

      {/* partition_e: south wall of Bedroom 1 — from NS_CLOSET_BED1 to east wall */}
      {(() => {
        const segStart = NS_CLOSET_BED1
        const segEnd = HW
        const segW = segEnd - segStart
        const dLeft = bed1DoorX - bed1DoorW / 2 - segStart
        const dRight = segEnd - (bed1DoorX + bed1DoorW / 2)
        return (
          <>
            {/* Left of bed1 door */}
            <Wall
              position={[segStart + dLeft / 2, WALL_H / 2, PZ]}
              size={[dLeft, WALL_H, INT]}
              color={MAT.interior}
              castShadow={false}
            />
            {/* Right of bed1 door */}
            <Wall
              position={[segEnd - dRight / 2, WALL_H / 2, PZ]}
              size={[dRight, WALL_H, INT]}
              color={MAT.interior}
              castShadow={false}
            />
            {/* Header above bed1 door */}
            <Wall
              position={[bed1DoorX, WALL_H - headerH / 2, PZ]}
              size={[bed1DoorW, headerH, INT]}
              color={MAT.interior}
              castShadow={false}
            />
          </>
        )
      })()}

      {/* ═══ N-S Walls ═══ */}

      {/* N-S wall: Bedroom 2 | Bathroom (X = -3.92) */}
      <Wall
        position={[NS_BED2_BATH, WALL_H / 2, (-HD + PZ) / 2]}
        size={[INT, WALL_H, Math.abs(PZ - (-HD))]}
        color={MAT.interior}
        castShadow={false}
      />

      {/* N-S wall: Bathroom | Closet (X = 1.46) */}
      <Wall
        position={[NS_BATH_CLOSET, WALL_H / 2, (-HD + PZ) / 2]}
        size={[INT, WALL_H, Math.abs(PZ - (-HD))]}
        color={MAT.interior}
        castShadow={false}
      />

      {/* N-S wall: Closet | Bedroom 1 (X = 4.12) */}
      <Wall
        position={[NS_CLOSET_BED1, WALL_H / 2, (-HD + PZ) / 2]}
        size={[INT, WALL_H, Math.abs(PZ - (-HD))]}
        color={MAT.interior}
        castShadow={false}
      />

      {/* ═══ Bathroom South Wall (Z = -5.96) ═══ */}
      {/* Split around bath door at X=-1.5 (2.5' wide) and closet door at X=2.8 (2.0' wide) */}
      {(() => {
        const bsStart = NS_BED2_BATH
        const bsEnd = NS_CLOSET_BED1
        // Bath door
        const bdL = bathDoorX - bathDoorW / 2  // -2.75
        const bdR = bathDoorX + bathDoorW / 2  // -0.25
        // Closet door
        const cdL = closetDoorX - closetDoorW / 2  // 1.8
        const cdR = closetDoorX + closetDoorW / 2  // 3.8
        return (
          <>
            {/* Left of bath door */}
            <Wall
              position={[(bsStart + bdL) / 2, WALL_H / 2, BATH_SOUTH_Z]}
              size={[bdL - bsStart, WALL_H, INT]}
              color={MAT.interior}
              castShadow={false}
            />
            {/* Between bath door and closet door */}
            <Wall
              position={[(bdR + cdL) / 2, WALL_H / 2, BATH_SOUTH_Z]}
              size={[cdL - bdR, WALL_H, INT]}
              color={MAT.interior}
              castShadow={false}
            />
            {/* Right of closet door */}
            <Wall
              position={[(cdR + bsEnd) / 2, WALL_H / 2, BATH_SOUTH_Z]}
              size={[bsEnd - cdR, WALL_H, INT]}
              color={MAT.interior}
              castShadow={false}
            />
            {/* Header above bath door */}
            <Wall
              position={[bathDoorX, WALL_H - headerH / 2, BATH_SOUTH_Z]}
              size={[bathDoorW, headerH, INT]}
              color={MAT.interior}
              castShadow={false}
            />
            {/* Header above closet door */}
            <Wall
              position={[closetDoorX, WALL_H - headerH / 2, BATH_SOUTH_Z]}
              size={[closetDoorW, headerH, INT]}
              color={MAT.interior}
              castShadow={false}
            />
          </>
        )
      })()}
    </group>
  )
}

// ─── Windows & Doors ─────────────────────────────────────────────────────────
function OpeningsAndDoors() {
  const sZ = HD + 0.01
  const nZ = -HD - 0.01
  const wX = -HW - 0.01
  const eX = HW + 0.01

  return (
    <group>
      {/* ── South (Front) Facade ── */}
      <DoorMesh position={[-5.0, 6.83 / 2, sZ]} width={3.0} height={6.83} />
      <WindowMesh position={[-9.0, 4.5, sZ]} width={5.0} height={4.0} />
      <WindowMesh position={[5.5, 4.5, sZ]} width={3.0} height={3.5} />
      <WindowMesh position={[10.5, 4.5, sZ]} width={3.0} height={3.5} />

      {/* ── North (Rear) Facade ── */}
      <WindowMesh position={[-9.0, 4.5, nZ]} rotation={[0, Math.PI, 0]} width={3.0} height={3.0} />
      <WindowMesh position={[-1.0, 5.5, nZ]} rotation={[0, Math.PI, 0]} width={2.0} height={2.0} />
      <WindowMesh position={[9.0, 4.5, nZ]} rotation={[0, Math.PI, 0]} width={3.0} height={3.5} />

      {/* ── West Wall ── */}
      <WindowMesh position={[wX, 4.5, -8.0]} rotation={[0, -Math.PI / 2, 0]} width={3.0} height={3.5} />
      <WindowMesh position={[wX, 4.5, 6.0]} rotation={[0, -Math.PI / 2, 0]} width={3.0} height={3.5} />

      {/* ── East Wall ── */}
      <WindowMesh position={[eX, 4.5, -8.0]} rotation={[0, Math.PI / 2, 0]} width={3.0} height={3.5} />
      <WindowMesh position={[eX, 4.5, 4.0]} rotation={[0, Math.PI / 2, 0]} width={3.0} height={3.5} />
    </group>
  )
}

// ─── Interior Objects ────────────────────────────────────────────────────────
function InteriorObjects() {
  return (
    <group>
      {/* ── Kitchen Counters ── */}
      {/* Peninsula counter (runs N-S, west of east wall) */}
      <mesh position={[9.5, 1.5, 1.5]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 3.0, 5.0]} />
        <meshStandardMaterial color={MAT.counter} roughness={0.7} />
      </mesh>
      {/* L-counter along east wall */}
      <mesh position={[13.5, 1.5, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 3.0, 8.0]} />
        <meshStandardMaterial color={MAT.counter} roughness={0.7} />
      </mesh>
      {/* Counter along south wall (kitchen area) */}
      <mesh position={[11.0, 1.5, 12.5]} castShadow receiveShadow>
        <boxGeometry args={[7.0, 3.0, 2.0]} />
        <meshStandardMaterial color={MAT.counter} roughness={0.7} />
      </mesh>

      {/* ── Bathroom Fixtures ── */}
      {/* Bathtub along north wall */}
      <mesh position={[-1.5, 0.75, -12.5]} receiveShadow>
        <boxGeometry args={[2.5, 1.5, 5.0]} />
        <meshStandardMaterial color={MAT.fixture} roughness={0.3} />
      </mesh>
      {/* Toilet */}
      <mesh position={[-3.0, 0.75, -9.5]} receiveShadow>
        <boxGeometry args={[1.5, 1.5, 2.0]} />
        <meshStandardMaterial color={MAT.fixture} roughness={0.3} />
      </mesh>
      {/* Vanity */}
      <mesh position={[-0.5, 1.5, -6.8]} receiveShadow>
        <boxGeometry args={[3.0, 3.0, 1.75]} />
        <meshStandardMaterial color={MAT.counter} roughness={0.6} />
      </mesh>

      {/* ── Laundry Appliances (Bedroom 2) ── */}
      {/* Washer */}
      <mesh position={[-12.5, 1.5, -12.5]} receiveShadow>
        <boxGeometry args={[2.25, 3.0, 2.5]} />
        <meshStandardMaterial color={MAT.appliance} roughness={0.5} />
      </mesh>
      {/* Dryer */}
      <mesh position={[-10.0, 1.5, -12.5]} receiveShadow>
        <boxGeometry args={[2.25, 3.0, 2.5]} />
        <meshStandardMaterial color={MAT.appliance} roughness={0.5} />
      </mesh>
    </group>
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
        const sectionW = sec.eastEaveX - sec.westEaveX
        const halfSec = sectionW / 2
        const rise = sec.ridgeHeight - sec.eaveHeight
        const ridgeLocalX = sec.ridgeX - (sec.westEaveX + sec.eastEaveX) / 2
        const centerX = (sec.westEaveX + sec.eastEaveX) / 2

        // West slope
        const wRun = sec.ridgeX - sec.westEaveX
        const wAngle = Math.atan2(rise, wRun)
        const wHyp = Math.sqrt(wRun * wRun + rise * rise)
        const wCenterX = (sec.westEaveX + sec.ridgeX) / 2
        const wCenterY = sec.eaveHeight + rise / 2

        // East slope
        const eRun = sec.eastEaveX - sec.ridgeX
        const eAngle = Math.atan2(rise, eRun)
        const eHyp = Math.sqrt(eRun * eRun + rise * rise)
        const eCenterX = (sec.ridgeX + sec.eastEaveX) / 2
        const eCenterY = sec.eaveHeight + rise / 2

        return (
          <group key={sec.id}>
            {/* West slope */}
            <mesh
              position={[wCenterX, wCenterY, 0]}
              rotation={[0, 0, wAngle]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[wHyp, panelThick, panelDepth]} />
              <meshStandardMaterial color={MAT.roof} roughness={0.9} />
            </mesh>

            {/* East slope */}
            <mesh
              position={[eCenterX, eCenterY, 0]}
              rotation={[0, 0, -eAngle]}
              castShadow
              receiveShadow
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

      {/* Gable ends */}
      <GableEnds />
    </group>
  )
}

function GableEnds() {
  // Build gable-end triangles for each roof section
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
          <mesh position={[0, 0, HD + 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial color={MAT.exterior} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          {/* North gable */}
          <mesh position={[0, 0, -HD - 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial color={MAT.exterior} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── Covered Porch ──────────────────────────────────────────────────────────
function CoveredPorch({ position, width, depth, roofVisible }) {
  const postR = 0.2
  const postH = 7.5
  const roofThick = 0.3
  const roofOverhang = 0.8
  const roofW = width + roofOverhang * 2
  const roofD = depth + roofOverhang
  const roofPitch = 1.2

  const hw = width / 2 - 0.5
  const hd = depth - 0.5

  return (
    <group position={position}>
      {/* Porch floor / pad */}
      <mesh position={[0, -0.1, depth / 2]} receiveShadow>
        <boxGeometry args={[width + 0.5, 0.25, depth + 0.5]} />
        <meshStandardMaterial color={MAT.concrete} roughness={0.95} />
      </mesh>

      {/* Posts */}
      {[
        [-hw, 0],
        [hw, 0],
        [-hw, hd],
        [hw, hd],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, postH / 2, pz]} castShadow>
          <boxGeometry args={[postR * 2, postH, postR * 2]} />
          <meshStandardMaterial color={MAT.trim} roughness={0.6} />
        </mesh>
      ))}

      {/* Decorative post caps */}
      {[
        [-hw, 0],
        [hw, 0],
        [-hw, hd],
        [hw, hd],
      ].map(([px, pz], i) => (
        <mesh key={`cap-${i}`} position={[px, postH + 0.15, pz]}>
          <boxGeometry args={[0.6, 0.3, 0.6]} />
          <meshStandardMaterial color={MAT.trim} roughness={0.6} />
        </mesh>
      ))}

      {/* Beam across top — front and back */}
      <mesh position={[0, postH + 0.4, 0]}>
        <boxGeometry args={[width + 0.3, 0.5, 0.4]} />
        <meshStandardMaterial color={MAT.trim} roughness={0.6} />
      </mesh>
      <mesh position={[0, postH + 0.4, hd]}>
        <boxGeometry args={[width + 0.3, 0.5, 0.4]} />
        <meshStandardMaterial color={MAT.trim} roughness={0.6} />
      </mesh>

      {/* Roof — shed style, sloping away from house */}
      {roofVisible && (
        <group>
          {/* Roof panel — tilted slightly down away from house */}
          <mesh
            position={[0, postH + 0.7 + roofPitch / 2, depth / 2]}
            rotation={[Math.atan2(roofPitch, depth + roofOverhang), 0, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[roofW, roofThick, Math.sqrt(roofD * roofD + roofPitch * roofPitch)]} />
            <meshStandardMaterial color={MAT.roof} roughness={0.9} />
          </mesh>
          {/* Fascia trim along the outer edge */}
          <mesh position={[0, postH + 0.55, depth - 0.1]} castShadow>
            <boxGeometry args={[roofW, 0.5, 0.2]} />
            <meshStandardMaterial color={MAT.roofFascia} roughness={0.9} />
          </mesh>
        </group>
      )}
    </group>
  )
}

// ─── Root Component ──────────────────────────────────────────────────────────
export default function ADUModel({ roofVisible = true }) {
  return (
    <group>
      <Foundation />
      <InteriorFloor />
      <ExteriorWalls />
      <InteriorWalls />
      <OpeningsAndDoors />
      <InteriorObjects />
      {roofVisible && <SplitGableRoof />}

      {/* Front entry porch — south wall at front door */}
      <CoveredPorch
        position={[-5.0, 0, HD]}
        width={7}
        depth={5}
        roofVisible={roofVisible}
      />

      {/* Rear porch — north wall, center-east area */}
      <CoveredPorch
        position={[4.0, 0, -HD - 5]}
        width={8}
        depth={5}
        roofVisible={roofVisible}
      />
    </group>
  )
}
