import type { IncomingMessage as Req, ServerResponse as Res } from 'node:http';

export type { Req, Res };

/** Sitios que pueden llamar a la API desde otro dominio (ej. la copia en Render), separados por coma en ORIGENES_PERMITIDOS. Sin la variable, solo el mismo sitio. */
const origenes = () => (process.env.ORIGENES_PERMITIDOS ?? '').split(',').map(s => s.trim()).filter(Boolean);

/** Pone los encabezados CORS y responde el preflight; devuelve true si el pedido ya quedó resuelto. */
export function cors(req: Req, res: Res): boolean {
  const origen = req.headers.origin;
  res.setHeader('Vary', 'Origin'); // siempre: sin esto la caché de Vercel reparte la respuesta de un origen a otro
  if (origen && origenes().includes(origen)) res.setHeader('Access-Control-Allow-Origin', origen);
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-gc');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE, OPTIONS');
  if (req.method !== 'OPTIONS') return false;
  res.statusCode = 204;
  res.end();
  return true;
}

export function json(res: Res, estado: number, cuerpo: unknown) {
  res.statusCode = estado;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!res.hasHeader('Cache-Control')) res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(cuerpo));
}

/** IP del visitante: Vercel y Render la ponen en estos encabezados; en local cae al socket. */
export function ip(req: Req): string {
  const h = (n: string) => { const v = req.headers[n]; return (Array.isArray(v) ? v[0] : v)?.split(',')[0].trim(); };
  return h('x-real-ip') || h('x-forwarded-for') || req.socket?.remoteAddress || 'desconocida';
}

export class CuerpoGrande extends Error {}

/** Lee el cuerpo del pedido y corta si pasa de `max` bytes. */
export async function leerCuerpo(req: Req, max: number): Promise<Buffer> {
  const partes: Buffer[] = [];
  let total = 0;
  for await (const parte of req) {
    total += (parte as Buffer).length;
    if (total > max) throw new CuerpoGrande();
    partes.push(parte as Buffer);
  }
  return Buffer.concat(partes);
}

/** Lee un cuerpo JSON de hasta `max` bytes; si viene roto responde 400 y devuelve undefined. */
export async function leerJson(req: Req, res: Res, max = 100_000): Promise<unknown> {
  try { return JSON.parse((await leerCuerpo(req, max)).toString('utf8')); } catch (e) {
    if (e instanceof SyntaxError) { json(res, 400, { error: 'No entendimos lo que se envió. Recargá la página y probá de nuevo.' }); return undefined; }
    throw e;
  }
}

/** Envuelve un handler: CORS, errores a JSON y nada de detalles internos hacia afuera. */
export function ruta(f: (req: Req, res: Res) => Promise<void>) {
  return async (req: Req, res: Res) => {
    if (cors(req, res)) return;
    try {
      await f(req, res);
    } catch (error) {
      if (error instanceof CuerpoGrande) return json(res, 413, { error: 'Lo que enviaste es demasiado grande.' });
      console.error(error);
      json(res, 500, { error: 'Hubo un problema de nuestro lado. Probá de nuevo en un rato.' });
    }
  };
}
