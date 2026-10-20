# ACTA — Sala 3D explorable estilo caffe.design (GeaCofi)

## Expediente
1. Idea: reemplazar el hero espacial por una sala-café 3D explorable (three.js, generada por código): estrellas clicables que acercan la cámara a objetos, cada uno abre una sección (carta, panadería, pizarra, galería, ubicación, contacto). Mascota-taza con globo de diálogo, menú de píldoras, tipografía pixel + grotesca, colores vivos.
2. Quién la usaría: clientes y seguidores de @geacofi, sobre todo en celular desde Instagram.
3. Qué quiere el dueño: algo "como caffe.design" porque lo actual le parece muy simple.
4. Tiempo, dinero, precio: no lo dijo. Antecedente: acta previa dio NO LA HAGAS ASÍ al 3D por scroll.

## Alegatos
**Fiscal:** (1) supuesto: en celular medio con datos la sala tarda y esconde horario/dirección/WhatsApp tras estrellas; (2) el 3D previo ya fue rechazado por lo mismo y este es más pesado; (3) 6 productos y sin precios/horarios cargados para un escenario enorme.
**Defensa:** (1) supuesto: el dueño solo publica lo que lo entusiasma y eligió la referencia; (2) supuesto: la sala con mascota se comparte y diferencia al local; (3) supuesto: es por código, liviano, carga bajo demanda, y los 6 stickers ya existen.

## Votos
| # | Jurado | Voto | Razón | Cambiaría su voto si |
|---|---|---|---|---|
| 1 | Clienta ideal | CULPABLE | Entro desde Instagram a ver horario y dónde queda; una sala con estrellas me hace buscar y cierro. | Horario, dirección, WhatsApp y carta visibles sin tocar nada, 3D opcional y liviano. |
| 2 | Escéptica | CULPABLE | El tribunal previo ya dijo no y esta versión es más pesada; nada prueba que lo básico sea accesible. | Prototipo en celular medio con horario, dirección y WhatsApp sin clics y carga < 3 s. |
| 3 | No te conoce | CULPABLE | En dos segundos no se entiende que es una cafetería; la info queda tras objetos. | Primera pantalla dice "cafetería de especialidad", dirección, horario y WhatsApp. |
| 4 | Contadora | CULPABLE | 3D a medida con mantenimiento para 6 productos sin presupuesto declarado. | Presupuesto cerrado y versión 2D liviana primero. |
| 5 | Competencia | INOCENTE | El concepto se copia, pero mascota, identidad y vínculo con @geacofi no. | La sala fuera plantilla genérica sin mascota ni contenido propio. |
| 6 | Ya te compró | CULPABLE | Ya vengo por el café; perseguir estrellas para ver el horario me confunde. | Info visible de entrada y la sala como extra opcional. |
| 7 | Casi compra | CULPABLE | Mi traba es saber si abren, dónde queda y qué cuesta; la sala lo esconde. | Horario, dirección, precios y WhatsApp visibles sin esperar el 3D. |
| 8 | Experta del rubro | CULPABLE | Posible con three.js procedural, pero el riesgo en el navegador de Instagram supera lo que promete. | Datos clave en HTML fuera del canvas y 3D opcional, liviano, probado en Instagram Android. |
| 9 | Vendedora | CULPABLE | "¿A qué hora abren y cuánto sale?" queda tras estrellas y sin datos cargados. | Horario, dirección y WhatsApp fijos desde el primer segundo y carta con precios. |
| 10 | La que lo ejecuta | CULPABLE | Cada cambio de carta o pizarra depende de un programador. | Carta, pizarra, horarios y precios editables en un archivo simple, con respaldo plano. |
| 11 | Largo plazo | CULPABLE | Es moda y con poco contenido se abandona. | Contenido editable sin tocar la escena y versión plana siempre visible. |
| 12 | Amiga honesta | CULPABLE | Hoy lo entusiasma, pero sin precios ni horarios se cansa y no sabrá mantenerlo. | Carga precios, horarios y fotos y acepta una versión ligera con lo básico a la vista. |

**Marcador:** INOCENTE 1 + CULPABLE 11 = 12.

## Veredicto: NO LA HAGAS ASÍ
1. **En contra:** esconde horario/dirección/WhatsApp tras el 3D; riesgo de peso/fallo en celular dentro de Instagram; contenido que depende de un programador.
2. **A favor:** la identidad (mascota, sala propia) no se copia fácil (competencia).
3. **Condiciones (usadas como requisitos del plan):**
   - Dirección, horario y WhatsApp siempre a la vista en HTML, fuera del canvas y sin esperar el 3D.
   - El 3D es opcional: carga diferida, respaldo plano (Info + Carta), se apaga con "reducir movimiento"/ahorro de datos/sin WebGL.
   - Carta, precios, horarios y pizarra se editan en `src/data/products.ts`, sin tocar la escena.
4. **Prueba real, ≤ 7 días:** abrir el enlace en el celular de 10 clientes dentro de Instagram. "Sí" si ≥ 7 ven dirección y WhatsApp en < 5 s y ≥ 3 recorren la sala; "no" si la mayoría abandona o no carga.
5. **Lo que el tribunal no sabía:** presupuesto, precios, horarios, rendimiento real en Instagram, si los clientes quieren "explorar" o solo informarse.

Juicio en salas separadas: cada papel fue un agente independiente que no vio a los demás, pero todos son el mismo modelo base.
Este tribunal es una simulación: ordena los argumentos, no reemplaza probar la idea con personas reales.
