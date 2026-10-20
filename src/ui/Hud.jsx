import { useState } from 'react'
import { useProgress } from '@react-three/drei'
import { PALETTE } from '../config'
import { useStore } from '../store'
import TimeControls from './TimeControls'
import { formatHour } from './formatHour'
import { button, panel } from './styles'

function Credits({ onClose }) {
  return (
    <div style={{ ...panel, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 420 }}>
      <h3 style={{ margin: '0 0 8px', color: PALETTE.mustard }}>Créditos</h3>
      <p style={{ margin: '0 0 8px' }}>
        Personaje: «FEMALE» por staxegolo (Sketchfab), licencia CC-BY 4.0.{' '}
        <a style={{ color: PALETTE.mustard }} href="https://sketchfab.com/3d-models/female-9a0c634d1a2249d18afbbaecf6305706" target="_blank" rel="noreferrer">
          Fuente
        </a>
        . Modificado (esqueleto, escala y color).
      </p>
      <p style={{ margin: '0 0 12px' }}>Animaciones: Mixamo (Adobe).</p>
      <button style={button} onClick={onClose}>Cerrar</button>
    </div>
  )
}

function Loader() {
  const { active, progress } = useProgress()
  if (!active) return null
  return (
    <div style={{ ...panel, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
      Cargando… {Math.round(progress)}%
    </div>
  )
}

export default function Hud() {
  const [creditsOpen, setCreditsOpen] = useState(false)
  const showHud = useStore((s) => s.showHud)
  const showTime = useStore((s) => s.showTime)
  const helpVisible = useStore((s) => s.helpVisible)
  const camMode = useStore((s) => s.camMode)
  const setCamMode = useStore((s) => s.setCamMode)
  const firstPerson = useStore((s) => s.camMode === 'first' || s.camAuto)
  const minutes = useStore((s) => Math.floor(s.hour * 60))
  const renderStats = useStore((s) => s.renderStats)
  const showStats = useStore((s) => s.showStats)
  const respawn = useStore((s) => s.respawn)

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <Loader />
      {showHud && (
        <>
          <div style={{ ...panel, top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>{formatHour(minutes / 60)} · {firstPerson ? 'Primera persona' : 'Tercera persona'}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ ...button, opacity: camMode === 'first' ? 1 : 0.6 }} onClick={() => setCamMode('first')}>1ª persona</button>
              <button style={{ ...button, opacity: camMode === 'third' ? 1 : 0.6 }} onClick={() => setCamMode('third')}>3ª persona</button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={button} onClick={respawn}>Volver al inicio</button>
              <button style={button} onClick={() => setCreditsOpen(true)}>Créditos</button>
            </div>
            {showStats && renderStats && (
              <span style={{ fontSize: 12 }}>{renderStats.calls} draw calls · {renderStats.triangles} tris</span>
            )}
          </div>
          {helpVisible && (
            <div style={{ ...panel, top: 16, right: 16, maxWidth: 280 }}>
              <strong style={{ color: PALETTE.mustard }}>Controles</strong>
              <div>W A S D / flechas: moverse</div>
              <div>Shift: correr</div>
              <div>Click + mouse: mirar (Esc libera el mouse)</div>
              <div>1 / 3: primera / tercera persona (V alterna)</div>
              <div>T: hora · H: ocultar HUD</div>
              <div>F1: colliders · F2: estadísticas</div>
            </div>
          )}
          {showTime && <TimeControls />}
          {creditsOpen && <Credits onClose={() => setCreditsOpen(false)} />}
        </>
      )}
    </div>
  )
}
