import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody, TrimeshCollider } from '@react-three/rapier'

export const COLLIDERS_URL = `${import.meta.env.BASE_URL}models/office_colliders.glb`

// The collider nodes are never added to the visible scene; only their data is used.
export default function Colliders() {
  const { scene } = useGLTF(COLLIDERS_URL)
  const parts = useMemo(() => {
    const found = []
    scene.traverse((o) => {
      if (o.userData?.collider) found.push(o)
    })
    return found
  }, [scene])

  return (
    <RigidBody type="fixed" colliders={false}>
      {parts.map((o) => {
        if (o.userData.collider === 'cuboid') {
          return <CuboidCollider key={o.uuid} args={o.userData.half_extents} position={o.position.toArray()} />
        }
        // Floor geometry is already in world coordinates, so the node position is not applied.
        const g = o.geometry
        return (
          <TrimeshCollider
            key={o.uuid}
            args={[g.attributes.position.array, Uint32Array.from(g.index.array)]}
          />
        )
      })}
    </RigidBody>
  )
}

useGLTF.preload(COLLIDERS_URL)
