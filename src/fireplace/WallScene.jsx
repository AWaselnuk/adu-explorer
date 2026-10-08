import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  WALL, DEN_ZONE, BUILTIN, OPENING, NICHE, MANTEL_HEIGHT, VAULT_PEAK, VAULT_RUN,
  FP_CENTER, SURROUND_W, SURROUND_X0, SURROUND_X1, MANTEL_W,
} from './spec'
import { makeTileTexture, makeWoodTexture, makeFloorTexture, makeFlameTexture } from './textures'

const FACE = BUILTIN.depth
const ROOM_DEPTH = FACE + VAULT_RUN * 2
const COLUMN_W = BUILTIN.x0 + BUILTIN.width - SURROUND_X1

const WHITE = '#f2f0ea'
const GREEN = '#6b7558'

function ceilingY(z) {
  if (z <= FACE) return WALL.height
  const rise = (VAULT_PEAK - WALL.height) / VAULT_RUN
  return VAULT_PEAK - Math.abs(z - FACE - VAULT_RUN) * rise
}

export const VIEWS = {
  seated: { label: 'Seated on sofa', position: [FP_CENTER, 40, FACE + 118], target: [FP_CENTER, 50, FACE] },
  standing: { label: 'Standing, 8\' back', position: [FP_CENTER - 20, 63, FACE + 96], target: [FP_CENTER, 50, FACE] },
  kitchen: { label: 'From the kitchen', position: [18, 63, FACE + 200], target: [FP_CENTER, 48, FACE] },
}

function Box({ x0, x1, y0, y1, z0, z1, color = WHITE, map, ...props }) {
  return (
    <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]} castShadow receiveShadow {...props}>
      <boxGeometry args={[x1 - x0, y1 - y0, z1 - z0]} />
      <meshStandardMaterial color={color} map={map} roughness={0.85} />
    </mesh>
  )
}

