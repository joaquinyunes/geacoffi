import { useLayoutEffect, useRef } from 'react'
import Pizarra from '../sala/Pizarra'
import { gsap, SIN_REDUCIR } from '../scroll'

/** La pizarra del café, para garabatear. Entra girada y se endereza al llegar. */
export default function PizarraSeccion() {
  const raiz = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const mm = gsap.matchMedia(raiz)
    mm.add(SIN_REDUCIR, () => {
      gsap.from('.pizarra-marco', { rotate: 6, y: 80, opacity: 0, duration: 1, ease: 'back.out(1.4)', scrollTrigger: { trigger: raiz.current, start: 'top 60%' } })
      gsap.from('.pizarra-intro > *', { y: 40, opacity: 0, stagger: 0.12, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: raiz.current, start: 'top 65%' } })
    })
    return () => mm.revert()
  }, [])
  return (
    <section ref={raiz} id="pizarra" className="pizarra-sec" aria-label="La pizarra">
      <div className="pizarra-intro">
        <p className="kicker">La pizarra</p>
        <h2>Dibujá algo, <em>es tuya</em></h2>
        <p>Elegí un marcador y garabateá con el dedo o el mouse. No se guarda: es para pasar el rato.</p>
      </div>
      <div className="pizarra-marco"><Pizarra /></div>
    </section>
  )
}
