# Revisión de diseño y accesibilidad (WCAG 2.1 AA) — GeaCofi

Fecha: 2026-10-31 · Rama: `feat/diseno-a11y` (base `feat/panel-mongo-verificado`) · Alcance: **mejorar sin rediseñar**
(sala 3D, paleta crema/caramelo/cacao y tipografías Inter Tight / Fraunces / DM Mono quedan igual).
Método: sitio levantado en local (`vite`), navegador integrado a 375 px y a escritorio, script de medición del DOM por
página (h1, controles visibles < 44 px, campos sin etiqueta, imágenes sin `alt`, desborde horizontal) y lectura del código
con `web-design-guidelines`, `design:accessibility-review`, `design:design-critique` y `design:ux-copy`.

## Medición a 375 px (controles menores de 44 px / total)

| Página | `<h1>` antes → después | Controles < 44 px antes → después |
|---|---|---|
| `/` (inicio) | 2 → 1 | 16 de 21 → 0 de 21 |
| `/carta.html` | 1 → 1 | 19 de 44 → 0 de 44 |
| `/armar.html` | 1 → 1 | 22 de 26 → 0 de 26 |
| `/detalles.html` | **0** → 1 | 18 de 22 → 0 de 22 |
| `/admin.html` | sin medir (ver "No verificado") | botones a 44 px por CSS |

Sin imágenes sin `alt` y sin desborde horizontal en ninguna página (antes y después).
Peso: CSS 10,47 → 10,62 KB gzip (+0,15 KB); JS idéntico (main 172,76 KB gzip).

## Hallazgos

| # | Prio | Hallazgo | Evidencia | Estado |
|---|---|---|---|---|
| 1 | Alta | Dos `<h1>` en inicio: el logo y "Tostado con criterio" | `index.html` (`.hero-logo` y `.ai-title`) | Corregido: el segundo es `<h2>` y conserva el estilo (`.ai-title` sin mayúsculas) |
| 2 | Alta | `detalles.html` no tenía `<h1>` (solo h2/h3): la página no tiene título para lector de pantalla | `detalles.html` | Corregido: `<h1 class="sr-only">` |
| 3 | Alta | Menú principal (14–26 px), logo, enlaces del pie (21 px), "Cafés / Panadería…" de la carta, "Ver la carta →", "Ver Instagram ↗" y chips del pedido (40 px) por debajo de 44 px | medición; `styles.css` (`#header-logo`, `.is-flipper-target`, `.ft-link`, `.c-nav a`, `.care-link`, `.ev-link`, `.cr-chip`) | Corregido. En celular la barra crece ~26 px y se bajó el texto del héroe (`.hero-top` 76→98 px) y el `top` del `.c-nav` (74→100 px) para que no se pisen |
| 4 | Alta | Foco de teclado casi invisible en enlaces del menú, pie y tarjetas (solo había reglas puntuales) | `styles.css` | Corregido: aro negro + aro caramelo (`:focus-visible` global), legible sobre fondo oscuro y claro; también en `admin.html` |
| 5 | Media | Navegación de la carta (`.c-nav a`) con 50 % de opacidad: ≈ 4,4:1, bajo AA | cálculo de contraste | Corregido: 72 % |
| 6 | Media | `prefers-reduced-motion`: ya se respetaba en JS (`main.js`, smooth scroll y secuencias) pero no en transiciones CSS | `styles.css` | Corregido: sin transiciones en `.hero-cta`, `.cr-chip`, `.ft-link`, `.c-nav` |
| 7 | Baja | Textos del panel mezclan mensajes técnicos del proveedor ("No se guardó: <error>") | `admin.js` | Pendiente: `admin.js` lo está reescribiendo otra sesión (migración a Mongo); no se tocó para no pisar su trabajo |
| 8 | Baja | `aria-label="GeaCofi"` + `aria-hidden` en el texto del `<h1>`: correcto, pero el H1 de la carta ("LA CARTA") se lee igual, sin contexto de negocio | `carta.html` | Pendiente, opcional |
| 9 | Baja | El preloader (contador "100") se queda visible varios segundos con scroll bloqueado en el navegador integrado | observado al medir | Pendiente: medir en equipo real |

## Lo que se conservó a propósito
Sala/escena WebGL, taza 3D y secuencia de 150 fotogramas, paleta, tipografías, glass panels, textos de marca.

## No verificado
- `admin.html` / `admin.js`: la rama base importa `@supabase/supabase-js`, que ya no está en `node_modules` (el trabajo en curso migra a Mongo), así que el panel no carga en esta copia. Solo se cambió CSS (botones 44 px, foco).
- El navegador integrado emula `prefers-reduced-motion: reduce`: la animación completa (scroll cinematográfico) se revisó por código, no en movimiento.
- Lector de pantalla real y contraste sobre las fotos/canvas.
- La build se verificó con una config temporal que marca `@supabase/supabase-js` como externo (el archivo no se versionó).
