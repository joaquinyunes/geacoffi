/* El texto del pedido y los totales. Sin DOM, así se puede testear. */

export const pesos = (n) => '$' + Math.round(n).toLocaleString('es-AR')
export const MODOS = { local: 'Para consumir en el local', llevar: 'Para llevar', envio: 'Con envío' }

/** Texto de una línea: "Café de siempre (Leche: Vegetal · Azúcar: Con azúcar)" */
export const detalleLinea = (l) => [...Object.entries(l.opc || {}).map(([k, v]) => `${k}: ${v}`), l.nota ? `"${l.nota}"` : ''].filter(Boolean).join(' · ')

/**
 * lineas: [{ nombre, cant, precio, opc, nota }]. envio: { costo, minimo }.
 * El total solo existe si TODAS las líneas tienen precio (y el envío, si lo hay, también); si no, queda null = "a confirmar".
 */
export function totales(lineas, modo, envio = {}) {
  const sub = lineas.every((l) => typeof l.precio === 'number') ? lineas.reduce((s, l) => s + l.precio * l.cant, 0) : null
  const costo = modo === 'envio' ? envio.costo ?? null : 0
  const total = sub !== null && costo !== null ? sub + costo : null
  const bajoMinimo = modo === 'envio' && typeof envio.minimo === 'number' && sub !== null && sub < envio.minimo
  return { sub, costo, total, bajoMinimo }
}

/** datos: { lineas, modo, hora, nombre, direccion, referencias, envio, total } */
export function armarMensaje({ lineas, modo, hora, nombre, direccion = '', referencias = '', envio = {}, total = null }) {
  const t = totales(lineas, modo, envio)
  const cuerpo = lineas.flatMap((l) => {
    const det = detalleLinea(l)
    return [`• ${l.cant} × ${l.nombre}${l.precio != null ? ` (${pesos(l.precio * l.cant)})` : ''}`, ...(det ? [`   ${det}`] : [])]
  })
  return [
    `Hola! Quiero hacer un pedido${nombre ? ` a nombre de ${nombre}` : ''}:`,
    ...cuerpo,
    '',
    `Modalidad: ${MODOS[modo] || MODOS.local}`,
    modo === 'envio' ? `Dirección: ${direccion}${referencias ? ` (${referencias})` : ''}` : '',
    `Horario: ${hora} h`,
    modo === 'envio' ? `Envío: ${t.costo === null ? 'a confirmar' : t.costo ? pesos(t.costo) : 'sin cargo'}` : '',
    `Total: ${(total ?? t.total) === null ? 'a confirmar' : pesos(total ?? t.total)}`,
  ].filter((x) => x !== '').join('\n')
}

export const urlWhatsapp = (telefono, texto) => `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`
