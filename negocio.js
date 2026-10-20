/* ==========================================================================
   GeaCofi · negocio.js
   TODO lo que cambia seguido vive acá: contacto, horarios, envío, precios,
   opciones de cada producto, eventos y fotos de visitas. No hace falta tocar
   el diseño. Lo que dejes vacío no se muestra (o queda "a confirmar").
   ========================================================================== */

export const NEGOCIO = {
  nombre: 'GeaCofi',
  direccion: '9 de Julio 996',
  instagram: 'https://www.instagram.com/geacofi/',
  // Chat actual (link de mensaje de WhatsApp Business). No admite texto prellenado.
  chat: 'https://wa.me/message/KFA3BBGBV2PLA1',
  // Número que RECIBE los pedidos, con código de país y sin signos. Ej: '5493510000000'.
  // Vacío = el cliente abre el chat y pega el pedido (se copia solo).
  telefono: '',
  // Texto libre, ej: 'Lun a Sáb · 8 a 20 h'. Vacío = "Consultá por WhatsApp".
  horarios: '',
  // Franja en la que se puede pedir retiro/mesa ('HH:MM'). Vacías = cualquier hora.
  pedidos: { desde: '', hasta: '' },
  // Qué le decimos al cliente tras armar el pedido. Ej: 'Te respondemos en unos minutos.'
  respuesta: 'Te respondemos por WhatsApp para confirmar tu pedido.',
  envio: {
    activo: true, // false = se oculta la opción "Con envío"
    zona: '', // ej: 'Centro y barrios cercanos (hasta 15 cuadras)'. Vacía = "te confirmamos si llegamos".
    costo: null, // número en pesos (ej: 1500). null = "a confirmar".
    minimo: null, // pedido mínimo en pesos para envío. null = sin mínimo.
  },
}

/*
  Precio en pesos (número). null = todavía sin precio: el pedido sale igual y el total queda "a confirmar".
  opciones: lo que el cliente puede personalizar. Son ejemplos: editá, agregá o borrá a gusto.
*/
const AZUCAR = { nombre: 'Azúcar', valores: ['Sin azúcar', 'Con azúcar', 'Edulcorante'] }
const LECHE = { nombre: 'Leche', valores: ['Sin leche', 'Común', 'Sin lactosa', 'Vegetal'] }

export const PRODUCTOS = [
  { id: 'cafe-filtrado', nombre: 'Café filtrado', categoria: 'bebida', precio: null, opciones: [AZUCAR] },
  { id: 'cafe-de-siempre', nombre: 'Café de siempre', categoria: 'bebida', precio: null, opciones: [LECHE, AZUCAR] },
  { id: 'cafe-frio', nombre: 'Café frío', categoria: 'bebida', precio: null, opciones: [LECHE, AZUCAR] },
  { id: 'rol-de-canela', nombre: 'Rol de canela', categoria: 'panaderia', precio: null, opciones: [{ nombre: 'Servido', valores: ['Tibio', 'Natural'] }] },
  { id: 'medialuna', nombre: 'Medialuna', categoria: 'panaderia', precio: null, opciones: [{ nombre: 'Servida', valores: ['Tibia', 'Natural'] }] },
  { id: 'tostado', nombre: 'Tostado', categoria: 'panaderia', precio: null, opciones: [{ nombre: 'Corte', valores: ['En dos', 'Entero'] }] },
]
export const foto = (id) => PRODUCTOS.find((p) => p.id === id)?.foto || `/img/${id}.webp`

// Parejas de la carta, en el mismo orden que aparecen en la página.
export const PAREJAS = [['cafe-filtrado', 'medialuna'], ['cafe-de-siempre', 'tostado'], ['cafe-frio', 'rol-de-canela']]
// Las tres opciones de "Elegí el tuyo", en el mismo orden que los botones.
export const ELEGI = ['cafe-filtrado', 'cafe-de-siempre', 'cafe-frio']

/*
  Eventos próximos. Ejemplo:
  { fecha: '2026-11-08', hora: '17:00', titulo: 'Cata de cafés de origen', desc: 'Tres métodos, tres granos. Cupos limitados.', foto: '/eventos/cata.webp' }
  Los eventos con fecha pasada se ocultan solos. Vacía = se muestra la invitación a consultar por uno.
*/
export const EVENTOS = []

/*
  Fotos de quienes pasaron por GeaCofi (con permiso de las personas). Poné los archivos en public/visitas/ y listalos:
  { src: '/visitas/mesa-de-amigas.webp', pie: 'Domingo de mates y medialunas', quien: '@usuario' }
*/
export const VISITAS = []

/*
  Contenido editable desde /admin.html. Se trae de Supabase antes de que arranque la página y pisa los valores de arriba;
  si falla (sin red, proyecto pausado) queda la última copia guardada en el navegador o, si no hay, lo de este archivo.
  shortcut: el panel edita datos, precios, nombres y fotos de los productos de arriba, eventos y visitas; productos nuevos y los textos de la carta siguen en el código.
*/
export const SUPABASE = { url: 'https://jgzdhmpfokmyoiktboux.supabase.co', key: 'sb_publishable_k1WCrn7mJQm4vDOIhUfJnA_xyK0KcpX' }

function aplicar(c) {
  if (c.negocio) {
    const { envio, pedidos, ...resto } = c.negocio
    Object.assign(NEGOCIO, resto)
    Object.assign(NEGOCIO.envio, envio)
    Object.assign(NEGOCIO.pedidos, pedidos)
  }
  for (const p of PRODUCTOS) Object.assign(p, c.productos?.[p.id])
  if (c.eventos) EVENTOS.splice(0, EVENTOS.length, ...c.eventos)
  if (c.visitas) VISITAS.splice(0, VISITAS.length, ...c.visitas)
  // las fotos que están escritas a mano en el HTML
  for (const img of document.querySelectorAll('img[src^="/img/"]')) {
    const p = PRODUCTOS.find((q) => img.getAttribute('src') === `/img/${q.id}.webp`)
    if (p?.foto) img.src = p.foto
  }
}

async function traer() {
  try {
    const r = await fetch(`${SUPABASE.url}/rest/v1/geacofi_contenido?select=clave,valor`, { headers: { apikey: SUPABASE.key }, signal: AbortSignal.timeout(2000) })
    if (!r.ok) throw new Error(r.status)
    const c = Object.fromEntries((await r.json()).map((f) => [f.clave, f.valor]))
    try { localStorage.setItem('gc:contenido', JSON.stringify(c)) } catch { /* sin storage: no pasa nada */ }
    return c
  } catch {
    try { return JSON.parse(localStorage.getItem('gc:contenido')) } catch { return null }
  }
}

// el test de pedido-texto corre en node, sin página
if (typeof document !== 'undefined') {
  const c = await traer()
  if (c) aplicar(c)
}
