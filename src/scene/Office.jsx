import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'
import { getSky } from './timeOfDay'
import { OFFICE_URL, useOffice } from './useOffice'

export default function Office() {
  const { scene, rig } = useOffice()

  useFrame(() => {
    const sky = getSky(useStore.getState().hour)
    if (rig.windowsMaterial) rig.windowsMaterial.emissiveIntensity = 2.5 * sky.nightFactor
    const lamps = THREE.MathUtils.lerp(0.6, 1.5, sky.nightFactor)
    rig.lampMaterials.forEach((m) => (m.emissiveIntensity = lamps))
  })

  return <primitive object={scene} />
}

useGLTF.preload(OFFICE_URL)
