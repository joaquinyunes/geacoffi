import { randomUUID } from 'node:crypto';
import { coleccion } from '../server/db.js';
import { registrar } from '../server/auditoria.js';
import { ip, json, leerJson, ruta } from '../server/http.js';
import { limitar } from '../server/limite.js';
import { codigoCorto, ESTADOS, SIGUIENTES, validarPedido, type Estado, type PedidoNuevo } from '../server/pedido.js';
import { exigirAdmin } from '../server/sesion.js';

interface Pedido extends PedidoNuevo { _id: string; estado: Estado; motivo: string; creado: Date; actualizado: Date }

let indice: Promise<unknown> | undefined;

// Pedidos de la carta. El cliente los registra (POST) y consulta su estado con el id (GET ?id=); el local los atiende desde el panel (GET ?lista=1, PATCH).
// El pedido siempre sale también por WhatsApp desde el navegador: este registro es un extra, nunca el único camino.
export default ruta(async (req, res) => {
  const col = await coleccion<Pedido>('pedidos');
  indice ??= col.createIndex({ creado: 1 }, { expireAfterSeconds: 90 * 86400 }).catch(() => { indice = undefined; }); // los datos del cliente se borran a los 90 días
  const url = new URL(req.url ?? '', 'http://x');

  if (req.method === 'GET') {
    if (url.searchParams.get('lista') === '1') {
      if (!await exigirAdmin(req, res)) return;
      const filas = await col.find().sort({ creado: -1 }).limit(50).toArray();
      return json(res, 200, filas.map(({ _id, ...p }) => ({ id: _id, codigo: codigoCorto(_id), ...p })));
    }
    const id = url.searchParams.get('id') ?? '';
    const p = /^[a-f0-9-]{36}$/.test(id) ? await col.findOne({ _id: id }, { projection: { estado: 1, motivo: 1, actualizado: 1 } }) : null;
    if (!p) return json(res, 404, { error: 'No encontramos ese pedido.' });
    return json(res, 200, { estado: p.estado, motivo: p.motivo, actualizado: p.actualizado });
  }

  if (req.method === 'POST') {
    if (await limitar(`pedido:${ip(req)}`, 10, 600)) return json(res, 429, { error: 'Mandaste varios pedidos seguidos. Esperá unos minutos o escribinos por WhatsApp.' });
    const cuerpo = await leerJson(req, res, 20_000);
    if (cuerpo === undefined) return;
    const pedido = validarPedido(cuerpo);
    if (typeof pedido === 'string') return json(res, 400, { error: pedido });
    const { id: idCliente, ...datos } = pedido; // el navegador puede traer el id para poner el código en el WhatsApp antes de que responda el servidor
    const id = idCliente ?? randomUUID(), ahora = new Date();
    try { await col.insertOne({ _id: id, ...datos, estado: 'recibido', motivo: '', creado: ahora, actualizado: ahora }); } catch (e) {
      if ((e as { code?: number }).code === 11000) return json(res, 409, { error: 'Ese pedido ya estaba registrado.' });
      throw e;
    }
    return json(res, 201, { id, codigo: codigoCorto(id), estado: 'recibido' });
  }

  if (req.method === 'PATCH') {
    if (!await exigirAdmin(req, res)) return;
    const d = await leerJson(req, res, 2_000) as { id?: unknown; estado?: unknown; motivo?: unknown } | undefined;
    if (d === undefined) return;
    const id = typeof d?.id === 'string' && /^[a-f0-9-]{36}$/.test(d.id) ? d.id : '';
    const estado = ESTADOS.find((e) => e === d?.estado);
    const motivo = typeof d?.motivo === 'string' ? d.motivo.trim().slice(0, 120) : '';
    if (!id || !estado) return json(res, 400, { error: 'No se entendió qué hacer con el pedido.' });
    const actual = await col.findOne({ _id: id });
    if (!actual) return json(res, 404, { error: 'No encontramos ese pedido.' });
    if (!SIGUIENTES[actual.estado].includes(estado)) return json(res, 409, { error: `Este pedido ya está «${actual.estado}»: no se puede pasar a «${estado}».` });
    await col.updateOne({ _id: id, estado: actual.estado }, { $set: { estado, motivo: estado === 'rechazado' ? motivo : '', actualizado: new Date() } });
    await registrar(req, `pedido ${codigoCorto(id)}`, [{ campo: 'estado', antes: actual.estado, despues: estado }]);
    return json(res, 200, { ok: true, estado });
  }

  json(res, 405, { error: 'Este pedido no está permitido.' });
});
