import type { Producto } from './tipos'

/** "Lo que trae": `incluye` si está cargado; si no, la descripción cortada por comas y "y". */
export function traeDe(p: Pick<Producto, 'incluye' | 'desc'>): string[] {
  if (p.incluye?.length) return p.incluye
  return p.desc
    .split(/,| y /)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter((s) => s.length > 1)
    .map((s) => s[0].toUpperCase() + s.slice(1))
}
