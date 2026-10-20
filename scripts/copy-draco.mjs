import { cpSync, mkdirSync } from 'node:fs'

const from = 'node_modules/three/examples/jsm/libs/draco/gltf'
const to = 'public/draco'

mkdirSync(to, { recursive: true })
cpSync(from, to, { recursive: true })
