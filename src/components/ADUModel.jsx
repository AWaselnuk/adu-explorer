import { useMemo } from 'react'
import * as THREE from 'three'
import data from '../floorplan-data.json'

// ─── Dimensions ──────────────────────────────────────────────────────────────
// Building: 25'-0" wide × 26'-3" deep (from architectural drawings)
const W = 25.0
const D = 26.25
const HW = 12.5
const HD = 13.125
const EXT = 0.5   // exterior wall thickness (6")
const INT = 0.33  // interior wall thickness (4")
const WALL_H = 8.5

// Interior faces
const NF = -HD + EXT / 2  // north interior face = -12.875
const SF =  HD - EXT / 2  // south interior face =  12.875
const WF = -HW + EXT / 2  // west interior face  = -12.25
const EF =  HW - EXT / 2  // east interior face  =  12.25

// N-S wall X positions (centerlines), derived from labeled room widths:
//   Bed2 (6'-11½") | Bath (5'-4½") | Closet (3'-0") | Bed1 (8'-5")
const X_BED2_BATH    = WF + 6.958 + INT / 2        // -5.127
const X_BATH_CLOSET  = X_BED2_BATH + INT / 2 + 5.375 + INT / 2  // 0.578
const X_CLOSET_BED1  = X_BATH_CLOSET + INT / 2 + 3.0 + INT / 2  // 3.908

// E-W partition: 11'-7½" from north int face to partition north face
const PZ = NF + 11.625 + INT / 2  // -1.085

// Bathroom south wall: 7'-0" from north int face
const BATH_SZ = NF + 7.0 + INT / 2  // -5.71

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
        <meshStandardMaterial
          color={MAT.window}
          transparent opacity={0.45}
          roughness={0.05} metalness={0.1}
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

// Wall segment with a door opening cut out
function WallSegmentWithDoor({ segStart, segEnd, doorCenter, doorW, z, axis = 'EW' }) {
  const doorH = 6.67
  const headerH = WALL_H - doorH
  const doorL = doorCenter - doorW / 2
  const doorR = doorCenter + doorW / 2

  if (axis === 'EW') {
    const leftW = doorL - segStart
    const rightW = segEnd - doorR
    return (
      <>
        {leftW > 0.05 && <Wall position={[segStart + leftW / 2, WALL_H / 2, z]} size={[leftW, WALL_H, INT]} color={MAT.interior} castShadow={false} />}
        {rightW > 0.05 && <Wall position={[segEnd - rightW / 2, WALL_H / 2, z]} size={[rightW, WALL_H, INT]} color={MAT.interior} castShadow={false} />}
        <Wall position={[doorCenter, WALL_H - headerH / 2, z]} size={[doorW, headerH, INT]} color={MAT.interior} castShadow={false} />
      </>
    )
  }
  // NS axis — z is the variable, x is the wall position
  const x = z // reuse param as the wall X
  const topW = doorL - segStart
  const botW = segEnd - doorR
  return (
    <>
      {topW > 0.05 && <Wall position={[x, WALL_H / 2, segStart + topW / 2]} size={[INT, WALL_H, topW]} color={MAT.interior} castShadow={false} />}
      {botW > 0.05 && <Wall position={[x, WALL_H / 2, segEnd - botW / 2]} size={[INT, WALL_H, botW]} color={MAT.interior} castShadow={false} />}
      <Wall position={[x, WALL_H - headerH / 2, doorCenter]} size={[INT, headerH, doorW]} color={MAT.interior} castShadow={false} />
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
  // Bathroom tile zone: between N-S walls, from north wall to bath south wall
  const bathCenterX = (X_BED2_BATH + X_BATH_CLOSET) / 2
  const bathW = (X_BATH_CLOSET - INT / 2) - (X_BED2_BATH + INT / 2)
  const bathCenterZ = (NF + BATH_SZ) / 2
  const bathD = (BATH_SZ - INT / 2) - NF

  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[W - EXT, 0.12, D - EXT]} />
        <meshStandardMaterial color={MAT.floor} roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[bathCenterX, 0.04, bathCenterZ]} receiveShadow>
        <boxGeometry args={[bathW, 0.1, bathD]} />
        <meshStandardMaterial color={MAT.tile} roughness={0.6} />
      </mesh>
    </group>
  )
}

