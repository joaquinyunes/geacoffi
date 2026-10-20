import { useRef, type PointerEvent, type WheelEvent } from 'react'
import { escalaPellizco } from './escala'

type Args = {
  pxPorCm: number
  onEscala: (v: number) => void
  onMover: (dx: number, dy: number) => void
}

/** Un dedo arrastra el producto, dos dedos (pellizco) o la rueda calibran la escala. */
export function useGestoEscala({ pxPorCm, onEscala, onMover }: Args) {
  const punteros = useRef(new Map<number, { x: number; y: number }>())
  const pellizco = useRef<{ d0: number; base: number } | null>(null)
  const distancia = () => {
    const [a, b] = [...punteros.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  return {
    onPointerDown(e: PointerEvent) {
      e.currentTarget.setPointerCapture(e.pointerId)
      punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (punteros.current.size === 2) pellizco.current = { d0: distancia() || 1, base: pxPorCm }
    },
    onPointerMove(e: PointerEvent) {
      const previo = punteros.current.get(e.pointerId)
      if (!previo) return
      punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (punteros.current.size === 2 && pellizco.current) onEscala(escalaPellizco(pellizco.current.base, pellizco.current.d0, distancia()))
      else if (punteros.current.size === 1) onMover(e.clientX - previo.x, e.clientY - previo.y)
    },
    onPointerUp(e: PointerEvent) {
      punteros.current.delete(e.pointerId)
      pellizco.current = null
    },
    onWheel(e: WheelEvent) {
      onEscala(pxPorCm * (e.deltaY < 0 ? 1.05 : 0.95))
    },
  }
}
