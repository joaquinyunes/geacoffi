import { randomUUID } from 'node:crypto';
import { Binary } from 'mongodb';
import { coleccion } from '../server/db.js';
import { tipoDeImagen } from '../server/foto.js';
import { registrar } from '../server/auditoria.js';
import { ip, json, leerCuerpo, ruta } from '../server/http.js';
import { limitar } from '../server/limite.js';
import { exigirAdmin } from '../server/sesion.js';

interface Foto { _id: string; tipo: string; data: Binary; creado: Date }

const MAX_BYTES = 3_000_000, MAX_FOTOS = 500;

export default ruta(async (req, res) => {
  const col = await coleccion<Foto>('fotos');
  if (req.method === 'GET') {
    const id = new URL(req.url ?? '', 'http://x').searchParams.get('id') ?? '';
    const foto = /^[a-f0-9-]{36}$/.test(id) ? await col.findOne({ _id: id }) : null;
    if (!foto) return json(res, 404, { error: 'Esa foto no existe.' });
    res.statusCode = 200;
    res.setHeader('Content-Type', foto.tipo);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox"); // si alguien abre la foto sola, no ejecuta nada
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // cada foto nueva tiene id nuevo
    res.end(Buffer.from(foto.data.buffer));
    return;
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Este pedido no está permitido.' });
  if (!await exigirAdmin(req, res)) return;
  if (await limitar(`foto:${ip(req)}`, 40, 3600)) return json(res, 429, { error: 'Subiste muchas fotos seguidas. Esperá un rato y probá de nuevo.' });

  const bytes = await leerCuerpo(req, MAX_BYTES); // corta en 3 MB: el 413 lo responde `ruta`
  const tipo = tipoDeImagen(bytes);
  if (!tipo) return json(res, 400, { error: 'Ese archivo no es una foto válida. Subí un JPG, PNG o WebP.' });
  if (await col.estimatedDocumentCount() >= MAX_FOTOS) return json(res, 507, { error: 'Se llenó el espacio de fotos. Avisá a quien mantiene la web.' });
  const id = randomUUID();
  await col.insertOne({ _id: id, tipo, data: new Binary(bytes), creado: new Date() });
  await registrar(req, 'subió una foto', [{ campo: 'foto', antes: null, despues: id }]);
  const proto = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'; // Vercel/Render avisan por este encabezado; en local es http
  json(res, 201, { url: `${proto}://${req.headers.host}/api/foto?id=${id}` });
});
