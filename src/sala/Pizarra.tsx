import { useRef, useState } from 'react'
import { NEGOCIO } from '../data/products'

const COLORES = [
  { nombre: 'Negro', valor: '#17122b' },
  { nombre: 'Azul', valor: '#3b5bdb' },
  { nombre: 'Rojo', valor: '#e5392b' },
  { nombre: 'Rosa', valor: '#f06aa6' },
]
const W = 640, H = 400

/** Pizarra para garabatear. No se guarda: es un juguete, no un servicio. */
export default function Pizarra() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const ultimo = useRef<{ x: number; y: number } | null>(null)
  const [color, setColor] = useState(COLORES[2].valor)

  const punto = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
  }
  const trazar = (e: React.PointerEvent) => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx || !ultimo.current) return
    const p = punto(e)
    ctx.strokeStyle = color
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(ultimo.current.x, ultimo.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    ultimo.current = p
  }
  const limpiar = () => canvas.current?.getContext('2d')?.clearRect(0, 0, W, H)

  return (
    <div className="pizarra">
      <p className="pizarra-msg">{NEGOCIO.pizarra || 'Hoy la pizarra es tuya: dibujá lo que quieras.'}</p>
      <canvas
        ref={canvas}
        className="pizarra-lienzo"
        width={W}
        height={H}
        aria-label="Pizarra para dibujar con el dedo o el mouse"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); ultimo.current = punto(e); trazar(e) }}
        onPointerMove={trazar}
        onPointerUp={() => { ultimo.current = null }}
        onPointerCancel={() => { ultimo.current = null }}
      />
      <div className="pizarra-herr">
        {COLORES.map((c) => (
          <button
            key={c.valor}
            type="button"
            className="marcador"
            style={{ background: c.valor }}
            aria-label={`Marcador ${c.nombre}`}
            aria-pressed={color === c.valor}
            onClick={() => setColor(c.valor)}
          />
        ))}
        <button type="button" className="btn chico" onClick={limpiar}>Borrar</button>
      </div>
    </div>
  )
}
