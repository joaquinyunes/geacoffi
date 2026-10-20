import { useLayoutEffect, useRef } from 'react'
import BotonCamara from '../camara/BotonCamara'
import { PRODUCTOS } from '../data/products'
import { gsap, SIN_REDUCIR } from '../scroll'

/** Galería horizontal: la sección se clava y el scroll vertical desplaza los cuadros hacia un costado. */
export default function Galeria() {
  const raiz = useRef<HTMLElement>(null)
  const pista = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia(raiz)
    mm.add(SIN_REDUCIR, () => {
      const el = pista.current
      if (!el) return
      const recorrido = () => Math.max(0, el.scrollWidth - innerWidth)
      gsap.to(el, {
        x: () => -recorrido(),
        ease: 'none',
        scrollTrigger: { trigger: raiz.current, start: 'top top', end: () => `+=${recorrido()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
      })
      gsap.utils.toArray<HTMLElement>('.cuadro').forEach((c, i) => gsap.fromTo(c, { rotate: i % 2 ? 5 : -5 }, { rotate: i % 2 ? -5 : 5, ease: 'none', scrollTrigger: { trigger: raiz.current, start: 'top top', end: () => `+=${recorrido()}`, scrub: true } }))
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={raiz} id="galeria" className="galeria-sec" aria-label="Galería">
      <div ref={pista} className="galeria-pista">
        <div className="galeria-titulo">
          <p className="kicker">La galería</p>
          <h2>Cada uno,<br /><em>enmarcado</em></h2>
          <p>Mirá cualquiera a tamaño real sobre tu mesa con la cámara del celular.</p>
        </div>
        {PRODUCTOS.map((p, i) => (
          <figure key={p.id} className={`cuadro c${i % 3}`}>
            <div className="cuadro-marco"><img src={p.foto} alt={p.nombre} loading="lazy" /></div>
            <figcaption>{p.nombre}<BotonCamara producto={p} variante="miniatura" /></figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
