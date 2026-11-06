import { coleccion } from './db.js';
import { ip, type Req } from './http.js';

export interface Cambio { campo: string; antes: unknown; despues: unknown }

/** Campos que cambiaron entre dos valores (recorre objetos y listas; un máximo de 60 para no inflar el registro). */
export function diferencias(antes: unknown, despues: unknown, ruta = '', salida: Cambio[] = []): Cambio[] {
  if (salida.length >= 60) return salida;
  const objeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';
  if (objeto(antes) && objeto(despues)) {
    for (const k of new Set([...Object.keys(antes), ...Object.keys(despues)])) diferencias(antes[k], despues[k], ruta ? `${ruta}.${k}` : k, salida);
  } else if (JSON.stringify(antes) !== JSON.stringify(despues)) {
    salida.push({ campo: ruta, antes: recortar(antes), despues: recortar(despues) });
  }
  return salida;
}

const recortar = (v: unknown) => {
  const t = typeof v === 'string' ? v : v && typeof v === 'object' ? JSON.stringify(v) : undefined;
  return t !== undefined && t.length > 120 ? `${t.slice(0, 120)}…` : v;
};

interface Registro { fecha: Date; ip: string; accion: string; cambios: Cambio[] }

/** Anota quién (IP) cambió qué y cuándo. Solo se agrega: ninguna ruta de la API borra ni edita este registro. Para que ni siquiera el código pueda borrarlo, el usuario de la base debe tener un rol sin `remove` sobre `auditoria` (ver docs/SEGURIDAD.md). */
export async function registrar(req: Req, accion: string, cambios: Cambio[] = []) {
  await (await coleccion<Registro>('auditoria')).insertOne({ fecha: new Date(), ip: ip(req), accion, cambios });
}

export async function ultimos(n = 100) {
  return (await coleccion<Registro>('auditoria')).find({}, { projection: { _id: 0 } }).sort({ fecha: -1 }).limit(n).toArray();
}
