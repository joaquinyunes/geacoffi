/** Tipo de imagen según los primeros bytes (no se confía en lo que diga el navegador ni la extensión). */
export function tipoDeImagen(b: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  const ascii = (desde: number, texto: string) => [...texto].every((c, i) => b[desde + i] === c.charCodeAt(0));
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 11 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((x, i) => b[i] === x)) return 'image/png';
  if (b.length > 11 && ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'image/webp';
  return null;
}

/** Las únicas secciones que edita el panel; cualquier otra clave se rechaza. */
export const CLAVES = ['negocio', 'productos', 'eventos', 'visitas'] as const;

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const texto = (v: unknown, max: number) => v === undefined || v === null || (typeof v === 'string' && v.length <= max);
const hora = (v: unknown) => v === undefined || v === '' || (typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v));
const fecha = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const dinero = (v: unknown) => v === undefined || v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 10_000_000);
/** Una foto del panel (/api/foto?id=…) o un archivo propio del sitio (/eventos/cata.webp). Nada de otros dominios ni de esquemas raros. */
const urlFoto = (v: unknown) => v === undefined || v === '' || (typeof v === 'string' && (/^(https?:\/\/[\w.:-]+)?\/api\/foto\?id=[a-f0-9-]{36}$/.test(v) || /^\/[\w./-]{1,120}$/.test(v) && !v.includes('//') && !v.includes('..')));

/** Claves que empiezan con $ o llevan punto son operadores o rutas de Mongo (NoSQL injection): se rechazan en cualquier nivel. */
function claveRara(v: unknown, prof = 0): boolean {
  if (prof > 6) return true;
  if (Array.isArray(v)) return v.some((x) => claveRara(x, prof + 1));
  return esObj(v) && Object.entries(v).some(([k, x]) => k.startsWith('$') || k.includes('.') || k.includes(String.fromCharCode(0)) || claveRara(x, prof + 1));
}

/** Revisa que `d` tenga la forma del contenido editable. Devuelve un mensaje para la dueña (en castellano) o null si está bien. */
export function errorDeContenido(d: unknown): string | null {
  if (!esObj(d) || !Object.keys(d).length) return 'No hay nada para guardar.';
  if (claveRara(d)) return 'Hay datos con un formato que no se acepta. Recargá la página.';
  for (const [k, v] of Object.entries(d)) {
    if (!(CLAVES as readonly string[]).includes(k)) return 'Hay datos que el panel no reconoce. Recargá la página.';
    if (!v || typeof v !== 'object') return 'Hay una sección con datos mal formados. Recargá la página.';
    if (Array.isArray(v) && v.length > 200) return 'Hay demasiados elementos en una lista (el máximo es 200).';
  }
  if (d.negocio !== undefined) {
    const n = d.negocio as Obj, p = n.pedidos as Obj | undefined, e = n.envio as Obj | undefined;
    if (!esObj(n)) return 'Los datos del local están mal formados.';
    if (typeof n.telefono === 'string' && !/^\d{0,15}$/.test(n.telefono)) return 'El WhatsApp tiene que tener solo números (hasta 15), con código de país.';
    if (!texto(n.horarios, 100) || !texto(n.respuesta, 200)) return 'Los horarios o el mensaje del pedido son demasiado largos.';
    if (p !== undefined && (!esObj(p) || !hora(p.desde) || !hora(p.hasta))) return 'Revisá el horario de pedidos (formato 08:00).';
    if (e !== undefined && (!esObj(e) || !texto(e.zona, 120) || !dinero(e.costo) || !dinero(e.minimo))) return 'Revisá el costo de envío y el pedido mínimo: tienen que ser números.';
  }
  if (d.productos !== undefined) {
    if (!esObj(d.productos)) return 'La carta está mal formada.';
    for (const [id, p] of Object.entries(d.productos)) {
      if (!/^[a-z0-9-]{1,40}$/.test(id) || !esObj(p)) return 'Hay un producto mal formado en la carta.';
      if (!texto(p.nombre, 60)) return `El nombre de «${id}» es demasiado largo.`;
      if (!dinero(p.precio)) return `El precio de «${String(p.nombre ?? id)}» tiene que ser un número.`;
      if (!urlFoto(p.foto)) return `La foto de «${String(p.nombre ?? id)}» no es válida: subila de nuevo.`;
    }
  }
  if (d.eventos !== undefined) {
    if (!Array.isArray(d.eventos)) return 'Los eventos están mal formados.';
    for (const [i, ev] of d.eventos.entries()) {
      const n = `Evento ${i + 1}`;
      if (!esObj(ev) || !fecha(ev.fecha)) return `${n}: falta la fecha o no es válida.`;
      if (!hora(ev.hora)) return `${n}: la hora no es válida.`;
      if (typeof ev.titulo !== 'string' || !ev.titulo || !texto(ev.titulo, 80) || !texto(ev.desc, 300)) return `${n}: el título es obligatorio (hasta 80 letras) y la descripción llega a 300.`;
      if (!urlFoto(ev.foto)) return `${n}: la foto no es válida, subila de nuevo.`;
    }
  }
  if (d.visitas !== undefined) {
    if (!Array.isArray(d.visitas)) return 'Las fotos de visitas están mal formadas.';
    for (const [i, v] of d.visitas.entries()) {
      if (!esObj(v) || !v.src || !urlFoto(v.src)) return `Foto de visita ${i + 1}: la foto no es válida, subila de nuevo.`;
      if (!texto(v.pie, 120) || !texto(v.quien, 40)) return `Foto de visita ${i + 1}: el pie o el nombre son demasiado largos.`;
    }
  }
  return null;
}

export const contenidoValido = (d: unknown): d is Partial<Record<(typeof CLAVES)[number], object>> => errorDeContenido(d) === null;
