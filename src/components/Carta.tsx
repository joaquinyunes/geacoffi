import { useLayoutEffect, useRef } from 'react'
import BotonCamara from '../camara/BotonCamara'
import { NEGOCIO, PRODUCTOS } from '../data/products'
import { gsap, SIN_REDUCIR } from '../scroll'

// Fondo y color de texto de cada fila; se repiten si hay más productos que colores.
const COLORES = [
  ['#f9a8c9', '#17122b'], ['#5646d9', '#fff3e2'], ['#ffd93d', '#17122b'],
  ['#ff7a6b', '#17122b'], ['#8fd3ff', '#17122b'], ['#b6f0c2', '#17122b'],
]
const primeraPanaderia = PRODUCTOS.findIndex((p) => p.categoria === 'panaderia')

/** La carta como una tira de filas a pantalla completa: una foto grande por producto, con parallax al scrollear. */
export default function Carta() {
  const raiz = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia(raiz)
    mm.add(SIN_REDUCIR, () => {
      gsap.utils.toArray<HTMLElement>('.fila').forEach((fila) => {
        const scrub = { trigger: fila, start: 'top bottom', end: 'bottom top', scrub: true }
        gsap.fromTo(fila.querySelector('.fila-foto'), { yPercent: 14, rotate: -7 }, { yPercent: -14, rotate: 7, ease: 'none', scrollTrigger: scrub })
        gsap.fromTo(fila.querySelector('.fila-fondo'), { xPercent: 12 }, { xPercent: -12, ease: 'none', scrollTrigger: scrub })
        gsap.from(fila.querySelector('.fila-texto'), { y: 60, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: fila, start: 'top 65%' } })
      })
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={raiz} id="carta" className="carta" aria-label="La carta">
      {PRODUCTOS.map((p, i) => {
        const [fondo, texto] = COLORES[i % COLORES.length]
        return (
          <article key={p.id} id={i === primeraPanaderia ? 'panaderia' : undefined} className={`fila${i % 2 ? ' invertida' : ''}`} style={{ background: fondo, color: texto }}>
            <span className="fila-fondo" aria-hidden="true">{p.nombre}</span>
            <div className="fila-foto"><img src={p.foto} alt={p.nombre} loading="lazy" /></div>
            <div className="fila-texto">
              <p className="kicker">{String(i + 1).padStart(2, '0')} · {p.categoria === 'bebida' ? 'Desde la barra' : 'De la vitrina'}</p>
              <h2>{p.nombre}</h2>
              <p className="fila-desc">{p.desc}</p>
              <p className="fila-precio">{p.precio ?? <a href={NEGOCIO.whatsapp} target="_blank" rel="noopener noreferrer">Consultá el precio por WhatsApp</a>}</p>
              <BotonCamara producto={p} variante="fila" />
            </div>
          </article>
        )
      })}
    </section>
  )
}
