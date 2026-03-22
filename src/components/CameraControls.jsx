import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Orbit mode  — standard mouse orbit/zoom/pan around the house
 * Walk mode   — WASD + mouse look (pointer lock), click canvas to activate
 */

// ─── First-Person Walk Controls ────────────────────────────────────────────────
function WalkControls() {
  const { camera, gl } = useThree()
  const keys = useRef({})
  const locked = useRef(false)
  const pitch = useRef(0)
  const yaw = useRef(0) // face south (+Z = front of house)
  const SPEED = 0.15
  const LOOK_SENS = 0.003

  useEffect(() => {
    // Start inside the living room area, eye height
    camera.position.set(0, 5.5, 8)

    const onKey = (e) => { keys.current[e.code] = e.type === 'keydown' }
    const onMouseMove = (e) => {
      if (!locked.current) return
      yaw.current -= e.movementX * LOOK_SENS
      pitch.current -= e.movementY * LOOK_SENS
      pitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch.current))
    }
    const onLockChange = () => {
      locked.current = document.pointerLockElement === gl.domElement
    }
    const onClick = () => {
      if (!locked.current) gl.domElement.requestPointerLock()
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('pointerlockchange', onLockChange)
    gl.domElement.addEventListener('click', onClick)

    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerlockchange', onLockChange)
      gl.domElement.removeEventListener('click', onClick)
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock()
      }
    }
  }, [camera, gl])

  useFrame(() => {
    // Build direction from yaw/pitch
    const dir = new THREE.Vector3(
      Math.sin(yaw.current) * Math.cos(pitch.current),
      Math.sin(pitch.current),
      Math.cos(yaw.current) * Math.cos(pitch.current)
    )
    const right = new THREE.Vector3(
      -Math.cos(yaw.current),
      0,
      Math.sin(yaw.current)
    )

    if (keys.current['KeyW'] || keys.current['ArrowUp'])    camera.position.addScaledVector(dir, SPEED)
    if (keys.current['KeyS'] || keys.current['ArrowDown'])  camera.position.addScaledVector(dir, -SPEED)
    if (keys.current['KeyA'] || keys.current['ArrowLeft'])  camera.position.addScaledVector(right, -SPEED)
    if (keys.current['KeyD'] || keys.current['ArrowRight']) camera.position.addScaledVector(right, SPEED)

    // Clamp height — stay above floor, below ceiling
    camera.position.y = Math.max(3, Math.min(9, camera.position.y))

    camera.lookAt(
      camera.position.x + dir.x,
      camera.position.y + dir.y,
      camera.position.z + dir.z
    )
  })

  return null
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function CameraControls({ mode }) {
  return mode === 'orbit' ? (
    <OrbitControls
      target={[0, 3, 0]}
      maxPolarAngle={Math.PI / 2.05}
      minDistance={5}
      maxDistance={150}
      enableDamping
      dampingFactor={0.05}
    />
  ) : (
    <WalkControls />
  )
}
