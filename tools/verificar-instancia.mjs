// Prueba de humo de una instancia ya levantada (local o en Vercel):  node tools/verificar-instancia.mjs https://geacofi.com.ar
// Revisa que la web, la base, el panel y los encabezados de seguridad estén como corresponde. Sale con código 1 si algo falla.
const base = (process.argv[2] || '').replace(/\/$/, '');
if (!base) { console.error('Uso: node tools/verificar-instancia.mjs https://tu-sitio'); process.exit(1); }

const resultados = [];
const chequear = async (nombre, f) => {
  try { const r = await f(); resultados.push([nombre, r === true, r === true ? '' : String(r)]); } catch (e) { resultados.push([nombre, false, e.message]); }
};
const pedir = (ruta, opciones) => fetch(base + ruta, { signal: AbortSignal.timeout(15000), ...opciones });

await chequear('La portada responde 200', async () => (await pedir('/')).status === 200 || 'no responde 200');
await chequear('/api/salud: la función y la base responden', async () => { const r = await pedir('/api/salud'); return (r.status === 200 && (await r.json()).ok === true) || `estado ${r.status}`; });
await chequear('/api/contenido devuelve JSON', async () => { const r = await pedir('/api/contenido'); const j = await r.json(); return (r.status === 200 && typeof j === 'object') || `estado ${r.status}`; });
await chequear('El panel carga y no deja entrar sin sesión', async () => {
  if ((await pedir('/admin.html')).status !== 200) return '/admin.html no carga';
  const s = await (await pedir('/api/login')).json();
  if (!s.configurado) return 'El panel no está configurado (faltan ADMIN_PASSWORD_HASH / ADMIN_TOTP_SECRET)';
  if (s.sesion) return 'Hay sesión sin haber entrado';
  return (await pedir('/api/auditoria')).status === 401 || '/api/auditoria no pide sesión';
});
await chequear('2FA activo en el panel', async () => (await (await pedir('/api/login')).json()).segundoPaso === true || 'Falta ADMIN_TOTP_SECRET');
await chequear('Escribir sin sesión se rechaza', async () => [(await pedir('/api/contenido', { method: 'PUT', body: '{}' })).status, (await pedir('/api/foto', { method: 'POST', body: 'x' })).status].every((s) => s === 401 || s === 403) || 'una ruta de escritura acepta sin sesión');
await chequear('CSP en modo bloqueo (no solo reporte)', async () => {
  const h = (await pedir('/')).headers;
  return (/default-src 'self'/.test(h.get('content-security-policy') ?? '') && !/unsafe-inline.*script|script-src[^;]*unsafe-inline/.test(h.get('content-security-policy') ?? '')) || 'falta la CSP o permite scripts inline';
});
await chequear('Encabezados de seguridad', async () => {
  const h = (await pedir('/')).headers;
  const falta = ['x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy', 'strict-transport-security'].filter((n) => !h.get(n));
  return falta.length === 0 || `faltan: ${falta.join(', ')}`;
});
await chequear('security.txt publicado', async () => (await pedir('/.well-known/security.txt')).status === 200 || 'no está /.well-known/security.txt');
await chequear('CORS cerrado a otros sitios', async () => !(await pedir('/api/contenido', { headers: { Origin: 'https://sitio-malo.example' } })).headers.get('access-control-allow-origin') || 'la API acepta cualquier origen');

let fallos = 0;
for (const [nombre, ok, detalle] of resultados) { console.log(`${ok ? '✓' : '✗'} ${nombre}${ok ? '' : ` — ${detalle}`}`); if (!ok) fallos++; }
console.log(fallos ? `\n${fallos} control(es) fallaron en ${base}` : `\nTodo en orden en ${base}`);
process.exit(fallos ? 1 : 0);
