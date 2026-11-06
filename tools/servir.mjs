// Sirve lo ya construido (dist/) con los mismos encabezados de vercel.json y las funciones de api/, contra un Mongo descartable.
// Sirve para probar como producción: CSP, panel completo y peso real de la portada.
//   npm run build && node tools/servir.mjs            (puerto 4173; PUERTO=... para otro)
// Variables opcionales: ADMIN_PASSWORD (por defecto una de prueba), ADMIN_TOTP_SECRET, MONGODB_URI (si no, Mongo en memoria).
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createServer as crearVite } from 'vite';

const raiz = process.cwd(), dist = join(raiz, 'dist'), puerto = Number(process.env.PUERTO || 4173);
let mongo;
if (!process.env.MONGODB_URI) {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
}
process.env.MONGODB_DB ||= 'geacoffi-local';
process.env.ADMIN_PASSWORD ||= 'clave-de-prueba-larga';

const headers = JSON.parse(readFileSync(join(raiz, 'vercel.json'), 'utf8')).headers.find((h) => h.source === '/(.*)').headers;
const vite = await crearVite({ appType: 'custom', server: { middlewareMode: true }, logLevel: 'error' });
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const comprimible = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt']);

createServer(async (req, res) => {
  for (const { key, value } of headers) res.setHeader(key, value);
  const ruta = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const api = /^\/api\/(contenido|foto|login|pedido|auditoria|salud)$/.exec(ruta)?.[1];
  if (api) return (await vite.ssrLoadModule(`/api/${api}.ts`)).default(req, res);
  let archivo = normalize(join(dist, ruta === '/' ? 'index.html' : ruta));
  if (!archivo.startsWith(dist) || !existsSync(archivo) || statSync(archivo).isDirectory()) { res.statusCode = 404; return res.end('No encontrado'); }
  const ext = extname(archivo);
  res.setHeader('Content-Type', tipos[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', archivo.includes(`${join(dist, 'assets')}`) ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate');
  if (comprimible.has(ext) && /gzip/.test(req.headers['accept-encoding'] ?? '')) {
    res.setHeader('Content-Encoding', 'gzip');
    return res.end(gzipSync(readFileSync(archivo)));
  }
  createReadStream(archivo).pipe(res);
}).listen(puerto, () => console.log(`http://localhost:${puerto}  (panel: /admin.html · clave: ${process.env.ADMIN_PASSWORD})`));

process.on('SIGINT', async () => { await vite.close(); await mongo?.stop(); process.exit(0); });
