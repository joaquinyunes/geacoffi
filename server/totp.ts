import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32(bytes: Uint8Array): string {
  let bits = 0, valor = 0, salida = '';
  for (const b of bytes) {
    valor = (valor << 8) | b; bits += 8;
    while (bits >= 5) { salida += ABC[(valor >>> (bits - 5)) & 31]; bits -= 5; }
  }
  return bits ? salida + ABC[(valor << (5 - bits)) & 31] : salida;
}

function desdeBase32(s: string): Buffer {
  let bits = 0, valor = 0;
  const salida: number[] = [];
  for (const c of s.toUpperCase().replace(/[\s=-]/g, '')) {
    const i = ABC.indexOf(c);
    if (i < 0) throw new Error('Secreto TOTP inválido');
    valor = (valor << 5) | i; bits += 5;
    if (bits >= 8) { salida.push((valor >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(salida);
}

export const nuevoSecreto = () => base32(randomBytes(20));

/** Código TOTP (RFC 6238, SHA-1, 30 s) de `secreto` en el instante `ms`. */
export function codigo(secreto: string, ms = Date.now(), digitos = 6): string {
  const paso = Buffer.alloc(8);
  paso.writeBigUInt64BE(BigInt(Math.floor(ms / 30_000)));
  const h = createHmac('sha1', desdeBase32(secreto)).update(paso).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 10 ** digitos).padStart(digitos, '0');
}

/** Paso de 30 s que acepta el código dado (tolera ±1 paso por relojes desfasados), o null. */
export function pasoValido(secreto: string, dado: string, ms = Date.now()): number | null {
  if (!/^\d{6}$/.test(dado)) return null;
  for (const d of [0, -1, 1]) {
    const t = ms + d * 30_000;
    const bueno = Buffer.from(codigo(secreto, t)), probado = Buffer.from(dado);
    if (timingSafeEqual(bueno, probado)) return Math.floor(t / 30_000);
  }
  return null;
}
