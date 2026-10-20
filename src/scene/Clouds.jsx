import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import { getSky, lightWeights } from './timeOfDay'
import { useOffice } from './useOffice'

const DAY_COLOR = new THREE.Color('#ffffff')
const DAY_EMISSIVE = new THREE.Color('#000000')
const DUSK_COLOR = new THREE.Color('#ffb59a')
const DUSK_EMISSIVE = new THREE.Color('#2a1a18')
const NIGHT_COLOR = new THREE.Color('#7b8199')
const NIGHT_EMISSIVE = new THREE.Color('#2b3042')

const ORBIT_SPEED = 0.004 // rad/s: one lap every ~26 minutes.

// The clouds are children of the Clouds empty inside office.glb; this only animates and tints them.
export default function Clouds() {
  const { rig } = useOffice()
  const { clouds, cloudMaterial } = rig

  useFrame(({ clock }, dt) => {
    if (!clouds) return
    const t = clock.elapsedTime
    clouds.rotation.y += ORBIT_SPEED * dt
    clouds.children.forEach((cloud, i) => {
      cloud.userData.baseY ??= cloud.position.y
      cloud.position.y = cloud.userData.baseY + Math.sin(t * 0.05 + i) * 0.5
      cloud.rotation.y += 0.01 * dt * (i % 2 ? 1 : -1)
    })

    const sky = getSky(useStore.getState().hour)
    cloudMaterial.color.copy(DAY_COLOR).lerp(DUSK_COLOR, lightWeights.y).lerp(NIGHT_COLOR, sky.nightFactor)
    cloudMaterial.emissive.copy(DAY_EMISSIVE).lerp(DUSK_EMISSIVE, lightWeights.y).lerp(NIGHT_EMISSIVE, sky.nightFactor)
  })

  return null
}
