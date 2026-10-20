/* ==========================================================================
   GeaCofi · carta.js
   Efectos de la página Carta (se carga después de main.js, que pone el menú,
   el scroll suave y los textos por líneas). Todo con gsap + ScrollTrigger.
   Con "reducir movimiento" solo queda el menú de secciones.
   ========================================================================== */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

/* menú fijo: marca la sección visible y desliza la píldora hasta ese link */
function setupNav() {
  const nav = $('#c-nav'), bar = $('.c-nav-bar', nav), links = $$('a', nav)
  const place = (a) => {
    links.forEach((l) => l.classList.toggle('is-on', l === a))
    bar.style.width = a ? a.offsetWidth + 'px' : '0px'
    bar.style.transform = a ? `translateX(${a.offsetLeft}px)` : ''
    if (a) nav.scrollTo?.({ left: a.offsetLeft - 20, behavior: 'smooth' })
  }
  links.forEach((a) => ScrollTrigger.create({
    trigger: a.getAttribute('href'), start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => { if (self.isActive) place(a); else if (!links.some((l) => l.classList.contains('is-on') && l !== a)) place(null) },
  }))
  addEventListener('resize', () => place(links.find((l) => l.classList.contains('is-on')) || null))
}

function intro() {
  // portada: título letra por letra, fondo con paralaje y accesos que suben escalonados
  const t = $('.c-title span')
  const split = SplitText.create(t, { type: 'chars', mask: 'chars' })
  gsap.fromTo(split.chars, { yPercent: 115 }, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.06 })
  gsap.from('.c-tile', { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, delay: 0.5 })
  gsap.to('.c-hero-bg', { yPercent: 9, ease: 'none', scrollTrigger: { trigger: '.c-hero', start: 'top top', end: 'bottom top', scrub: true } })
}

function sections() {
  // número gigante de cada sección con paralaje propio
  $$('.c-bignum').forEach((n) => gsap.fromTo(n, { yPercent: 18 }, { yPercent: -18, ease: 'none', scrollTrigger: { trigger: n, start: 'top bottom', end: 'bottom top', scrub: true } }))

  // franjas de texto: corren hacia lados opuestos con el scroll
  $$('.c-band').forEach((b, i) => {
    const s = $('span', b)
    s.textContent = s.textContent.repeat(4)
    gsap.fromTo(s, { xPercent: i % 2 ? -40 : 0 }, { xPercent: i % 2 ? 0 : -40, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: 0.6 } })
  })

  $$('.c-item').forEach((it) => {
    const cards = $$('.c-card', it)
    const tl = gsap.timeline({ scrollTrigger: { trigger: it, start: 'top 72%' } })
    tl.fromTo(cards, { clipPath: 'inset(0 0 100% 0)', y: 70 }, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 1.3, ease: 'expo.out', stagger: 0.14, clearProps: 'clipPath' }, 0)
      .fromTo($$('img', it).slice(0, 3), { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out', stagger: 0.14 }, 0)
      .from($('.c-num', it), { opacity: 0, y: 40, duration: 1, ease: 'power3.out' }, 0.5)
      .from($('.c-line', it), { scaleX: 0, duration: 1.2, ease: 'expo.out' }, 0.3)
      .from($$('.c-specs div', it), { opacity: 0, y: 24, duration: 0.8, ease: 'power3.out', stagger: 0.09 }, 0.5)
      .from($('.c-link', it), { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' }, 0.9)

    // las fotos se desplazan a distinta velocidad dentro de su marco
    ;[['.c-main img', 5], ['.c-ph1 img', 8], ['.c-ph2 img', 6]].forEach(([sel, k]) => {
      const img = $(sel, it)
      gsap.fromTo(img, { yPercent: -k }, { yPercent: k, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } })
    })
  })

  // parejas
  gsap.from('.c-pair', { y: 90, opacity: 0, rotate: 2, duration: 1.2, ease: 'expo.out', stagger: 0.14, scrollTrigger: { trigger: '.c-pair-grid', start: 'top 78%' } })
}

function start() {
  setupNav()
  if (!reduce) { intro(); sections() }
  addEventListener('load', () => ScrollTrigger.refresh())
}

if (document.documentElement.classList.contains('is-ready')) start()
else document.addEventListener('gc:ready', start, { once: true })
