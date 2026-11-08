# Costo a 3 años: GeaCofi vs. una web de café en suscripción (V2)

**Frase de venta (a validar con un café real):** «La web de tu café con carta, eventos y pedidos que editás vos desde el celular, con el estado del pedido y respaldo por WhatsApp, sin comisión por venta y con tus datos en tu cuenta.»

## Precios tomados el 06/11/2026 (no de memoria)
| Servicio | Precio vigente | Fuente |
|---|---|---|
| Tiendanube Esencial | $27.999 ARS/mes; **$20.999/mes con pago anual** (−25%) = $251.991/año. Comisión 2% por transacción con otros medios de pago; con Pago Nube desde 2,97% + IVA | [tiendanube.com/planes-y-precios](https://www.tiendanube.com/planes-y-precios) |
| Tiendanube Inicial | **$0** (solo Pago Nube y Envío Nube, estadísticas básicas) | idem |
| Wix Light | USD 17,77/mes con pago anual (dominio propio, sin cobros online) | [wix.com/plans](https://www.wix.com/plans) |
| Wix Core | USD 29,77/mes con pago anual (con cobros online) | idem |
| Vercel Pro (hosting de GeaCofi para uso comercial) | USD 20/mes por usuario; el plan Hobby es «personal, non-commercial use» | [vercel.com/pricing](https://vercel.com/pricing) |
| MongoDB Atlas | Free (M0) $0, **sin backups**; Flex desde USD 8/mes; M10 desde USD 56,94/mes | [mongodb.com/pricing](https://www.mongodb.com/pricing) |
| Dólar | **supuesto: 1 USD = 1.500 ARS** (último dato encontrado: BNA venta $1.495 el 17/07/2026 según [cotizacion-dolar.com.ar](https://www.cotizacion-dolar.com.ar/dolar-hoy)). Actualizar el día de la venta | |

Tiendanube **ajusta sus precios cada trimestre** (según su centro de ayuda): sus cifras a 3 años son un piso, no un tope. El precio en USD de Wix es «referencial» y varía por país.

## Tabla (36 meses, sin ajustes ni comisiones)
| Opción | Cuenta | Total 3 años |
|---|---|---|
| **Tiendanube Inicial** | 0 | **USD 0** (con límites: es una tienda, no tiene panel de eventos ni pedidos por WhatsApp con estado) |
| Tiendanube Esencial, pago anual | $251.991 × 3 = $755.973 ARS | ≈ **USD 504** |
| Tiendanube Esencial, pago mensual | $27.999 × 36 = $1.007.964 ARS | ≈ **USD 672** |
| Wix Light | 17,77 × 36 | **USD 640** |
| Wix Core (cobros online) | 29,77 × 36 | **USD 1.072** |
| **GeaCofi Esencial** (V1) | 400 + 25 × 36 | **USD 1.300** |
| **GeaCofi Completo** (V1, con integraciones) | 1.500 + 45 × 36 | **USD 3.120** |

## Lo que dice la tabla, sin maquillar
1. **GeaCofi no es más barato que una suscripción.** A 3 años cuesta de 2 a 2,5 veces lo que Tiendanube Esencial o Wix Light. Con Tiendanube Inicial (gratis) la diferencia es el 100 %.
2. **El costo propio también sube**: para vender a un café, el hosting en Vercel no puede ser el plan gratuito (Hobby es no comercial) → Vercel Pro USD 20/mes por usuario (se reparte entre varios clientes si están en el mismo equipo) y Atlas Free no tiene backups (por eso hay `tools/backup.mjs`).
3. Por lo tanto **no se vende por precio**. Se vende por: diseño propio (el scroll 3D no existe en ninguna plantilla), panel hecho a medida del café (carta, eventos, pedidos con estado), **sin comisión por venta** (Tiendanube cobra 0,7–2 % por transacción con medios externos y 2,65–2,99 % + IVA de Pago Nube; los cobros por Mercado Pago de GeaCofi pagan solo la comisión de Mercado Pago), y datos y código del cliente.
4. **Punto de equilibrio contra Tiendanube Esencial:** nunca, con estos precios. Contra una comisión: un café que venda $5.000.000 ARS/mes por la web paga ≈ $100.000 de comisión del 2 % en Tiendanube (≈ USD 67/mes) → ahí GeaCofi Completo (USD 45/mes) empieza a conviene en el uso mensual, pero la instalación (USD 1.500) se recupera en ~5 años. Un café chico no llega a ese volumen por la web: el argumento de comisión es débil salvo cafés con muchos pedidos online.
5. **Conclusión comercial:** el producto es de **ticket bajo** (instalación USD 400–1.500 + mensual USD 25–45). Los USD 10.000 no salen de este producto solo (ver `PAQUETES.md`).

## Cómo rehacer la tabla
Cambiar los precios de la segunda tabla, el dólar y los meses; el cálculo es `instalación + mensual × meses` y, para Tiendanube, `plan × 12 × años`. Anotar la fecha de toma de precios.
