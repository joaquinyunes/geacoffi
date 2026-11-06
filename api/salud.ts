import { coleccion } from '../server/db.js';
import { json, ruta } from '../server/http.js';

// Para el monitor de uptime: 200 si la función y la base responden, 503 si no. No devuelve datos.
export default ruta(async (_req, res) => {
  try {
    await (await coleccion('contenido')).estimatedDocumentCount();
  } catch (e) {
    console.error(e);
    return json(res, 503, { ok: false });
  }
  json(res, 200, { ok: true });
});
