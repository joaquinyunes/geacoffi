import { limitar } from './limite.js';

/** Avisa de un error del servidor a una URL tipo ntfy.sh (ALERTA_URL, ej. https://ntfy.sh/geacofi-<algo-largo-y-secreto>): se instala la app ntfy en el celular y se suscribe a ese tema; no hace falta cuenta. Sin la variable no hace nada. Máximo un aviso cada 10 minutos por ruta, y solo se manda el nombre del error y la ruta (nunca datos de clientes). */
export async function alertar(ruta: string, error: unknown) {
  const destino = process.env.ALERTA_URL;
  if (!destino || !/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(destino)) return; // http solo para probar en local
  try {
    if (await limitar(`alerta:${ruta}`, 1, 600)) return;
    const nombre = error instanceof Error ? error.name : 'Error';
    await fetch(destino, { method: 'POST', headers: { Title: 'GeaCofi: error del servidor', Priority: 'high' }, body: `${nombre} en ${ruta}`, signal: AbortSignal.timeout(3000) });
  } catch { /* avisar es un extra: si falla, no tumba la respuesta */ }
}
