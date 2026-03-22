import { Canvas } from '@react-three/fiber'
import { Sky, Environment } from '@react-three/drei'
import { useState, useEffect, Suspense } from 'react'
import ADUModel from './components/ADUModel'
import Forest from './components/Forest'
import CameraControls from './components/CameraControls'
import UI from './components/UI'

export default function App() {
  const [mode, setMode] = useState('orbit') // 'orbit' | 'walk'
  const [roofVisible, setRoofVisible] = useState(true)

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'KeyR' && !e.repeat) setRoofVisible((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <UI mode={mode} setMode={setMode} roofVisible={roofVisible} setRoofVisible={setRoofVisible} />
      <Canvas
        shadows
        camera={{ position: [45, 25, 45], fov: 55, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          {/* Sky and ambient environment */}
          <Sky
            distance={450000}
            sunPosition={[100, 40, 80]}
            inclination={0.49}
            azimuth={0.25}
          />
          <Environment preset="forest" background={false} />

          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[50, 60, 30]}
            intensity={1.4}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={200}
            shadow-camera-left={-60}
            shadow-camera-right={60}
            shadow-camera-top={60}
            shadow-camera-bottom={-60}
          />
          <directionalLight position={[-30, 20, -20]} intensity={0.3} />

          {/* Scene */}
          <ADUModel roofVisible={roofVisible} />
          <Forest />

          {/* Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[300, 300]} />
            <meshStandardMaterial color="#3d5a2a" roughness={1} />
          </mesh>

          <CameraControls mode={mode} />
        </Suspense>
      </Canvas>
    </div>
  )
}
