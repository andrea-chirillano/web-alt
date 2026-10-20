import { useEffect, useRef } from 'react'
import { useStore } from '../store'

const MOVE_KEYS = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'run', ShiftRight: 'run',
}
const PREVENT_DEFAULT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'])

// Returns a ref holding the live key state; reading it never causes a re-render.
export function useKeys() {
  const keys = useRef({ forward: false, back: false, left: false, right: false, run: false })

  useEffect(() => {
    const set = (e, value) => {
      if (PREVENT_DEFAULT.has(e.code)) e.preventDefault()
      const action = MOVE_KEYS[e.code]
      if (action) keys.current[action] = value
    }
    const onDown = (e) => set(e, true)
    const onUp = (e) => set(e, false)
    const reset = () => Object.keys(keys.current).forEach((k) => (keys.current[k] = false))
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', reset)
    }
  }, [])

  return keys
}

export function useHotkeys() {
  useEffect(() => {
    const onDown = (e) => {
      if (e.repeat) return
      const s = useStore.getState()
      switch (e.code) {
        case 'KeyV': s.toggleCamMode(); break
        case 'Digit1': case 'Numpad1': s.setCamMode('first'); break
        case 'Digit3': case 'Numpad3': s.setCamMode('third'); break
        case 'KeyH': s.toggle('showHud'); break
        case 'KeyT': s.toggle('showTime'); break
        case 'F1': e.preventDefault(); s.toggle('showColliders'); break
        case 'F2': e.preventDefault(); s.toggle('showStats'); break
      }
    }
    window.addEventListener('keydown', onDown)
    return () => window.removeEventListener('keydown', onDown)
  }, [])
}
