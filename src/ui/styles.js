import { PALETTE } from '../config'

export const panel = {
  position: 'absolute',
  background: 'rgba(30, 24, 22, 0.78)',
  border: `1px solid ${PALETTE.terracotta}`,
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 14,
  lineHeight: 1.4,
  color: '#fff',
  pointerEvents: 'auto',
}

export const button = {
  background: PALETTE.teal,
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '4px 10px',
  cursor: 'pointer',
  font: 'inherit',
}
