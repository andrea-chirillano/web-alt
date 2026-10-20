import * as THREE from 'three'

export function loadLightmaps() {
  const loader = new THREE.TextureLoader()
  const base = import.meta.env.BASE_URL
  const load = (url) => {
    const t = loader.load(url)
    t.flipY = false
    t.colorSpace = THREE.SRGBColorSpace
    t.channel = 1 // UV1 (TEXCOORD_1)
    t.anisotropy = 4
    return t
  }
  return {
    day: load(`${base}models/lightmap_day.webp`),
    sunset: load(`${base}models/lightmap_sunset.webp`),
    night: load(`${base}models/lightmap_night.webp`),
  }
}

// One material shared by every Arch_* mesh; `weights` is (day, sunset, night) and is updated per frame.
export function makeArchMaterial(base, maps, weights) {
  const m = base.clone()
  m.aoMap = null
  m.lightMap = maps.day
  m.lightMapIntensity = Math.PI // The map is already albedo × light; three divides by π.
  m.onBeforeCompile = (shader) => {
    shader.uniforms.lmB = { value: maps.sunset }
    shader.uniforms.lmC = { value: maps.night }
    shader.uniforms.lmW = { value: weights }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D lmB;\nuniform sampler2D lmC;\nuniform vec3 lmW;')
      .replace(
        '#include <lights_fragment_maps>',
        THREE.ShaderChunk.lights_fragment_maps.replace(
          'texture2D( lightMap, vLightMapUv )',
          '( texture2D( lightMap, vLightMapUv ) * lmW.x + texture2D( lmB, vLightMapUv ) * lmW.y + texture2D( lmC, vLightMapUv ) * lmW.z )',
        ),
      )
  }
  m.customProgramCacheKey = () => 'archLightmap3'
  return m
}
