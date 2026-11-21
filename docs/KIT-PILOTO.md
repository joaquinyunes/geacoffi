# Kit del piloto (V10) — checklist y contrato borrador

> Complementa `DEMO-Y-PILOTO.md`. El contrato es un **borrador para que lo revise un abogado (V6)**: no es asesoramiento legal.

## Checklist (un café, 2 semanas)
**Antes de empezar**
- [ ] El café acepta ser caso real (puede citarse) y dar 30 min de feedback por semana.
- [ ] Cuentas **a nombre del café**: dominio, Vercel (Pro), Atlas, GitHub. (`DESPLIEGUE-NUEVO-CLIENTE.md`, pasos 0–4)
- [ ] `tools/verificar-instancia.mjs` da «Todo en orden»; el dueño entra al panel con contraseña + código.
- [ ] Carta, precios, horarios y WhatsApp **reales** cargados (nada de datos inventados).
- [ ] Avisos ntfy, respaldo diario y prueba de restauración hechos (`MONITOREO.md`, `SEGURIDAD.md`).
- [ ] Capacitación de 1 hora con `docs/manual/manual-dueno.pdf` (con el contacto de soporte completado).

**Durante (anotar cada semana)**
- [ ] Pedidos registrados vs. pedidos que llegaron solo por WhatsApp (códigos que no están en el panel).
- [ ] Minutos de «recibido» a «aceptado».
- [ ] Cambios hechos por el dueño solo (registro de cambios) vs. pedidos de cambio a vos.
- [ ] Caídas y tiempo de respuesta del soporte.

**Al cerrar**
- [ ] Preguntas: ¿pagarías USD 25/mes? ¿Y 45 con pagos y factura? ¿Qué cambiarías antes de pagar?
- [ ] Completar «Caso real» en `docs/venta/index.html` con datos medidos y una frase del dueño (con su OK por escrito).
- [ ] Decisión: usa y paga el mensual → seguir con el siguiente rubro; si no → parar y revisar el producto.

## Contrato borrador (licencia de uso y mantenimiento)
**Partes:** [PROVEEDOR] y [CAFÉ / titular], en [ciudad], a [fecha].

1. **Objeto.** El proveedor instala y mantiene el sitio web con panel de administración descrito en el paquete [Instalación / Mensual / Completo] de `PAQUETES.md`.
2. **Titularidad.** Dominio, cuentas de hosting y base de datos, y **todos los datos del café y de sus clientes son del café**. El proveedor los administra solo para prestar el servicio y los entrega (exportación y accesos) al terminar el contrato.
3. **Licencia.** El proveedor otorga al café una licencia [perpetua / mientras dure el mantenimiento] de uso del código para su sitio. No incluye reventa ni sublicencia. [A definir con el abogado: cesión o licencia.]
4. **Precio y pago.** Instalación USD [400 / 1.500] (seña del 50 % al firmar); mensual USD [25 / 45], pagadero por adelantado, desde [mes]. Impuestos aparte. Comisiones de terceros (Mercado Pago, WhatsApp API, proveedor de factura) a cargo del café.
5. **Soporte.** Lunes a viernes de 9 a 18 h. Respuesta inicial en 1 día hábil (4 horas hábiles si el sitio no abre). Incluye hosting, respaldo diario, actualizaciones de seguridad y monitoreo. **No incluye:** diseño nuevo, funciones nuevas, redacción de textos, restaurar datos que el propio café borró fuera del respaldo.
6. **Disponibilidad.** Sin garantía de porcentaje: depende de Vercel y MongoDB Atlas. El proveedor avisa las caídas que detecte y las resuelve dentro del horario de soporte.
7. **Datos personales.** El café es responsable del tratamiento (Ley 25.326); el proveedor es encargado. Los pedidos se borran automáticamente a los 90 días. Política de privacidad y términos: [a redactar con el abogado].
8. **Seguridad.** El café guarda en secreto la contraseña y el segundo factor, y avisa de inmediato si pierde el celular. El proveedor aplica lo descrito en `docs/SEGURIDAD.md`.
9. **Plazo y baja.** [12 meses], renovación automática; cualquiera de las partes puede terminarlo con 30 días de aviso. Al terminar: entrega de accesos y exportación de datos en 10 días hábiles.
10. **Responsabilidad.** Limitada al monto abonado en los últimos 12 meses, salvo dolo. [Revisar con el abogado.]
11. **Ley y jurisdicción.** [Tribunales de ... / mediación previa].

Firmas: ______________________ (proveedor) · ______________________ (café)
