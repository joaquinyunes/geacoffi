import { ip, json, leerJson, ruta } from '../server/http.js';
import { bloqueado, limpiar, sumar } from '../server/limite.js';
import { registrar } from '../server/auditoria.js';
import { abrirSesion, cerrarSesion, claveCorrecta, estadoConfig, exigirAdmin, hayAdmin, segundoPasoCorrecto } from '../server/sesion.js';

const INTENTOS = 5, GLOBAL = 30, VENTANA_S = 900;
const espera = (s: number) => `Demasiados intentos. Esperá ${Math.ceil(s / 60)} minuto${s > 60 ? 's' : ''} y probá de nuevo.`;

// Entrada al panel. GET: ¿hay sesión? · POST: entrar con clave (y código del celular) · DELETE: salir (?todas=1 cierra todos los dispositivos)
export default ruta(async (req, res) => {
  if (req.method === 'GET') {
    const config = estadoConfig();
    return json(res, 200, { sesion: config === 'ok' && await hayAdmin(req), segundoPaso: Boolean(process.env.ADMIN_TOTP_SECRET), configurado: config === 'ok' });
  }
  if (req.method === 'DELETE') {
    if (!await exigirAdmin(req, res)) return;
    const todas = new URL(req.url ?? '', 'http://x').searchParams.get('todas') === '1';
    await registrar(req, todas ? 'cerró sesión en todos los dispositivos' : 'cerró sesión');
    await cerrarSesion(req, res, todas);
    return json(res, 200, { ok: true });
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Este pedido no está permitido.' });
  if (req.headers['x-gc'] !== '1') return json(res, 403, { error: 'Pedido no permitido. Recargá la página.' });
  if (estadoConfig() !== 'ok') return json(res, 503, { error: 'El panel todavía no está configurado. Avisá a quien instaló la web.' });

  // Bloqueo temporal: por IP y, aparte, un tope general para ataques repartidos entre muchas IPs.
  const claveIp = `login:${ip(req)}`;
  const bloqueo = Math.max(await bloqueado(claveIp, INTENTOS), await bloqueado('login:global', GLOBAL));
  if (bloqueo) { res.setHeader('Retry-After', bloqueo); return json(res, 429, { error: espera(bloqueo) }); }

  const cuerpo = await leerJson(req, res, 2_000);
  if (cuerpo === undefined) return;
  const { clave, codigo } = (cuerpo ?? {}) as { clave?: unknown; codigo?: unknown };
  const bien = typeof clave === 'string' && claveCorrecta(clave) && await segundoPasoCorrecto(typeof codigo === 'string' ? codigo.trim() : '');
  if (!bien) {
    await Promise.all([sumar(claveIp, VENTANA_S), sumar('login:global', VENTANA_S)]);
    await new Promise(r => setTimeout(r, 700)); // frena un poco los intentos al azar
    return json(res, 401, { error: process.env.ADMIN_TOTP_SECRET ? 'La contraseña o el código no coinciden.' : 'La contraseña no es correcta.' });
  }
  await limpiar(claveIp);
  await abrirSesion(req, res);
  await registrar(req, 'entró al panel');
  json(res, 200, { ok: true });
});
