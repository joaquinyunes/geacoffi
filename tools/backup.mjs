// Respaldo de la base:  MONGODB_URI=... BACKUP_CLAVE=... node tools/backup.mjs [carpeta]
// Sin BACKUP_CLAVE el archivo queda SIN cifrar (tiene datos de clientes: no lo subas a ningún lado así).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hacerRespaldo } from './respaldo-lib.mjs';

const { MONGODB_URI, MONGODB_DB = 'geacoffi', BACKUP_CLAVE } = process.env;
if (!MONGODB_URI) { console.error('Falta MONGODB_URI.'); process.exit(1); }
if (process.env.CI && !BACKUP_CLAVE) { console.error('En CI el respaldo tiene que ir cifrado: falta el secreto BACKUP_CLAVE.'); process.exit(1); }

const carpeta = process.argv[2] || 'respaldos';
mkdirSync(carpeta, { recursive: true });
const archivo = join(carpeta, `${MONGODB_DB}-${new Date().toISOString().slice(0, 10)}${BACKUP_CLAVE ? '.cifrado' : ''}.json.gz`);
const datos = await hacerRespaldo(MONGODB_URI, MONGODB_DB, BACKUP_CLAVE);
writeFileSync(archivo, datos);
console.log(`Respaldo guardado: ${archivo} (${(datos.length / 1024).toFixed(1)} KB${BACKUP_CLAVE ? ', cifrado' : ', SIN cifrar'})`);
