import { execFileSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { diferencias } from './auditoria';
import { base32, codigo, nuevoSecreto, pasoValido } from './totp';
import { claveCorrecta, hashClave } from './sesion';
import { CLAVE, entrar, levantar } from './prueba';

// Vector oficial de la RFC 6238 (secreto "12345678901234567890", t = 59 s, SHA-1): 8 dígitos 94287082 → 6 dígitos 287082.
const RFC = base32(Buffer.from('12345678901234567890'));

describe('2FA (TOTP)', () => {
  it('coincide con el vector de la RFC 6238 y tolera un paso de desfase', () => {
    expect(codigo(RFC, 59_000)).toBe('287082');
    expect(pasoValido(RFC, '287082', 59_000)).toBe(1);
    expect(pasoValido(RFC, '287082', 59_000 + 30_000)).toBe(1); // reloj atrasado 30 s
    expect(pasoValido(RFC, '287082', 59_000 + 120_000)).toBeNull();
    expect(pasoValido(RFC, '12345', 59_000)).toBeNull();
    expect(pasoValido(RFC, 'abcdef', 59_000)).toBeNull();
  });
  it('genera secretos distintos y válidos', () => {
    const a = nuevoSecreto();
    expect(a).toMatch(/^[A-Z2-7]{32}$/);
    expect(a).not.toBe(nuevoSecreto());
    expect(codigo(a)).toMatch(/^\d{6}$/);
  });
});

describe('contraseña con hash', () => {
  it('scrypt verifica la clave y no la guarda en claro', () => {
    const h = hashClave('una-clave-bien-larga');
    expect(h).toMatch(/^scrypt\$/);
    expect(h).not.toContain('una-clave');
    process.env.ADMIN_PASSWORD_HASH = h;
    expect(claveCorrecta('una-clave-bien-larga')).toBe(true);
    expect(claveCorrecta('otra')).toBe(false);
    delete process.env.ADMIN_PASSWORD_HASH;
  });
});

describe('tools/clave.mjs', () => {
  it('imprime un hash y un secreto 2FA que el servidor acepta', () => {
    const salida = execFileSync('node', ['tools/clave.mjs'], { env: { ...process.env, CLAVE: 'otra-clave-bien-larga' }, encoding: 'utf8' });
    const hash = /ADMIN_PASSWORD_HASH=(\S+)/.exec(salida)![1], secreto = /ADMIN_TOTP_SECRET=(\S+)/.exec(salida)![1];
    process.env.ADMIN_PASSWORD_HASH = hash;
    expect(claveCorrecta('otra-clave-bien-larga')).toBe(true);
    expect(claveCorrecta('otra-clave-bien-larg')).toBe(false);
    delete process.env.ADMIN_PASSWORD_HASH;
    expect(codigo(secreto)).toMatch(/^\d{6}$/);
    expect(() => execFileSync('node', ['tools/clave.mjs'], { env: { ...process.env, CLAVE: 'corta' }, stdio: 'pipe' })).toThrow();
  });
});

describe('registro de cambios', () => {
  it('diferencias lista solo lo que cambió y recorta textos largos', () => {
    expect(diferencias({ a: 1, b: { c: 'x' } }, { a: 1, b: { c: 'y' } }, 'sec')).toEqual([{ campo: 'sec.b.c', antes: 'x', despues: 'y' }]);
    expect(diferencias(null, { a: 1 }, 'sec')).toEqual([{ campo: 'sec', antes: null, despues: { a: 1 } }]);
    expect(diferencias({ a: 1 }, { a: 1 })).toEqual([]);
    expect(diferencias({ t: 'a' }, { t: 'x'.repeat(500) })[0].despues).toHaveLength(121);
  });
});

describe('login del panel', () => {
  let base: string, cerrar: () => Promise<void>;
  beforeAll(async () => { vi.useFakeTimers({ toFake: ['Date'] }); ({ base, cerrar } = await levantar({ ADMIN_TOTP_SECRET: RFC })); });
  afterAll(async () => { vi.useRealTimers(); await cerrar(); });
  // cada código vale una sola vez: antes de pedir uno nuevo se avanza el reloj al paso siguiente
  const nuevo = () => { vi.setSystemTime(Date.now() + 30_000); return codigo(RFC); };

  const post = (cuerpo: unknown, ip: string, extra: Record<string, string> = {}) =>
    fetch(`${base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-gc': '1', 'x-real-ip': ip, ...extra }, body: JSON.stringify(cuerpo) });

  it('con 2FA activo la clave sola no alcanza, y el código correcto abre una sesión con cookie segura', async () => {
    expect((await post({ clave: CLAVE }, '1.1.1.1')).status).toBe(401);
    expect((await post({ clave: CLAVE, codigo: '000000' }, '1.1.1.1')).status).toBe(401);
    const r = await post({ clave: CLAVE, codigo: nuevo() }, '1.1.1.1', { 'x-forwarded-proto': 'https' });
    expect(r.status).toBe(200);
    const c = r.headers.get('set-cookie')!;
    expect(c).toMatch(/^gc_sesion=[\w-]{40,}/);
    for (const parte of ['HttpOnly', 'SameSite=Lax', 'Secure', 'Max-Age=43200', 'Path=/']) expect(c).toContain(parte);
    const estado = await (await fetch(`${base}/api/login`, { headers: { cookie: c.split(';')[0] } })).json();
    expect(estado).toEqual({ sesion: true, segundoPaso: true, configurado: true });
    expect((await (await fetch(`${base}/api/login`)).json()).sesion).toBe(false);
  });

  it('un código ya usado no vale dos veces', async () => {
    const usado = nuevo();
    expect((await post({ clave: CLAVE, codigo: usado }, '2.2.2.2')).status).toBe(200);
    expect((await post({ clave: CLAVE, codigo: usado }, '2.2.2.2')).status).toBe(401);
  });

  it('tras 5 intentos fallidos bloquea esa IP con 429 y Retry-After, aunque después llegue la clave buena', async () => {
    for (let i = 0; i < 5; i++) expect((await post({ clave: 'mal', codigo: '000000' }, '3.3.3.3')).status).toBe(401);
    const r = await post({ clave: CLAVE, codigo: nuevo() }, '3.3.3.3');
    expect(r.status).toBe(429);
    expect(Number(r.headers.get('retry-after'))).toBeGreaterThan(0);
    expect((await r.json()).error).toMatch(/minuto/);
    expect((await post({ clave: CLAVE, codigo: nuevo() }, '4.4.4.4')).status).toBe(200); // otra IP no se ve afectada
  }, 15_000);

  it('sin x-gc se rechaza, y salir de todos los dispositivos invalida las demás sesiones', async () => {
    expect((await fetch(`${base}/api/login`, { method: 'POST', body: '{}' })).status).toBe(403);
    const a = await entrar(base, '5.5.5.5', nuevo());
    const b = await entrar(base, '5.5.5.6', nuevo());
    expect((await fetch(`${base}/api/auditoria`, { headers: b })).status).toBe(200);
    expect((await fetch(`${base}/api/login?todas=1`, { method: 'DELETE', headers: a })).status).toBe(200);
    expect((await fetch(`${base}/api/auditoria`, { headers: a })).status).toBe(401);
    expect((await fetch(`${base}/api/auditoria`, { headers: b })).status).toBe(401);
  }, 15_000);
});

describe('configuración insegura', () => {
  let base: string, cerrar: () => Promise<void>;
  beforeAll(async () => { ({ base, cerrar } = await levantar({ ADMIN_PASSWORD: 'corta123' })); });
  afterAll(() => cerrar());
  it('una clave de menos de 12 caracteres no deja entrar', async () => {
    const r = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'x-gc': '1', 'content-type': 'application/json' }, body: JSON.stringify({ clave: 'corta123' }) });
    expect(r.status).toBe(503);
  });
});
