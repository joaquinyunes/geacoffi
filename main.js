/* ==========================================================================
   GeaCofi · main.js
   Ideas centrales (implementación propia):
   1. Scroll suave: la rueda alimenta un resorte críticamente amortiguado
      (second-order dynamics) y su valor se aplica con window.scrollTo.
   2. Un canvas WebGL fijo detrás del DOM. Cada .gl-img del HTML se dibuja
      como un plano alineado a su rectángulo (paralaje, curvatura por velocidad).
   3. Una secuencia de 150 fotogramas (latte → vaso) guiada por el scroll.
   4. Postproceso: grano, viñeta, aberración cromática y glow suave.
   5. Secciones "pinned": main.js calcula su progreso 0..1 y anima el DOM.
   ========================================================================== */

import * as THREE from 'three'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import './footer.js' // arman el pie y los eventos antes de que boot() mida las secciones
import './eventos.js'

gsap.registerPlugin(SplitText)
gsap.ticker.lagSmoothing(0)

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t) }
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const isTouch = matchMedia('(hover: none)').matches
const isMobile = () => innerWidth < 768

const PAGE = document.body.dataset.page || 'inicio'
const S = { w: innerWidth, h: innerHeight, dpr: devicePixelRatio, max: 0, vel: 0, mx: 0, my: 0, ready: false }
const root = document.documentElement
root.classList.remove('no-js')
root.style.setProperty('--vh', S.h / 100 + 'px')

/* ---------- resorte de segundo orden (t3ssel8r) ----------
   f = frecuencia (rapidez), z = amortiguación (1 = sin rebote), r = anticipación. */
class Spring {
  constructor(n = 1, f = 1.5, z = 0.8, r = 0) {
    this.n = n
    this.k1 = z / (Math.PI * f)
    this.k2 = 1 / (2 * Math.PI * f) ** 2
    this.k3 = (r * z) / (2 * Math.PI * f)
    this.y = new Float64Array(n)
    this.yd = new Float64Array(n)
    this.xp = new Float64Array(n)
    this.init = false
  }
  update(dt, target) {
    if (!this.init) { for (let i = 0; i < this.n; i++) { this.y[i] = this.xp[i] = target[i]; this.yd[i] = 0 } this.init = true }
    // k2 estable aunque dt sea grande
    const k2s = Math.max(this.k2, (dt * dt) / 2 + (dt * this.k1) / 2, dt * this.k1)
    for (let i = 0; i < this.n; i++) {
      const x = target[i]
      const xd = (x - this.xp[i]) / dt
      this.xp[i] = x
      this.y[i] += dt * this.yd[i]
      this.yd[i] += (dt * (x + this.k3 * xd - this.y[i] - this.k1 * this.yd[i])) / k2s
    }
    return this.y
  }
}

/* ==========================================================================
   1 · SCROLL SUAVE
   ========================================================================== */
const smoothScroll = !reduceMotion && !isTouch
const scrollSpring = new Spring(1, 1.15, 1, 0)
let scrollTarget = scrollY
let scrollCur = scrollY
let lastSet = scrollY

const measureMax = () => { S.max = Math.max(0, root.scrollHeight - innerHeight) }

if (smoothScroll) {
  addEventListener('wheel', (e) => {
    if (e.ctrlKey) return // zoom del navegador
    e.preventDefault()
    const k = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1
    scrollTarget = clamp(scrollTarget + e.deltaY * k, 0, S.max)
  }, { passive: false })

  addEventListener('keydown', (e) => {
    const t = e.target
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
    if ((e.key === ' ' || e.key === 'Enter') && /^(BUTTON|A)$/.test(t.tagName)) return
    const page = innerHeight * 0.9
    const map = { ArrowDown: 100, ArrowUp: -100, PageDown: page, PageUp: -page, Home: -1e9, End: 1e9 }
    let d = map[e.key]
    if (e.key === ' ') d = e.shiftKey ? -page : page
    if (d === undefined) return
    e.preventDefault()
    scrollTarget = clamp(scrollTarget + d, 0, S.max)
  })
}

// Si algo movió el scroll por fuera (touch, barra, teclado nativo) nos sincronizamos
addEventListener('scroll', () => {
  if (Math.abs(scrollY - lastSet) > 2) { scrollTarget = scrollCur = lastSet = scrollY; scrollSpring.init = false }
}, { passive: true })

function scrollToY(y) {
  y = clamp(y, 0, S.max)
  if (smoothScroll) scrollTarget = y
  else scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' })
}

$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const h = a.getAttribute('href')
  const el = h === '#top' ? document.body : $(h)
  if (!el) return
  e.preventDefault()
  scrollToY(el.getBoundingClientRect().top + scrollY)
}))

let prevCur = scrollCur
function updateScroll(dt) {
  if (smoothScroll) {
    scrollCur = scrollSpring.update(dt, [scrollTarget])[0]
    if (Math.abs(scrollTarget - scrollCur) < 0.1) scrollCur = scrollTarget
    if (Math.abs(scrollCur - lastSet) > 0.01) { lastSet = scrollCur; scrollTo(0, scrollCur) }
  } else {
    scrollCur = scrollY
  }
  S.vel = lerp(S.vel, (scrollCur - prevCur) / dt, 0.25)
  prevCur = scrollCur
}

/* ==========================================================================
   2 · ESCENA WEBGL
   ========================================================================== */
const canvas = $('#gl')
let renderer = null
try {
  if (canvas) renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
} catch { /* sin WebGL */ }
if (!renderer) root.classList.add('no-gl')

