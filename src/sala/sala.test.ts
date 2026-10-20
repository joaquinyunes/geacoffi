import { describe, expect, it } from 'vitest'
import { ESTACIONES, estacionEn, poseEn } from './secciones'

const ultima = ESTACIONES.length - 1
const igual = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 6))

describe('poseEn', () => {
  it('empieza en la primera estación y termina en la última', () => {
    igual(poseEn(0).pos, ESTACIONES[0].cam.pos)
    igual(poseEn(1).pos, ESTACIONES[ultima].cam.pos)
    igual(poseEn(1).look, ESTACIONES[ultima].cam.look)
  })
  it('se queda quieta cerca de cada estación', () => {
    ESTACIONES.forEach((e, i) => {
      const p = i / ultima
      igual(poseEn(p).pos, e.cam.pos)
      igual(poseEn(Math.min(1, p + 0.01)).pos, e.cam.pos)
    })
  })
  it('limita el progreso fuera de 0..1', () => {
    expect(poseEn(-4)).toEqual(poseEn(0))
    expect(poseEn(9)).toEqual(poseEn(1))
  })
  it('se mueve de verdad entre dos estaciones', () => {
    const a = poseEn(0.02 / ultima), b = poseEn(0.5 / ultima)
    expect(b.pos).not.toEqual(a.pos)
  })
})

describe('estacionEn', () => {
  it('devuelve la estación más cercana y se acota', () => {
    expect(estacionEn(-1)).toBe(0)
    expect(estacionEn(0)).toBe(0)
    expect(estacionEn(1)).toBe(ultima)
    expect(estacionEn(2)).toBe(ultima)
    expect(estacionEn(1.4 / ultima)).toBe(1)
  })
  it('las estaciones tienen id único y destino de enlace', () => {
    expect(new Set(ESTACIONES.map((e) => e.id)).size).toBe(ESTACIONES.length)
    ESTACIONES.forEach((e) => expect(e.cta?.href.startsWith('#')).toBe(true))
  })
})
