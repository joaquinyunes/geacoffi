import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { contenidoValido, errorDeContenido, tipoDeImagen } from './foto';
import { entrar, levantar } from './prueba';

let base: string, cerrar: () => Promise<void>, admin: Record<string, string>;

beforeAll(async () => {
  ({ base, cerrar } = await levantar());
  admin = await entrar(base);
});
afterAll(() => cerrar());

const put = (cuerpo: unknown, headers: Record<string, string> = admin) =>
  fetch(`${base}/api/contenido`, { method: 'PUT', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(cuerpo) });

describe('contenido editable en MongoDB', () => {
  it('sin guardar nada la web recibe un objeto vacío (y usa lo de negocio.js)', async () => {
    const r = await fetch(`${base}/api/contenido`);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({});
  });

  it('guardar exige sesión del panel (y el encabezado x-gc contra CSRF)', async () => {
    expect((await put({ negocio: { telefono: '1' } }, { 'x-gc': '1' })).status).toBe(401);
    expect((await put({ negocio: { telefono: '1' } }, { cookie: 'gc_sesion=inventada', 'x-gc': '1' })).status).toBe(401);
    expect((await put({ negocio: { telefono: '1' } }, { cookie: admin.cookie })).status).toBe(403); // cookie buena pero sin x-gc: como un formulario de otro sitio
  });

  it('lo guardado se lee igual, y guardar de nuevo pisa solo esa sección', async () => {
    expect((await put({ negocio: { telefono: '3794000000' }, eventos: [{ fecha: '2026-11-01', titulo: 'Tarde de mates' }] })).status).toBe(200);
    expect((await put({ negocio: { telefono: '3794111111' } })).status).toBe(200);
    const c = await (await fetch(`${base}/api/contenido`)).json();
    expect(c.negocio.telefono).toBe('3794111111');
    expect(c.eventos).toEqual([{ fecha: '2026-11-01', titulo: 'Tarde de mates' }]);
  });

  it('rechaza claves desconocidas, JSON roto y listas enormes, siempre con un mensaje en castellano', async () => {
    for (const mala of [{ hack: { a: 1 } }, {}, { visitas: Array.from({ length: 201 }, () => ({})) }]) {
      const r = await put(mala);
      expect(r.status).toBe(400);
      expect((await r.json()).error).toMatch(/[a-záéíóú]{4}/i);
    }
    const roto = await fetch(`${base}/api/contenido`, { method: 'PUT', headers: { ...admin }, body: '{no es json' });
    expect(roto.status).toBe(400);
    expect(await roto.json()).toEqual({ error: expect.not.stringMatching(/JSON|SyntaxError|Unexpected/) });
  });

  it('rechaza operadores de Mongo ($, .) en cualquier nivel y valores fuera de rango', () => {
    expect(errorDeContenido({ negocio: { $where: '1' } })).toBeTruthy();
    expect(errorDeContenido({ productos: { cafe: { nombre: 'x', precio: { $gt: 0 } } } })).toBeTruthy();
    expect(errorDeContenido({ negocio: { 'a.b': 1 } })).toBeTruthy();
    expect(errorDeContenido({ productos: { cafe: { precio: -5 } } })).toMatch(/precio/);
    expect(errorDeContenido({ negocio: { telefono: '+54 9 351' } })).toMatch(/WhatsApp/);
    expect(errorDeContenido({ eventos: [{ fecha: '2026-13-45', titulo: 'x' }] })).toMatch(/fecha/);
    expect(errorDeContenido({ visitas: [{ src: 'https://malo.example/x.png' }] })).toMatch(/foto/);
    expect(errorDeContenido({ visitas: [{ src: 'javascript:alert(1)' }] })).toMatch(/foto/);
  });

  it('contenidoValido solo acepta secciones conocidas', () => {
    expect(contenidoValido({ negocio: {}, productos: {} })).toBe(true);
    expect(contenidoValido({ negocio: 'texto' })).toBe(false);
    expect(contenidoValido([])).toBe(false);
    expect(contenidoValido(null)).toBe(false);
  });

  it('cada cambio queda en el registro de auditoría, que solo se puede leer', async () => {
    await put({ productos: { medialuna: { nombre: 'Medialuna', precio: 900 } } });
    await put({ productos: { medialuna: { nombre: 'Medialuna', precio: 1100 } } });
    const reg = await (await fetch(`${base}/api/auditoria`, { headers: admin })).json();
    const cambio = reg.flatMap((r: { cambios: { campo: string; antes: unknown; despues: unknown }[] }) => r.cambios).find((c: { campo: string; antes: unknown }) => c.campo === 'productos.medialuna.precio' && c.antes === 900);
    expect(cambio).toMatchObject({ despues: 1100 });
    expect(reg.some((r: { accion: string }) => r.accion === 'entró al panel')).toBe(true);
    expect((await fetch(`${base}/api/auditoria`, { method: 'DELETE', headers: admin })).status).toBe(405);
    expect((await fetch(`${base}/api/auditoria`)).status).toBe(401);
  });
});

describe('fotos', () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const sube = (cuerpo: BodyInit, headers: Record<string, string> = admin) => fetch(`${base}/api/foto`, { method: 'POST', headers, body: cuerpo });

  it('la url de la foto usa el protocolo real del pedido (http en local, https detrás del proxy de Vercel)', async () => {
    expect(new URL((await (await sube(png)).json()).url).protocol).toBe('http:');
    expect(new URL((await (await sube(png, { ...admin, 'x-forwarded-proto': 'https' })).json()).url).protocol).toBe('https:');
  });

  it('sube una foto real y la devuelve sin permitir que ejecute nada', async () => {
    expect(tipoDeImagen(png)).toBe('image/png');
    const r = await sube(png);
    expect(r.status).toBe(201);
    const { url } = await r.json();
    const lee = await fetch(`${base}/api/foto?id=${new URL(url).searchParams.get('id')}`);
    expect(lee.status).toBe(200);
    expect(lee.headers.get('content-type')).toBe('image/png');
    expect(lee.headers.get('x-content-type-options')).toBe('nosniff');
    expect(lee.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(new Uint8Array(await lee.arrayBuffer())).toEqual(png);
  });

  it('el tipo se decide por los bytes: un SVG, un HTML o un .exe disfrazados de imagen se rechazan', async () => {
    for (const falso of ['no soy una imagen', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', '<html><script>alert(1)</script>', 'MZ\x90\x00 programa']) {
      const r = await sube(falso, { ...admin, 'content-type': 'image/png' });
      expect(r.status).toBe(400);
      expect((await r.json()).error).toMatch(/JPG, PNG o WebP/);
    }
    const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    expect(tipoDeImagen(jpg)).toBe('image/jpeg');
    expect(tipoDeImagen(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp');
    expect(tipoDeImagen(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(null); // firma PNG incompleta
  });

  it('corta en 3 MB y exige sesión', async () => {
    const grande = new Uint8Array(3_000_001); grande.set(png);
    const r = await sube(grande);
    expect(r.status).toBe(413);
    expect((await r.json()).error).toMatch(/demasiado grande/);
    expect((await sube(png, {})).status).toBe(403);
    expect((await sube(png, { 'x-gc': '1' })).status).toBe(401);
  });
});
