import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import { getSky } from './timeOfDay'

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`

const FRAGMENT = /* glsl */ `
  uniform mat4 invProj;
  uniform mat4 cameraMatrixWorld;
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform vec3 sunColor;
  uniform vec3 sunDir;
  uniform vec3 moonDir;
  uniform float nightFactor;
  varying vec2 vUv;
  void main() {
    vec4 ndc = vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
    vec3 dir = normalize((cameraMatrixWorld * vec4((invProj * ndc).xyz, 0.0)).xyz);
    float h = clamp(dir.y, 0.0, 1.0);
    vec3 col = mix(horizonColor, topColor, pow(h, 0.55));
    col += sunColor * pow(max(dot(dir, sunDir), 0.0), 24.0) * (1.0 - nightFactor);
    col += vec3(0.25, 0.3, 0.5) * pow(max(dot(dir, moonDir), 0.0), 60.0) * nightFactor;
    col = mix(col, horizonColor, 1.0 - smoothstep(-0.4, 0.0, dir.y));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

// Full-screen gradient instead of a sky dome, so no sky geometry exists.
export default function SkyGradient() {
  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3))
    const m = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        invProj: { value: new THREE.Matrix4() },
        cameraMatrixWorld: { value: new THREE.Matrix4() },
        topColor: { value: new THREE.Color() },
        horizonColor: { value: new THREE.Color() },
        sunColor: { value: new THREE.Color() },
        sunDir: { value: new THREE.Vector3() },
        moonDir: { value: new THREE.Vector3() },
        nightFactor: { value: 0 },
      },
    })
    return { geometry: g, material: m }
  }, [])

  useFrame(({ camera }) => {
    const sky = getSky(useStore.getState().hour)
    const u = material.uniforms
    u.invProj.value.copy(camera.projectionMatrixInverse)
    u.cameraMatrixWorld.value.copy(camera.matrixWorld)
    u.topColor.value.copy(sky.top)
    u.horizonColor.value.copy(sky.horizon)
    u.sunColor.value.copy(sky.sunColor)
    u.sunDir.value.copy(sky.sunDir)
    u.moonDir.value.copy(sky.moonDir)
    u.nightFactor.value = sky.nightFactor
  })

  return <mesh geometry={geometry} material={material} renderOrder={-1000} frustumCulled={false} />
}
