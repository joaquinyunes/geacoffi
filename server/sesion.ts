import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { coleccion } from './db.js';
import { ip, json, type Req, type Res } from './http.js';
import { pasoValido } from './totp.js';

export const MIN_CLAVE = 12;
const DURACION_S = 12 * 3600;
const COOKIE = 'gc_sesion';

interface Sesion { _id: string; exp: Date; creado: Date; ip: string }

const sha = (s: string) => createHash('sha256').update(s).digest();
const igual = (a: string, b: string) => timingSafeEqual(sha(a), sha(b));

let indices: Promise<unknown> | undefined;
async function sesiones() {
  const c = await coleccion<Sesion>('sesiones');
  indices ??= Promise.all([
    c.createIndex({ exp: 1 }, { expireAfterSeconds: 0 }),
    (await coleccion('totp_usados')).createIndex({ creado: 1 }, { expireAfterSeconds: 300 }),
  ]).catch(() => { indices = undefined; });
  return c;
}

/** 'ok' si hay clave usable; si no, el motivo. La clave puede venir como hash scrypt (ADMIN_PASSWORD_HASH, recomendado) o en claro (ADMIN_PASSWORD, ≥ 12 caracteres). */
export function estadoConfig(): 'ok' | 'sin-clave' | 'clave-corta' | 'sin-2fa' {
  const { ADMIN_PASSWORD_HASH: hash, ADMIN_PASSWORD: plano, ADMIN_TOTP_SECRET: totp, VERCEL_ENV, ADMIN_SIN_2FA } = process.env;
  if (!hash && !plano) return 'sin-clave';
  if (!hash && plano!.length < MIN_CLAVE) return 'clave-corta';
  if (VERCEL_ENV === 'production' && !totp && ADMIN_SIN_2FA !== '1') return 'sin-2fa';
  return 'ok';
}

/** Formato del hash: scrypt$<sal base64>$<hash base64> (lo genera tools/clave.mjs). */
export function hashClave(clave: string, sal = randomBytes(16)): string {
  return `scrypt$${sal.toString('base64')}$${scryptSync(clave, sal, 32).toString('base64')}`;
}

export function claveCorrecta(dada: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    const [tipo, sal, esperado] = hash.split('$');
    if (tipo !== 'scrypt' || !sal || !esperado) return false;
    const e = Buffer.from(esperado, 'base64'), h = scryptSync(dada, Buffer.from(sal, 'base64'), e.length);
    return timingSafeEqual(h, e);
  }
  return Boolean(process.env.ADMIN_PASSWORD) && igual(process.env.ADMIN_PASSWORD!, dada);
}

/** Valida el segundo paso. Un código vale una sola vez (si no, quien lo vea por encima lo reusa 30 s). */
export async function segundoPasoCorrecto(dado: string): Promise<boolean> {
  const secreto = process.env.ADMIN_TOTP_SECRET;
  if (!secreto) return true;
  const paso = pasoValido(secreto, dado);
  if (paso === null) return false;
  await sesiones(); // crea los índices
  try { await (await coleccion<{ _id: string; creado: Date }>('totp_usados')).insertOne({ _id: String(paso), creado: new Date() }); return true; } catch { return false; }
}

const tokenDe = (req: Req) => /(?:^|;\s*)gc_sesion=([\w-]+)/.exec(req.headers.cookie ?? '')?.[1];

/** Crea la sesión y pone la cookie (HttpOnly, SameSite=Lax, Secure detrás de https). */
export async function abrirSesion(req: Req, res: Res) {
  const token = randomBytes(32).toString('base64url');
  await (await sesiones()).insertOne({ _id: sha(token).toString('hex'), exp: new Date(Date.now() + DURACION_S * 1000), creado: new Date(), ip: ip(req) });
  res.setHeader('Set-Cookie', cookie(req, token, DURACION_S));
}

const cookie = (req: Req, valor: string, edad: number) =>
  `${COOKIE}=${valor}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${edad}${req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`;

export async function hayAdmin(req: Req): Promise<boolean> {
  const token = tokenDe(req);
  return Boolean(token && await (await sesiones()).findOne({ _id: sha(token).toString('hex'), exp: { $gt: new Date() } }));
}

/** Cierra esta sesión, o todas (en todos los dispositivos). */
export async function cerrarSesion(req: Req, res: Res, todas = false) {
  const token = tokenDe(req), c = await sesiones();
  if (todas) await c.deleteMany({}); else if (token) await c.deleteOne({ _id: sha(token).toString('hex') });
  res.setHeader('Set-Cookie', cookie(req, '', 0));
}

/** Para las rutas del panel: deja pasar solo con sesión vigente. Los pedidos que cambian datos deben traer `x-gc` (un encabezado propio que otro sitio no puede mandar sin permiso de CORS: frena CSRF). */
export async function exigirAdmin(req: Req, res: Res): Promise<boolean> {
  if (req.method !== 'GET' && req.headers['x-gc'] !== '1') { json(res, 403, { error: 'Pedido no permitido. Recargá el panel.' }); return false; }
  if (!await hayAdmin(req)) { json(res, 401, { error: 'Tu sesión venció. Volvé a entrar.' }); return false; }
  return true;
}
