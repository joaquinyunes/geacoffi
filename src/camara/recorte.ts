import { limitesDelContenido, quitarFondo } from './quitar-fondo'

const cache = new Map<string, Promise<HTMLCanvasElement>>()

async function procesar(url: string, margen: number): Promise<HTMLCanvasElement> {
  const img = new Image()
  img.src = url
  await img.decode()
  const origen = document.createElement('canvas')
  origen.width = img.naturalWidth
  origen.height = img.naturalHeight
  const ctx = origen.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('sin canvas 2d')
  ctx.drawImage(img, 0, 0)
  const datos = ctx.getImageData(0, 0, origen.width, origen.height) // lanza si el canvas quedó tainted (CORS)
  quitarFondo(datos)
  ctx.putImageData(datos, 0, 0)
  const l = limitesDelContenido(datos)
  const m = Math.round(Math.max(l.w, l.h) * margen)
  const x = Math.max(0, l.x - m), y = Math.max(0, l.y - m)
  const w = Math.min(origen.width - x, l.w + 2 * m), h = Math.min(origen.height - y, l.h + 2 * m)
  const salida = document.createElement('canvas')
  salida.width = w
  salida.height = h
  salida.getContext('2d')?.drawImage(origen, x, y, w, h, 0, 0, w, h)
  return salida
}

/** Foto del producto con el fondo claro recortado y ajustada al contenido. Cacheada por URL. */
export function cargarRecorte(url: string, margen = 0.02): Promise<HTMLCanvasElement> {
  let p = cache.get(url)
  if (!p) {
    p = procesar(url, margen)
    p.catch(() => cache.delete(url))
    cache.set(url, p)
  }
  return p
}
