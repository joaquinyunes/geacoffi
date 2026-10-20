import { useCallback, useEffect, useRef, useState } from 'react'
import { PRODUCTOS } from '../data/products'
import { ScrollTrigger } from '../scroll'
import Mascota from './Mascota'
import SalaPlana from './SalaPlana'
import { ESTACIONES, estacionEn } from './secciones'
import { useSalaMode } from './use-sala-mode'
import type { Sala as EscenaSala } from './create-sala'

const FOTOS = PRODUCTOS.map((p) => p.foto)

/** El café en 3D: al scrollear, la cámara recorre la sala y cada estación muestra su texto. */
function Recorrido({ onFail, onSimple }: { onFail: () => void; onSimple: () => void }) {
  const contenedor = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const barra = useRef<HTMLElement>(null)
  const progreso = useRef(0)
  const escena = useRef<EscenaSala | null>(null)
  const [estacion, setEstacion] = useState(0)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let cancelado = false
    import('./create-sala')
      .then(({ createSala }) => {
        if (cancelado) return
        try {
          escena.current = createSala({ canvas: el, fotos: FOTOS, leerProgreso: () => progreso.current, onFail })
        } catch {
          onFail()
        }
      })
      .catch(onFail)
    const mover = (e: PointerEvent) => escena.current?.setPointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1)
    addEventListener('pointermove', mover)
    return () => {
      cancelado = true
      removeEventListener('pointermove', mover)
      escena.current?.dispose()
      escena.current = null
    }
  }, [onFail])

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: contenedor.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progreso.current = self.progress
        setEstacion(estacionEn(self.progress))
        if (barra.current) barra.current.style.transform = `scaleX(${self.progress})`
      },
    })
    return () => st.kill()
  }, [])

  return (
    <section ref={contenedor} className="tour" style={{ height: `${ESTACIONES.length * 90}vh` }} aria-label="Recorrido por GeaCofi">
      <div className="tour-escenario">
        <canvas ref={canvas} className="tour-canvas" aria-hidden="true" />
        <h1 className="sr-only">GeaCofi, café de especialidad</h1>
        <div className="tour-textos">
          {ESTACIONES.map((e, i) => (
            <div key={e.id} className={`tour-texto${i === estacion ? ' activo' : ''}`}>
              <p className="kicker">{e.kicker}</p>
              <p className="tour-titulo">{e.titulo}</p>
              <p>{e.texto}</p>
              {e.cta && <a className="btn rojo" href={e.cta.href}>{e.cta.etiqueta}</a>}
            </div>
          ))}
        </div>
        <Mascota frase={ESTACIONES[estacion].frase} />
        <button type="button" className="enlace tour-simple" onClick={onSimple}>Versión simple</button>
        <p className="tour-pista" aria-hidden="true">Scrolleá para recorrer ↓</p>
        <i ref={barra} className="tour-barra" aria-hidden="true" />
      </div>
    </section>
  )
}

/** El recorrido 3D, o la versión plana si no hay WebGL, el usuario pidió menos movimiento o la escena falla. */
export default function Sala() {
  const { modo, razon, activar, desactivar, fallar } = useSalaMode()
  const alFallar = useCallback(() => fallar(), [fallar])
  return modo === 'sala' ? <Recorrido onFail={alFallar} onSimple={desactivar} /> : <SalaPlana razon={razon} onActivar={activar} />
}
