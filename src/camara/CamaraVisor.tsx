import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import CamaraFicha from './CamaraFicha'
import CamaraProducto from './CamaraProducto'
import CamaraTarjetaReferencia from './CamaraTarjetaReferencia'
import { limitarEscala, pxPorCmInicial } from './escala'
import { tamanoDe } from './tamano-estimado'
import type { EstadoCamara, Producto } from './tipos'
import { useCamaraStream } from './use-camara-stream'
import { useGestoEscala } from './use-gesto-escala'
import { useImagenRecortada } from './use-imagen-recortada'

const AVISOS: Partial<Record<EstadoCamara, string>> = {
  'sin-https': 'La cámara necesita una conexión segura (https). Te mostramos una mesa con cuadrícula de 5 cm.',
  denegada: 'No diste permiso a la cámara. Te mostramos una mesa con cuadrícula de 5 cm.',
  'sin-camara': 'No encontramos una cámara en este dispositivo. Te mostramos una mesa con cuadrícula de 5 cm.',
}

/** Visor a pantalla completa: cámara en vivo con el producto a tamaño real y calibración con una tarjeta. */
export default function CamaraVisor({ producto, onClose }: { producto: Producto; onClose: () => void }) {
  const { estado, videoRef } = useCamaraStream()
  const img = useImagenRecortada(producto.foto)
  const escenario = useRef<HTMLDivElement>(null)
  const cerrar = useRef<HTMLButtonElement>(null)
  const tamano = tamanoDe(producto)
  const [inicial, setInicial] = useState(() => pxPorCmInicial(Math.min(window.innerWidth, 720)))
  const [px, setPx] = useState(inicial)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useLayoutEffect(() => {
    const w = escenario.current?.clientWidth
    if (!w) return
    const v = pxPorCmInicial(w)
    setInicial(v)
    setPx(v)
  }, [])

  useEffect(() => {
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrar.current?.focus()
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', tecla)
    return () => {
      document.body.style.overflow = overflow
      removeEventListener('keydown', tecla)
    }
  }, [onClose])

  const gestos = useGestoEscala({
    pxPorCm: px,
    onEscala: (v) => setPx(limitarEscala(v, inicial)),
    onMover: (dx, dy) => setPos((p) => ({ x: p.x + dx, y: p.y + dy })),
  })
  const sinCamara = estado !== 'activa' && estado !== 'pidiendo'

  return (
    <div className="visor" role="dialog" aria-modal="true" aria-labelledby="visor-titulo">
      <div ref={escenario} className="visor-escenario" style={{ touchAction: 'none' }} {...gestos}>
        <video ref={videoRef} className="visor-video" playsInline muted hidden={estado !== 'activa'} />
        {sinCamara && <div className="visor-mesa" style={{ backgroundSize: `${5 * px}px ${5 * px}px` }} />}
        <CamaraProducto producto={producto} tamano={tamano} pxPorCm={px} pos={pos} img={img} />
        <CamaraTarjetaReferencia pxPorCm={px} />
        <button ref={cerrar} type="button" className="visor-cerrar" onClick={onClose} aria-label="Cerrar visor">×</button>
        <div className="visor-controles" onPointerDown={(e) => e.stopPropagation()}>
          {AVISOS[estado] && <p role="status">{AVISOS[estado]}</p>}
          {estado === 'pidiendo' && <p role="status">Pidiendo acceso a la cámara…</p>}
          <label>
            Calibrá: apoyá una tarjeta real bajo el recuadro y ajustá hasta que coincidan (o pellizcá).
            <input type="range" min={inicial / 3} max={inicial * 3} step={0.1} value={px} onChange={(e) => setPx(+e.target.value)} />
          </label>
        </div>
      </div>
      <CamaraFicha producto={producto} tamano={tamano} />
    </div>
  )
}
