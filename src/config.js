export const PLAYER = {
  height: 1.7,
  radius: 0.25,
  eye: 1.6,
  walk: 3.6,
  run: 6.5,
  accel: 12,
  turn: 10,
  gravity: 9.81,
  stepHeight: 0.2,
}

// Speeds at which the Walk and Run clips were authored; clips are sped up by speed / reference to avoid foot sliding.
export const CLIP_SPEED = { Walk: 1.575, Run: 2.94 }

export const CAMERA = { distance: 2.8, min: 0.8, height: 1.5, sensitivity: 0.0025, fov: 60 }

export const DAY = {
  minutesPerDay: 4,
  startHour: 18.5, // The reference sunset lightmap.
}

export const PALETTE = { terracotta: '#C8644A', mustard: '#D9A441', teal: '#3E8F8F' }
