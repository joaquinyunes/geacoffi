import {
  AmbientLight, BoxGeometry, CanvasTexture, CapsuleGeometry, CylinderGeometry, DirectionalLight, DoubleSide, Group, HemisphereLight,
  Mesh, MeshBasicMaterial, MeshLambertMaterial, NearestFilter, PlaneGeometry, SphereGeometry, SRGBColorSpace, type Material, type Object3D,
} from 'three'
import { NEGOCIO } from '../data/products'
import { cargarTexturaSticker } from './load-texture'

const C = {
  violeta: '#5646d9', rosa: '#f59bbd', rosaClaro: '#ffd9e5', rojo: '#e5392b', azul: '#3b5bdb', crema: '#fff3e2',
  madera: '#e9cfa6', tinta: '#1d1840', verde: '#3f9b57', naranja: '#e8a33d', marron: '#b8682e',
}

const mat = (color: string) => new MeshLambertMaterial({ color })
const luz = (color: string) => new MeshBasicMaterial({ color })

function caja(padre: Object3D, w: number, h: number, d: number, material: Material, x: number, y: number, z: number) {
  const m = new Mesh(new BoxGeometry(w, h, d), material)
  m.position.set(x, y, z)
  padre.add(m)
  return m
}
function cilindro(padre: Object3D, r: number, h: number, material: Material, x: number, y: number, z: number, rt = r) {
  const m = new Mesh(new CylinderGeometry(rt, r, h, 20), material)
  m.position.set(x, y, z)
  padre.add(m)
  return m
}
function esfera(padre: Object3D, r: number, material: Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) {
  const m = new Mesh(new SphereGeometry(r, 20, 14), material)
  m.position.set(x, y, z)
  m.scale.set(sx, sy, sz)
  padre.add(m)
  return m
}

function textura(ancho: number, alto: number, dibujar: (c: CanvasRenderingContext2D) => void, pixelado = false) {
  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const c = canvas.getContext('2d')
  if (c) dibujar(c)
  const t = new CanvasTexture(canvas)
  t.colorSpace = SRGBColorSpace
  if (pixelado) t.magFilter = NearestFilter
  return t
}

function cartel() {
  const t = textura(1024, 340, (c) => {
    c.fillStyle = '#3326a8'
    c.fillRect(0, 0, 1024, 340)
    c.lineJoin = 'round'
    c.textAlign = 'center'
    c.font = '900 190px "Arial Black", Arial, sans-serif'
    c.lineWidth = 26
    c.strokeStyle = C.rosa
    c.strokeText(NEGOCIO.nombre.toUpperCase(), 512, 200)
    c.fillStyle = '#fff'
    c.fillText(NEGOCIO.nombre.toUpperCase(), 512, 200)
    c.font = '700 54px "Arial Black", Arial, sans-serif'
    c.fillStyle = C.rosaClaro
    c.fillText(NEGOCIO.descriptor.toUpperCase(), 512, 290)
  })
  const m = new Mesh(new PlaneGeometry(4.6, 1.52), new MeshBasicMaterial({ map: t }))
  m.position.set(-5.97, 3.7, -4.4)
  m.rotation.y = Math.PI / 2
  return m
}

function alfombra() {
  const t = textura(8, 8, (c) => {
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#2a2272' : '#4b3fd6'; c.fillRect(i, j, 1, 1) }
  }, true)
  const m = new Mesh(new PlaneGeometry(4.2, 5.2), new MeshLambertMaterial({ map: t }))
  m.rotation.x = -Math.PI / 2
  m.position.set(-1.9, 0.012, -0.2)
  return m
}

function pizarra() {
  const g = new Group()
  g.position.set(2.6, 0, -4)
  caja(g, 2.9, 1.9, 0.1, mat(C.tinta), 0, 1.95, 0)
  const garabato = textura(512, 320, (c) => {
    c.fillStyle = '#fff'
    c.fillRect(0, 0, 512, 320)
    c.lineWidth = 8
    c.lineCap = 'round'
    c.strokeStyle = '#111'
    c.beginPath()
    for (let x = 30; x < 480; x += 8) c.lineTo(x, 110 + Math.sin(x / 22) * 34)
    c.stroke()
    c.strokeStyle = C.rojo
    c.lineWidth = 9
    c.beginPath()
    c.arc(110, 230, 52, 0, Math.PI * 2)
    c.stroke()
    c.font = '900 70px "Arial Black", Arial, sans-serif'
    c.fillStyle = C.rojo
    c.fillText('HOY', 190, 255)
  })
  const cara = new Mesh(new PlaneGeometry(2.7, 1.7), new MeshBasicMaterial({ map: garabato }))
  cara.position.set(0, 1.95, 0.06)
  g.add(cara)
  ;[-1.15, 1.15].forEach((x) => cilindro(g, 0.04, 1.1, mat('#9aa0ad'), x, 0.55, -0.1))
  caja(g, 2.4, 0.07, 0.35, mat(C.tinta), 0, 1.0, 0.15)
  ;['#111', C.azul, C.rojo, C.rosa].forEach((color, i) => cilindro(g, 0.045, 0.34, mat(color), -0.7 + i * 0.28, 1.08, 0.2).rotateZ(Math.PI / 2))
  return g
}

