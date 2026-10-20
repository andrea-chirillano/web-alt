import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { COLLIDERS_URL } from './Colliders'

export function useSpawn() {
  const { scene } = useGLTF(COLLIDERS_URL)
  return useMemo(() => {
    const node = scene.getObjectByName('Spawn_Player')
    const position = node.position.clone()
    const lookAt = new THREE.Vector3(...node.userData.look_at)
    const yaw = Math.atan2(-(lookAt.x - position.x), -(lookAt.z - position.z))
    return { position, yaw }
  }, [scene])
}