function SideWall({ x, doorway }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(ROOM_DEPTH, 0)
    shape.lineTo(ROOM_DEPTH, ceilingY(ROOM_DEPTH))
    shape.lineTo(FACE + VAULT_RUN, VAULT_PEAK)
    shape.lineTo(FACE, WALL.height)
    shape.lineTo(0, WALL.height)
    shape.closePath()
    if (doorway) {
      const [z0, z1, h] = doorway
      const hole = new THREE.Path()
      hole.moveTo(z0, 0)
      hole.lineTo(z1, 0)
      hole.lineTo(z1, h)
      hole.lineTo(z0, h)
      hole.closePath()
      shape.holes.push(hole)
    }
    return new THREE.ShapeGeometry(shape)
  }, [doorway])
  return (
    <mesh geometry={geometry} position={[x, 0, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
      <meshStandardMaterial color={WHITE} side={THREE.DoubleSide} roughness={0.9} />
    </mesh>
  )
}

function Ceiling() {
  const rise = VAULT_PEAK - WALL.height
  const len = Math.hypot(VAULT_RUN, rise)
  const tilt = Math.atan2(rise, VAULT_RUN)
  return (
    <group>
      <mesh position={[WALL.width / 2, WALL.height, FACE / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL.width, FACE]} />
        <meshStandardMaterial color={WHITE} side={THREE.DoubleSide} />
      </mesh>
      {[1, -1].map((dir) => (
        <mesh key={dir}
          position={[WALL.width / 2, WALL.height + rise / 2, FACE + VAULT_RUN + (dir === 1 ? -VAULT_RUN / 2 : VAULT_RUN / 2)]}
          rotation={[Math.PI / 2 - dir * tilt, 0, 0]}>
          <planeGeometry args={[WALL.width, len]} />
          <meshStandardMaterial color={WHITE} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function BuiltIn({ x0 }) {
  const w = COLUMN_W
  const base = NICHE.cabinetTop + NICHE.counter
  const iw = w - NICHE.stile * 2
  const r = iw / 2
  const nicheBack = FACE - NICHE.depth

  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(w, 0)
    shape.lineTo(w, WALL.height - base)
    shape.lineTo(0, WALL.height - base)
    shape.closePath()
    const spring = NICHE.archTop - r - base
    const hole = new THREE.Path()
    hole.moveTo(NICHE.stile, 0)
    hole.lineTo(NICHE.stile, spring)
    hole.absarc(w / 2, spring, r, Math.PI, 0, true)
    hole.lineTo(w - NICHE.stile, 0)
    hole.closePath()
    shape.holes.push(hole)
    return new THREE.ExtrudeGeometry(shape, { depth: NICHE.depth, bevelEnabled: false, curveSegments: 32 })
  }, [w, base, r])

  const doorW = (w - 3) / 2
  return (
    <group>
      <Box x0={x0 + 3} x1={x0 + w - 3} y0={0} y1={4} z0={0} z1={FACE - 3} color="#cfccc4" />
      <Box x0={x0} x1={x0 + w} y0={4} y1={NICHE.cabinetTop} z0={0} z1={FACE - 0.75} />
      {[0, 1].map((i) => (
        <Box key={i} x0={x0 + 1 + i * (doorW + 1)} x1={x0 + 1 + i * (doorW + 1) + doorW}
          y0={5} y1={NICHE.cabinetTop - 1} z0={FACE - 0.75} z1={FACE} />
      ))}
      <Box x0={x0 - 0.5} x1={x0 + w + 0.5} y0={NICHE.cabinetTop} y1={base} z0={0} z1={FACE + 1} color="#c79a63" />
      <Box x0={x0} x1={x0 + w} y0={base} y1={WALL.height} z0={0} z1={nicheBack} color={GREEN} />
      <mesh geometry={geometry} position={[x0, base, nicheBack]} castShadow receiveShadow>
        <meshStandardMaterial attach="material-0" color={WHITE} roughness={0.85} />
        <meshStandardMaterial attach="material-1" color={GREEN} roughness={0.9} />
      </mesh>
      {NICHE.shelves.map((s) => (
        <Box key={s} x0={x0 + NICHE.stile} x1={x0 + w - NICHE.stile} y0={s} y1={s + 1.5}
          z0={nicheBack} z1={FACE - 0.5} color="#c79a63" />
      ))}
    </group>
  )
}

function Fireplace({ clearance, depth, material }) {
  const tileTex = useMemo(makeTileTexture, [])
  const flameTex = useMemo(makeFlameTexture, [])
  const woodTex = useMemo(() => makeWoodTexture(material === 'wood' ? '#b98552' : '#a98a6c'), [material])
  const underside = OPENING.height + clearance
  tileTex.repeat.set(SURROUND_W / 24, underside / 8)
  woodTex.repeat.set(1, 1)

  return (
    <group>
      <Box x0={SURROUND_X0} x1={SURROUND_X1} y0={0} y1={WALL.height} z0={0} z1={FACE} />
      <mesh position={[FP_CENTER, underside / 2, FACE + 0.02]} receiveShadow>
        <planeGeometry args={[SURROUND_W, underside]} />
        <meshStandardMaterial map={tileTex} roughness={0.5} />
      </mesh>
      <mesh position={[FP_CENTER, OPENING.height / 2, FACE + 0.05]}>
        <planeGeometry args={[OPENING.width + 1.5, OPENING.height + 1.5]} />
        <meshStandardMaterial color="#141414" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[FP_CENTER, OPENING.height / 2, FACE + 0.08]}>
        <planeGeometry args={[OPENING.width - 2, OPENING.height - 2]} />
        <meshStandardMaterial color="#080706" roughness={0.6} />
      </mesh>
      <mesh position={[FP_CENTER, 9, FACE + 0.1]}>
        <planeGeometry args={[OPENING.width - 4, 16]} />
        <meshBasicMaterial map={flameTex} transparent toneMapped={false} />
      </mesh>
      <pointLight position={[FP_CENTER, 10, FACE + 14]} color="#ff9a4a" intensity={1500} distance={120} decay={2} />

      <mesh position={[FP_CENTER, underside + MANTEL_HEIGHT / 2, FACE + depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[MANTEL_W, MANTEL_HEIGHT, depth]} />
        <meshStandardMaterial map={woodTex} roughness={material === 'wood' ? 0.7 : 0.9} />
      </mesh>
    </group>
  )
}

function Art({ mantelTop }) {
  const h = Math.min(36, WALL.height - mantelTop - 12)
  if (h <= 8) return null
  const w = h * 0.75
  const y = mantelTop + 6 + h / 2
  return (
    <group position={[FP_CENTER, y, FACE + 0.75]}>
      <mesh castShadow>
        <boxGeometry args={[w, h, 1.5]} />
        <meshStandardMaterial color="#1c1c1c" />
      </mesh>
      <mesh position={[0, 0, 0.76]}>
        <planeGeometry args={[w - 3, h - 3]} />
        <meshStandardMaterial color="#efe7da" />
      </mesh>
      <mesh position={[0, -h * 0.05, 0.78]}>
        <circleGeometry args={[w * 0.2, 32]} />
        <meshStandardMaterial color="#6a4a32" />
      </mesh>
    </group>
  )
}

function Furniture() {
  const sofaZ = FACE + 118
  const fabric = '#e4ddd0'
  return (
    <group>
      <Box x0={FP_CENTER - 42} x1={FP_CENTER + 42} y0={4} y1={18} z0={sofaZ - 18} z1={sofaZ + 18} color={fabric} />
      <Box x0={FP_CENTER - 42} x1={FP_CENTER + 42} y0={4} y1={34} z0={sofaZ + 10} z1={sofaZ + 18} color={fabric} />
      {[-1, 1].map((s) => (
        <Box key={s} x0={FP_CENTER + s * 42 - 4} x1={FP_CENTER + s * 42 + 4} y0={4} y1={25}
          z0={sofaZ - 18} z1={sofaZ + 18} color={fabric} />
      ))}
      <mesh position={[FP_CENTER, 8, FACE + 66]} castShadow receiveShadow>
        <cylinderGeometry args={[18, 18, 16, 40]} />
        <meshStandardMaterial color="#b89a6e" roughness={0.95} />
      </mesh>
      <mesh position={[FP_CENTER, 0.2, FACE + 70]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[96, 72]} />
        <meshStandardMaterial color="#d9d4ca" roughness={1} />
      </mesh>
    </group>
  )
}

function Person({ x, z, height = 66 }) {
  const head = 4.6
  const bodyR = 7
  const bodyLen = height - head * 2 - 2 - bodyR * 2
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, bodyR + bodyLen / 2, 0]} castShadow>
        <capsuleGeometry args={[bodyR, bodyLen, 6, 16]} />
        <meshStandardMaterial color="#8d97a3" />
      </mesh>
      <mesh position={[0, height - head, 0]} castShadow>
        <sphereGeometry args={[head, 24, 16]} />
        <meshStandardMaterial color="#8d97a3" />
      </mesh>
    </group>
  )
}

function Room() {
  const floorTex = useMemo(makeFloorTexture, [])
  floorTex.repeat.set(WALL.width / 28, ROOM_DEPTH / 48)
  return (
    <group>
      <mesh position={[WALL.width / 2, 0, ROOM_DEPTH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WALL.width, ROOM_DEPTH]} />
        <meshStandardMaterial map={floorTex} roughness={0.8} />
      </mesh>
      <Box x0={0} x1={DEN_ZONE} y0={0} y1={WALL.height} z0={-1} z1={0} />
      <Box x0={BUILTIN.x0 - 0.1} x1={BUILTIN.x0} y0={0} y1={WALL.height} z0={0} z1={FACE} />
      <SideWall x={0} doorway={[0, 32.5, 80]} />
      <SideWall x={WALL.width} />
      <Ceiling />
    </group>
  )
}

function CameraRig({ view }) {
  const { camera, controls } = useThree()
  useEffect(() => {
    const v = VIEWS[view]
    camera.position.set(...v.position)
    if (controls) {
      controls.target.set(...v.target)
      controls.update()
    } else {
      camera.lookAt(...v.target)
    }
  }, [view, camera, controls])
  return null
}

export default function WallScene({ clearance, depth, material, showArt, view }) {
  const mantelTop = OPENING.height + clearance + MANTEL_HEIGHT
  return (
    <Canvas shadows camera={{ fov: 55, near: 1, far: 2000, position: VIEWS.seated.position }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <color attach="background" args={['#ddd8cf']} />
      <hemisphereLight args={['#fffaf0', '#8a7a66', 1.1]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[WALL.width + 120, 160, 160]} intensity={1.6} castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-200} shadow-camera-right={200}
        shadow-camera-top={200} shadow-camera-bottom={-200} shadow-bias={-0.0005} />
      <pointLight position={[FP_CENTER, 115, FACE + 90]} intensity={9000} distance={400} decay={2} color="#fff3df" />

      <Room />
      <BuiltIn x0={BUILTIN.x0} />
      <BuiltIn x0={SURROUND_X1} />
      <Fireplace clearance={clearance} depth={depth} material={material} />
      {showArt && <Art mantelTop={mantelTop} />}
      <Furniture />
      <Person x={18} z={30} />

      <OrbitControls makeDefault enableDamping maxDistance={500} />
      <CameraRig view={view} />
    </Canvas>
  )
}
