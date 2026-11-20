import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { ruta } from './http';
import { levantar } from './prueba';

let cerrarBase: () => Promise<void>;
const recibidos: { titulo?: string; cuerpo: string }[] = [];
const receptor = createServer((req, res) => {
  let cuerpo = ''; req.on('data', (d) => (cuerpo += d)).on('end', () => { recibidos.push({ titulo: req.headers.title as string, cuerpo }); res.end('ok'); });
});
const falla = createServer(ruta(async () => { throw new TypeError('dato-secreto-de-un-cliente'); }) as never);

beforeAll(async () => {
  ({ cerrar: cerrarBase } = await levantar());
  await new Promise<void>((ok) => receptor.listen(0, '127.0.0.1', ok));
  await new Promise<void>((ok) => falla.listen(0, '127.0.0.1', ok));
});
afterAll(async () => { receptor.close(); falla.close(); await cerrarBase(); delete process.env.ALERTA_URL; });

const pegar = () => fetch(`http://127.0.0.1:${(falla.address() as AddressInfo).port}/api/boom`);

it('un error del servidor avisa una vez por ruta cada 10 minutos, sin datos del cliente, y la respuesta sigue siendo genérica', async () => {
  const antes = await pegar(); // sin ALERTA_URL: no avisa
  expect(antes.status).toBe(500);
  expect(recibidos).toHaveLength(0);

  process.env.ALERTA_URL = `http://127.0.0.1:${(receptor.address() as AddressInfo).port}/tema`;
  const r = await pegar();
  expect(r.status).toBe(500);
  expect(JSON.stringify(await r.json())).not.toContain('secreto');
  expect(recibidos).toHaveLength(1);
  expect(recibidos[0].cuerpo).toBe('TypeError en /api/boom');
  expect(recibidos[0].cuerpo).not.toContain('secreto');

  await pegar(); await pegar();
  expect(recibidos).toHaveLength(1); // el tope de 1 cada 10 min

  process.env.ALERTA_URL = 'http://sitio-externo.example/tema'; // http fuera de localhost: se ignora
  recibidos.length = 0;
  await pegar();
  expect(recibidos).toHaveLength(0);
});
