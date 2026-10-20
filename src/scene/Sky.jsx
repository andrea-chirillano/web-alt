import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { useStore } from '../store'
import { getSky } from './timeOfDay'

const SKY_DISTANCE = 500
const STAR_COUNT = 400
const STAR_RADIUS = 700
const RAY_COUNT = 8
const CRATER_FACES = [7, 23, 38, 52, 66]

function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeSunRays() {
  const rays = []
  for (let i = 0; i < RAY_COUNT; i++) {
    const cone = new THREE.ConeGeometry(2.2, 14, 3)
    cone.translate(0, 18, 0)
    cone.rotateZ((i / RAY_COUNT) * Math.PI * 2)
    rays.push(cone)
  }
  return mergeGeometries(rays)
}

function makeMoonGeometry() {
  const g = new THREE.IcosahedronGeometry(11, 1)
  const faces = g.attributes.position.count / 3
  const base = new THREE.Color('#e8ecff')
  const crater = new THREE.Color('#aab2d4')
  const colors = new Float32Array(faces * 9)
  for (let f = 0; f < faces; f++) {
    const c = CRATER_FACES.includes(f) ? crater : base
    for (let v = 0; v < 3; v++) c.toArray(colors, f * 9 + v * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return g
}

function useStars() {
  return useMemo(() => {
    const rand = mulberry32(1337)
    return Array.from({ length: STAR_COUNT }, () => {
      // Uniform direction on the upper hemisphere, kept slightly above the horizon.
      const y = 0.03 + rand() * 0.97
      const phi = rand() * Math.PI * 2
      const r = Math.sqrt(1 - y * y)
      return {
        position: new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r).multiplyScalar(STAR_RADIUS),
        scale: 1.2 + rand() * 2,
        speed: 0.5 + rand() * 2,
        phase: rand() * Math.PI * 2,
      }
    })
  }, [])
}

export default function Sky() {
  const scene = useThree((s) => s.scene)
  const follow = useRef()
  const sunGroup = useRef()
  const sunRays = useRef()
  const moon = useRef()
  const stars = useRef()
  const sunLight = useRef()
  const moonLight = useRef()
  const hemiLight = useRef()
  const frame = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const starData = useStars()
  const rayGeometry = useMemo(() => makeSunRays(), [])
  const moonGeometry = useMemo(() => makeMoonGeometry(), [])

  useFrame(({ camera, clock }, dt) => {
    const sky = getSky(useStore.getState().hour)
    const night = sky.nightFactor

    follow.current.position.copy(camera.position)
    scene.fog.color.copy(sky.horizon)

    sunGroup.current.visible = sky.sunDir.y > -0.2
    sunGroup.current.position.copy(sky.sunDir).multiplyScalar(SKY_DISTANCE)
    sunGroup.current.lookAt(0, 0, 0)
    sunRays.current.rotation.z += dt * 0.1

    moon.current.visible = sky.moonDir.y > -0.2
    moon.current.position.copy(sky.moonDir).multiplyScalar(SKY_DISTANCE)

    sunLight.current.position.copy(sky.sunDir).multiplyScalar(100)
    sunLight.current.color.copy(sky.sunColor)
    sunLight.current.intensity = 3 * sky.sunLight
    moonLight.current.position.copy(sky.moonDir).multiplyScalar(100)
    moonLight.current.intensity = 0.35 * night
    hemiLight.current.intensity = THREE.MathUtils.lerp(0.4, 0.3, night)

    const starMesh = stars.current
    starMesh.visible = night > 0.01
    starMesh.material.opacity = night
    if (starMesh.visible && frame.current++ % 2 === 0) {
      const t = clock.elapsedTime
      starData.forEach((s, i) => {
        dummy.position.copy(s.position)
        dummy.scale.setScalar(s.scale * (0.75 + 0.25 * Math.sin(t * s.speed + s.phase)))
        dummy.updateMatrix()
        starMesh.setMatrixAt(i, dummy.matrix)
      })
      starMesh.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <fog attach="fog" args={['#ffffff', 120, 800]} />
      <group ref={follow}>
        <group ref={sunGroup}>
          <mesh>
            <icosahedronGeometry args={[14, 1]} />
            <meshBasicMaterial color="#ffd27a" flatShading fog={false} />
          </mesh>
          <mesh ref={sunRays} geometry={rayGeometry}>
            <meshBasicMaterial color="#ffd27a" flatShading fog={false} />
          </mesh>
        </group>
        <mesh ref={moon} geometry={moonGeometry}>
          <meshBasicMaterial vertexColors flatShading fog={false} />
        </mesh>
        <instancedMesh ref={stars} args={[null, null, STAR_COUNT]} frustumCulled={false}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#ffffff" transparent depthWrite={false} fog={false} />
        </instancedMesh>
      </group>
      <directionalLight ref={sunLight} />
      <directionalLight ref={moonLight} color="#9db4ff" />
      <hemisphereLight ref={hemiLight} args={['#dfe9ff', '#8a7a6a', 0.4]} />
    </>
  )
}