const planes = []
let rt, sceneP, camP, scenePost, camPost, postMat, bg, wearText
const loadProgress = { total: 0, done: 0 }

/* ----- shaders de los planos de imagen ----- */
const planeVert = /* glsl */`
  varying vec2 vUv;
  uniform float uVel;
  void main() {
    vUv = uv;
    vec3 p = position;
    // curvatura según la velocidad del scroll: se siente "líquido" y suave
    p.y += sin(uv.x * 3.14159) * uVel * 0.05;
    p.x += (uv.y - 0.5) * uVel * 0.012;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`

const planeFrag = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uSize, uTexSize, uMouse;
  uniform float uReveal, uDim, uVel, uHover, uPar, uParK;
  vec2 coverUv(vec2 uv) {
    float pr = uSize.x / uSize.y, tr = uTexSize.x / uTexSize.y;
    vec2 s = pr > tr ? vec2(1.0, tr / pr) : vec2(pr / tr, 1.0);
    return (uv - 0.5) * s + 0.5;
  }
  void main() {
    vec2 uv = coverUv(vUv);
    float zoom = 1.16 + uHover * 0.035 + (1.0 - uReveal) * 0.12;
    uv = (uv - 0.5) / zoom + 0.5;
    uv += uMouse * 0.012 + vec2(0.0, uPar * uParK * 0.05);
    float ca = 0.0006 + abs(uVel) * 0.003;
    vec3 c = vec3(texture2D(uTex, uv + vec2(ca, 0.0)).r, texture2D(uTex, uv).g, texture2D(uTex, uv - vec2(ca, 0.0)).b);
    // look de estudio: contraste suave, cálido en luces y fondo profundo
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(l), c, 1.1);
    c = c * c * (3.0 - 2.0 * c) * 0.35 + c * 0.65;
    c *= vec3(1.04, 1.0, 0.93);
    float v = smoothstep(1.15, 0.25, length(vUv - 0.5) * 1.25);
    c *= mix(0.78, 1.0, v);
    c *= 1.0 - uDim;
    // revelado: barrido suave de abajo hacia arriba
    float m = smoothstep(0.0, 0.16, uReveal * 1.16 - (1.0 - vUv.y));
    gl_FragColor = vec4(c, m * step(0.001, uReveal));
  }`

/* ----- fondo degradado (cambia de color con la sección) ----- */
const bgFrag = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uA, uB, uGlowCol;
  uniform vec2 uGlowPos;
  uniform float uGlow, uAspect;
  void main() {
    vec3 col = mix(uA, uB, smoothstep(1.0, 0.0, vUv.y));
    float g = 1.0 - clamp(length((vUv - uGlowPos) * vec2(uAspect, 1.0)) * 0.9, 0.0, 1.0);
    col += uGlowCol * pow(g, 2.2) * uGlow * 0.55;
    gl_FragColor = vec4(col, 1.0);
  }`

