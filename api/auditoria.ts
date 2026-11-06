import { ultimos } from '../server/auditoria.js';
import { json, ruta } from '../server/http.js';
import { exigirAdmin } from '../server/sesion.js';

// Registro de cambios del panel: solo lectura, para la dueña. No hay forma de borrarlo desde la web.
export default ruta(async (req, res) => {
  if (req.method !== 'GET') return json(res, 405, { error: 'Este pedido no está permitido.' });
  if (!await exigirAdmin(req, res)) return;
  json(res, 200, await ultimos(100));
});
