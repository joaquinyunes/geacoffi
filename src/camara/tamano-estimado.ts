import type { Medida, Producto, Tamano } from './tipos'

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// shortcut: tamaños orientativos por palabra clave (medida del recorte de la foto, plato incluido), cargá tamanoCm real cuando lo midas
const REGLAS: [RegExp, number, Medida][] = [
  [/filtrad|chemex|v60/, 26, 'largo'],
  [/medialuna|croissant/, 19, 'diametro'],
  [/rol|canela/, 19, 'diametro'],
  [/tostado|sandwich/, 19, 'diametro'],
  [/frio|vaso|helad/, 19, 'alto'],
  [/cafe|taza|espresso/, 14, 'diametro'],
]

export function estimarTamano(p: Pick<Producto, 'nombre' | 'desc'>): { cm: number; medida: Medida } {
  const texto = sinAcentos(`${p.nombre} ${p.desc}`)
  const regla = REGLAS.find(([re]) => re.test(texto))
  return regla ? { cm: regla[1], medida: regla[2] } : { cm: 14, medida: 'diametro' }
}

export function tamanoDe(p: Producto): Tamano {
  if (p.tamanoCm) return { cm: p.tamanoCm, medida: p.medida ?? 'diametro', estimado: false }
  return { ...estimarTamano(p), estimado: true }
}
