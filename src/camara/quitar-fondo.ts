export type Rgba = { data: Uint8ClampedArray; width: number; height: number }

const dist2 = (d: Uint8ClampedArray, i: number, r: number, g: number, b: number) =>
  (d[i] - r) ** 2 + (d[i + 1] - g) ** 2 + (d[i + 2] - b) ** 2

/** Color de fondo: promedio de los cuatro píxeles de las esquinas. */
export function colorDeFondo({ data, width, height }: Rgba): [number, number, number] {
  const idx = [0, (width - 1) * 4, (height - 1) * width * 4, ((height - 1) * width + width - 1) * 4]
  const suma = idx.reduce((a, i) => [a[0] + data[i], a[1] + data[i + 1], a[2] + data[i + 2]], [0, 0, 0])
  return [suma[0] / 4, suma[1] / 4, suma[2] / 4]
}

/** Vuelve transparente el fondo conectado a los bordes (flood fill). Lo que queda encerrado se conserva. */
export function quitarFondo(img: Rgba, tolerancia = 40): void {
  const { data, width: w, height: h } = img
  const [r, g, b] = colorDeFondo(img)
  const tol2 = tolerancia ** 2
  const visto = new Uint8Array(w * h)
  const pila: number[] = []
  const probar = (p: number) => {
    if (!visto[p] && dist2(data, p * 4, r, g, b) <= tol2) {
      visto[p] = 1
      pila.push(p)
    }
  }
  for (let x = 0; x < w; x++) {
    probar(x)
    probar((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    probar(y * w)
    probar(y * w + w - 1)
  }
  while (pila.length) {
    const p = pila.pop() as number
    const x = p % w
    if (x > 0) probar(p - 1)
    if (x < w - 1) probar(p + 1)
    if (p >= w) probar(p - w)
    if (p < w * (h - 1)) probar(p + w)
  }
  // borde suave: píxeles opacos pegados al fondo, algo más claros que el objeto, quedan semitransparentes
  const borde: number[] = []
  for (let p = 0; p < w * h; p++) {
    if (visto[p]) continue
    const x = p % w
    const vecinoFondo =
      (x > 0 && visto[p - 1]) || (x < w - 1 && visto[p + 1]) || (p >= w && visto[p - w]) || (p < w * (h - 1) && visto[p + w])
    if (vecinoFondo) borde.push(p)
  }
  for (const p of borde) {
    const d = Math.sqrt(dist2(data, p * 4, r, g, b))
    if (d < tolerancia * 2) data[p * 4 + 3] = Math.round(255 * Math.max(0, (d - tolerancia) / tolerancia))
  }
  for (let p = 0; p < w * h; p++) if (visto[p]) data[p * 4 + 3] = 0
}

/** Rectángulo mínimo que contiene los píxeles con alfa > umbral. */
export function limitesDelContenido({ data, width: w, height: h }: Rgba, umbral = 8) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > umbral) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
  return x1 < 0 ? { x: 0, y: 0, w, h } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}
