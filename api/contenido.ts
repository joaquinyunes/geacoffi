import { coleccion } from '../server/db.js';
import { contenidoValido } from '../server/foto.js';
import { esAdmin, json, leerCuerpo, ruta } from '../server/http.js';

interface Fila { _id: string; valor: unknown; actualizado: Date }

// Contenido editable de la web (negocio, productos, eventos y visitas): una fila por sección.
export default ruta(async (req, res) => {
  if (req.method === 'GET') {
    const filas = await (await coleccion<Fila>('contenido')).find().toArray();
    res.setHeader('Cache-Control', 'no-store'); // la web debe ver los cambios apenas se guardan
    return json(res, 200, Object.fromEntries(filas.map((f) => [f._id, f.valor])));
  }
  if (req.method !== 'PUT') return json(res, 405, { error: 'Método no permitido' });
  if (!esAdmin(req)) return json(res, 401, { error: 'Clave incorrecta' });

  let datos: unknown;
  try { datos = JSON.parse((await leerCuerpo(req, 1_000_000)).toString('utf8')); } catch (e) {
    if (e instanceof SyntaxError) return json(res, 400, { error: 'JSON inválido' });
    throw e;
  }
  if (!contenidoValido(datos)) return json(res, 400, { error: 'Datos inválidos' });
  const col = await coleccion<Fila>('contenido');
  const ahora = new Date();
  await col.bulkWrite(Object.entries(datos).map(([_id, valor]) => ({ updateOne: { filter: { _id }, update: { $set: { valor, actualizado: ahora } }, upsert: true } })));
  json(res, 200, { ok: true });
});
