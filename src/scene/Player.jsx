import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import { CAMERA, PLAYER } from '../config'
import { useKeys } from '../hooks/useKeys'
import { useStore } from '../store'
import Character from './Character'
import { useSpawn } from './useSpawn'

const HALF_HEIGHT = (PLAYER.height - 2 * PLAYER.radius) / 2
const MAX_PITCH = Math.PI / 3
const CAMERA_WALL_MARGIN = 0.15
const AUTO_EXIT_MARGIN = 0.4

const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const wish = new THREE.Vector3()
const pivot = new THREE.Vector3()
const camDir = new THREE.Vector3()

function updateCamera({ camera, world, rapier, excludeCollider }, t, l, store) {
  const cosP = Math.cos(l.pitch)
  pivot.set(t.x, t.y + CAMERA.height, t.z)
  // Offset from the pivot to the camera: behind the view direction, above when the pitch is positive.
  camDir.set(Math.sin(l.yaw) * cosP, Math.sin(l.pitch), Math.cos(l.yaw) * cosP)

  let firstPerson = store.camMode === 'first'
  let distance = CAMERA.distance
  if (!firstPerson) {
    const hit = world.castRay(new rapier.Ray(pivot, camDir), CAMERA.distance, true, undefined, undefined, excludeCollider)
    if (hit) distance = Math.max(0, hit.timeOfImpact - CAMERA_WALL_MARGIN)
    // Leaving a tight space needs extra room, so the view does not flicker at the threshold.
    firstPerson = distance < (store.camAuto ? CAMERA.min + AUTO_EXIT_MARGIN : CAMERA.min)
  }
  // The chosen mode (camMode) is never changed here, so third person returns once there is room.
  const auto = firstPerson && store.camMode === 'third'
  if (store.camAuto !== auto) store.setCamAuto(auto)

  if (firstPerson) {
    camera.position.set(t.x, t.y + PLAYER.eye, t.z)
    camera.lookAt(
      t.x - Math.sin(l.yaw) * cosP,
      t.y + PLAYER.eye - Math.sin(l.pitch),
      t.z - Math.cos(l.yaw) * cosP,
    )
    return
  }
  camera.position.copy(pivot).addScaledVector(camDir, distance)
  camera.lookAt(pivot)
}

export default function Player() {
  const spawn = useSpawn()
  const { world, rapier } = useRapier()
  const gl = useThree((s) => s.gl)
  const keys = useKeys()
  const body = useRef()
  const collider = useRef()
  const motion = useRef({ moving: false, running: false, heading: spawn.yaw + Math.PI })
  const look = useRef({ yaw: spawn.yaw, pitch: 0.2 })
  const velocity = useRef(new THREE.Vector3())
  const verticalSpeed = useRef(0)
  const lastRespawn = useRef(useStore.getState().respawnTick)

  const controller = useRef(null)

  // Created in an effect because StrictMode frees the Rapier world (and its controllers) between mounts.
  useEffect(() => {
    const c = world.createCharacterController(0.02)
    c.setUp({ x: 0, y: 1, z: 0 })
    c.enableAutostep(PLAYER.stepHeight, 0.1, false)
    c.enableSnapToGround(0.2)
    c.setSlideEnabled(true)
    c.setMaxSlopeClimbAngle((50 * Math.PI) / 180)
    c.setApplyImpulsesToDynamicBodies(false)
    controller.current = c
    return () => {
      world.removeCharacterController(c)
      controller.current = null
    }
  }, [world])

  useEffect(() => {
    const canvas = gl.domElement
    const onMove = (e) => {
      if (document.pointerLockElement !== canvas && !(e.buttons & 1)) return
      const l = look.current
      l.yaw -= e.movementX * CAMERA.sensitivity
      l.pitch = THREE.MathUtils.clamp(l.pitch + e.movementY * CAMERA.sensitivity, -MAX_PITCH, MAX_PITCH)
    }
    const onClick = () => canvas.requestPointerLock?.()
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('click', onClick)
    return () => {
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('click', onClick)
    }
  }, [gl])

  useFrame(({ camera }, dt) => {
    const ctrl = controller.current
    if (!ctrl) return
    dt = Math.min(dt, 0.05)
    const store = useStore.getState()
    const k = keys.current
    const l = look.current
    const v = velocity.current

    if (store.respawnTick !== lastRespawn.current) {
      lastRespawn.current = store.respawnTick
      body.current.setTranslation(spawn.position, true)
      v.set(0, 0, 0)
      verticalSpeed.current = 0
      l.yaw = spawn.yaw
      l.pitch = 0.2
    }

    const inputZ = Number(k.forward) - Number(k.back)
    const inputX = Number(k.right) - Number(k.left)
    const moving = inputX !== 0 || inputZ !== 0
    if (moving && store.helpVisible) store.hideHelp()

    forward.set(-Math.sin(l.yaw), 0, -Math.cos(l.yaw))
    right.set(Math.cos(l.yaw), 0, -Math.sin(l.yaw))
    wish.set(0, 0, 0).addScaledVector(forward, inputZ).addScaledVector(right, inputX)
    if (moving) wish.normalize()

    const speed = k.run ? PLAYER.run : PLAYER.walk
    const blend = 1 - Math.exp(-PLAYER.accel * dt)
    v.x += (wish.x * speed - v.x) * blend
    v.z += (wish.z * speed - v.z) * blend

    verticalSpeed.current = ctrl.computedGrounded() ? 0 : verticalSpeed.current - PLAYER.gravity * dt

    ctrl.computeColliderMovement(collider.current, {
      x: v.x * dt,
      y: verticalSpeed.current * dt,
      z: v.z * dt,
    })
    const m = ctrl.computedMovement()
    const t = body.current.translation()
    body.current.setNextKinematicTranslation({ x: t.x + m.x, y: t.y + m.y, z: t.z + m.z })

    if (moving) motion.current.heading = Math.atan2(wish.x, wish.z)
    motion.current.moving = moving
    motion.current.running = moving && k.run

    updateCamera({ camera, world, rapier, excludeCollider: collider.current }, t, l, store)
  })

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={spawn.position.toArray()}>
      <CapsuleCollider ref={collider} args={[HALF_HEIGHT, PLAYER.radius]} position={[0, HALF_HEIGHT + PLAYER.radius, 0]} />
      <Character motion={motion} />
    </RigidBody>
  )
}
