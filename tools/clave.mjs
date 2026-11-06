// Prepara el acceso al panel: genera el hash de la contraseña y el secreto del 2FA (código de 6 números en el celular).
//   node tools/clave.mjs            (te pide la contraseña)      ·      CLAVE=... node tools/clave.mjs
// Copiá los valores que imprime a Vercel (Environment Variables); la contraseña en sí no se guarda en ningún lado.
import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32(bytes) {
  let bits = 0, valor = 0, salida = '';
  for (const b of bytes) { valor = (valor << 8) | b; bits += 8; while (bits >= 5) { salida += ABC[(valor >>> (bits - 5)) & 31]; bits -= 5; } }
  return bits ? salida + ABC[(valor << (5 - bits)) & 31] : salida;
}

let clave = process.env.CLAVE;
if (!clave) { const rl = createInterface({ input: process.stdin, output: process.stdout }); clave = await rl.question('Contraseña nueva del panel (mínimo 12 caracteres): '); rl.close(); }
if (clave.length < 12) { console.error('La contraseña tiene que tener al menos 12 caracteres.'); process.exit(1); }

const sal = randomBytes(16), secreto = base32(randomBytes(20));
console.log(`
ADMIN_PASSWORD_HASH=scrypt$${sal.toString('base64')}$${scryptSync(clave, sal, 32).toString('base64')}
ADMIN_TOTP_SECRET=${secreto}

Segundo paso: en Google Authenticator / Authy / Microsoft Authenticator elegí "Agregar manualmente" (clave de tiempo) y pegá ADMIN_TOTP_SECRET.
O abrí este enlace desde el celular: otpauth://totp/GeaCofi%20Panel?secret=${secreto}&issuer=GeaCofi
No pongas ADMIN_PASSWORD si usás ADMIN_PASSWORD_HASH.`);
