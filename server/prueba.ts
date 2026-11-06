// Ayudas para los tests: un Mongo en memoria, un servidor con todas las rutas de api/ y un login listo.
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { MongoMemoryServer } from 'mongodb-memory-server';
import auditoria from '../api/auditoria';
import contenido from '../api/contenido';
import foto from '../api/foto';
import login from '../api/login';
import pedido from '../api/pedido';
import salud from '../api/salud';

type H = (req: never, res: never) => Promise<void>;
const rutas: Record<string, H> = { '/api/contenido': contenido as never, '/api/login': login as never, '/api/foto': foto as never, '/api/pedido': pedido as never, '/api/auditoria': auditoria as never, '/api/salud': salud as never };

export const CLAVE = 'clave-de-prueba-larga';

export async function levantar(extra: Record<string, string> = {}) {
  const mongo = await MongoMemoryServer.create();
  Object.assign(process.env, { MONGODB_URI: mongo.getUri(), MONGODB_DB: `t${Date.now()}`, ADMIN_PASSWORD: CLAVE }, extra);
  const servidor: Server = createServer((req, res) => rutas[(req.url ?? '').split('?')[0]](req as never, res as never));
  await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  return { base, cerrar: async () => { servidor.close(); await mongo.stop(); } };
}

/** Entra al panel y devuelve los encabezados que usa el navegador después (cookie + x-gc). */
export async function entrar(base: string, ipFalsa = '10.0.0.1', codigo?: string): Promise<Record<string, string>> {
  const r = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-gc': '1', 'x-real-ip': ipFalsa }, body: JSON.stringify({ clave: CLAVE, codigo }) });
  if (r.status !== 200) throw new Error(`login ${r.status} ${await r.text()}`);
  return { cookie: r.headers.get('set-cookie')!.split(';')[0], 'x-gc': '1', 'x-real-ip': ipFalsa };
}
