export const FOV_GRADOS = 65
export const DISTANCIA_CM = 38
export const TARJETA_CM = { ancho: 8.56, alto: 5.4 }

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** px por cm iniciales: la pantalla abarca el ancho que ve una cámara de FOV_GRADOS a DISTANCIA_CM. */
export function pxPorCmInicial(anchoPantallaPx: number): number {
  const anchoVistoCm = 2 * DISTANCIA_CM * Math.tan(((FOV_GRADOS / 2) * Math.PI) / 180)
  return anchoPantallaPx / anchoVistoCm
}

export const anchoPx = (cm: number, pxPorCm: number) => cm * pxPorCm

/** Rango razonable de calibración: de 1/3 a 3 veces el valor inicial. */
export const limitarEscala = (v: number, inicial: number) => clamp(v, inicial / 3, inicial * 3)

export const escalaPellizco = (base: number, distInicial: number, distActual: number) =>
  base * (distActual / distInicial)