function barra() {
  const g = new Group()
  caja(g, 1.4, 1.1, 7.4, mat(C.azul), -5.1, 0.55, -2.4)
  caja(g, 1.6, 0.1, 7.6, mat(C.rojo), -5.1, 1.15, -2.4)
  // máquina de espresso
  caja(g, 0.8, 0.75, 0.9, mat('#2b2b33'), -5.3, 1.58, -4.0)
  caja(g, 0.82, 0.12, 0.92, mat('#c9ced8'), -5.3, 1.99, -4.0)
  cilindro(g, 0.06, 0.22, mat('#c9ced8'), -4.85, 1.48, -3.8)
  // tazas, molinillo y domo
  ;[-1.2, -0.4, 0.5].forEach((z) => cilindro(g, 0.11, 0.2, mat('#ffffff'), -4.9, 1.3, z, 0.13))
  cilindro(g, 0.17, 0.5, mat(C.tinta), -5.35, 1.45, -1.2, 0.12)
  esfera(g, 0.34, new MeshLambertMaterial({ color: '#cfe9ff', transparent: true, opacity: 0.45 }), -5.2, 1.4, 0.1, 1, 0.8, 1)
  // banquetas
  ;[-1.6, -3.0].forEach((z) => {
    cilindro(g, 0.28, 0.1, mat(C.rojo), -3.6, 0.75, z)
    cilindro(g, 0.04, 0.7, mat('#9aa0ad'), -3.6, 0.38, z)
  })
  return g
}

function vitrina() {
  const g = new Group()
  g.position.set(-5.1, 0, -7.8)
  caja(g, 1.4, 0.7, 2.2, mat(C.azul), 0, 0.35, 0)
  const vidrio = new MeshLambertMaterial({ color: '#cfe9ff', transparent: true, opacity: 0.28, side: DoubleSide })
  caja(g, 1.4, 1.1, 2.2, vidrio, 0, 1.25, 0)
  caja(g, 1.5, 0.08, 2.3, mat(C.rojo), 0, 1.84, 0)
  ;[0.85, 1.35].forEach((y) => caja(g, 1.3, 0.04, 2.1, mat('#f5f5f5'), 0, y, 0))
  const hojaldre = mat(C.naranja), pan = mat(C.marron)
  for (let i = 0; i < 4; i++) {
    const m = new Mesh(new CapsuleGeometry(0.1, 0.22, 4, 10), hojaldre)
    m.position.set(-0.2 + (i % 2) * 0.4, 0.97, -0.75 + i * 0.5)
    m.rotation.z = Math.PI / 2
    m.rotation.y = 0.5
    g.add(m)
  }
  for (let i = 0; i < 4; i++) esfera(g, 0.15, pan, -0.2 + (i % 2) * 0.4, 1.47, -0.75 + i * 0.5, 1, 0.7, 1)
  return g
}

function telefono() {
  const g = new Group()
  g.position.set(3.4, 0, 3.5)
  cilindro(g, 0.5, 0.06, mat(C.rojo), 0, 0.9, 0)
  cilindro(g, 0.07, 0.9, mat('#9aa0ad'), 0, 0.45, 0)
  cilindro(g, 0.34, 0.06, mat(C.rojo), 0, 0.03, 0)
  caja(g, 0.56, 0.2, 0.42, mat(C.violeta), 0, 1.03, 0)
  cilindro(g, 0.1, 0.03, mat('#fff'), 0, 1.14, 0.02)
  const tubo = new Mesh(new CapsuleGeometry(0.05, 0.4, 4, 8), mat(C.violeta))
  tubo.position.set(0, 1.2, -0.12)
  tubo.rotation.z = Math.PI / 2
  g.add(tubo)
  return g
}

function planta(x: number, z: number) {
  const g = new Group()
  g.position.set(x, 0, z)
  cilindro(g, 0.3, 0.55, mat(C.rojo), 0, 0.28, 0, 0.36)
  ;[[0, 1.0, 0, 0.5], [-0.22, 0.8, 0.1, 0.34], [0.24, 0.86, -0.1, 0.36], [0, 1.4, 0, 0.3]].forEach(([px, py, pz, r]) =>
    esfera(g, r, mat(C.verde), px, py, pz, 1, 1.15, 1))
  return g
}

