import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { loadLightmaps, makeArchMaterial } from './BakedLight'
import { lightWeights } from './timeOfDay'

export const OFFICE_URL = `${import.meta.env.BASE_URL}models/office.glb`

const isUnder = (object, namePrefix) => {
  for (let o = object; o; o = o.parent) if (o.name.startsWith(namePrefix)) return true
  return false
}

function prepareOffice(scene) {
  scene.updateMatrixWorld(true)

  const maps = loadLightmaps()
  const rig = { clouds: null, cloudMaterial: null, windowsMaterial: null, lampMaterials: new Set() }
  let archMaterial = null
  let furnitureMaterial = null

  scene.traverse((o) => {
    if (o.name === 'Clouds') rig.clouds = o
    if (!o.isMesh) return
    const material = o.material

    if (o.name.startsWith('Arch_')) {
      archMaterial ??= makeArchMaterial(material, maps, lightWeights)
      o.material = archMaterial
    } else if (isUnder(o, 'Cloud')) {
      if (!rig.cloudMaterial) {
        rig.cloudMaterial = material.clone()
        rig.cloudMaterial.aoMap = null
        rig.cloudMaterial.flatShading = true
      }
      o.material = rig.cloudMaterial
    } else if (o.name.startsWith('City_Windows')) {
      rig.windowsMaterial ??= material.clone()
      o.material = rig.windowsMaterial
    } else if (material.name === 'Glass') {
      material.depthWrite = false
      o.renderOrder = 10
    } else if (material.name === 'Palette') {
      // The furniture and the city carry their occlusion in vertex colors (COLOR_0).
      if (!furnitureMaterial) {
        furnitureMaterial = material.clone()
        furnitureMaterial.aoMap = null
      }
      o.material = furnitureMaterial
    }
    if (o.name.endsWith('_E')) rig.lampMaterials.add(o.material)
  })

  scene.traverse((o) => {
    if (!isUnder(o, 'Clouds')) o.matrixAutoUpdate = false
  })
  return rig
}

export function useOffice() {
  const { scene } = useGLTF(OFFICE_URL)
  return useMemo(() => {
    scene.userData.rig ??= prepareOffice(scene)
    return { scene, rig: scene.userData.rig }
  }, [scene])
}
