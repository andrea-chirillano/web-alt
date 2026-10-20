import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { CLIP_SPEED, PLAYER } from '../config'
import { useStore } from '../store'

const CHARACTER_URL = `${import.meta.env.BASE_URL}models/character.glb`
const FADE = 0.2

// `motion` is a ref written by Player: { moving, running, heading }.
export default function Character({ motion }) {
  const group = useRef()
  const model = useRef()
  const { scene, animations } = useGLTF(CHARACTER_URL)
  const object = useMemo(() => {
    const copy = clone(scene)
    copy.traverse((o) => {
      if (!o.isMesh) return
      // The model is painted with vertex colors; dropping them (and any map) leaves a plain white figure.
      o.material = o.material.clone()
      o.material.vertexColors = false
      o.material.map = null
      o.material.color.set('#ffffff')
    })
    return copy
  }, [scene])
  const { actions } = useAnimations(animations, group)
  const current = useRef(null)

  useEffect(() => {
    const idle = actions.Idle
    idle.reset().play()
    current.current = idle
  }, [actions])

  useFrame((_, dt) => {
    const { moving, running, heading } = motion.current

    const next = actions[moving ? (running ? 'Run' : 'Walk') : 'Idle']
    if (next && next !== current.current) {
      next.reset().fadeIn(FADE).play()
      next.timeScale = next === actions.Run ? PLAYER.run / CLIP_SPEED.Run : next === actions.Walk ? PLAYER.walk / CLIP_SPEED.Walk : 1
      current.current?.fadeOut(FADE)
      current.current = next
    }

    const delta = THREE.MathUtils.euclideanModulo(heading - model.current.rotation.y + Math.PI, Math.PI * 2) - Math.PI
    model.current.rotation.y += delta * (1 - Math.exp(-PLAYER.turn * dt))

    const { camMode, camAuto } = useStore.getState()
    group.current.visible = camMode === 'third' && !camAuto
  })

  return (
    <group ref={group}>
      <group ref={model}>
        <primitive object={object} />
      </group>
    </group>
  )
}

useGLTF.preload(CHARACTER_URL)
