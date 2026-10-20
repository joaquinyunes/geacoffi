import { describe, expect, it } from 'vitest'
import { anchoPx, escalaPellizco, limitarEscala, pxPorCmInicial } from './escala'
import { colorDeFondo, limitesDelContenido, quitarFondo, type Rgba } from './quitar-fondo'
import { estimarTamano, tamanoDe } from './tamano-estimado'
import { traeDe } from './trae'

function imagen(w: number, h: number, pintar: (x: number, y: number) => [number, number, number]): Rgba {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, g, b] = pintar(x, y)
      data.set([r, g, b, 255], (y * w + x) * 4)
    }
  return { data, width: w, height: h }
}
const alfa = (i: Rgba, x: number, y: number) => i.data[(y * i.width + x) * 4 + 3]

describe('quitarFondo', () => {
  // aro oscuro de 5x5 con interior blanco, sobre fondo blanco
  const aro = () =>
    imagen(9, 9, (x, y) => {
      const enAro = x >= 2 && x <= 6 && y >= 2 && y <= 6 && (x === 2 || x === 6 || y === 2 || y === 6)
      return enAro ? [20, 20, 20] : [255, 255, 255]
    })

  it('borra el fondo conectado a los bordes y conserva lo encerrado', () => {
    const img = aro()
    quitarFondo(img)
    expect(alfa(img, 0, 0)).toBe(0)
    expect(alfa(img, 8, 8)).toBe(0)
    expect(alfa(img, 2, 2)).toBe(255)
    expect(alfa(img, 4, 4)).toBe(255) // interior blanco encerrado
  })

  it('estima el color de fondo con las esquinas', () => {
    expect(colorDeFondo(aro())).toEqual([255, 255, 255])
  })

  it('devuelve el rectángulo del contenido', () => {
    const img = aro()
    quitarFondo(img)
    expect(limitesDelContenido(img)).toEqual({ x: 2, y: 2, w: 5, h: 5 })
  })
})

describe('escala', () => {
  it('cuadra con una cámara de 65° a 38 cm', () => {
    expect(pxPorCmInicial(484)).toBeCloseTo(10, 0)
  })
  it('convierte cm a px y respeta el rango de calibración', () => {
    expect(anchoPx(8.56, 10)).toBeCloseTo(85.6)
    expect(limitarEscala(1, 9)).toBe(3)
    expect(limitarEscala(100, 9)).toBe(27)
  })
  it('el pellizco escala en proporción a la distancia entre dedos', () => {
    expect(escalaPellizco(8, 100, 150)).toBe(12)
  })
})

describe('tamaño estimado', () => {
  it('estima por palabra clave, sin acentos', () => {
    expect(estimarTamano({ nombre: 'Café frío', desc: '' })).toEqual({ cm: 19, medida: 'alto' })
    expect(estimarTamano({ nombre: 'Café filtrado', desc: '' }).medida).toBe('largo')
    expect(estimarTamano({ nombre: 'Medialuna', desc: '' }).medida).toBe('diametro')
    expect(estimarTamano({ nombre: 'Algo raro', desc: '' })).toEqual({ cm: 14, medida: 'diametro' })
  })
  it('usa el tamaño cargado y lo marca como no estimado', () => {
    const t = tamanoDe({ id: 'x', nombre: 'Taza', desc: '', foto: '', categoria: 'bebida', tamanoCm: 12, medida: 'largo' })
    expect(t).toEqual({ cm: 12, medida: 'largo', estimado: false })
  })
})

describe('trae', () => {
  it('corta la descripción por comas y "y"', () => {
    expect(traeDe({ desc: 'Chemex o V60, granos de especialidad.' })).toEqual(['Chemex o V60', 'Granos de especialidad'])
    expect(traeDe({ desc: 'Jamón y queso, pan crocante.' })).toEqual(['Jamón', 'Queso', 'Pan crocante'])
  })
  it('prefiere incluye si está cargado', () => {
    expect(traeDe({ desc: 'a, b', incluye: ['Solo esto'] })).toEqual(['Solo esto'])
  })
})
