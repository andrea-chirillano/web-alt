import { useStore } from '../store'
import { formatHour } from './formatHour'
import { panel, button } from './styles'

const SPEEDS = [1, 4, 10, 30]
const SHORTCUTS = [
  ['Amanecer', 6],
  ['Mediodía', 12],
  ['Atardecer', 18.5],
  ['Noche', 22],
]

export default function TimeControls() {
  // Selecting whole minutes limits re-renders to once per in-game minute.
  const minutes = useStore((s) => Math.floor(s.hour * 60))
  const paused = useStore((s) => s.paused)
  const minutesPerDay = useStore((s) => s.minutesPerDay)
  const { setHour, togglePause, setMinutesPerDay } = useStore.getState()

  return (
    <div style={{ ...panel, bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: 8, width: 360 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={button} onClick={togglePause}>
          {paused ? 'Reanudar' : 'Pausar'}
        </button>
        <input
          type="range"
          min={0}
          max={24}
          step={0.05}
          value={minutes / 60}
          onChange={(e) => setHour(Math.min(23.99, Number(e.target.value)))}
          style={{ flex: 1 }}
        />
        <strong style={{ minWidth: 48, textAlign: 'right' }}>{formatHour(minutes / 60)}</strong>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SHORTCUTS.map(([label, hour]) => (
          <button key={label} style={button} onClick={() => setHour(hour)}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
        <span>Min/día:</span>
        {SPEEDS.map((m) => (
          <button key={m} style={{ ...button, opacity: m === minutesPerDay ? 1 : 0.6 }} onClick={() => setMinutesPerDay(m)}>{m}</button>
        ))}
      </div>
    </div>
  )
}
