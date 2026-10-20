# ACTA · Deploy de GeaCofi + edición de carta e imágenes

## Expediente
1. **Idea:** publicar la web de GeaCofi (sitio estático Vite multipágina) en Vercel y usar Supabase (proyecto nuevo: Postgres, Storage, Auth) para editar carta (productos, precios) e imágenes desde un panel admin, sin tocar código.
2. **Quién la usa:** vecinos y seguidores de Instagram que piden por WhatsApp. Edita el dueño.
3. **Qué quiere:** estar online y cambiar carta e imágenes por su cuenta.
4. **No lo dijo:** presupuesto, plazo, quién edita ni cada cuánto, dominio propio, si acepta el costo de Supabase. Nombró Render y después pidió solo deploy + edición.
5. **Hoy:** datos en JS del código, pedidos por WhatsApp, sin backend.

## Alegatos
**Fiscal:** (1) Supuesto: el dueño no mantiene la carta; a las 2 semanas hay precios viejos. (2) Supuesto: nadie técnico se hace cargo del backend; login caído o Supabase pausado y vuelve a depender del programador. (3) Supuesto: costo y dominio sin resolver; URL genérica y gasto recurrente que nadie pidió.
**Defensa:** (1) Supuesto: el dueño edita seguido; el panel saca el cuello de botella. (2) La carta es una lista chica, modelo simple; pedidos siguen por WhatsApp. (3) Supuesto: acepta costo y plazo; Vercel sirve lo que ya existe y el panel se suma después.

## Votos
| # | Jurado | Voto | Razón | Cambiaría su voto si |
|---|---|---|---|---|
| 1 | Clienta ideal | INOCENTE | Quiero carta y precios al día y pedir por WhatsApp; que la dueña actualice sola me da eso sin fricción. | La carta quedara desactualizada o el sitio caído y no pudiera pedir. |
| 2 | Escéptica | CULPABLE | Solo veo supuestos: nada indica que el dueño mantenga la carta ni que alguien responda si falla login o Supabase. | Hay una persona responsable del backend y el dueño publica un cambio real solo antes de lanzar. |
| 3 | La que no te conoce | CULPABLE | En dos segundos solo veo infraestructura; no entiendo qué es GeaCofi ni qué gana el vecino. | La propuesta se resumiera en una frase visible en la primera pantalla. |
| 4 | Contadora | CULPABLE | Publicar estático sale casi gratis, pero el panel suma horas y gasto recurrente sin presupuesto, plazo ni frecuencia declarados. | El dueño confirma presupuesto mensual, dominio y edición semanal. |
| 5 | Competencia | CULPABLE | Carta online con WhatsApp la copio en un fin de semana; el panel no es ventaja competitiva. | La web ofreciera algo no replicable rápido: retiro programado, fidelización o contenido propio. |
| 6 | La que ya te compró | INOCENTE | Carta siempre al día con precios reales y el mismo pedido por WhatsApp me suma, no me confunde. | El panel dejara precios viejos semanas o el sitio cayera. |
| 7 | La que casi compra | INOCENTE | Fotos y precios al día más el botón de WhatsApp me sacan la duda, así que pido. | La carta mostrara precios viejos o productos agotados. |
| 8 | Experta del rubro | INOCENTE | Viable y estándar: estático en Vercel + Supabase con tabla, Storage y Auth de un usuario. Riesgos operativos, resolubles. | Panel con login sin mantenedor y sin fallback estático si Supabase se pausa. |
| 9 | Vendedora | CULPABLE | Se explica en una frase, pero no tengo respuesta si hay precio viejo o la carta cae, y nadie definió quién la mantiene. | Se nombra responsable fijo, panel simple y plan de respaldo. |
| 10 | La que lo ejecuta | INOCENTE | Un formulario es más sostenible que pedir a alguien que toque código; el riesgo es que Supabase o el login fallen. | No hubiera copia estática de respaldo y el sitio quedara vacío. |
| 11 | Largo plazo | CULPABLE | Sin dueño constante ni mantenedor de Supabase, login y pausas, el panel es moda y vuelve a depender del programador. | Edición semanal confirmada y persona técnica nombrada. |
| 12 | Amiga honesta | INOCENTE | Venís iterando la web con cariño y esto saca tu cuello de botella; vas a querer cambiar precios solo. | Quien edite sea otra persona que no pidió el panel ni lo probó en el celular. |

**Marcador: 6 INOCENTE · 6 CULPABLE.**

## Veredicto: REHAZLA antes de invertirle
1. **En contra:** nadie definido para mantener Supabase/login y sin garantía de que la carta se edite con constancia; costo, dominio y presupuesto sin declarar; la portada no explica en una frase qué es y el panel no es diferencial.
2. **A favor:** técnicamente estándar y simple; los pedidos por WhatsApp quedan intactos; saca el cuello de botella de depender del código.
3. **Condiciones aplicables (usadas como requisitos del plan):**
   - **Fallback estático:** la carta y las fotos actuales van embebidas en el sitio; si Supabase se pausa o falla, se ve lo último publicado, no una página vacía.
   - **Probado por quien edita:** panel hecho para celular; el dueño cambia un precio y sube una foto solo antes de darlo por terminado.
   - **Costo y mantenedor a la vista:** Supabase nuevo con costo confirmado antes de crearlo; se deja dicho quién lo mantiene y que el plan gratis se pausa por inactividad.
4. **Prueba real en ≤ 7 días:** el dueño edita al menos 1 precio y 1 foto desde el celular sin ayuda, y esos cambios aparecen en la web pública. "No" si no lo logra solo o si la carta pública no refleja el cambio.
5. **Lo que el tribunal no sabía:** presupuesto, quién edita y cada cuánto, dominio propio, quién mantiene el backend.

*Juicio en salas separadas: cada papel fue un agente independiente que no vio a los demás, pero todos son el mismo modelo base.*
*Este tribunal es una simulación: ordena los argumentos, no reemplaza probar la idea con personas reales.*
