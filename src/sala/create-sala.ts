import { PerspectiveCamera, Scene, WebGLRenderer, type Material, type Mesh } from 'three'
import { buildSala } from './build-sala'
import { poseEn } from './secciones'

export type SalaOpts = {
  canvas: HTMLCanvasElement
  fotos: string[]
  /** Progreso de scroll 0..1 del recorrido; se lee en cada frame. */
  leerProgreso: () => number
  onFail: (motivo: string) => void
}
export type Sala = { setPointer(x: number, y: number): void; dispose(): void }

const FALLOS_MAXIMOS = 5

/** Orquesta renderer, cámara guiada por el scroll, loop y limpieza. La geometría vive en build-sala.ts. */
export function createSala({ canvas, fotos, leerProgreso, onFail }: SalaOpts): Sala {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  const scene = new Scene()
  const camera = new PerspectiveCamera(58, 1, 0.1, 60)
  const construida = buildSala(fotos)
  scene.add(construida.sala)

  const puntero = { x: 0, y: 0, tx: 0, ty: 0 }
  let ancho = 0, alto = 0, muerto = false, fallos = 0
  let actual = leerProgreso(), tPrevio = 0

  const redimensionar = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (!w || !h) return
    ancho = w
    alto = h
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w / h < 1 ? 78 : 58 // en vertical entra menos sala a lo ancho: abrimos el ángulo
  }
  const ro = new ResizeObserver(redimensionar)
  ro.observe(canvas)
  redimensionar()

  const frame = (ms: number) => {
    try {
      const t = ms / 1000
      const dt = Math.min(Math.max(t - tPrevio, 0), 0.1)
      tPrevio = t
      actual += (leerProgreso() - actual) * (1 - Math.exp(-dt * 6)) // inercia: la cámara llega suave aunque el scroll sea brusco
      puntero.x += (puntero.tx - puntero.x) * 0.06
      puntero.y += (puntero.ty - puntero.y) * 0.06

      const { pos, look } = poseEn(actual)
      camera.position.set(pos[0] + puntero.x * 0.35, pos[1] - puntero.y * 0.2, pos[2])
      camera.lookAt(look[0], look[1], look[2])
      // El texto del recorrido ocupa la izquierda en escritorio y abajo en celular: corremos la sala para que el objeto no quede tapado.
      const horizontal = ancho > alto
      camera.setViewOffset(ancho, alto, horizontal ? -0.14 * ancho : 0, horizontal ? 0 : 0.14 * alto, ancho, alto)
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
      fallos = 0
    } catch {
      if (++fallos >= FALLOS_MAXIMOS) fallar('frames')
    }
  }

  let visible = true
  let pestanaActiva = !document.hidden
  const sincronizar = () => renderer.setAnimationLoop(visible && pestanaActiva && !muerto ? frame : null)
  const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; sincronizar() })
  io.observe(canvas)
  const alCambiarPestana = () => { pestanaActiva = !document.hidden; sincronizar() }
  document.addEventListener('visibilitychange', alCambiarPestana)
  const alPerderContexto = (e: Event) => { e.preventDefault(); fallar('contexto') }
  canvas.addEventListener('webglcontextlost', alPerderContexto)
  sincronizar()

  function dispose() {
    if (muerto) return
    muerto = true
    renderer.setAnimationLoop(null)
    io.disconnect()
    ro.disconnect()
    document.removeEventListener('visibilitychange', alCambiarPestana)
    canvas.removeEventListener('webglcontextlost', alPerderContexto)
    construida.dispose()
    scene.traverse((o) => {
      const m = o as Mesh
      m.geometry?.dispose()
      const mat = m.material as Material | Material[] | undefined
      ;(Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
        ;(x as Material & { map?: { dispose(): void } | null }).map?.dispose()
        x.dispose()
      })
    })
    renderer.dispose()
    renderer.forceContextLoss()
  }
  function fallar(motivo: string) {
    if (muerto) return
    dispose()
    onFail(motivo)
  }

  return { dispose, setPointer: (x, y) => { puntero.tx = x; puntero.ty = y } }
}
