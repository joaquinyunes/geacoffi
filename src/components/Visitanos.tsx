import { useLayoutEffect, useRef } from 'react'
import { NEGOCIO } from '../data/products'
import { gsap, SIN_REDUCIR } from '../scroll'

const externo = { target: '_blank', rel: 'noopener noreferrer' } as const
const MAPA = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${NEGOCIO.nombre} ${NEGOCIO.direccion}`)}`

/** Dónde, cuándo y cómo escribir, con un título gigante que entra al scrollear. */
export default function Visitanos() {
  const raiz = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const mm = gsap.matchMedia(raiz)
    mm.add(SIN_REDUCIR, () => {
      gsap.from('.visita-titulo span', { yPercent: 110, stagger: 0.12, duration: 0.9, ease: 'power4.out', scrollTrigger: { trigger: raiz.current, start: 'top 70%' } })
      gsap.from('.dato', { y: 50, opacity: 0, stagger: 0.12, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: '.datos', start: 'top 85%' } })
    })
    return () => mm.revert()
  }, [])
  return (
    <section ref={raiz} id="visitanos" className="visita" aria-label="Dónde y cuándo">
      <h2 className="visita-titulo"><span>Pasá por</span><span><em>{NEGOCIO.nombre}</em></span></h2>
      <div className="datos">
        <div className="dato"><b>Dirección</b><p>{NEGOCIO.direccion}</p><a className="btn" href={MAPA} {...externo}>Cómo llegar</a></div>
        <div className="dato"><b>Horarios</b><p>{NEGOCIO.horarios || 'Consultá por WhatsApp'}</p></div>
        <div className="dato"><b>Escribinos</b><p>Reservas y consultas</p><a className="btn rojo" href={NEGOCIO.whatsapp} {...externo}>WhatsApp</a></div>
        <div className="dato"><b>Seguinos</b><p>@geacofi</p><a className="btn" href={NEGOCIO.instagram} {...externo}>Instagram</a></div>
      </div>
    </section>
  )
}
