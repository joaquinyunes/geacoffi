# Rendimiento en celular (WP-42)

Medido en el navegador integrado a 375 px, sobre `vite build` + `vite preview` local, recarga y 10 s de espera sin hacer scroll.
Bytes = suma de `encodedBodySize` de `performance.getEntriesByType('resource')` (JS ya comprimido por el servidor de preview).
Los tiempos de carga en localhost (~0,2 s) **no representan** una red de celular: el criterio fiable es el peso.

## Antes / después (portada `/`)

| | Antes | Después |
|---|---|---|
| Pedidos | 16 | 18 |
| Bytes primera carga | 7,0 MB | 0,87 MB |
| Imágenes de los planos WebGL | 10 JPG, 6,8 MB | 10 WebP, 0,7 MB |
| Fotogramas de la secuencia (`/frames`) | 150 WebP (7,6 MB) pedidos al terminar el preloader | se piden al acercarse a `#ai`; en celular 1 de cada 3 (~61 archivos, ~3 MB); con `saveData` 1 de cada 10 |
| `detalles.html` | — | 13 pedidos, 312 KB |

## Qué cambió

- `index.html` y `detalles.html`: `data-src` apunta a los `.webp` que ya existían en `public/studio` (antes cargaba los `.jpg` de ~750 KB c/u).
- `main.js`: `loadSequence()` ya no arranca tras el preloader; lo dispara un `IntersectionObserver` sobre `#ai` con margen de una pantalla. En celular (`innerWidth < 768`) o con `navigator.connection.saveData` salta fotogramas (`seqNearest` ya dibuja el más cercano).
- Se mantiene el 3D (three.js + plano WebGL): el aparato sin WebGL ya caía a fondos CSS.

## Activos más pesados (antes)

1. `public/studio/*.jpg` (10 × 0,67–0,83 MB) — cargados como textura al arrancar.
2. `public/frames/*.webp` (150 × ~50–87 KB = 7,6 MB).
3. `dist/assets/main-*.js` 632 KB (172 KB gzip): three + gsap.
4. `public/img/*.png` (1,4–1,7 MB c/u): solo `src/data/products.ts`; las páginas HTML ya usan sus `.webp`.

## No hecho / no verificado

- Dividir el JS (three.js sigue en el chunk principal, 172 KB gzip): `main.js` usa `THREE` en todo el archivo; cargarlo bajo demanda exige reestructurarlo.
- Los `.jpg`/`.png` de `public/` quedan sin usar en el código de las páginas; no los borré (requiere tu permiso y se publican en `dist`).
- Fuentes: ya vienen de Google Fonts con `display=swap` y subconjunto latino; no se tocaron.
- Sin throttling de red ni dispositivo real: no pude confirmar "< 3 s" en un celular; por bytes (0,87 MB) debería cumplirlo.

## Re-medición del 08/11/2026 (G6) — build de `integracion` con las ramas fusionadas
Mismo método (navegador integrado a 375 px, `vite build` servido con `tools/servir.mjs`, que aplica gzip y los mismos encabezados que Vercel, CSP en modo bloqueo, 9 s sin hacer scroll):

| Página | Pedidos | Bytes (encodedBodySize) | Resultado |
|---|---|---|---|
| Portada `/` (celular) | 16 | **858.078 B = 0,82 MiB** (JS principal 171.599 B gzip + 10 imágenes WebP de los planos) | ✅ **< 1 MB** |
| `/admin.html` (panel, con sesión) | 14 | 176.842 B | ✅ |
| Carga en localhost | — | DOMContentLoaded 310 ms · load 487 ms | no representa una red de celular |

- La CSP en bloqueo no cambió el peso ni rompió el 3D: portada, detalles, carta y armar sin violaciones; el scroll 3D se ve igual.
- **No medido:** tiempo en producción real y en red de celular. El deploy de Vercel que existe (`geacoffi`) sigue en el primer commit; hasta que el usuario cargue las variables y redeploye (G7) no hay URL de producción con esta versión. Cuando exista: `node tools/verificar-instancia.mjs <url>` y repetir esta tabla con DevTools en «Slow 4G». FCP/LCP no los expone el navegador integrado.
- Los fotogramas de `#ai` (~61 archivos, ~3 MB en celular) se piden al acercarse a esa sección: no se re-midieron.