// ─── Exterior Walls ──────────────────────────────────────────────────────────
function ExteriorWalls() {
  // Front door: center-right of south wall, ~3' wide
  const doorX = 3.0
  const doorW = 3.0
  const doorH = 6.83
  const doorL = doorX - doorW / 2
  const doorR = doorX + doorW / 2
  const leftW = doorL - (-HW)
  const rightW = HW - doorR
  const headerH = WALL_H - doorH

  return (
    <group>
      {/* South wall — split around front door */}
      <Wall position={[(-HW + doorL) / 2, WALL_H / 2, HD]} size={[leftW, WALL_H, EXT]} />
      <Wall position={[(doorR + HW) / 2, WALL_H / 2, HD]} size={[rightW, WALL_H, EXT]} />
      <Wall position={[doorX, WALL_H - headerH / 2, HD]} size={[doorW, headerH, EXT]} />

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
  // Hallway opening in partition: ~4' wide, centered between the N-S walls
  const hallCenterX = (X_BED2_BATH + X_CLOSET_BED1) / 2
  const hallOpenW = 4.0
  const hallL = hallCenterX - hallOpenW / 2
  const hallR = hallCenterX + hallOpenW / 2

  // Door positions
  const bed2DoorZ = -3.5  // in Bed2/Bath N-S wall, hallway zone
  const bed1DoorZ = -3.5  // in Closet/Bed1 N-S wall, hallway zone
  const bathDoorX = (X_BED2_BATH + X_BATH_CLOSET) / 2  // centered in bath
  const closetDoorX = (X_BATH_CLOSET + X_CLOSET_BED1) / 2  // centered in closet

  return (
    <group>
      {/* ═══ Main E-W Partition (Z = PZ) ═══ */}

      {/* West segment: south wall of Bed 2 — solid (door is in N-S wall) */}
      <Wall
        position={[(-HW + hallL) / 2, WALL_H / 2, PZ]}
        size={[hallL - (-HW), WALL_H, INT]}
        color={MAT.interior} castShadow={false}
      />

      {/* East segment: south wall of Bed 1 — solid (door is in N-S wall) */}
      <Wall
        position={[(hallR + HW) / 2, WALL_H / 2, PZ]}
        size={[HW - hallR, WALL_H, INT]}
        color={MAT.interior} castShadow={false}
      />

      {/* ═══ N-S Walls ═══ */}

      {/* Bed2 | Bath+Hallway — with door opening in hallway zone */}
      <WallSegmentWithDoor
        segStart={-HD} segEnd={PZ}
        doorCenter={bed2DoorZ} doorW={2.67}
        z={X_BED2_BATH} axis="NS"
      />

      {/* Bath | Closet — only in bathroom zone, stops at BATH_SZ */}
      <Wall
        position={[X_BATH_CLOSET, WALL_H / 2, (-HD + BATH_SZ) / 2]}
        size={[INT, WALL_H, Math.abs(BATH_SZ - (-HD))]}
        color={MAT.interior} castShadow={false}
      />

      {/* Closet | Bed1 — with door opening in hallway zone */}
      <WallSegmentWithDoor
        segStart={-HD} segEnd={PZ}
        doorCenter={bed1DoorZ} doorW={2.67}
        z={X_CLOSET_BED1} axis="NS"
      />

      {/* ═══ Bathroom South Wall (Z = BATH_SZ) ═══ */}

      <WallSegmentWithDoor
        segStart={X_BED2_BATH} segEnd={X_BATH_CLOSET}
        doorCenter={bathDoorX} doorW={2.5} z={BATH_SZ}
      />
      <WallSegmentWithDoor
        segStart={X_BATH_CLOSET} segEnd={X_CLOSET_BED1}
        doorCenter={closetDoorX} doorW={2.0} z={BATH_SZ}
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
      {/* South (Front) — door is at X=3 */}
      <DoorMesh position={[3.0, 6.83 / 2, sZ]} width={3.0} height={6.83} />
      {/* Kitchen window (west side of south wall) */}
      <WindowMesh position={[-7.0, 4.5, sZ]} width={4.0} height={3.5} />
      {/* Living window (east side of south wall) */}
      <WindowMesh position={[9.0, 4.5, sZ]} width={4.0} height={4.0} />

      {/* North (Rear) */}
      <WindowMesh position={[-9.0, 4.5, nZ]} rotation={[0, Math.PI, 0]} width={3.0} height={3.0} />
      <WindowMesh position={[(X_BED2_BATH + X_BATH_CLOSET) / 2, 5.5, nZ]} rotation={[0, Math.PI, 0]} width={2.0} height={2.0} />
      <WindowMesh position={[8.0, 4.5, nZ]} rotation={[0, Math.PI, 0]} width={3.0} height={3.5} />

      {/* West */}
      <WindowMesh position={[wX, 4.5, -8.0]} rotation={[0, -Math.PI / 2, 0]} width={2.5} height={3.5} />
      <WindowMesh position={[wX, 4.5, 5.0]} rotation={[0, -Math.PI / 2, 0]} width={3.0} height={3.5} />

      {/* East */}
      <WindowMesh position={[eX, 4.5, -7.0]} rotation={[0, Math.PI / 2, 0]} width={3.0} height={3.5} />
      <WindowMesh position={[eX, 4.5, 5.0]} rotation={[0, Math.PI / 2, 0]} width={3.0} height={3.5} />
    </group>
  )
}

// ─── Interior Objects ────────────────────────────────────────────────────────
function InteriorObjects() {
  // Kitchen is on the WEST side (9'-6" wide from west wall)
  const kitchenE = WF + 9.5  // east edge of kitchen zone

  return (
    <group>
      {/* ── Kitchen (SW corner) ── */}
      {/* Counter along south wall with sink */}
      <mesh position={[WF + 3.5, 1.5, SF - 1.0]} castShadow receiveShadow>
        <boxGeometry args={[6.0, 3.0, 2.0]} />
        <meshStandardMaterial color={MAT.counter} roughness={0.7} />
      </mesh>
      {/* Counter along west wall */}
      <mesh position={[WF + 1.0, 1.5, PZ + 4.0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 3.0, 7.0]} />
        <meshStandardMaterial color={MAT.counter} roughness={0.7} />
      </mesh>
      {/* Kitchen peninsula / island */}
      <mesh position={[WF + 5.5, 1.5, PZ + 5.0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 3.0, 2.0]} />
        <meshStandardMaterial color={MAT.counter} roughness={0.7} />
      </mesh>

      {/* ── Electric Fireplace (east wall) ── */}
      <mesh position={[EF - 0.15, 3.5, 3.0]} receiveShadow>
        <boxGeometry args={[0.5, 4.0, 3.0]} />
        <meshStandardMaterial color={MAT.fireplace} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* ── Bathroom Fixtures ── */}
      {/* Tub/shower along north wall */}
      <mesh position={[(X_BED2_BATH + X_BATH_CLOSET) / 2, 0.75, NF + 1.25]} receiveShadow>
        <boxGeometry args={[4.5, 1.5, 2.5]} />
        <meshStandardMaterial color={MAT.fixture} roughness={0.3} />
      </mesh>
      {/* Toilet — west side */}
      <mesh position={[X_BED2_BATH + INT / 2 + 0.75, 0.75, NF + 4.5]} receiveShadow>
        <boxGeometry args={[1.5, 1.5, 2.0]} />
        <meshStandardMaterial color={MAT.fixture} roughness={0.3} />
      </mesh>
      {/* Vanity — near south wall of bath */}
      <mesh position={[(X_BED2_BATH + X_BATH_CLOSET) / 2, 1.5, BATH_SZ - INT / 2 - 1.0]} receiveShadow>
        <boxGeometry args={[3.5, 3.0, 1.75]} />
        <meshStandardMaterial color={MAT.counter} roughness={0.6} />
      </mesh>

      {/* ── W/D in Bedroom 2 (NW corner) ── */}
      <mesh position={[WF + 2.5, 1.5, NF + 1.25]} receiveShadow>
        <boxGeometry args={[4.5, 3.0, 2.5]} />
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
            <mesh position={[wCenterX, wCenterY, 0]} rotation={[0, 0, wAngle]} castShadow receiveShadow>
              <boxGeometry args={[wHyp, panelThick, panelDepth]} />
              <meshStandardMaterial color={MAT.roof} roughness={0.9} />
            </mesh>
            <mesh position={[eCenterX, eCenterY, 0]} rotation={[0, 0, -eAngle]} castShadow receiveShadow>
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
  const roofThick = 0.3
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
        <mesh key={`side-${i}`} position={[px, postH + 0.4, outerZ / 2]}>
          <boxGeometry args={[0.3, 0.5, outerZ + 0.4]} />
          <meshStandardMaterial color={MAT.trim} roughness={0.6} />
        </mesh>
      ))}

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

      {/* Front entry porch — extends south, roughly centered on door */}
      <CoveredPorch
        position={[3.0, 0, HD]}
        width={8}
        depth={6}
        roofVisible={roofVisible}
      />

      {/* NW covered porch — 13'-1" × 5'-0", extends north from NW area */}
      <CoveredPorch
        position={[-6.0, 0, -HD]}
        rotation={[0, Math.PI, 0]}
        width={13.08}
        depth={5}
        roofVisible={roofVisible}
      />
    </group>
  )
}
