import { Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import * as THREE from 'three'
import { CAMERA } from './config'
import { useHotkeys } from './hooks/useKeys'
import Clouds from './scene/Clouds'
import Colliders from './scene/Colliders'
import Office from './scene/Office'
import Player from './scene/Player'
import Sky from './scene/Sky'
import SkyGradient from './scene/SkyGradient'
import { useStore } from './store'
import Hud from './ui/Hud'

function TimeTicker() {
  useFrame((_, dt) => {
    const s = useStore.getState()
    if (!s.paused) s.advanceHour(Math.min(dt, 0.1))
  })
  return null
}

function StatsProbe() {
  const gl = useThree((s) => s.gl)
  const frame = useRef(0)
  useFrame(() => {
    if (frame.current++ % 30 !== 0) return
    const { calls, triangles } = gl.info.render
    useStore.getState().setRenderStats({ calls, triangles })
  })
  return null
}

export default function App() {
  useHotkeys()
  const showColliders = useStore((s) => s.showColliders)
  const showStats = useStore((s) => s.showStats)

  return (
    <>
      <Canvas
        shadows={false}
        dpr={[1, 1.5]}
        camera={{ fov: CAMERA.fov, near: 0.05, far: 2000 }}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
      >
        <Suspense fallback={null}>
          <TimeTicker />
          <SkyGradient />
          <Sky />
          <Office />
          <Clouds />
          <Physics debug={showColliders}>
            <Colliders />
            <Player />
          </Physics>
          {showStats && <StatsProbe />}
        </Suspense>
      </Canvas>
      <Hud />
    </>
  )
}
