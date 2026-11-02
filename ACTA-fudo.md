# ACTA — Conectar la web de GeaCofi con Fudo por API

## Expediente
1. Idea: el carrito web manda los pedidos a Fudo (POS gastronómico) por API como ventas. Fudo pasa a ser el centro de pedidos, caja y cocina; `/admin.html` queda solo para contenido de la web.
2. Hoy: `pedido.js` arma el pedido (local, llevar o envío, con horario) y lo manda por WhatsApp. No hay backend de pedidos. Sitio vanilla en Vercel; Supabase guarda solo el contenido editable.
3. Quién lo usa: clientes que piden por la web, y el personal que atiende en Fudo.
4. Objetivo: que el dueño no tipee pedidos de WhatsApp y todo se gestione en Fudo ("que todo sea Fudo").
5. Restricciones: API `api.fu.do/v1alpha1`, credenciales pedidas por mail a Fudo, token de 24 h. No está confirmado que la API permita crear ventas. Credenciales en función serverless de Vercel.
6. Tiempo, dinero, precio y costo de la API de Fudo: no lo dijo.

## Alegatos
**Fiscal (contra)**
1. Supuesto: la API no permite crear ventas. Se construye todo y al final no se pueden crear pedidos.
2. Se pasa de WhatsApp, que siempre llega, a una cadena frágil (carrito, Vercel, token de 24 h, API de Fudo). Un pedido puede perderse sin que nadie se entere.
3. Supuesto: cobro, estados y avisos al cliente no están resueltos. El cliente envía y no recibe confirmación ni rechazo.

**Defensa (a favor)**
1. Saca al dueño de retipear cada WhatsApp; el pedido entra directo al sistema donde se cobra y se cocina.
2. Supuesto: la API permite crear ventas. Entonces el cambio es chico: una función serverless que traduce el carrito.
3. Es barato de validar antes de construir: el mail de credenciales o una venta de prueba lo confirma o lo descarta en un día.

## Votos
| # | Jurado | Voto | Razón | Cambiaría su voto si |
|---|---|---|---|---|
| 1 | Clienta ideal | CULPABLE | Necesito saber que mi pedido llegó y me lo aceptaron; hoy WhatsApp me responde una persona, acá la confirmación no existe. | Tras enviar, recibo confirmación clara de que el local aceptó, con aviso si lo rechazan. |
| 2 | Escéptica | CULPABLE | Prometen "todo en Fudo" pero lo central (crear ventas) es un supuesto sin confirmar, y WhatsApp llega seguro. | Fudo confirma por escrito o con venta de prueba que crea ventas, y hay aviso ante pedidos fallidos. |
| 3 | La que no te conoce | CULPABLE | Sin contexto no entiendo qué cambia: no sé si me confirman, me cobran o me rechazan. | Tras enviar, veo pantalla de pedido recibido o rechazado, con estado y hora estimada. |
| 4 | Contadora | CULPABLE | Sin cifras de tiempo, costo ni precio de la API, y con el supuesto clave sin confirmar, las cuentas no cierran. | Fudo confirma por escrito que crea ventas, con costo conocido, y una venta de prueba entra. |
| 5 | Competencia | INOCENTE | Cualquier cafetería con Fudo y un dev lo copia en días, pero tampoco me adelanta. | Fudo cerrara la API de ventas a terceros y GeaCofi tuviera acceso exclusivo. |
| 6 | La que ya te compró | CULPABLE | Hoy pido por WhatsApp y me contestan que sí; sin confirmación ni rechazo me quedo sin saber. | Recibo confirmación o rechazo claro del local, por WhatsApp o en pantalla. |
| 7 | La que casi compra | CULPABLE | Me falta saber que mi pedido llega y me confirman; WhatsApp ya me daba respuesta humana. | El carrito muestra confirmación o rechazo real del local sin depender de WhatsApp. |
| 8 | Experta del rubro | CULPABLE | De ventas solo se vio lectura; sin POST confirmado la promesa no se cumple, y faltan confirmación, renovación de token y reintentos. | Una venta de prueba por API con ítems, tipo de pedido y cliente, más respaldo por WhatsApp. |
| 9 | Vendedora | CULPABLE | Hoy explico "pedís y llega por WhatsApp"; con Fudo no puedo prometer que llegó. | El cliente recibe confirmación o rechazo visible y el pedido nunca se pierde en silencio. |
| 10 | La que lo ejecuta | CULPABLE | WhatsApp siempre llega; la cadena nueva obliga a vigilarla a diario y puede soltar lo que funciona. | Se confirma que Fudo crea ventas y WhatsApp queda de respaldo automático, con alerta al local. |
| 11 | Largo plazo | CULPABLE | Ata el negocio a cuatro eslabones frágiles (token 24 h, API alfa, serverless) que pueden cambiar. | Fudo confirma por escrito que la API de ventas es estable, con versión fija y aviso de cambios. |
| 12 | Amiga honesta | CULPABLE | "Que todo sea Fudo" te va a dejar peleando con tokens y pedidos perdidos; te vas a cansar. | Una venta de prueba funciona y el pedido fallido avisa por WhatsApp como respaldo. |