/* ----- postproceso ----- */
const postFrag = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D tDiffuse;
  uniform vec2 uRes;
  uniform float uTime, uVel;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 d = vUv - 0.5;
    float r = length(d);
    float ca = (0.0004 + abs(uVel) * 0.0015) * r;
    vec3 col = vec3(texture2D(tDiffuse, vUv - d * ca * 6.0).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + d * ca * 6.0).b);
    // glow suave en las luces (halación de lente)
    vec3 glow = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785398;
      vec2 o = vec2(cos(a), sin(a)) * 7.0 / uRes;
      vec3 s = texture2D(tDiffuse, vUv + o).rgb;
      glow += max(s - 0.62, 0.0);
    }
    col += glow * 0.07 * vec3(1.0, 0.82, 0.6);
    // viñeta + grano de película
    col *= 1.0 - smoothstep(0.42, 0.98, r) * 0.38;
    col += (hash(vUv * uRes + fract(uTime) * 91.7) - 0.5) * 0.055;
    gl_FragColor = vec4(col, 1.0);
  }`

const tmpV = new THREE.Vector2()
// colores sRGB "crudos": el postproceso trabaja directo en sRGB, sin conversión a lineal
const rawColor = (hex) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace)

function makeFallbackTex() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const gr = g.createRadialGradient(80, 200, 10, 128, 128, 260)
  gr.addColorStop(0, '#8a4b1f'); gr.addColorStop(0.5, '#3a2415'); gr.addColorStop(1, '#140c07')
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256)
  const id = g.getImageData(0, 0, 256, 256)
  for (let i = 0; i < id.data.length; i += 4) { const n = (Math.random() - 0.5) * 16; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n }
  g.putImageData(id, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.NoColorSpace
  return t
}

const texCache = new Map()
function loadTex(src) {
  if (texCache.has(src)) return texCache.get(src)
  loadProgress.total++
  const p = new Promise((res) => {
    new THREE.TextureLoader().load(src, (t) => {
      t.colorSpace = THREE.NoColorSpace // trabajamos en sRGB "crudo" (ver el render target)
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
      loadProgress.done++; res(t)
    }, undefined, () => { loadProgress.done++; res(makeFallbackTex()) })
  })
  texCache.set(src, p)
  return p
}

const readyP = new Promise((r) => { S.resolveReady = r })

function makePlane(el, index, geo) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    vertexShader: planeVert, fragmentShader: planeFrag,
    uniforms: {
      uTex: { value: null }, uSize: { value: new THREE.Vector2(1, 1) }, uTexSize: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2() }, uReveal: { value: 0 }, uDim: { value: 0 }, uVel: { value: 0 },
      uHover: { value: 0 }, uPar: { value: 0 }, uParK: { value: parseFloat(el.dataset.parallax || '0.35') },
    },
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.visible = false
  mesh.frustumCulled = false
  mesh.renderOrder = index
  sceneP.add(mesh)
  const p = { el, mesh, mat, loaded: false, hover: 0, manual: el.classList.contains('feat-img') }
  planes.push(p)
  loadTex(el.dataset.src).then((t) => {
    mat.uniforms.uTex.value = t
    mat.uniforms.uTexSize.value.set(t.image.naturalWidth || t.image.width || 1, t.image.naturalHeight || t.image.height || 1)
    p.loaded = true
  })
  if (!p.manual) {
    new IntersectionObserver((ents, ob) => {
      if (!ents[0].isIntersecting) return
      ob.disconnect()
      readyP.then(() => gsap.to(mat.uniforms.uReveal, { value: 1, duration: 1.8, ease: 'power3.out' }))
    }, { threshold: 0.12 }).observe(el)
  }
}

/* ----- texto gigante "para llevar" dibujado en canvas (queda DETRÁS de la taza) ----- */
async function buildWearText() {
  await document.fonts.load('700 200px "Inter Tight"')
  const txt = 'para llevar'
  const fs = 420
  const c = document.createElement('canvas')
  const g = c.getContext('2d')
  g.font = `700 ${fs}px "Inter Tight"`
  c.width = Math.ceil(g.measureText(txt).width + 80)
  c.height = Math.ceil(fs * 1.25)
  g.font = `700 ${fs}px "Inter Tight"`
  g.fillStyle = '#f6e5cb'
  g.fillText(txt, 40, fs * 0.95)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }))
  m.renderOrder = 0.5
  m.visible = false
  m.userData.aspect = c.width / c.height
  sceneP.add(m)
  return m
}

/* ----- armado de la escena ----- */
function initScene() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile() ? 1.5 : 2))
  renderer.setSize(S.w, S.h, false)
  renderer.autoClear = false
  renderer.setClearColor(0x140c07, 1)

  rt = new THREE.WebGLRenderTarget(1, 1, { samples: 4 })
  rt.texture.colorSpace = THREE.SRGBColorSpace

  // escena 2D en píxeles (fondo + imágenes del DOM)
  sceneP = new THREE.Scene()
  camP = new THREE.OrthographicCamera(-S.w / 2, S.w / 2, S.h / 2, -S.h / 2, -10, 10)

  bg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: bgFrag,
    uniforms: {
      uA: { value: rawColor('#140c07') }, uB: { value: rawColor('#140c07') }, uGlowCol: { value: rawColor('#d8802f') },
      uGlowPos: { value: new THREE.Vector2(0.05, 0.1) }, uGlow: { value: 0 }, uAspect: { value: S.w / S.h },
    },
  }))
  bg.renderOrder = -10
  bg.frustumCulled = false
  sceneP.add(bg)

  const geo = new THREE.PlaneGeometry(1, 1, 24, 24)
  $$('.gl-img').forEach((el, i) => makePlane(el, i + 1, geo))
  buildWearText().then((m) => { wearText = m })

  // postproceso (un triángulo a pantalla completa)
  scenePost = new THREE.Scene()
  camPost = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  postMat = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: postFrag,
    uniforms: { tDiffuse: { value: rt.texture }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uVel: { value: 0 } },
  })
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat)
  quad.frustumCulled = false
  scenePost.add(quad)
}

function resizeGL() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile() ? 1.5 : 2))
  renderer.setSize(S.w, S.h, false)
  renderer.getDrawingBufferSize(tmpV)
  rt.setSize(tmpV.x, tmpV.y)
  postMat.uniforms.uRes.value.copy(tmpV)
  camP.left = -S.w / 2; camP.right = S.w / 2; camP.top = S.h / 2; camP.bottom = -S.h / 2
  camP.updateProjectionMatrix()
  bg.scale.set(S.w, S.h, 1)
  bg.material.uniforms.uAspect.value = S.w / S.h
}

/* ----- colores de fondo por sección ----- */
const BG = {
  hero: ['#140c07', '#140c07', 0], ai: ['#140c07', '#241309', 0.55], wearable: ['#1a0f08', '#42240f', 0.85],
  features: ['#150d08', '#150d08', 0], name: ['#140c07', '#1d1109', 0.3], grip: ['#140c07', '#140c07', 0.15],
  care: ['#140c07', '#1a0f09', 0.2], carta: ['#140c07', '#140c07', 0.1], momentos: ['#120a06', '#2a160a', 0.4],
  pausa: ['#140c07', '#2a170b', 0.55], eventos: ['#120a06', '#26140a', 0.4], footer: ['#140c07', '#2d190c', 0.6],
}
const bgTarget = { a: rawColor('#140c07'), b: rawColor('#140c07'), g: 0 }
const sections = $$('.section')
let secTops = []
function measureSections() { secTops = sections.map((s) => ({ id: s.id, top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight })) }
function activeSection(offset = 0.5) {
  const y = scrollCur + S.h * offset
  let cur = secTops[0]
  for (const s of secTops) if (s.top <= y) cur = s
  return cur
}

const mouseSpring = new Spring(2, 1.4, 0.9, 0)

/* ----- actualizar planos de imagen ----- */
function updatePlanes() {
  for (const p of planes) {
    const r = p.el.getBoundingClientRect()
    const vis = p.loaded && r.width > 1 && r.bottom > -120 && r.top < S.h + 120 && r.right > -120 && r.left < S.w + 120
    p.mesh.visible = vis
    if (!vis) continue
    const u = p.mat.uniforms
    p.mesh.position.set(r.left + r.width / 2 - S.w / 2, -(r.top + r.height / 2 - S.h / 2), 0)
    p.mesh.scale.set(r.width, r.height, 1)
    u.uSize.value.set(r.width, r.height)
    u.uVel.value = clamp(S.vel / 3200, -1, 1)
    u.uPar.value = clamp((r.top + r.height / 2 - S.h / 2) / (S.h / 2 + r.height / 2), -1.2, 1.2)
    const mx = (S.mx * 0.5 + 0.5) * S.w, my = (S.my * -0.5 + 0.5) * S.h
    const inside = mx > r.left && mx < r.right && my > r.top && my < r.bottom
    p.hover = lerp(p.hover, inside ? 1 : 0, 0.08)
    u.uHover.value = p.hover
    u.uMouse.value.set(clamp((mx - (r.left + r.width / 2)) / (r.width / 2 + 200), -1, 1), clamp(-(my - (r.top + r.height / 2)) / (r.height / 2 + 200), -1, 1))
    if (p.el.dataset.dim) u.uDim.value = smooth(0.05, 0.95, -r.top / r.height) * 0.9
  }
}

function render() {
  renderer.setRenderTarget(rt)
  renderer.clear()
  renderer.render(sceneP, camP)
  renderer.setRenderTarget(null)
  renderer.render(scenePost, camPost)
}

/* ==========================================================================
   3 · SECCIONES FIJADAS (progreso 0..1 → DOM)
   ========================================================================== */
const secProg = new Map()
const progressOf = (sec) => {
  const r = sec.getBoundingClientRect()
  return clamp(-r.top / Math.max(1, r.height - S.h))
}
const inView = (sec) => { const r = sec.getBoundingClientRect(); return r.bottom > 0 && r.top < S.h }

const winEls = $$('[data-win]').map((el) => {
  const [a, b, c, d] = el.dataset.win.split(',').map(Number)
  return { el, a, b, c, d, sec: el.closest('[data-sec]') }
})

const featItems = $$('.feat-item')
const featPlanes = () => planes.filter((p) => p.manual)
const featSlider = $('.feat-slider')
const featBar = $('.feat-slider-bar span')
let featIdx = -1
let featZ = 100
function setFeature(i) {
  featIdx = i
  featItems.forEach((it, j) => it.classList.toggle('is-active', i === j))
  const fp = featPlanes()
  fp.forEach((p, j) => {
    const u = p.mat.uniforms.uReveal
    if (j === i) {
      p.mesh.renderOrder = ++featZ
      gsap.killTweensOf(u)
      u.value = 0
      gsap.to(u, { value: 1, duration: 1.3, ease: 'expo.inOut', onComplete: () => fp.forEach((o, k) => { if (k !== i) { gsap.killTweensOf(o.mat.uniforms.uReveal); o.mat.uniforms.uReveal.value = 0 } }) })
    }
  })
  featSlider.classList.toggle('is-on', i === 1)
}

const momTrack = $('.mom-track')
const momBar = $('.mom-progress span')
const wearCols = $$('.wear-col-move')
const wearSec = $('#wearable')
const wearScene = $('.wear-scene')
// Zoom 3D: la cámara avanza WEAR_Z unidades con el scroll y todo (marcos, fotos, granos, sello) queda a una
// profundidad d; lo que la cámara pasa se desvanece, lo lejano aparece de a poco. El sello llega al final y se queda.
const WEAR_Z = 5200
const wearU = { w: 0, h: 0, v: 1, probe: null }
const wearItems = []
const wearSeed = (i, k) => { const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) } // posiciones fijas, no al azar
if (wearScene) {
  const world = $('.ws-world')
  $$('.ws-world > *').forEach((el, i) => wearItems.push({ el, x: +el.dataset.x || 0, y: +el.dataset.y || 0, d: +el.dataset.d, r: +el.dataset.r || 0, k: i, core: el.classList.contains('ws-core'), frame: el.classList.contains('ws-fr'), bean: false }))
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('div')
    const size = 38 + wearSeed(i, 1) * 56
    el.innerHTML = '<svg viewBox="0 0 100 140"><use href="#bean" /></svg>'
    el.style.width = `calc(${size.toFixed(1)} * var(--u))`
    el.style.height = `calc(${(size * 1.4).toFixed(1)} * var(--u))`
    el.className = 'ws-b'
    world.append(el)
    const side = wearSeed(i, 2) < 0.5 ? -1 : 1
    wearItems.push({ el, x: side * (260 + wearSeed(i, 3) * 700), y: (wearSeed(i, 4) - 0.5) * 900, d: 300 + wearSeed(i, 5) * 4700, r: wearSeed(i, 6) * 360, k: i, core: false, frame: false, bean: true, spin: 180 + wearSeed(i, 7) * 360 })
  }
}

function updatePinned() {
  secProg.clear()
  const P = (sec) => { if (!secProg.has(sec)) secProg.set(sec, progressOf(sec)); return secProg.get(sec) }

  for (const w of winEls) {
    const p = P(w.sec)
    const vin = smooth(w.a, w.b, p), vout = smooth(w.c, w.d, p)
    const o = vin * (1 - vout)
    w.el.style.opacity = o.toFixed(3)
    w.el.style.transform = `translate3d(0, ${((1 - vin) * 28 - vout * 28).toFixed(1)}px, 0)`
  }

  // features: qué ítem está activo según el progreso
  const fsec = $('#features')
  if (fsec && inView(fsec)) {
    const p = P(fsec)
    const idx = p < 0.34 ? 0 : p < 0.67 ? 1 : 2
    if (idx !== featIdx) setFeature(idx)
    featBar.style.width = (clamp((p - 0.34) / 0.33) * 100).toFixed(1) + '%'
  }

  // momentos: carrusel horizontal
  const msec = $('#momentos')
  if (msec && inView(msec)) {
    const p = P(msec)
    const dist = Math.max(0, momTrack.scrollWidth - S.w)
    momTrack.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`
    momBar.style.width = (p * 100).toFixed(1) + '%'
  }

  // wearable: columnas de miniaturas a contramano + texto gigante horizontal
  if (wearSec && inView(wearSec)) {
    const p = P(wearSec)
    wearCols.forEach((m, i) => {
      const dist = Math.max(0, m.scrollHeight - S.h * 0.9)
      m.style.transform = `translate3d(0, ${(i === 0 ? -p * dist : -(1 - p) * dist).toFixed(1)}px, 0)`
    })
    if (wearScene) {
      // la escena aparece al entrar a la sección; el scroll empuja la cámara hacia adelante
      if (wearU.w !== S.w || wearU.h !== S.h) {
        wearU.probe ||= Object.assign(document.createElement('i'), { style: 'position:absolute;width:calc(1000 * var(--u));height:0;visibility:hidden' })
        wearScene.append(wearU.probe)
        wearU.v = wearU.probe.getBoundingClientRect().width / 1000; wearU.w = S.w; wearU.h = S.h
      }
      const u = wearU.v
      const cam = p * WEAR_Z
      wearScene.style.opacity = smooth(0.03, 0.1, p).toFixed(3)
      wearScene.style.setProperty('--wx', (S.my * -3).toFixed(2) + 'deg')
      wearScene.style.setProperty('--wy', (S.mx * 4).toFixed(2) + 'deg')
      wearScene.style.setProperty('--spin', (-p * 900).toFixed(1) + 'deg')
      for (const it of wearItems) {
        const dist = it.d - cam // unidades por delante de la cámara (negativo = ya la pasó)
        const far = 1 - smooth(2600, 3800, dist)
        const near = it.core ? 1 : smooth(-1100, -450, dist)
        const o = far * near
        it.el.style.opacity = o.toFixed(3)
        it.el.style.visibility = o < 0.003 ? 'hidden' : 'visible'
        if (o < 0.003) continue
        const roll = it.frame ? (it.k % 2 ? 1 : -1) * p * 40 : it.bean ? it.r + p * it.spin : it.core ? 0 : it.r + p * 8
        const flip = it.bean ? ` rotateY(${(p * it.spin * 0.7).toFixed(1)}deg)` : ''
        it.el.style.transform = `translate3d(${(it.x * u).toFixed(1)}px, ${(it.y * u).toFixed(1)}px, ${(-dist * u).toFixed(1)}px) translate(-50%, -50%) rotateZ(${roll.toFixed(1)}deg)${flip}`
      }
    }
    if (wearText) {
      const hgt = S.h * (isMobile() ? 0.3 : 0.5)
      const wdt = hgt * wearText.userData.aspect
      const t = smooth(0.08, 0.96, p)
      wearText.scale.set(wdt, hgt, 1)
      wearText.position.set(lerp(S.w / 2 + wdt / 2, -(S.w / 2 + wdt / 2), t), -S.h * 0.02, 0)
      wearText.visible = true
    }
  } else if (wearText) wearText.visible = false
}

