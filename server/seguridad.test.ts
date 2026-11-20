// Revisión adversaria (19/11/2026): cada test es un ataque o una carrera que tiene que fallar.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MongoClient } from 'mongodb';
import { errorDeContenido } from './foto';
import { CLAVE, entrar, levantar } from './prueba';

let base: string, cerrar: () => Promise<void>, admin: Record<string, string>;
beforeAll(async () => { ({ base, cerrar } = await levantar()); admin = await entrar(base, '10.9.9.9'); });
afterAll(() => cerrar());

const json = { 'content-type': 'application/json' };
const login = (clave: string, ip: string) => fetch(`${base}/api/login`, { method: 'POST', headers: { ...json, 'x-gc': '1', 'x-real-ip': ip }, body: JSON.stringify({ clave }) });
const put = (cuerpo: unknown, h = admin) => fetch(`${base}/api/contenido`, { method: 'PUT', headers: { ...json, ...h }, body: JSON.stringify(cuerpo) });
const pedido = (extra: object = {}) => ({ lineas: [{ nombre: 'Medialuna', cant: 1, precio: 900, opc: {}, nota: '' }], modo: 'local', hora: '09:30', nombre: 'Ana', total: 900, texto: 'Hola', ...extra });
const enviar = (cuerpo: unknown, ip: string) => fetch(`${base}/api/pedido`, { method: 'POST', headers: { ...json, 'x-real-ip': ip }, body: JSON.stringify(cuerpo) });

describe('fuerza bruta del login', () => {
  it('20 intentos en paralelo desde la misma IP: como mucho 5 llegan a probarse (antes se contaban después de verificar)', async () => {
    const r = await Promise.all(Array.from({ length: 20 }, (_, i) => login(`mal-${i}-xxxxxxxx`, '20.0.0.1')));
    const probados = r.filter((x) => x.status === 401).length;
    expect(probados).toBeLessThanOrEqual(5);
    expect(r.filter((x) => x.status === 429).length).toBeGreaterThanOrEqual(15);
    expect((await login(CLAVE, '20.0.0.1')).status).toBe(429); // y la buena tampoco entra mientras dure el bloqueo
  }, 20_000);
});

describe('sesiones', () => {
  it('cambiar la contraseña invalida las sesiones abiertas', async () => {
    const vieja = await entrar(base, '30.0.0.1');
    expect((await fetch(`${base}/api/auditoria`, { headers: vieja })).status).toBe(200);
    const antes = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = 'otra-clave-rotada-123';
    expect((await fetch(`${base}/api/auditoria`, { headers: vieja })).status).toBe(401);
    process.env.ADMIN_PASSWORD = antes;
  });

  it('en producción (NODE_ENV=production) sin 2FA el login queda cerrado, no solo en Vercel', async () => {
    const antes = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect((await login(CLAVE, '31.0.0.1')).status).toBe(503);
    process.env.NODE_ENV = antes;
  });
});

describe('pedidos: carreras y abuso', () => {
  it('aceptar y rechazar a la vez: solo una de las dos gana (la otra recibe 409)', async () => {
    const { id } = await (await enviar(pedido(), '40.0.0.1')).json();
    const patch = (estado: string) => fetch(`${base}/api/pedido`, { method: 'PATCH', headers: { ...json, ...admin }, body: JSON.stringify({ id, estado }) });
    const r = await Promise.all([patch('aceptado'), patch('rechazado')]);
    expect(r.map((x) => x.status).sort()).toEqual([200, 409]);
    const final = await (await fetch(`${base}/api/pedido?id=${id}`)).json();
    expect(['aceptado', 'rechazado']).toContain(final.estado);
  });

  it('consultar el estado también tiene tope por IP (300 cada 10 minutos)', async () => {
    const { id } = await (await enviar(pedido(), '41.0.0.1')).json();
    let ultimo = 0;
    for (let i = 0; i < 302; i++) ultimo = (await fetch(`${base}/api/pedido?id=${id}`, { headers: { 'x-real-ip': '41.0.0.2' } })).status;
    expect(ultimo).toBe(429);
  }, 30_000);

  it('hay un tope general de pedidos por hora aunque cambie la IP (no se llena el panel del local)', async () => {
    let ultimo = 0;
    for (let i = 0; i < 305; i++) ultimo = (await enviar(pedido(), `42.${i % 250}.0.${Math.floor(i / 250) + 1}`)).status;
    expect(ultimo).toBe(429);
  }, 60_000);
});

