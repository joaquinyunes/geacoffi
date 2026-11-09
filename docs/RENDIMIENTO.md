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

## Re-medición del 09/11/2026 (G6) — con `tools/medir-peso.mjs`
**Corrección de la medición del 08/11:** esa vez se midió en el navegador integrado, que no dispara el `IntersectionObserver`, y dio 0,82 MiB. Con un Edge real en modo celular los **fotogramas de `#ai` se pedían en la carga** (la sección empieza justo en el borde de la primera pantalla, y el margen de «una pantalla» la daba por visible): la portada pesaba **2,0–2,3 MiB y 38–46 pedidos**, no 0,87 MiB. Se arregló en `main.js` (ahora se piden al primer gesto de scroll/teclado o cuando `#ai` entra de verdad en pantalla; el look 3D no cambia).

Script repetible (Edge/Chrome sin pantalla por DevTools; no instala nada): `node tools/medir-peso.mjs <url> [segundos] [--scroll]`. Simula 375 px, DPR 2, **Slow 4G (1,6 Mbit/s, 150 ms) y CPU 4× más lenta**, sin caché. Medido contra `tools/servir.mjs` (gzip y encabezados como Vercel):

| Escenario | Pedidos | Bytes transferidos | LCP / FCP | Carga (evento load) |
|---|---|---|---|---|
| **Antes del arreglo**, portada sin tocar nada, 15 s | 38–46 | 1,81–2,20 MiB (1,37 MB en 27 fotogramas) | 1,4–1,7 s | 6,4–8,0 s |
| **Después**, portada sin tocar nada, 15 s | **19** | **934.186 B = 0,89 MiB (< 1 MB)** | **1,05 s** | 8,4 s |
| Después, con scroll por la página (una corrida) | 80 | 3,88 MiB (61 fotogramas = 3,13 MB) | — | — |
| `/admin.html` con sesión (navegador integrado) | 14 | 176.842 B | — | — |

- La portada (lo que baja sin que la persona haga nada) queda **bajo 1 MB**. Los ~3 MB de fotogramas bajan **al empezar a mover la página**, en orden de importancia (0, último, cada 30, 10 y 3: ya con los primeros se ve la animación y `seqNearest` dibuja el más cercano).
- La CSP en bloqueo no cambió el peso ni rompió el 3D.
- La simulación de red del script es la de Lighthouse; no reemplaza un celular real. **Medición en producción real: pendiente** (el proyecto `geacoffi` de Vercel recibió el `main` nuevo el 08/11 pero sin variables; apenas el usuario cargue las de G7 y redeploye: `node tools/medir-peso.mjs https://<url> 15`).
- Con `--scroll` el script solo dispara los fotogramas a veces (el gesto táctil sintético depende del hilo principal con CPU 4× lenta): la primera corrida los bajó, dos no. Los números «con scroll» son de esa corrida.