/* ==========================================================================
   SECUENCIA DE FOTOGRAMAS · scroll → fotograma (latte → vaso GEACOFFE)
   Canvas 2D dentro de #ai (sticky). Los 150 .webp se piden al acercarse la sección, de grueso a fino
   (0, último, cada 30, 10, 3, 1): siempre hay un fotograma cercano para dibujar.
   ========================================================================== */
const SEQ = { n: 150, frames: [], cur: 0, img: null }
const seqSec = $('#ai')
const seqCv = $('#seq')
const seqCtx = seqCv?.getContext('2d', { alpha: false })
const seqUrl = (i) => `/frames/frame-${String(i + 1).padStart(3, '0')}.webp`

function loadSequence() {
  if (!seqCv) return
  const order = [0, SEQ.n - 1]
  const seen = new Set(order)
  // celular o ahorro de datos: solo 1 de cada 3 (o 10) fotogramas; seqNearest dibuja el más cercano
  const min = navigator.connection?.saveData ? 10 : isMobile() ? 3 : 1
  for (const step of [30, 10, 3, 1]) if (step >= min) for (let i = 0; i < SEQ.n; i += step) if (!seen.has(i)) { seen.add(i); order.push(i) }
  let next = 0
  const worker = async () => {
    while (next < order.length) {
      const i = order[next++]
      const img = new Image()
      img.src = seqUrl(i)
      try { await img.decode(); SEQ.frames[i] = img } catch { /* si falta uno se usa el más cercano */ }
    }
  }
  for (let k = 0; k < 6; k++) worker()
}

