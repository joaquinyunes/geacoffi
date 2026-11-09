# V3 (demo aparte) y V10 (café piloto) — son 👤, cómo hacerlos

## V3 — Entorno de demo separado
**Regla:** el entorno real (el del café) nunca se usa para mostrar; y no se muestran datos inventados como si fueran de un cliente.

1. En Vercel, un **segundo proyecto** del mismo repo (`geacoffi-demo`) con su **propia base** en Atlas (`MONGODB_DB=geacoffi-demo`) y sus propias variables (`tools/clave.mjs` para una contraseña distinta). Dominio tipo `demo.<tu-dominio>`.
2. Cargar datos de ejemplo **verosímiles** desde el panel (carta y precios de un café típico, un evento, un pedido de prueba) y un **cartel «DEMO»** visible. Hoy no existe ese cartel: se agrega en `negocio.js` (`NEGOCIO.nombre`) o con una franja en `index.html` solo para ese proyecto, por rama (`demo`) para que no llegue al sitio real.
3. Verificar con `node tools/verificar-instancia.mjs https://demo...`.
4. Las capturas y el video de `docs/venta/index.html` salen de **este** entorno. Hoy las capturas son de un entorno local de prueba, etiquetadas como tales.
5. Reiniciar la demo antes de cada reunión: `node tools/backup.mjs` una vez con la demo «limpia» y `node tools/restaurar.mjs` sobre una base vacía cuando haga falta.

## V10 — Café piloto (antes de seguir con el siguiente rubro)
Criterio del tribunal: **un cliente que use o pague** antes de construir más.
1. Elegir 1 café (GeaCofi mismo cuenta si el dueño lo usa en serio con base real: G7 cumplido y pedidos reales por el panel durante 2 semanas).
2. Ofrecerle el paquete **Instalación** (`PAQUETES.md`) con seña del 50 %, o gratis a cambio de poder citarlo como caso real y de 30 minutos de feedback por semana.
3. Qué medir durante el piloto (para completar «Caso real» en la página de venta):
   - pedidos registrados vs. pedidos que llegaron solo por WhatsApp (códigos que no aparecen en el panel);
   - minutos entre «recibido» y «aceptado»;
   - cambios hechos por la dueña sola en el panel (registro de cambios) vs. pedidos de cambio a vos;
   - caídas (`/api/salud`) y tiempo de respuesta del soporte.
4. Preguntas para validar el precio: ¿pagarías USD 25/mes por esto? ¿Y 45 con pagos y factura? ¿Qué cambiarías antes de pagar?
5. Decisión al terminar: si el café lo usa y paga el mensual → seguir con el siguiente rubro; si no → parar y revisar el producto.
