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

/**
 * Builds a wall segment split around a door opening.
 * segStart/segEnd = X range of the full wall segment.
 * doorCenterX/doorW = door position and width within that segment.
 */
function PartitionWithDoor({ segStart, segEnd, doorCenterX, doorW, z }) {
  const doorH = 6.67
  const headerH = WALL_H - doorH
  const doorL = doorCenterX - doorW / 2
  const doorR = doorCenterX + doorW / 2
  const leftW = doorL - segStart
  const rightW = segEnd - doorR

  return (
    <>
      {leftW > 0.05 && (
        <Wall
          position={[segStart + leftW / 2, WALL_H / 2, z]}
          size={[leftW, WALL_H, INT]}
          color={MAT.interior}
          castShadow={false}
        />
      )}
      {rightW > 0.05 && (
        <Wall
          position={[segEnd - rightW / 2, WALL_H / 2, z]}
          size={[rightW, WALL_H, INT]}
          color={MAT.interior}
          castShadow={false}
        />
      )}
      <Wall
        position={[doorCenterX, WALL_H - headerH / 2, z]}
        size={[doorW, headerH, INT]}
        color={MAT.interior}
        castShadow={false}
      />
    </>
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
  const doorX = -5.0
  const doorW = 3.0
  const doorH = 6.83
  const leftEnd = doorX - doorW / 2
  const rightStart = doorX + doorW / 2
  const leftW = leftEnd - (-HW)
  const rightW = HW - rightStart
  const headerH = WALL_H - doorH

  return (
    <group>
      {/* South wall — split around front door */}
      <Wall
        position={[(-HW + leftEnd) / 2, WALL_H / 2, HD]}
        size={[leftW, WALL_H, EXT]}
      />
      <Wall
        position={[(rightStart + HW) / 2, WALL_H / 2, HD]}
        size={[rightW, WALL_H, EXT]}
      />
      <Wall
        position={[doorX, WALL_H - headerH / 2, HD]}
        size={[doorW, headerH, EXT]}
      />

      {/* North wall */}
      <Wall position={[0, WALL_H / 2, -HD]} size={[W, WALL_H, EXT]} />

      {/* West wall */}
      <Wall position={[-HW, WALL_H / 2, 0]} size={[EXT, WALL_H, D]} />

      {/* East wall */}
      <Wall position={[HW, WALL_H / 2, 0]} size={[EXT, WALL_H, D]} />
    </group>
  )
}

// ─── Interior Walls ──────────────────────────────────────────────────────────
function InteriorWalls() {
  const hallOpenW = 3.0

  // Door positions aligned to N-S walls to avoid thin slivers
  const bed2DoorW = 2.67
  const bed2DoorX = NS_BED2_BATH - bed2DoorW / 2   // right edge at N-S wall
  const bed1DoorW = 2.67
  const bed1DoorX = NS_CLOSET_BED1 + bed1DoorW / 2 // left edge at N-S wall
  const bathDoorW = 2.5
  const bathDoorX = -1.5
  const closetDoorW = 2.0
  const closetDoorX = NS_CLOSET_BED1 - closetDoorW / 2 // right edge at N-S wall

  return (
    <group>
      {/* ═══ Main E-W Partition (Z = PZ) ═══ */}

      {/* South wall of Bedroom 2 — with door */}
      <PartitionWithDoor
        segStart={-HW} segEnd={NS_BED2_BATH}
        doorCenterX={bed2DoorX} doorW={bed2DoorW} z={PZ}
      />

      {/* West of hallway opening */}
      <Wall
        position={[(NS_BED2_BATH + (-hallOpenW / 2)) / 2, WALL_H / 2, PZ]}
        size={[(-hallOpenW / 2) - NS_BED2_BATH, WALL_H, INT]}
        color={MAT.interior}
        castShadow={false}
      />

      {/* East of hallway opening */}
      <Wall
        position={[(hallOpenW / 2 + NS_CLOSET_BED1) / 2, WALL_H / 2, PZ]}
        size={[NS_CLOSET_BED1 - hallOpenW / 2, WALL_H, INT]}
        color={MAT.interior}
        castShadow={false}
      />

      {/* South wall of Bedroom 1 — with door */}
      <PartitionWithDoor
        segStart={NS_CLOSET_BED1} segEnd={HW}
        doorCenterX={bed1DoorX} doorW={bed1DoorW} z={PZ}
      />

      {/* ═══ N-S Walls ═══ */}

      {/* Bedroom 2 | Bathroom+Hallway (X = -3.92) — full height, north wall to partition */}
      <Wall
        position={[NS_BED2_BATH, WALL_H / 2, (-HD + PZ) / 2]}
        size={[INT, WALL_H, Math.abs(PZ - (-HD))]}
        color={MAT.interior}
        castShadow={false}
      />

      {/* Bathroom | Closet (X = 1.46) — only in the bathroom zone, stops at BATH_SOUTH_Z */}
      <Wall
        position={[NS_BATH_CLOSET, WALL_H / 2, (-HD + BATH_SOUTH_Z) / 2]}
        size={[INT, WALL_H, Math.abs(BATH_SOUTH_Z - (-HD))]}
        color={MAT.interior}
        castShadow={false}
      />

      {/* Closet | Bedroom 1 (X = 4.12) — full height, north wall to partition */}
      <Wall
        position={[NS_CLOSET_BED1, WALL_H / 2, (-HD + PZ) / 2]}
        size={[INT, WALL_H, Math.abs(PZ - (-HD))]}
        color={MAT.interior}
        castShadow={false}
      />

      {/* ═══ Bathroom South Wall (Z = BATH_SOUTH_Z) ═══ */}

      {/* Split around bathroom door and closet door */}
      <PartitionWithDoor
        segStart={NS_BED2_BATH} segEnd={NS_BATH_CLOSET}
        doorCenterX={bathDoorX} doorW={bathDoorW} z={BATH_SOUTH_Z}
      />
      <PartitionWithDoor
        segStart={NS_BATH_CLOSET} segEnd={NS_CLOSET_BED1}
        doorCenterX={closetDoorX} doorW={closetDoorW} z={BATH_SOUTH_Z}
      />
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
      {/* South (Front) */}
      <DoorMesh position={[-5.0, 6.83 / 2, sZ]} width={3.0} height={6.83} />
      <WindowMesh position={[-9.0, 4.5, sZ]} width={5.0} height={4.0} />
      <WindowMesh position={[5.5, 4.5, sZ]} width={3.0} height={3.5} />
      <WindowMesh position={[10.5, 4.5, sZ]} width={3.0} height={3.5} />

      {/* North (Rear) */}
      <WindowMesh position={[-9.0, 4.5, nZ]} rotation={[0, Math.PI, 0]} width={3.0} height={3.0} />
      <WindowMesh position={[-1.0, 5.5, nZ]} rotation={[0, Math.PI, 0]} width={2.0} height={2.0} />
      <WindowMesh position={[9.0, 4.5, nZ]} rotation={[0, Math.PI, 0]} width={3.0} height={3.5} />

      {/* West */}
      <WindowMesh position={[wX, 4.5, -8.0]} rotation={[0, -Math.PI / 2, 0]} width={3.0} height={3.5} />
      <WindowMesh position={[wX, 4.5, 6.0]} rotation={[0, -Math.PI / 2, 0]} width={3.0} height={3.5} />

      {/* East */}
      <WindowMesh position={[eX, 4.5, -8.0]} rotation={[0, Math.PI / 2, 0]} width={3.0} height={3.5} />
      <WindowMesh position={[eX, 4.5, 4.0]} rotation={[0, Math.PI / 2, 0]} width={3.0} height={3.5} />
    </group>
  )
}

// ─── Interior Objects ────────────────────────────────────────────────────────
function InteriorObjects() {
  // North interior face
  const northFace = -HD + EXT / 2  // -13.46

  return (
    <group>
      {/* ── Kitchen Counters ── */}
      {/* Peninsula counter (runs N-S) */}
      <mesh position={[9.5, 1.5, 1.5]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 3.0, 5.0]} />
        <meshStandardMaterial color={MAT.counter} roughness={0.7} />
      </mesh>
      {/* L-counter along east wall — stays south of partition */}
      <mesh position={[13.5, 1.5, 1.0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 3.0, 6.0]} />
        <meshStandardMaterial color={MAT.counter} roughness={0.7} />
      </mesh>
      {/* Counter along south wall */}
      <mesh position={[11.0, 1.5, 12.5]} castShadow receiveShadow>
        <boxGeometry args={[7.0, 3.0, 2.0]} />
        <meshStandardMaterial color={MAT.counter} roughness={0.7} />
      </mesh>

      {/* ── Bathroom Fixtures ── */}
      {/* Bathtub — flush against north interior wall */}
      <mesh position={[-1.5, 0.75, northFace + 2.5]} receiveShadow>
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

      {/* ── Laundry (Bedroom 2) — flush against north wall ── */}
      <mesh position={[-12.5, 1.5, northFace + 1.25]} receiveShadow>
        <boxGeometry args={[2.25, 3.0, 2.5]} />
        <meshStandardMaterial color={MAT.appliance} roughness={0.5} />
      </mesh>
      <mesh position={[-10.0, 1.5, northFace + 1.25]} receiveShadow>
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
        const rise = sec.ridgeHeight - sec.eaveHeight

        const wRun = sec.ridgeX - sec.westEaveX
        const wAngle = Math.atan2(rise, wRun)
        const wHyp = Math.sqrt(wRun * wRun + rise * rise)
        const wCenterX = (sec.westEaveX + sec.ridgeX) / 2
        const wCenterY = sec.eaveHeight + rise / 2

        const eRun = sec.eastEaveX - sec.ridgeX
        const eAngle = Math.atan2(rise, eRun)
        const eHyp = Math.sqrt(eRun * eRun + rise * rise)
        const eCenterX = (sec.ridgeX + sec.eastEaveX) / 2
        const eCenterY = sec.eaveHeight + rise / 2

        return (
          <group key={sec.id}>
            <mesh
              position={[wCenterX, wCenterY, 0]}
              rotation={[0, 0, wAngle]}
              castShadow receiveShadow
            >
              <boxGeometry args={[wHyp, panelThick, panelDepth]} />
              <meshStandardMaterial color={MAT.roof} roughness={0.9} />
            </mesh>

            <mesh
              position={[eCenterX, eCenterY, 0]}
              rotation={[0, 0, -eAngle]}
              castShadow receiveShadow
            >
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
          {/* South gable — shape is in XY plane, positioned at south face */}
          <mesh position={[0, 0, HD + 0.5]}>
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial color={MAT.exterior} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          {/* North gable */}
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
// Extends in +Z from position. Only front posts — the house wall is the back support.
function CoveredPorch({ position, rotation = [0, 0, 0], width, depth, roofVisible }) {
  const postSize = 0.35
  const postH = 7.5
  const roofThick = 0.3
  const roofOverhang = 0.8
  const roofW = width + roofOverhang * 2
  const roofD = depth + roofOverhang
  const roofPitch = 1.2

  const hw = width / 2 - 0.4
  const outerZ = depth - 0.4

  return (
    <group position={position} rotation={rotation}>
      {/* Porch pad */}
      <mesh position={[0, -0.1, depth / 2]} receiveShadow>
        <boxGeometry args={[width + 0.5, 0.25, depth + 0.5]} />
        <meshStandardMaterial color={MAT.concrete} roughness={0.95} />
      </mesh>

      {/* Two front posts only — back is supported by house wall */}
      {[[-hw, outerZ], [hw, outerZ]].map(([px, pz], i) => (
        <group key={i}>
          <mesh position={[px, postH / 2, pz]} castShadow>
            <boxGeometry args={[postSize, postH, postSize]} />
            <meshStandardMaterial color={MAT.trim} roughness={0.6} />
          </mesh>
          {/* Decorative cap */}
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
      {/* Side beams connecting posts to wall */}
      {[-hw, hw].map((px, i) => (
        <mesh key={`side-${i}`} position={[px, postH + 0.4, outerZ / 2]}>
          <boxGeometry args={[0.3, 0.5, outerZ + 0.4]} />
          <meshStandardMaterial color={MAT.trim} roughness={0.6} />
        </mesh>
      ))}

      {/* Roof — shed style, slopes down away from house */}
      {roofVisible && (
        <group>
          <mesh
            position={[0, postH + 0.7 + roofPitch / 2, depth / 2]}
            rotation={[Math.atan2(roofPitch, roofD), 0, 0]}
            castShadow receiveShadow
          >
            <boxGeometry args={[roofW, roofThick, Math.sqrt(roofD * roofD + roofPitch * roofPitch)]} />
            <meshStandardMaterial color={MAT.roof} roughness={0.9} />
          </mesh>
          {/* Fascia trim on outer edge */}
          <mesh position={[0, postH + 0.55, depth + roofOverhang / 2]} castShadow>
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

      {/* Front entry porch — extends south from front door */}
      <CoveredPorch
        position={[-5.0, 0, HD]}
        width={7}
        depth={5}
        roofVisible={roofVisible}
      />

      {/* Rear porch — extends north from north wall, rotated 180 */}
      <CoveredPorch
        position={[4.0, 0, -HD]}
        rotation={[0, Math.PI, 0]}
        width={8}
        depth={5}
        roofVisible={roofVisible}
      />
    </group>
  )
}