function seqNearest(i) {
  for (let d = 0; d < SEQ.n; d++) {
    const f = SEQ.frames[i - d] || SEQ.frames[i + d]
    if (f) return f
  }
  return null
}

function resizeSeq() {
  if (!seqCv) return
  const dpr = Math.min(devicePixelRatio, 2)
  seqCv.width = Math.round(S.w * dpr)
  seqCv.height = Math.round(S.h * dpr)
  seqCtx.imageSmoothingQuality = 'high'
  SEQ.img = null // al cambiar el tamaño el canvas se borra: forzar redibujo
}

function updateSeq(dt) {
  if (!seqCv) return
  const target = progressOf(seqSec) * (SEQ.n - 1) // 0% → fotograma 1, 100% → fotograma 150
  if (!inView(seqSec)) { SEQ.cur = target; return }
  SEQ.cur = reduceMotion ? target : lerp(SEQ.cur, target, 1 - Math.exp(-dt * 12))
  if (Math.abs(SEQ.cur - target) < 0.01) SEQ.cur = target
  const img = seqNearest(Math.round(SEQ.cur))
  if (!img || img === SEQ.img) return
  SEQ.img = img
  const k = Math.max(seqCv.width / img.naturalWidth, seqCv.height / img.naturalHeight) // cover
  const w = img.naturalWidth * k, h = img.naturalHeight * k
  seqCtx.drawImage(img, (seqCv.width - w) / 2, (seqCv.height - h) / 2, w, h)
}

