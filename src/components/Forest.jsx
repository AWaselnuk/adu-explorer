import { useMemo } from 'react'

const TREE_COUNT = 80
const OUTER_RADIUS = 120

// Rectangular exclusion zone — building + porches + clearance
const EXCL_X = 16   // HW(12.5) + porch/clearance
const EXCL_Z = 22   // HD(13.125) + porch depth(6) + clearance

function seededRand(seed) {
  let s = seed
  return function () {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function isInsideExclusion(x, z) {
  return Math.abs(x) < EXCL_X && Math.abs(z) < EXCL_Z
}

function useTreePositions() {
  return useMemo(() => {
    const rand = seededRand(42)
    const positions = []
    let attempts = 0
    while (positions.length < TREE_COUNT && attempts < TREE_COUNT * 10) {
      attempts++
      const angle = rand() * Math.PI * 2
      const r = 20 + rand() * (OUTER_RADIUS - 20)
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      if (isInsideExclusion(x, z)) continue
      // Keep a clear view corridor in front of the house
      if (z > 22 && z < 40 && Math.abs(x) < 18) continue
      positions.push({
        x,
        z,
        scale: 0.7 + rand() * 0.8,
        rotY: rand() * Math.PI * 2,
        variety: rand() > 0.3 ? 'pine' : 'deciduous',
      })
    }
    return positions
  }, [])
}

function PineTree({ position, scale = 1 }) {
  const [x, , z] = position
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.45, 4, 6]} />
        <meshStandardMaterial color="#4a3520" roughness={1} />
      </mesh>
      <mesh position={[0, 7, 0]} castShadow>
        <coneGeometry args={[3.5, 6, 7]} />
        <meshStandardMaterial color="#1a4a1a" roughness={1} />
      </mesh>
      <mesh position={[0, 10.5, 0]} castShadow>
        <coneGeometry args={[2.5, 5, 7]} />
        <meshStandardMaterial color="#1e5520" roughness={1} />
      </mesh>
      <mesh position={[0, 13.5, 0]} castShadow>
        <coneGeometry args={[1.5, 4, 7]} />
        <meshStandardMaterial color="#236b28" roughness={1} />
      </mesh>
    </group>
  )
}

function DeciduousTree({ position, scale = 1 }) {
  const [x, , z] = position
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.55, 6, 6]} />
        <meshStandardMaterial color="#5c3d1e" roughness={1} />
      </mesh>
      <mesh position={[0, 9, 0]} castShadow>
        <sphereGeometry args={[4, 8, 6]} />
        <meshStandardMaterial color="#2d5a1b" roughness={1} />
      </mesh>
      <mesh position={[2, 10.5, 1]} castShadow>
        <sphereGeometry args={[2.5, 7, 5]} />
        <meshStandardMaterial color="#355c22" roughness={1} />
      </mesh>
      <mesh position={[-1.5, 10, -1.5]} castShadow>
        <sphereGeometry args={[2.8, 7, 5]} />
        <meshStandardMaterial color="#264d15" roughness={1} />
      </mesh>
    </group>
  )
}

// Shrubs placed outside the building footprint
function Shrubs() {
  const positions = [
    [-18, 0, 16], [18, 0, 16],
    [-18, 0, -16], [18, 0, -16],
    [-10, 0, 24], [10, 0, 24],
    [0, 0, 26], [-20, 0, 0],
  ]
  return (
    <>
      {positions.map(([x, y, z], i) => (
        <mesh key={i} position={[x, 0.8, z]} castShadow>
          <sphereGeometry args={[1.2 + (i % 3) * 0.3, 6, 5]} />
          <meshStandardMaterial color="#2a5c18" roughness={1} />
        </mesh>
      ))}
    </>
  )
}

function GroundCover() {
  const patches = useMemo(() => {
    const rand = seededRand(99)
    return Array.from({ length: 40 }, () => {
      let x, z
      do {
        x = (rand() - 0.5) * 180
        z = (rand() - 0.5) * 180
      } while (isInsideExclusion(x, z))
      return {
        x, z,
        r: 2 + rand() * 4,
        color: rand() > 0.5 ? '#2e5c1a' : '#3a6622',
      }
    })
  }, [])

  return (
    <>
      {patches.map((p, i) => (
        <mesh key={i} position={[p.x, 0.01, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[p.r, 6]} />
          <meshStandardMaterial color={p.color} roughness={1} />
        </mesh>
      ))}
    </>
  )
}

export default function Forest() {
  const trees = useTreePositions()

  return (
    <group>
      <GroundCover />
      <Shrubs />
      {trees.map((t, i) =>
        t.variety === 'pine' ? (
          <PineTree key={i} position={[t.x, 0, t.z]} scale={t.scale} />
        ) : (
          <DeciduousTree key={i} position={[t.x, 0, t.z]} scale={t.scale} />
        )
      )}
    </group>
  )
}
