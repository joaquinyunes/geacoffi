import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** Animaciones de scroll solo si el usuario no pidió reducir movimiento. Todo lo que se cree adentro se limpia solo. */
export const SIN_REDUCIR = '(prefers-reduced-motion: no-preference)'

export { gsap, ScrollTrigger }
