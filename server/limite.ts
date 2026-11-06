import { coleccion } from './db.js';

interface Fila { _id: string; n: number; vence: Date }

let indice: Promise<unknown> | undefined;
async function col() {
  const c = await coleccion<Fila>('limites');
  indice ??= c.createIndex({ vence: 1 }, { expireAfterSeconds: 3600 }).catch(() => { indice = undefined; }); // Mongo borra solo las filas viejas
  return c;
}

/** Cuenta un golpe más contra `clave` dentro de una ventana fija de `ventanaS` segundos; devuelve el total y cuánto falta para que se reinicie. Es atómico: sirve con varias instancias de la función. */
export async function sumar(clave: string, ventanaS: number): Promise<{ n: number; reintentoS: number }> {
  const ahora = new Date(), nueva = new Date(ahora.getTime() + ventanaS * 1000);
  const fila = await (await col()).findOneAndUpdate(
    { _id: clave },
    [{ $set: {
      n: { $cond: [{ $lt: ['$vence', ahora] }, 1, { $add: [{ $ifNull: ['$n', 0] }, 1] }] },
      vence: { $cond: [{ $lt: ['$vence', ahora] }, nueva, '$vence'] },
    } }],
    { upsert: true, returnDocument: 'after' },
  );
  return { n: fila!.n, reintentoS: Math.max(1, Math.ceil((fila!.vence.getTime() - ahora.getTime()) / 1000)) };
}

/** ¿Ya se pasó de `max` golpes? No suma. */
export async function bloqueado(clave: string, max: number): Promise<number> {
  const f = await (await col()).findOne({ _id: clave });
  return f && f.vence > new Date() && f.n >= max ? Math.max(1, Math.ceil((f.vence.getTime() - Date.now()) / 1000)) : 0;
}

/** Suma un golpe y devuelve 0 si todavía entra, o los segundos de espera si se pasó de `max`. */
export async function limitar(clave: string, max: number, ventanaS: number): Promise<number> {
  const { n, reintentoS } = await sumar(clave, ventanaS);
  return n > max ? reintentoS : 0;
}

export async function limpiar(clave: string) { await (await col()).deleteOne({ _id: clave }); }
