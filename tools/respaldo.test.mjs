import { afterAll, beforeAll, expect, it } from 'vitest';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { hacerRespaldo, restaurar } from './respaldo-lib.mjs';

let mongo, uri;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); uri = mongo.getUri(); });
afterAll(() => mongo.stop());

it('respaldo cifrado → restauración en otra base: los datos vuelven iguales (fotos binarias incluidas)', async () => {
  const c = await new MongoClient(uri).connect();
  const origen = c.db('origen');
  const { Binary } = await import('mongodb');
  await origen.collection('contenido').insertOne({ _id: 'negocio', valor: { telefono: '5493510000000' }, actualizado: new Date('2026-11-06') });
  await origen.collection('fotos').insertOne({ _id: 'f1', tipo: 'image/png', data: new Binary(Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])), creado: new Date('2026-11-06') });
  await origen.collection('pedidos').insertMany([{ _id: 'p1', estado: 'recibido', nombre: 'Ana' }, { _id: 'p2', estado: 'listo', nombre: 'Beto' }]);
  await origen.collection('sesiones').insertOne({ _id: 's', exp: new Date() }); // no debe viajar

  const archivo = await hacerRespaldo(uri, 'origen', 'clave-de-respaldo');
  expect(archivo.toString('latin1')).not.toContain('Ana'); // cifrado de verdad
  await expect(restaurar(archivo, uri, 'destino', { clave: 'clave-equivocada' })).rejects.toThrow(/clave/);

  const r = await restaurar(archivo, uri, 'destino', { clave: 'clave-de-respaldo' });
  expect(r.colecciones).toEqual({ contenido: 1, fotos: 1, pedidos: 2 });
  const destino = c.db('destino');
  expect(await destino.collection('contenido').findOne({})).toEqual(await origen.collection('contenido').findOne({}));
  expect(await destino.collection('pedidos').find().sort({ _id: 1 }).toArray()).toEqual(await origen.collection('pedidos').find().sort({ _id: 1 }).toArray());
  const foto = await destino.collection('fotos').findOne({ _id: 'f1' });
  expect([...foto.data.buffer]).toEqual([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
  expect(await destino.collection('sesiones').countDocuments()).toBe(0);

  await expect(restaurar(archivo, uri, 'destino', { clave: 'clave-de-respaldo' })).rejects.toThrow(/ya tiene datos/); // no pisa una base con datos
  await c.close();
});
