// Restaura un respaldo en una base:  MONGODB_URI=... [MONGODB_DB=geacoffi-restaurada] [BACKUP_CLAVE=...] node tools/restaurar.mjs archivo [--forzar]
// Probá siempre primero en una base nueva y después cambiá MONGODB_DB en Vercel.
import { readFileSync } from 'node:fs';
import { restaurar } from './respaldo-lib.mjs';

const [archivo, ...banderas] = process.argv.slice(2);
const { MONGODB_URI, MONGODB_DB = 'geacoffi-restaurada', BACKUP_CLAVE } = process.env;
if (!archivo || !MONGODB_URI) { console.error('Uso: MONGODB_URI=... node tools/restaurar.mjs archivo [--forzar]'); process.exit(1); }
try {
  const r = await restaurar(readFileSync(archivo), MONGODB_URI, MONGODB_DB, { clave: BACKUP_CLAVE, forzar: banderas.includes('--forzar') });
  console.log(`Restaurado en "${MONGODB_DB}" (respaldo del ${r.fecha}):`, r.colecciones);
} catch (e) { console.error(e.message); process.exit(1); }
