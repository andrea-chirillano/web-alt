import { create } from 'zustand'
import { DAY } from './config'

function initialHour() {
  const raw = new URLSearchParams(window.location.search).get('hour')
  const hour = raw === null ? NaN : Number(raw)
  return hour >= 0 && hour < 24 ? hour : DAY.startHour
}

export const useStore = create((set) => ({
  hour: initialHour(),
  paused: false,
  minutesPerDay: DAY.minutesPerDay,
  camMode: 'third',
  camAuto: false,
  showHud: true,
  showTime: true,
  showColliders: false,
  showStats: false,
  helpVisible: true,
  respawnTick: 0,
  renderStats: null,

  setHour: (hour) => set({ hour }),
  advanceHour: (dt) =>
    set((s) => ({ hour: (s.hour + (dt * 24) / (s.minutesPerDay * 60)) % 24 })),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  setMinutesPerDay: (minutesPerDay) => set({ minutesPerDay }),
  setCamMode: (camMode) => set({ camMode }),
  setCamAuto: (camAuto) => set({ camAuto }),
  toggleCamMode: () => set((s) => ({ camMode: s.camMode === 'third' ? 'first' : 'third' })),
  toggle: (key) => set((s) => ({ [key]: !s[key] })),
  hideHelp: () => set({ helpVisible: false }),
  respawn: () => set((s) => ({ respawnTick: s.respawnTick + 1 })),
  setRenderStats: (renderStats) => set({ renderStats }),
}))