/* ==========================================================================
   4 · UI: header, indicador, cursor, textos
   ========================================================================== */
const NAMES = { hero: 'Inicio', ai: 'El café', wearable: 'Para llevar', features: 'Detalles', name: 'Tu nombre', grip: 'El grano', care: 'Con calma', carta: 'Carta', momentos: 'Momentos', eventos: 'Eventos', pausa: 'Elegí el tuyo', footer: 'Contacto', 'c-hero': 'La carta', 'c-cafes': 'Cafés', 'c-pan': 'Panadería', 'c-parejas': 'Parejas', armar: 'Tu pedido' }
const navLis = $$('#header-nav li')
const navLine = $('#header-line')
const indDot = $('#scroll-indicator .dot')
const indLabel = $('#scroll-indicator .label')
const hint = $('#scroll-hint')
let lastNav = ''
let lastLabel = ''

function updateHud() {
  const s = activeSection(0.5)
  if (PAGE === 'armar') document.body.classList.toggle('on-light', s.id !== 'footer') // fondo gris claro: HUD oscuro (el footer es oscuro)
  const navId = s.id === 'footer' || s.id === 'eventos' ? s.id : PAGE
  if (navId !== lastNav) {
    lastNav = navId
    const li = navLis.find((l) => l.dataset.id === navId)
    if (li) { navLine.style.width = li.offsetWidth + 'px'; navLine.style.transform = `translateX(${li.offsetLeft}px)` }
  }
  if (s.id !== lastLabel) { lastLabel = s.id; indLabel.textContent = NAMES[s.id] || '' }
  indDot.style.top = `calc(${(S.max ? scrollCur / S.max : 0) * 100}% - 3px)`
  hint.style.opacity = scrollCur < S.h * 0.5 && S.ready ? 1 : 0

  // color de fondo hacia el de la sección activa
  const cfg = BG[s.id] || BG.hero
  bgTarget.a.setStyle(cfg[0], THREE.LinearSRGBColorSpace); bgTarget.b.setStyle(cfg[1], THREE.LinearSRGBColorSpace); bgTarget.g = cfg[2]
}

function updateBg(dt) {
  const u = bg.material.uniforms
  const k = 1 - Math.exp(-dt * 3)
  u.uA.value.lerp(bgTarget.a, k)
  u.uB.value.lerp(bgTarget.b, k)
  u.uGlow.value = lerp(u.uGlow.value, bgTarget.g, k)
  u.uGlowPos.value.set(0.06 + S.mx * 0.05, 0.1 + S.my * 0.04)
}

/* header (y el índice de la carta) se esconden al bajar y vuelven al subir o al acercar el mouse al borde de arriba */
const headerEl = $('#header')
let headerAway = false
let lastY = scrollY
function updateHeader() {
  const dy = scrollCur - lastY
  lastY = scrollCur
  let away = headerAway
  if (scrollCur < S.h * 0.25) away = false
  else if (dy > 2) away = true
  else if (dy < -2) away = false
  if (rawMy < 64 || headerEl.matches(':focus-within')) away = false
  if (away !== headerAway) { headerAway = away; document.body.classList.toggle('nav-away', away) }
}

/* cursor + mouse global */
const cursor = $('#cursor')
const cursorSpring = new Spring(2, 4, 0.9, 0)
let rawMx = innerWidth / 2, rawMy = innerHeight / 2
addEventListener('pointermove', (e) => {
  rawMx = e.clientX; rawMy = e.clientY
  cursor.classList.toggle('is-big', !!e.target.closest?.('a,button,input,.zoom-box'))
}, { passive: true })

/* flipper: cada letra rueda al pasar el mouse */
function buildFlipper(target, text) {
  target.setAttribute('aria-label', text)
  target.textContent = ''
  const inners = [...text].map((ch) => {
    const w = document.createElement('span'); w.className = 'fl'; w.setAttribute('aria-hidden', 'true')
    const inn = document.createElement('span'); inn.className = 'fl-in'
    const a = document.createElement('span'), b = document.createElement('span')
    a.textContent = b.textContent = ch
    inn.append(a, b); w.append(inn); target.append(w)
    return inn
  })
  return inners
}
const flippers = new WeakMap()
function setupFlipper(el) {
  const target = $('.is-flipper-target', el) || el
  const text = target.textContent.trim()
  let inners = buildFlipper(target, text)
  flippers.set(el, { target, rebuild: (t) => { inners = buildFlipper(target, t) } })
  if (reduceMotion) return
  el.addEventListener('pointerenter', () => {
    gsap.fromTo(inners, { yPercent: 0 }, { yPercent: -50, duration: 0.55, ease: 'expo.inOut', stagger: 0.02, overwrite: true, onComplete: () => gsap.set(inners, { yPercent: 0 }) })
  })
}
const setFlipperText = (el, t) => flippers.get(el)?.rebuild(t)