function ventana() {
  const g = new Group()
  g.position.set(0, 2.5, -9.95)
  caja(g, 4.9, 2.7, 0.08, mat(C.tinta), 0, 0, 0)
  caja(g, 4.5, 2.3, 0.1, luz('#d8f1ff'), 0, 0, 0.02)
  caja(g, 0.1, 2.3, 0.12, mat(C.tinta), 0, 0, 0.06)
  caja(g, 4.5, 0.1, 0.12, mat(C.tinta), 0, 0, 0.06)
  ;[-2.9, 2.9].forEach((x) => caja(g, 0.7, 3.0, 0.2, mat(C.rojo), x, -0.1, 0.15))
  return g
}

/** Pared derecha: su +z local mira hacia la sala y su +x local corre a lo largo de la sala (+z del mundo). */
function cuadros() {
  const g = new Group()
  g.position.set(5.94, 0, 0)
  g.rotation.y = -Math.PI / 2
  return g
}

/** Arma la sala completa. Las fotos de los productos se cargan después y entran como cuadros en la pared derecha. */
export function buildSala(fotos: string[]) {
  const sala = new Group()
  sala.add(new AmbientLight('#ffffff', 1.1), new HemisphereLight('#ffffff', C.rosa, 1.0))
  const sol = new DirectionalLight('#fff4e0', 1.5)
  sol.position.set(3, 6, 5)
  sala.add(sol)

  const piso = new Mesh(new PlaneGeometry(12, 20), mat(C.madera))
  piso.rotation.x = -Math.PI / 2
  const techo = new Mesh(new PlaneGeometry(12, 20), luz('#fdeef3')) // sin sombreado: la luz de abajo lo apagaría
  techo.rotation.x = Math.PI / 2
  techo.position.y = 5
  const paredIzq = new Mesh(new PlaneGeometry(20, 5), mat(C.violeta))
  paredIzq.rotation.y = Math.PI / 2
  paredIzq.position.set(-6, 2.5, 0)
  const paredDer = new Mesh(new PlaneGeometry(20, 5), mat(C.rosa))
  paredDer.rotation.y = -Math.PI / 2
  paredDer.position.set(6, 2.5, 0)
  const fondo = new Mesh(new PlaneGeometry(12, 5), mat(C.rosaClaro))
  fondo.position.set(0, 2.5, -10)
  sala.add(piso, techo, paredIzq, paredDer, fondo)
  ;[-1.6, 2.4].forEach((x) => caja(sala, 0.28, 0.05, 17, luz('#ffffff'), x, 4.96, -1))
  caja(sala, 0.4, 5, 0.4, mat('#f3efe9'), -1, 2.5, -4.5) // columna central, como en la referencia

  sala.add(cartel(), alfombra(), barra(), vitrina(), pizarra(), telefono(), ventana(), planta(-4.8, 5), planta(5, -9))
  esfera(sala, 0.9, mat(C.rojo), -2.2, 0.4, 0.8, 1.2, 0.5, 1.2) // puf
  ;[3.9, 2.9].forEach((x) => { cilindro(sala, 0.3, 0.1, mat(C.rojo), x, 0.8, -7); cilindro(sala, 0.04, 0.75, mat('#9aa0ad'), x, 0.4, -7) })
  esfera(sala, 0.32, mat(C.rojo), 3.4, 0.4, -7)

  const marcos = cuadros()
  sala.add(marcos)
  let muerto = false
  const texturas: CanvasTexture[] = []
  Promise.all(fotos.map(cargarTexturaSticker)).then((res) => {
    res.forEach((r, i) => {
      if (!r) return
      if (muerto) return r.texture.dispose()
      texturas.push(r.texture)
      const alto = 1.25, ancho = Math.min(alto * r.aspect, 1.5)
      const cuadro = new Group()
      cuadro.position.set(-8.4 + i * 1.65, 2.0 + (i % 2) * 0.75, 0)
      caja(cuadro, ancho + 0.34, alto + 0.34, 0.1, mat(C.tinta), 0, 0, 0)
      const fondoCuadro = new Mesh(new PlaneGeometry(ancho + 0.14, alto + 0.14), mat(i % 2 ? C.rosaClaro : '#c7c0ff'))
      fondoCuadro.position.z = 0.056
      const foto = new Mesh(new PlaneGeometry(ancho, alto), new MeshBasicMaterial({ map: r.texture, transparent: true }))
      foto.position.z = 0.06
      cuadro.add(fondoCuadro, foto)
      marcos.add(cuadro)
    })
  })

  return {
    sala,
    dispose() {
      muerto = true
      texturas.forEach((t) => t.dispose())
    },
  }
}
