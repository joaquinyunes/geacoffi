# Paquetes y precios de GeaCofi (V1) — propuesta a validar

> **Es un producto de ticket bajo.** La tabla de `COSTO-3-ANOS.md` muestra que a 3 años cuesta más que una suscripción (Tiendanube Esencial ≈ USD 504, Wix Light USD 640). Los USD 10.000 del plan común **no se justifican con este producto solo**: solo se llega agrupándolo con otros proyectos del estudio o con un cliente que necesite pedidos + Fudo/facturación + migración. Los precios de abajo son una **propuesta** (no un dato de mercado) que hay que validar con un café real antes de ofrecerlos.

## Los tres paquetes
| | **Instalación** | **Mensual** | **Completo** |
|---|---|---|---|
| Qué es | Pago único | Por mes (obligatorio con la instalación) | Instalación + integraciones |
| Precio propuesto | **USD 400** | **USD 25 / mes** | **USD 1.500** + **USD 45 / mes** |
| Incluye | Sitio con el diseño 3D en el dominio del cliente · panel con contraseña y 2FA · carta, eventos y fotos cargados con los **datos reales** del café · pedidos por WhatsApp con código · capacitación de 1 hora (manual del dueño) · cuentas (Vercel, Atlas, dominio) a nombre del cliente | Hosting (Vercel Pro), base MongoDB Atlas, **respaldo diario cifrado** (y prueba de restauración trimestral), actualizaciones de seguridad semanales, monitoreo de caídas, soporte por escrito con **respuesta en 1 día hábil** (urgencias de «el sitio no abre»: 4 horas hábiles) | Todo lo anterior + **estado del pedido** para el cliente y alerta si el registro falla · Mercado Pago (cobro online) · WhatsApp Business API (avisos automáticos) · factura electrónica con proveedor certificado · migración de datos del cliente · **12 meses de mantenimiento incluidos** en el precio de instalación (el mensual USD 45 empieza el mes 13) |
| No incluye | Cambios de diseño, secciones nuevas, fotos o redacción de textos (se cotizan aparte) | Desarrollo de funciones nuevas · restaurar datos borrados por el propio cliente fuera del respaldo | Fudo u otro POS si su API no lo permite (ver abajo) · costos de terceros (comisión de Mercado Pago, WhatsApp API, proveedor de factura) |

## Reglas
- **Todo a nombre del cliente**: dominio, Vercel, Atlas, WhatsApp, repo. Si deja de pagar el mensual, el sitio y los datos son suyos y se entregan.
- **Datos del cliente, del cliente.** Respaldo exportable a pedido.
- **Fudo no está incluido** hasta que Fudo confirme por escrito que su API crea ventas (`ACTA-fudo.md`: el tribunal votó 11-1 en contra sin esa prueba). Si lo confirma, se cotiza como adicional.
- **Mercado Pago, WhatsApp API y factura** necesitan credenciales del cliente: se hacen en el paquete Completo y solo cuando el cliente las tiene.
- **Seña antes de construir**: 50 % de la instalación antes de empezar el paquete Completo.

## Soporte por escrito (para el contrato; lo redacta un abogado, V6)
- Horario: lunes a viernes, 9 a 18 h (hora de Argentina).
- Respuesta inicial: 1 día hábil (4 horas hábiles si el sitio no abre).
- Fuera de alcance: errores causados por cambios hechos por terceros en el repo o en las cuentas.
- Disponibilidad: sin garantía de porcentaje (depende de Vercel y Atlas); aviso de caída propio (`docs/MONITOREO.md`).

## Por qué estos números
- El mensual cubre: Vercel Pro USD 20/usuario (repartido entre varios clientes), Atlas Free o Flex (USD 0–8), tiempo de soporte. Con USD 25 el margen es chico a propósito: el ingreso real está en la instalación y en el Completo.
- Contra Wix Core (USD 29,77/mes con cobros) el mensual de GeaCofi Instalación es equivalente; la diferencia a 3 años es el pago de instalación (USD 400).
- Validar: preguntarle a 3 cafés cuánto pagarían por «pedidos con estado + carta editable sin comisión». Si ninguno pasa de USD 15/mes, este producto es regalo de entrada para otros servicios, no un negocio por sí mismo.