/* revelado de texto por líneas (SplitText) */
const reveals = []
function setupReveal(el) {
  const item = { el, shown: false, split: null }
  item.build = () => {
    item.split?.revert()
    item.split = SplitText.create(el, { type: 'lines', mask: 'lines' })
    gsap.set(item.split.lines, { yPercent: item.shown ? 0 : 110 })
  }
  item.build()
  reveals.push(item)
  new IntersectionObserver((ents, ob) => {
    if (!ents[0].isIntersecting) return
    ob.disconnect()
    readyP.then(() => {
      item.shown = true
      gsap.to(item.split.lines, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 })
    })
  }, { threshold: 0.25 }).observe(el)
}

/* contadores de la sección "con calma" */
function setupCounters() {
  $$('[data-count]').forEach((el) => {
    const to = parseInt(el.dataset.count, 10)
    new IntersectionObserver((ents, ob) => {
      if (!ents[0].isIntersecting) return
      ob.disconnect()
      const o = { n: 0 }
      gsap.to(o, { n: to, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.n) } })
    }, { threshold: 0.4 }).observe(el)
  })
}

/* "tu nombre en la taza": voltea el texto */
function setupName() {
  const input = $('#name-input'), btn = $('#name-btn')
  if (!input) return
  let flipped = false
  btn.addEventListener('click', () => {
    if (btn.dataset.busy) return
    btn.dataset.busy = '1'
    const orig = input.value
    const tl = gsap.timeline({ onComplete: () => delete btn.dataset.busy })
    tl.to(input, { rotationX: 90, duration: 0.35, ease: 'power2.in' })
      .add(() => {
        flipped = !flipped
        if (flipped) { input.dataset.orig = orig; input.value = [...orig].reverse().join(''); input.disabled = true; input.style.transform = 'rotateX(90deg) scaleY(-1)' }
        else { input.value = input.dataset.orig || orig; input.disabled = false; input.style.transform = 'rotateX(90deg)' }
        setFlipperText(btn, flipped ? 'Enderezar taza' : 'Voltear taza')
      })
      .to(input, { rotationX: flipped ? 180 : 0, duration: 0.5, ease: 'power3.out' })
  })
}

