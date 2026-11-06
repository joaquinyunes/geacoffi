import { coleccion } from '../server/db.js';
import { errorDeContenido } from '../server/foto.js';
import { diferencias, registrar } from '../server/auditoria.js';
import { ip, json, leerJson, ruta } from '../server/http.js';
import { limitar } from '../server/limite.js';
import { exigirAdmin } from '../server/sesion.js';

interface Fila { _id: string; valor: unknown; actualizado: Date }

// Contenido editable de la web (negocio, productos, eventos y visitas): una fila por sección.
export default ruta(async (req, res) => {
  const col = await coleccion<Fila>('contenido');
  if (req.method === 'GET') {
    const filas = await col.find().toArray();
    res.setHeader('Cache-Control', 'no-store'); // la web debe ver los cambios apenas se guardan
    return json(res, 200, Object.fromEntries(filas.map((f) => [f._id, f.valor])));
  }
  if (req.method !== 'PUT') return json(res, 405, { error: 'Este pedido no está permitido.' });
  if (!await exigirAdmin(req, res)) return;
  if (await limitar(`guardar:${ip(req)}`, 60, 3600)) return json(res, 429, { error: 'Guardaste demasiadas veces seguidas. Esperá un rato y probá de nuevo.' });

  const datos = await leerJson(req, res, 1_000_000);
  if (datos === undefined) return;
  const problema = errorDeContenido(datos);
  if (problema) return json(res, 400, { error: problema });
  const nuevo = datos as Record<string, unknown>;
  const antes = new Map((await col.find({ _id: { $in: Object.keys(nuevo) } }).toArray()).map((f) => [f._id, f.valor]));
  const ahora = new Date();
  await col.bulkWrite(Object.entries(nuevo).map(([_id, valor]) => ({ updateOne: { filter: { _id }, update: { $set: { valor, actualizado: ahora } }, upsert: true } })));
  const cambios = Object.entries(nuevo).flatMap(([seccion, valor]) => diferencias(antes.get(seccion) ?? (Array.isArray(valor) ? [] : {}), valor, seccion));
  if (cambios.length) await registrar(req, 'guardó cambios', cambios);
  json(res, 200, { ok: true, cambios: cambios.length });
});
