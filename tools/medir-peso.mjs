// Mide peso y tiempos de una página en un celular simulado (375 px, red «Slow 4G», CPU 4x más lenta).
//   node tools/medir-peso.mjs https://tu-sitio.com/ [segundos de espera, por defecto 10] [--scroll]
// Usa Edge o Chrome sin pantalla (variable NAVEGADOR si no los encuentra). No instala nada.
// Devuelve: pedidos, bytes transferidos (comprimidos), FCP, LCP y carga. Criterio del plan: portada < 1 MB.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.argv[2];
const espera = Number(process.argv[3] || 10) * 1000;
const conScroll = process.argv.includes('--scroll'); // además baja por toda la página con el dedo, como una persona
if (!url) { console.error('Uso: node tools/medir-peso.mjs <url> [segundos] [--scroll]'); process.exit(1); }

const candidatos = [process.env.NAVEGADOR, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const exe = candidatos.find((p) => existsSync(p));
if (!exe) { console.error('No encontré Edge ni Chrome. Indicalo con NAVEGADOR=ruta.'); process.exit(1); }

const puerto = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(exe, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${puerto}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'medir-'))}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const cerrar = () => { try { proc.kill(); } catch { /* ya cerró */ } };
process.on('exit', cerrar);

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50 && !ws; i++) {
  try {
    const paginas = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json();
    const p = paginas.find((x) => x.type === 'page');
    if (p) ws = new WebSocket(p.webSocketDebuggerUrl);
  } catch { await pausa(200); }
}
if (!ws) { console.error('No pude conectarme al navegador.'); cerrar(); process.exit(1); }
await new Promise((ok) => ws.addEventListener('open', ok, { once: true }));

let n = 0; const pendientes = new Map(); const eventos = [];
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pendientes.has(d.id)) { pendientes.get(d.id)(d.result ?? d.error); pendientes.delete(d.id); } else if (d.method) eventos.push(d);
});
const cdp = (method, params = {}) => new Promise((ok) => { const id = ++n; pendientes.set(id, ok); ws.send(JSON.stringify({ id, method, params })); });

await cdp('Network.enable');
await cdp('Page.enable');
await cdp('Network.setCacheDisabled', { cacheDisabled: true });
await cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
await cdp('Emulation.setCPUThrottlingRate', { rate: 4 });
// Slow 4G de Lighthouse: 1,6 Mbit/s bajada, 150 ms de latencia
await cdp('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.__m = { lcp: 0 };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });` });

const t0 = Date.now();
await cdp('Page.navigate', { url });
await pausa(espera);
if (conScroll) {
  for (let i = 0; i < 12; i++) { await cdp('Input.synthesizeScrollGesture', { x: 180, y: 600, yDistance: -900, gestureSourceType: 'touch', speed: 2500 }); await pausa(400); }
  await pausa(8000);
}

const bytes = new Map();
for (const e of eventos) if (e.method === 'Network.loadingFinished') bytes.set(e.params.requestId, e.params.encodedDataLength);
const total = [...bytes.values()].reduce((s, b) => s + b, 0);
const urls = new Map(eventos.filter((e) => e.method === 'Network.requestWillBeSent').map((e) => [e.params.requestId, e.params.request.url]));
const grupos = {};
for (const [id, b] of bytes) { const u = new URL(urls.get(id) ?? 'http://x/otro'); const g = u.pathname.split('/')[1] || 'raiz'; const k = g.includes('.') ? 'html' : g; grupos[k] ??= { pedidos: 0, bytes: 0 }; grupos[k].pedidos++; grupos[k].bytes += b; }
const r = await cdp('Runtime.evaluate', { returnByValue: true, expression: `JSON.stringify({ lcp: Math.round(window.__m?.lcp || 0), fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0), carga: Math.round(performance.getEntriesByType('navigation')[0]?.loadEventEnd || 0), ancho: innerWidth })` });
const m = JSON.parse(r.result.value);
cerrar();

console.log(JSON.stringify({ url, pedidos: bytes.size, bytes: total, mib: Number((total / 1048576).toFixed(2)), lcp_ms: m.lcp, fcp_ms: m.fcp, carga_ms: m.carga, ancho: m.ancho, red: 'Slow 4G simulada, CPU 4x', esperaS: (Date.now() - t0) / 1000, porCarpeta: grupos }, null, 2));
console.log(total < 1_000_000 ? '✓ portada < 1 MB' : '✗ la portada pasa de 1 MB');
process.exit(0);
