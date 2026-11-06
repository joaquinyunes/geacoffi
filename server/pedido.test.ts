import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { validarPedido } from './pedido';
import { entrar, levantar } from './prueba';

let base: string, cerrar: () => Promise<void>, admin: Record<string, string>;
beforeAll(async () => { ({ base, cerrar } = await levantar()); admin = await entrar(base); });
afterAll(() => cerrar());

const pedido = (extra: object = {}) => ({
  lineas: [{ nombre: 'Medialuna', cant: 2, precio: 900, opc: { Servida: 'Tibia' }, nota: '' }],
  modo: 'local', hora: '09:30', nombre: 'Ana', direccion: '', referencias: '', total: 1800, texto: 'Hola! Quiero hacer un pedido', ...extra,
});
const enviar = (cuerpo: unknown, ip = '9.9.9.9') => fetch(`${base}/api/pedido`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': ip }, body: JSON.stringify(cuerpo) });
const patch = (cuerpo: unknown) => fetch(`${base}/api/pedido`, { method: 'PATCH', headers: { 'content-type': 'application/json', ...admin }, body: JSON.stringify(cuerpo) });
const estado = async (id: string) => (await fetch(`${base}/api/pedido?id=${id}`)).json();

describe('estado del pedido para el cliente', () => {
  it('el cliente registra el pedido y lo ve "recibido"; el local lo acepta, lo deja listo y el cliente lo ve', async () => {
    const r = await enviar(pedido());
    expect(r.status).toBe(201);
    const { id, codigo } = await r.json();
    expect(codigo).toMatch(/^[0-9A-F]{4}$/);
    expect((await estado(id)).estado).toBe('recibido');
    expect((await patch({ id, estado: 'aceptado' })).status).toBe(200);
    expect((await estado(id)).estado).toBe('aceptado');
    expect((await patch({ id, estado: 'listo' })).status).toBe(200);
    expect((await estado(id)).estado).toBe('listo');
    const lista = await (await fetch(`${base}/api/pedido?lista=1`, { headers: admin })).json();
    expect(lista[0]).toMatchObject({ id, estado: 'listo', nombre: 'Ana', codigo });
  });

  it('si el local lo rechaza, el cliente ve el motivo', async () => {
    const { id } = await (await enviar(pedido())).json();
    await patch({ id, estado: 'rechazado', motivo: 'Nos quedamos sin medialunas' });
    expect(await estado(id)).toMatchObject({ estado: 'rechazado', motivo: 'Nos quedamos sin medialunas' });
  });

  it('no se puede saltar ni deshacer estados, y el cambio exige sesión', async () => {
    const { id } = await (await enviar(pedido())).json();
    expect((await patch({ id, estado: 'listo' })).status).toBe(409); // recibido → listo no existe
    await patch({ id, estado: 'rechazado' });
    expect((await patch({ id, estado: 'aceptado' })).status).toBe(409);
    expect((await fetch(`${base}/api/pedido`, { method: 'PATCH', headers: { 'x-gc': '1' }, body: JSON.stringify({ id, estado: 'aceptado' }) })).status).toBe(401);
    expect((await fetch(`${base}/api/pedido?lista=1`)).status).toBe(401);
  });

  it('el navegador puede traer su propio id (así el WhatsApp ya lleva el código) y no se registra dos veces', async () => {
    const id = crypto.randomUUID();
    const r = await enviar(pedido({ id }), '7.7.7.7');
    expect(r.status).toBe(201);
    expect(await r.json()).toMatchObject({ id, codigo: id.slice(0, 4).toUpperCase() });
    expect((await enviar(pedido({ id }), '7.7.7.7')).status).toBe(409);
    expect((await enviar(pedido({ id: 'no-es-un-id' }), '7.7.7.7')).status).toBe(400);
  });

  it('un id inexistente o con forma rara da 404 (sin pistas)', async () => {
    expect((await fetch(`${base}/api/pedido?id=${'a'.repeat(36)}`)).status).toBe(404);
    expect((await fetch(`${base}/api/pedido?id[$ne]=x`)).status).toBe(404);
  });

  it('rechaza pedidos mal formados con un mensaje claro', async () => {
    for (const malo of [pedido({ lineas: [] }), pedido({ modo: 'volando' }), pedido({ hora: '25:99' }), pedido({ modo: 'envio' }), pedido({ lineas: [{ nombre: 'x', cant: 0 }] }), pedido({ texto: '' }), 'texto']) {
      const r = await enviar(malo);
      expect(r.status).toBe(400);
      expect((await r.json()).error).toMatch(/[a-z]{4}/i);
    }
  });

  it('frena el abuso: 11 pedidos seguidos desde la misma IP', async () => {
    let ultimo = 0;
    for (let i = 0; i < 11; i++) ultimo = (await enviar(pedido(), '8.8.8.8')).status;
    expect(ultimo).toBe(429);
  });

  it('validarPedido descarta campos de más y operadores', () => {
    const v = validarPedido({ ...pedido(), $where: '1', admin: true });
    expect(typeof v).toBe('object');
    expect(v).not.toHaveProperty('$where');
    expect(validarPedido(pedido({ lineas: [{ nombre: 'x', cant: 1, precio: null, opc: { $gt: 'a' }, nota: '' }] }))).toMatch(/opción/);
  });
});

describe('salud', () => {
  it('responde 200 cuando la base está', async () => {
    const r = await fetch(`${base}/api/salud`);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
  });
});
