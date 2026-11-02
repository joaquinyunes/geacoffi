/** Tipo de imagen según los primeros bytes (no se confía en lo que diga el navegador). */
export function tipoDeImagen(b: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 7 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  const ascii = (desde: number, texto: string) => [...texto].every((c, i) => b[desde + i] === c.charCodeAt(0));
  if (b.length > 11 && ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'image/webp';
  return null;
}

/** Las únicas secciones que edita el panel; cualquier otra clave se rechaza. */
export const CLAVES = ['negocio', 'productos', 'eventos', 'visitas'] as const;

/** Forma mínima del contenido que guarda la dueña: solo claves conocidas y objetos o listas razonables. */
export function contenidoValido(d: unknown): d is Partial<Record<(typeof CLAVES)[number], object>> {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return false;
  const entradas = Object.entries(d as Record<string, unknown>);
  return entradas.length > 0 && entradas.every(([k, v]) =>
    (CLAVES as readonly string[]).includes(k) && !!v && typeof v === 'object' && (!Array.isArray(v) || v.length <= 200));
}