/* lupa arrastrable sobre el grano */
const zoomEl = $('#zoom')
const zbox = $('#zoom-box')
const zimg = zbox && $('.zoom-box-img', zbox)
const zco = $('#zoom-coeff')
const ZOOM = 3
const zSpring = new Spring(1, 2.4, 1, 0)
const z = { nat: { w: 16, h: 7 }, tx: 0, grab: 0, drag: false, touched: false, W: 1, H: 1, bw: 1, max: 1 }
function setupZoom() {
  if (!zoomEl) return
  const src = zoomEl.dataset.src
  zoomEl.style.backgroundImage = zimg.style.backgroundImage = `url(${src})`
  const im = new Image()
  im.onload = () => { z.nat = { w: im.naturalWidth, h: im.naturalHeight } }
  im.src = src
  zbox.addEventListener('pointerdown', (e) => {
    z.drag = z.touched = true
    z.grab = e.clientX - zbox.getBoundingClientRect().left
    zbox.setPointerCapture(e.pointerId)
  })
  zbox.addEventListener('pointermove', (e) => {
    if (!z.drag) return
    z.tx = clamp(e.clientX - zoomEl.getBoundingClientRect().left - z.grab, 0, z.max)
  })
  const end = () => { z.drag = false }
  zbox.addEventListener('pointerup', end)
  zbox.addEventListener('pointercancel', end)
}
function measureZoom() {
  if (!zoomEl) return
  z.W = zoomEl.clientWidth; z.H = zoomEl.clientHeight; z.bw = zbox.offsetWidth; z.max = Math.max(0, z.W - z.bw)
}
function updateZoom(dt, time) {
  if (!zoomEl || !inView($('#grip'))) return
  if (!z.touched) z.tx = (0.5 + 0.5 * Math.sin(time * 0.45)) * z.max
  const x = zSpring.update(dt, [z.tx])[0]
  zbox.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`
  const cx = x + z.bw / 2, cy = z.H / 2
  const s = Math.max(z.W / z.nat.w, z.H / z.nat.h)
  const ox = (z.W - z.nat.w * s) / 2, oy = (z.H - z.nat.h * s) / 2
  zimg.style.backgroundSize = `${(z.nat.w * s * ZOOM).toFixed(1)}px ${(z.nat.h * s * ZOOM).toFixed(1)}px`
  zimg.style.backgroundPosition = `${(z.bw / 2 - (cx - ox) * ZOOM).toFixed(1)}px ${(z.bw / 2 - (cy - oy) * ZOOM).toFixed(1)}px`
  zco.textContent = (0.55 + 0.4 * (0.5 + 0.5 * Math.sin(cx * 0.011))).toFixed(2)
}

/* selector "elegí el tuyo" */
function setupPausa() {
  const tabs = $$('.pausa-options .btn')
  const groups = [$$('.pausa-photo img'), $$('.pausa-title span'), $$('.pausa-desc p')]
  tabs.forEach((t) => t.addEventListener('click', () => {
    const i = +t.dataset.i
    tabs.forEach((o) => { const on = o === t; o.classList.toggle('is-active', on); o.setAttribute('aria-selected', on) })
    groups.forEach((g) => g.forEach((el, j) => el.classList.toggle('is-active', i === j)))
  }))
}

/* ==========================================================================
   5 · ARRANQUE, BUCLE Y RESIZE
   ========================================================================== */
async function boot() {
  S.w = innerWidth; S.h = innerHeight // en algunos navegadores incrustados el tamaño inicial es 0
  root.style.setProperty('--vh', S.h / 100 + 'px')
  $$('.is-flipper').forEach(setupFlipper)
  setupName(); setupZoom(); setupPausa(); setupCounters()
  resizeSeq()

  if (!renderer) {
    // sin WebGL: las imágenes quedan como fondos CSS
    $$('.gl-img').forEach((el) => { el.style.backgroundImage = `url(${el.dataset.src})` })
  } else {
    initScene()
    resizeGL()
  }

  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))])
  $$('[data-reveal]').forEach(setupReveal)
  const logoSpan = $('.hero-logo span')
  const logo = logoSpan && SplitText.create(logoSpan, { type: 'chars', mask: 'chars' })
  if (logo) gsap.set(logo.chars, { yPercent: 110 })

  measureMax(); measureSections()
  measureZoom()

  // preloader con contador real (texturas cargadas); las páginas sin WebGL no lo traen
  if ($('#preloader')) {
    const counter = $('.pre-count')
    const t0 = performance.now()
    await new Promise((res) => {
      const o = { v: 0 }
      const id = setInterval(() => {
        const real = loadProgress.total ? loadProgress.done / loadProgress.total : 1
        const timeOk = clamp((performance.now() - t0) / 1100)
        gsap.to(o, { v: Math.min(real, timeOk), duration: 0.3, overwrite: true, onUpdate: () => { counter.textContent = Math.round(o.v * 100) } })
        if (real >= 1 && timeOk >= 1) { clearInterval(id); gsap.delayedCall(0.35, res) }
      }, 120)
    })
  }

  S.ready = true
  root.classList.add('is-ready')
  S.resolveReady()
  document.dispatchEvent(new Event('gc:ready'))
  // llegada con ancla desde otra página (ej: /#eventos): el navegador saltó antes de medir las secciones fijadas
  try { const t = location.hash && $(location.hash); if (t) scrollTo({ top: t.getBoundingClientRect().top + scrollY, behavior: 'instant' }) } catch { /* ancla inválida */ }
  // Los fotogramas (~3 MB en celular) se piden recién cuando la persona empieza a mover la página o cuando #ai ya está a la vista (ancla directa).
  // Antes se pedían con la sección a una pantalla de distancia: como #ai viene pegada al hero, eso pasaba en la carga y la portada pesaba 2,2 MB en celular.
  if (seqSec) {
    let arrancado = false
    const arrancar = () => { if (arrancado) return; arrancado = true; io.disconnect(); loadSequence() }
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) arrancar() }, { rootMargin: '-15% 0px' })
    io.observe(seqSec)
    for (const ev of ['wheel', 'touchmove', 'keydown']) addEventListener(ev, arrancar, { once: true, passive: true })
  }
  if ($('#preloader')) {
    const tl = gsap.timeline()
    tl.to('#preloader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' })
    if (logo) tl.to(logo.chars, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.07 }, '-=0.55')
    tl.add(() => $('#preloader').remove())
  } else if (logo) gsap.to(logo.chars, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.07 })
}

let lastTime = 0
gsap.ticker.add((time, deltaMs) => {
  const dt = clamp(deltaMs / 1000, 1 / 240, 1 / 20)
  lastTime = time
  // por si el navegador no dispara 'resize' (viewport que arranca en 0, paneles embebidos)
  if (innerWidth && (innerWidth !== S.w || (!isTouch && innerHeight !== S.h) || devicePixelRatio !== S.dpr)) onResize()
  if (!S.w || !S.h) return
  updateScroll(dt)
  updateHeader()
  const m = mouseSpring.update(dt, [(rawMx / S.w) * 2 - 1, (rawMy / S.h) * 2 - 1])
  S.mx = m[0]; S.my = -m[1]
  if (!isTouch) {
    const c = cursorSpring.update(dt, [rawMx, rawMy])
    cursor.style.transform = `translate3d(${c[0].toFixed(1)}px,${c[1].toFixed(1)}px,0)`
  }
  if (!sections.length || !secTops.length) return
  updatePinned()
  updateHud()
  updateZoom(dt, time)
  updateSeq(dt)
  if (!renderer) return
  updateBg(dt)
  updatePlanes()
  postMat.uniforms.uTime.value = time
  postMat.uniforms.uVel.value = clamp(S.vel / 3200, -1, 1)
  render()
})

let resizeT
function onResize() {
  if (isTouch && S.w === innerWidth && Math.abs(S.h - innerHeight) < 150) return // barra del navegador móvil
  S.w = innerWidth; S.h = innerHeight; S.dpr = devicePixelRatio
  resizeSeq()
  root.style.setProperty('--vh', S.h / 100 + 'px')
  if (renderer) resizeGL()
  clearTimeout(resizeT)
  resizeT = setTimeout(() => {
    reveals.forEach((r) => r.build())
    refresh()
  }, 150)
}
function refresh() {
  measureMax(); measureSections()
  measureZoom()
  scrollTarget = clamp(scrollTarget, 0, S.max)
}
addEventListener('resize', onResize)
new ResizeObserver(() => { clearTimeout(resizeT); resizeT = setTimeout(refresh, 100) }).observe($('#content'))


boot()
