/* ==========================================================================
   GeaCofi · armar.js
   Página "Armá tu pedido": chips + nombre → resumen, y la vista previa cambia
   sola (con animación) según lo que elegís. Se carga después de main.js.
   ========================================================================== */
import gsap from 'gsap'
import { foto } from './negocio.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

const out = $('#cr-out'), name = $('#cr-name'), tag = $('#cr-tag')
const slots = { base: $('#slot-base'), pan: $('#slot-pan') }
const sel = { base: 'Filtrado', pan: 'Medialuna' }
const ids = { base: 'cafe-filtrado', pan: 'medialuna' } // data-img de cada chip = id del producto en negocio.js

$$('.cr-chip').forEach((c) => { if (c.dataset.img) new Image().src = foto(c.dataset.img) }) // precarga: el cambio no parpadea

function paint() {
  const n = name.value.trim()
  out.textContent = sel.base + (sel.pan ? ` + ${sel.pan}` : '') + (n ? ` · a nombre de ${n}` : '')
  tag.hidden = !n
  tag.textContent = n ? `Para ${n}` : ''
}

// la foto sale, se cambia el archivo y entra con un pequeño rebote
async function swap(slot, file, label) {
  const img = $('img', slot)
  if (!file) { reduce ? gsap.set(slot, { autoAlpha: 0 }) : gsap.to(slot, { autoAlpha: 0, scale: 0.85, duration: 0.35, ease: 'power2.in' }); return }
  const show = () => { img.src = foto(file); img.alt = label; return img.decode().catch(() => {}) }
  if (reduce) { await show(); gsap.set(slot, { autoAlpha: 1, scale: 1, y: 0 }); return }
  await gsap.to(slot, { y: -26, scale: 0.9, autoAlpha: 0, duration: 0.25, ease: 'power2.in', overwrite: true })
  await show()
  gsap.fromTo(slot, { y: 34, scale: 0.92 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.7, ease: 'back.out(1.7)' })
}

$$('.cr-chips').forEach((g) => g.addEventListener('click', (e) => {
  const b = e.target.closest('.cr-chip')
  if (!b) return
  $$('.cr-chip', g).forEach((c) => c.classList.toggle('is-on', c === b))
  const k = g.dataset.group
  sel[k] = b.dataset.v
  ids[k] = b.dataset.img
  swap(slots[k], b.dataset.img, b.dataset.v)
  paint()
}))
name.addEventListener('input', () => {
  const had = !tag.hidden
  paint()
  if (!had && !tag.hidden && !reduce) gsap.from(tag, { y: 14, opacity: 0, duration: 0.5, ease: 'back.out(2)' })
})

// pedir: lo elegido pasa al carrito (pedido.js) con el nombre ya cargado
$('#cr-pedir').addEventListener('click', () => {
  document.dispatchEvent(new CustomEvent('gc:pedir', { detail: { ids: [ids.base, ids.pan].filter(Boolean), nombre: name.value.trim() } }))
})

// entrada de las tarjetas (el título lo revela main.js con data-reveal)
function enter() { if (!reduce) gsap.from('.cr-card', { y: 50, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.09, delay: 0.2 }) }
if (document.documentElement.classList.contains('is-ready')) enter()
else document.addEventListener('gc:ready', enter, { once: true })
