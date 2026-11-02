import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import contenido from '../api/contenido';
import login from '../api/login';
import foto from '../api/foto';
import { contenidoValido, tipoDeImagen } from './foto';

let mongo: MongoMemoryServer;
let servidor: Server;
let base: string;

const handlers: Record<string, (req: never, res: never) => Promise<void>> = { '/api/contenido': contenido as never, '/api/login': login as never, '/api/foto': foto as never };

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.MONGODB_DB = 'geacoffi-test';
  process.env.ADMIN_PASSWORD = 'clave-de-prueba';
  servidor = createServer((req, res) => handlers[(req.url ?? '').split('?')[0]](req as never, res as never));
  await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok));
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
});

afterAll(async () => {
  servidor.close();
  await mongo.stop();
});

const admin = { 'x-admin-clave': 'clave-de-prueba' };
const put = (cuerpo: unknown, headers: Record<string, string> = admin) =>
  fetch(`${base}/api/contenido`, { method: 'PUT', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(cuerpo) });

describe('contenido editable en MongoDB', () => {
  it('sin guardar nada la web recibe un objeto vacío (y usa lo de negocio.js)', async () => {
    const r = await fetch(`${base}/api/contenido`);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({});
  });

  it('guardar exige la clave del panel', async () => {
    expect((await put({ negocio: { telefono: '1' } }, {})).status).toBe(401);
    expect((await put({ negocio: { telefono: '1' } }, { 'x-admin-clave': 'otra' })).status).toBe(401);
  });

  it('lo guardado se lee igual, y guardar de nuevo pisa solo esa sección', async () => {
    expect((await put({ negocio: { telefono: '3794000000' }, eventos: [{ fecha: '2026-11-01', titulo: 'Tarde de mates' }] })).status).toBe(200);
    expect((await put({ negocio: { telefono: '3794111111' } })).status).toBe(200);
    const c = await (await fetch(`${base}/api/contenido`)).json();
    expect(c.negocio.telefono).toBe('3794111111');
    expect(c.eventos).toEqual([{ fecha: '2026-11-01', titulo: 'Tarde de mates' }]);
  });

  it('rechaza claves desconocidas, JSON roto y listas enormes', async () => {
    expect((await put({ hack: { a: 1 } })).status).toBe(400);
    expect((await put({})).status).toBe(400);
    const roto = await fetch(`${base}/api/contenido`, { method: 'PUT', headers: { ...admin }, body: '{no es json' });
    expect(roto.status).toBe(400);
    expect((await put({ visitas: Array.from({ length: 201 }, () => ({})) })).status).toBe(400);
  });

  it('contenidoValido solo acepta secciones conocidas', () => {
    expect(contenidoValido({ negocio: {}, productos: {} })).toBe(true);
    expect(contenidoValido({ negocio: 'texto' })).toBe(false);
    expect(contenidoValido([])).toBe(false);
    expect(contenidoValido(null)).toBe(false);
  });
});

describe('login y fotos', () => {
  it('login responde 204 con la clave y 401 sin ella', async () => {
    expect((await fetch(`${base}/api/login`, { method: 'POST', headers: admin })).status).toBe(204);
    expect((await fetch(`${base}/api/login`, { method: 'POST', headers: { 'x-admin-clave': 'mal' } })).status).toBe(401);
  });

  it('la url de la foto usa el protocolo real del pedido (http en local, https detrás del proxy de Vercel)', async () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const local = await (await fetch(`${base}/api/foto`, { method: 'POST', headers: admin, body: png })).json();
    expect(new URL(local.url).protocol).toBe('http:');
    const proxy = await (await fetch(`${base}/api/foto`, { method: 'POST', headers: { ...admin, 'x-forwarded-proto': 'https' }, body: png })).json();
    expect(new URL(proxy.url).protocol).toBe('https:');
  });

  it('sube una foto real y la devuelve; rechaza lo que no es imagen', async () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(tipoDeImagen(png)).toBe('image/png');
    const sube = await fetch(`${base}/api/foto`, { method: 'POST', headers: admin, body: png });
    expect(sube.status).toBe(201);
    const { url } = await sube.json();
    const lee = await fetch(`${base}/api/foto?id=${new URL(url).searchParams.get('id')}`);
    expect(lee.status).toBe(200);
    expect(lee.headers.get('content-type')).toBe('image/png');
    expect(new Uint8Array(await lee.arrayBuffer())).toEqual(png);
    expect((await fetch(`${base}/api/foto`, { method: 'POST', headers: admin, body: 'no soy una imagen' })).status).toBe(400);
    expect((await fetch(`${base}/api/foto`, { method: 'POST', body: png })).status).toBe(401);
  });
});
