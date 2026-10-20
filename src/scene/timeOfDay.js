import * as THREE from 'three'

// Hour, top sky, horizon sky, sun color, lightmap weights (day, sunset, night).
const TABLE = [
  [0, '#070b1f', '#14204a', '#ff9a5a', [0, 0, 1]],
  [5, '#0d1433', '#2a2f63', '#ff9a5a', [0, 0, 1]],
  [6, '#3b4a8a', '#f2a477', '#ff9a5a', [0, 1, 0]],
  [8, '#5f95d6', '#f7d2a8', '#ffd9a8', [1, 0, 0]],
  [11, '#4f93e0', '#bfe0f2', '#fff4e0', [1, 0, 0]],
  [15, '#4a8fdc', '#c8e4f4', '#fff4e0', [1, 0, 0]],
  [17, '#5b84cc', '#f6c79a', '#ffc890', [0.5, 0.5, 0]],
  [18.5, '#4f5c9c', '#f6a97a', '#ff8a45', [0, 1, 0]],
  [19.5, '#1f2a5e', '#8a5a86', '#ff7a50', [0, 0.4, 0.6]],
  [21, '#0a1230', '#1c2a5e', '#ff7a50', [0, 0, 1]],
].map(([hour, top, horizon, sun, weights]) => ({
  hour,
  top: new THREE.Color(top),
  horizon: new THREE.Color(horizon),
  sun: new THREE.Color(sun),
  weights: new THREE.Vector3(...weights),
}))
const LAST = { ...TABLE[0], hour: 24 }
const ROWS = [...TABLE, LAST]

// East: the sun rises there; its opposite matches the baked sunset sun.
const EAST = new THREE.Vector3(0.907, 0, -0.42)
const SOUTH_UP = new THREE.Vector3(0, 0.9, 0.35)

// Shared with the baked-light material so one write updates every architecture mesh.
export const lightWeights = new THREE.Vector3(0, 1, 0)

const sky = {
  top: new THREE.Color(),
  horizon: new THREE.Color(),
  sunColor: new THREE.Color(),
  sunDir: new THREE.Vector3(),
  moonDir: new THREE.Vector3(),
  nightFactor: 0,
  sunLight: 0,
}

let cachedHour = NaN

// Returns a shared object: read it within the frame, do not keep references to its fields.
export function getSky(hour) {
  if (hour === cachedHour) return sky
  cachedHour = hour

  const h = ((hour % 24) + 24) % 24
  let i = ROWS.findIndex((row, idx) => h >= row.hour && h < ROWS[idx + 1].hour)
  if (i < 0) i = ROWS.length - 2
  const a = ROWS[i]
  const b = ROWS[i + 1]
  const t = (h - a.hour) / (b.hour - a.hour)

  sky.top.lerpColors(a.top, b.top, t)
  sky.horizon.lerpColors(a.horizon, b.horizon, t)
  sky.sunColor.lerpColors(a.sun, b.sun, t)
  lightWeights.lerpVectors(a.weights, b.weights, t)

  const angle = ((h - 6) / 12) * Math.PI
  sky.sunDir
    .copy(EAST)
    .multiplyScalar(Math.cos(angle))
    .addScaledVector(SOUTH_UP, Math.sin(angle))
    .normalize()
  sky.moonDir.copy(sky.sunDir).negate()
  sky.nightFactor = THREE.MathUtils.clamp((-sky.sunDir.y + 0.05) / 0.25, 0, 1)
  sky.sunLight = THREE.MathUtils.clamp((sky.sunDir.y + 0.15) / 0.25, 0, 1)
  return sky
}