describe('contenido: solo lo que el panel edita', () => {
  const uuid = 'a'.repeat(8) + '-aaaa-aaaa-aaaa-' + 'a'.repeat(12);
  it('rechaza claves de más (chat, instagram, opciones, campos sueltos): llegarían tal cual a los href y al carrito', () => {
    expect(errorDeContenido({ negocio: { chat: 'javascript:alert(1)' } })).toBeTruthy();
    expect(errorDeContenido({ negocio: { instagram: 'https://malo.example' } })).toBeTruthy();
    expect(errorDeContenido({ negocio: { envio: { activo: true, extra: 1 } } })).toBeTruthy();
    expect(errorDeContenido({ productos: { medialuna: { nombre: 'x', opciones: [] } } })).toBeTruthy();
    expect(errorDeContenido({ eventos: [{ fecha: '2026-12-01', titulo: 'x', url: 'https://malo.example' }] })).toBeTruthy();
    expect(errorDeContenido({ visitas: [{ src: `/api/foto?id=${uuid}`, html: '<b>' }] })).toBeTruthy();
    expect(errorDeContenido({ negocio: { telefono: '5493510000000', horarios: 'Lun a Sáb', pedidos: { desde: '08:00', hasta: '20:00' }, respuesta: 'ok', envio: { activo: true, zona: 'Centro', costo: 1500, minimo: null } } })).toBeNull();
  });

  it('una foto de otro dominio (aunque tenga la forma /api/foto?id=) se rechaza; la del propio sitio entra', async () => {
    expect((await put({ visitas: [{ src: `http://sitio-malo.example/api/foto?id=${uuid}` }] })).status).toBe(400);
    expect((await put({ visitas: [{ src: `${base}/api/foto?id=${uuid}` }] })).status).toBe(200);
    expect((await put({ visitas: [{ src: `/api/foto?id=${uuid}` }] })).status).toBe(200);
  });

  it('JSON anidado a lo bestia da 400, no un 500 ni se cuelga', async () => {
    const r = await fetch(`${base}/api/contenido`, { method: 'PUT', headers: { ...json, ...admin }, body: '['.repeat(500_000) });
    expect(r.status).toBe(400);
  });

  it('las fotos que ya nadie usa se borran (viejas); las usadas y las recién subidas quedan', async () => {
    const c = await new MongoClient(process.env.MONGODB_URI!).connect();
    const fotos = c.db(process.env.MONGODB_DB).collection<{ _id: string; creado: Date }>('fotos');
    const id = (n: number) => `${String(n).repeat(8)}-bbbb-bbbb-bbbb-${String(n).repeat(12)}`;
    const dos = { data: Buffer.from([1]), tipo: 'image/png' };
    await fotos.insertMany([
      { _id: id(1), creado: new Date(Date.now() - 3 * 86400_000), ...dos }, // vieja y sin uso → se va
      { _id: id(2), creado: new Date(Date.now() - 3 * 86400_000), ...dos }, // vieja pero en uso → queda
      { _id: id(3), creado: new Date(), ...dos }, // recién subida, todavía sin guardar → queda
    ]);
    expect((await put({ visitas: [{ src: `${base}/api/foto?id=${id(2)}` }] })).status).toBe(200);
    expect(await fotos.countDocuments({ _id: id(1) })).toBe(0);
    expect(await fotos.countDocuments({ _id: id(2) })).toBe(1);
    expect(await fotos.countDocuments({ _id: id(3) })).toBe(1);
    await c.close();
  });
});
