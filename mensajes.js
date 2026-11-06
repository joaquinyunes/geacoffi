/* Mensajes del panel para personas, no para programadores. Sin DOM, así se puede testear. */

export class ErrorApi extends Error {
  constructor(mensaje, estado = 0) { super(mensaje); this.estado = estado }
}

const PARECE_TECNICO = /^error \d+|syntaxerror|typeerror|unexpected token|failed to fetch|networkerror|econn|mongo|undefined|null|stack|\bjson\b/i

const POR_ESTADO = {
  0: 'No hay conexión con el servidor. Revisá tu internet y probá de nuevo; lo que escribiste no se perdió.',
  400: 'Revisá los datos que cargaste y probá de nuevo.',
  401: 'Tu sesión venció. Volvé a entrar.',
  403: 'No pudimos confirmar que sos vos. Recargá la página y probá de nuevo.',
  404: 'No encontramos lo que buscabas.',
  409: 'Eso ya cambió desde otra pantalla. Recargá y probá de nuevo.',
  413: 'La foto pesa demasiado. Probá con una más chica.',
  429: 'Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo.',
  503: 'El servicio no está disponible por un momento. Probá de nuevo en unos minutos.',
}

/** Texto para mostrarle a la persona. Usa el mensaje del servidor si está en castellano normal; si parece un error técnico, uno propio según el estado. */
export function humano(err) {
  const estado = err?.estado ?? 0
  const m = String(err?.message ?? '').trim()
  if (m && !PARECE_TECNICO.test(m)) return m
  return POR_ESTADO[estado] ?? (estado >= 500 ? 'Hubo un problema de nuestro lado. Probá de nuevo en un rato; si sigue, avisanos.' : POR_ESTADO[400])
}

/** Frase para el cliente cuando mira su pedido. */
export function textoEstado(estado, motivo = '') {
  switch (estado) {
    case 'recibido': return { titulo: 'Recibido', detalle: 'Ya lo tenemos. Esperá que lo aceptemos; te avisamos acá.', tono: 'espera' }
    case 'aceptado': return { titulo: 'Aceptado', detalle: 'Ya lo estamos preparando.', tono: 'ok' }
    case 'listo': return { titulo: 'Listo', detalle: '¡Tu pedido está listo!', tono: 'ok' }
    case 'entregado': return { titulo: 'Entregado', detalle: 'Que lo disfrutes.', tono: 'ok' }
    case 'rechazado': return { titulo: 'No pudimos tomarlo', detalle: motivo ? `${motivo}.` : 'Escribinos por WhatsApp y lo resolvemos.', tono: 'mal' }
    default: return { titulo: 'Sin novedades', detalle: 'Todavía no sabemos el estado. Confirmalo por WhatsApp.', tono: 'espera' }
  }
}
