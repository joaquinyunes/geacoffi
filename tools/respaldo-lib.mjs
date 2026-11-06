// Respaldo y restauración de la base de GeaCofi: todo en un archivo comprimido y, si hay clave, cifrado (AES-256-GCM).
// Se excluyen las colecciones que se regeneran solas (sesiones, límites, códigos 2FA usados).
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import { BSON, MongoClient } from 'mongodb';

const MARCA = Buffer.from('GCB1');
const EXCLUIDAS = new Set(['limites', 'sesiones', 'totp_usados']);

export function cifrar(datos, clave) {
  const sal = randomBytes(16), iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', scryptSync(clave, sal, 32), iv);
  const cuerpo = Buffer.concat([c.update(datos), c.final()]);
  return Buffer.concat([MARCA, sal, iv, c.getAuthTag(), cuerpo]);
}

export function descifrar(archivo, clave) {
  if (!archivo.subarray(0, 4).equals(MARCA)) throw new Error('El archivo no es un respaldo cifrado de GeaCofi (o no está cifrado).');
  const sal = archivo.subarray(4, 20), iv = archivo.subarray(20, 32), tag = archivo.subarray(32, 48);
  const d = createDecipheriv('aes-256-gcm', scryptSync(clave, sal, 32), iv);
  d.setAuthTag(tag);
  try { return Buffer.concat([d.update(archivo.subarray(48)), d.final()]); } catch { throw new Error('La clave del respaldo no es correcta o el archivo está dañado.'); }
}

/** Devuelve el respaldo como Buffer. Con `clave` queda cifrado. */
export async function hacerRespaldo(uri, db, clave) {
  const cliente = await new MongoClient(uri).connect();
  try {
    const base = cliente.db(db), salida = { version: 1, fecha: new Date().toISOString(), db, colecciones: {} };
    for (const { name } of await base.listCollections({}, { nameOnly: true }).toArray()) {
      if (EXCLUIDAS.has(name) || name.startsWith('system.')) continue;
      salida.colecciones[name] = await base.collection(name).find().toArray();
    }
    const comprimido = gzipSync(Buffer.from(BSON.EJSON.stringify(salida, { relaxed: false })));
    return clave ? cifrar(comprimido, clave) : comprimido;
  } finally { await cliente.close(); }
}

/** Carga un respaldo en `db`. Se niega si esa base ya tiene datos, salvo con forzar (entonces pisa las colecciones del respaldo). Devuelve { colecciones: { nombre: cantidad } }. */
export async function restaurar(archivo, uri, db, { clave, forzar = false } = {}) {
  const datos = clave ? descifrar(archivo, clave) : archivo;
  const respaldo = BSON.EJSON.parse(gunzipSync(datos).toString('utf8'), { relaxed: false });
  const cliente = await new MongoClient(uri).connect();
  try {
    const base = cliente.db(db);
    const existentes = (await base.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
    if (existentes.length && !forzar) throw new Error(`La base "${db}" ya tiene datos (${existentes.join(', ')}). Usá otra base vacía o --forzar.`);
    const cantidades = {};
    for (const [nombre, docs] of Object.entries(respaldo.colecciones)) {
      const col = base.collection(nombre);
      if (forzar) await col.deleteMany({});
      if (docs.length) await col.insertMany(docs);
      cantidades[nombre] = docs.length;
    }
    return { fecha: respaldo.fecha, colecciones: cantidades };
  } finally { await cliente.close(); }
}