Nota: el voto 5 salió INOCENTE aunque su razón dice que es fácil de copiar, y la regla de su papel manda CULPABLE en ese caso. Se copió tal cual volvió. Con CULPABLE el marcador sería 12-0.

## Marcador
**INOCENTE 1 · CULPABLE 11** (suman 12).

## Veredicto: NO LA HAGAS ASÍ

Es el veredicto sobre construirla tal como está en el expediente. No dice que Fudo esté mal. Dice que hoy falta la pieza central y que la versión sin respaldo es peor que lo que ya tenés.

**Lo que pesó en contra**
1. Crear ventas por API no está confirmado. Es la promesa central y solo se vio lectura (jurados 2, 4, 8, 12).
2. El cliente no recibe confirmación ni rechazo, y WhatsApp hoy se lo da (jurados 1, 3, 6, 7, 9).
3. Se reemplaza algo que siempre llega por una cadena frágil (token de 24 h, API alfa, serverless) sin aviso si falla (jurados 10, 11, 12).

**Lo que pesó a favor**
1. Sale al dueño de retipear cada WhatsApp (defensa).
2. Si la API crea ventas, el cambio técnico es chico: una función que traduce el carrito (defensa).
3. Solo la competencia votó INOCENTE, y fue porque no hay foso defendible, no porque la idea funcione. No hubo otro voto a favor.

**Condiciones, aplicables esta semana (requisitos si se sigue)**
1. Confirmar con Fudo, por escrito o con una venta de prueba, que la API crea ventas con ítems, modalidad y cliente. Preguntar también costo y estabilidad de la versión.
2. WhatsApp se queda como respaldo automático: si falla el envío a Fudo, el pedido sale igual por WhatsApp y el local recibe una alerta.
3. Tras enviar, el cliente ve el estado del pedido (recibido, aceptado, rechazado) y no queda esperando sin saber.

**Prueba real y barata, en 7 días o menos**
- Pedir las credenciales a Fudo (mail con nombre de cuenta y usuario `api@…`) y, con ellas, crear **una venta de prueba** desde un script local, sin tocar el sitio vivo.
- Cuenta como **sí**: la venta aparece en Fudo con productos, modalidad (local, llevar, envío) y cliente, y Fudo confirma por escrito que la API es soportada.
- Cuenta como **no**: Fudo dice que no se puede, la venta no se puede crear o no responden en 7 días. Entonces plan B: panel de pedidos propio en Supabase o la herramienta de pedidos online de Fudo, si existe (no verificado).

**Lo que el tribunal no sabía**
- Costo de la API y si el plan de Fudo la incluye.
- Cuánto tiempo y dinero se va a invertir.
- Cuántos pedidos web entran por día y quién los atiende hoy.
- Si Fudo ofrece pedidos online propios.
- Quién va a mantener la función serverless cuando falle.

*Juicio en salas separadas: cada papel fue un agente independiente que no vio a los demás, pero todos son el mismo modelo base.*
*Este tribunal es una simulación: ordena los argumentos, no reemplaza probar la idea con personas reales.*
