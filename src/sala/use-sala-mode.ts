import { useCallback, useState } from 'react'

const CLAVE = 'geacofi:sala3d'

export type Modo = 'sala' | 'plana'
export type Razon = 'sin-webgl' | 'elegido' | 'movimiento-reducido' | 'ahorro-datos' | 'falla' | ''
export type EstadoModo = { modo: Modo; razon: Razon }

function hayWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
const leer = () => { try { return localStorage.getItem(CLAVE) } catch { return null } }
const guardar = (v: 'on' | 'off') => { try { localStorage.setItem(CLAVE, v) } catch { /* sin storage: no se recuerda la elección */ } }

function decidir(): EstadoModo {
  if (!hayWebGL()) return { modo: 'plana', razon: 'sin-webgl' }
  const elegido = leer()
  if (elegido === 'on') return { modo: 'sala', razon: '' }
  if (elegido === 'off') return { modo: 'plana', razon: 'elegido' }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return { modo: 'plana', razon: 'movimiento-reducido' }
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return { modo: 'plana', razon: 'ahorro-datos' }
  return { modo: 'sala', razon: '' }
}

/** Sala 3D o versión plana de respaldo. Recuerda la elección y cae a plana si WebGL falta o falla. */
export function useSalaMode() {
  const [estado, setEstado] = useState<EstadoModo>(decidir)
  const activar = useCallback(() => { guardar('on'); setEstado(decidir()) }, [])
  const desactivar = useCallback(() => { guardar('off'); setEstado(decidir()) }, [])
  const fallar = useCallback(() => setEstado({ modo: 'plana', razon: 'falla' }), [])
  return { ...estado, activar, desactivar, fallar }
}
