/* ==========================================================================
   GeaCofi · admin.js
   Panel para cambiar datos, precios, fotos, eventos y visitas sin tocar código.
   Entra con la clave del panel (ADMIN_PASSWORD en Vercel); guarda en MongoDB vía /api/contenido y /api/foto.
   ========================================================================== */
import { NEGOCIO, PRODUCTOS, EVENTOS, VISITAS } from './negocio.js'

// La clave vive solo en esta pestaña (sessionStorage) y viaja en un encabezado; el servidor la compara con ADMIN_PASSWORD.
const CLAVE = 'gc:clave'
const clave = () => { try { return sessionStorage.getItem(CLAVE) || '' } catch { return '' } }
async function api(ruta, { metodo = 'GET', cuerpo, tipo } = {}) {
  const r = await fetch(`/api/${ruta}`, { method: metodo, headers: { ...(tipo ? { 'content-type': tipo } : {}), 'x-admin-clave': clave() }, body: cuerpo })
  const j = r.status === 204 ? {} : await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || `Error ${r.status}`)
  return j
}
const app = document.querySelector('#app')
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function mensaje(texto, tipo = '') {
  const m = document.querySelector('#msg')
  if (m) { m.textContent = texto; m.className = tipo }
}

/* ---------- entrada ---------- */
function login(aviso = '') {
  app.innerHTML = `
    <h1>GeaCofi · Panel</h1>
    <form id="f-login">
      <label for="clave">Contraseña del panel</label><input id="clave" type="password" autocomplete="current-password" required />
      <p id="msg" class="${aviso ? 'mal' : ''}">${esc(aviso)}</p>
      <button class="pri">Entrar</button>
    </form>`
  document.querySelector('#f-login').addEventListener('submit', async (e) => {
    e.preventDefault()
    mensaje('Entrando…')
    try { sessionStorage.setItem(CLAVE, e.target.clave.value) } catch { /* sin storage: no se puede entrar */ }
    try { await api('login', { metodo: 'POST' }) } catch (err) { sessionStorage.removeItem(CLAVE); return mensaje(err.message === 'Clave incorrecta' ? 'Contraseña incorrecta.' : err.message, 'mal') }
    iniciar()
  })
}

async function iniciar() {
  if (!clave()) return login()
  try { await api('login', { metodo: 'POST' }) } catch { sessionStorage.removeItem(CLAVE); return login('La sesión venció. Volvé a entrar.') }
  editor()
}

/* ---------- editor ---------- */
// estado = copia de lo que se ve hoy en la web (negocio.js + lo ya guardado)
const estado = {
  negocio: structuredClone({ telefono: NEGOCIO.telefono, horarios: NEGOCIO.horarios, pedidos: NEGOCIO.pedidos, respuesta: NEGOCIO.respuesta, envio: NEGOCIO.envio }),
  productos: PRODUCTOS.map((p) => ({ id: p.id, nombre: p.nombre, precio: p.precio, foto: p.foto || '' })),
  eventos: structuredClone(EVENTOS),
  visitas: structuredClone(VISITAS),
}

const get = (ruta) => ruta.split('.').reduce((o, k) => o?.[k], estado)
function set(ruta, valor) {
  const ks = ruta.split('.'), ult = ks.pop()
  ks.reduce((o, k) => o[k], estado)[ult] = valor
}

const campo = (ruta, etiqueta, { tipo = 'text', num = false } = {}) =>
  `<label>${etiqueta}<input type="${tipo}" data-k="${ruta}" ${num ? 'data-num="1" inputmode="decimal"' : ''} value="${esc(get(ruta))}" /></label>`

const fotoCampo = (ruta, vista) => `
  <img src="${esc(vista)}" alt="" />
  <label>Cambiar foto<input type="file" accept="image/*" data-foto="${ruta}" /></label>`

function editor() {
  const n = (r) => `negocio.${r}`
  app.innerHTML = `
    <h1>GeaCofi · Panel</h1>
    <p class="nota">Cambiá lo que quieras y tocá “Guardar”. En la web se ve al recargar.</p>

    <h2>Datos del local</h2>
    ${campo(n('telefono'), 'WhatsApp que recibe los pedidos (con código de país, ej: 5493510000000)')}
    ${campo(n('horarios'), 'Horarios (ej: Lun a Sáb · 8 a 20 h)')}
    <div class="fila">${campo(n('pedidos.desde'), 'Pedidos desde', { tipo: 'time' })}${campo(n('pedidos.hasta'), 'Pedidos hasta', { tipo: 'time' })}</div>
    ${campo(n('respuesta'), 'Mensaje tras armar el pedido')}
    <label><input type="checkbox" data-k="negocio.envio.activo" ${estado.negocio.envio.activo ? 'checked' : ''} />Hacemos envíos</label>
    ${campo(n('envio.zona'), 'Zona de envío')}
    <div class="fila">${campo(n('envio.costo'), 'Costo de envío ($)', { num: true })}${campo(n('envio.minimo'), 'Pedido mínimo ($)', { num: true })}</div>

    <h2>Carta</h2>
    ${estado.productos.map((p, i) => `
      <div class="tarjeta">
        ${fotoCampo(`productos.${i}.foto`, p.foto || `/img/${p.id}.webp`)}
        ${campo(`productos.${i}.nombre`, 'Nombre')}
        ${campo(`productos.${i}.precio`, 'Precio ($, vacío = a confirmar)', { num: true })}
      </div>`).join('')}

    <h2>Eventos</h2>
    ${estado.eventos.map((e, i) => `
      <div class="tarjeta">
        ${e.foto ? `<img src="${esc(e.foto)}" alt="" />` : ''}
        <div class="fila">${campo(`eventos.${i}.fecha`, 'Fecha', { tipo: 'date' })}${campo(`eventos.${i}.hora`, 'Hora', { tipo: 'time' })}</div>
        ${campo(`eventos.${i}.titulo`, 'Título')}
        ${campo(`eventos.${i}.desc`, 'Descripción')}
        <label>${e.foto ? 'Cambiar foto' : 'Foto'}<input type="file" accept="image/*" data-foto="eventos.${i}.foto" /></label>
        <button type="button" class="peligro" data-quitar="eventos.${i}">Quitar evento</button>
      </div>`).join('')}
    <button type="button" data-agregar="eventos">+ Agregar evento</button>

    <h2>Fotos de visitas</h2>
    <p class="nota">Solo con permiso de las personas que aparecen.</p>
    ${estado.visitas.map((v, i) => `
      <div class="tarjeta">
        ${v.src ? `<img src="${esc(v.src)}" alt="" />` : ''}
        <label>${v.src ? 'Cambiar foto' : 'Foto'}<input type="file" accept="image/*" data-foto="visitas.${i}.src" /></label>
        ${campo(`visitas.${i}.pie`, 'Pie de foto')}
        ${campo(`visitas.${i}.quien`, 'Quién (ej: @usuario)')}
        <button type="button" class="peligro" data-quitar="visitas.${i}">Quitar foto</button>
      </div>`).join('')}
    <button type="button" data-agregar="visitas">+ Agregar foto</button>

    <div class="barra"><span id="msg"></span><button type="button" class="pri" id="guardar">Guardar</button><button type="button" id="salir">Salir</button></div>`
}

app.addEventListener('input', (e) => {
  const k = e.target.dataset?.k
  if (!k) return
  const t = e.target
  if (t.type === 'checkbox') return set(k, t.checked)
  if (t.dataset.num) {
    const v = t.value.replace(',', '.').trim()
    return set(k, v === '' || Number.isNaN(Number(v)) ? null : Number(v))
  }
  set(k, k.endsWith('telefono') ? t.value.replace(/\D/g, '') : t.value)
})

app.addEventListener('click', async (e) => {
  const b = e.target.closest('button')
  if (!b) return
  if (b.dataset.agregar) {
    estado[b.dataset.agregar].push(b.dataset.agregar === 'eventos' ? { fecha: '', hora: '', titulo: '', desc: '', foto: '' } : { src: '', pie: '', quien: '' })
    editor()
  } else if (b.dataset.quitar) {
    const [lista, i] = b.dataset.quitar.split('.')
    estado[lista].splice(Number(i), 1)
    editor()
  } else if (b.id === 'salir') {
    sessionStorage.removeItem(CLAVE)
    login()
  } else if (b.id === 'guardar') guardar(b)
})

app.addEventListener('change', async (e) => {
  const ruta = e.target.dataset?.foto
  const archivo = e.target.files?.[0]
  if (!ruta || !archivo) return
  mensaje('Subiendo foto…')
  try {
    const { url } = await api('foto', { metodo: 'POST', cuerpo: await aWebp(archivo), tipo: 'image/webp' })
    set(ruta, url)
    editor()
    mensaje('Foto subida. Falta tocar “Guardar”.', 'ok')
  } catch (err) {
    mensaje(`No se pudo subir la foto: ${err.message}`, 'mal')
  }
})

// la foto se achica a 1200 px y pasa a webp: carga rápido y entra en el límite de 3 MB
async function aWebp(archivo) {
  const bmp = await createImageBitmap(archivo)
  const k = Math.min(1, 1200 / Math.max(bmp.width, bmp.height))
  const c = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * k), height: Math.round(bmp.height * k) })
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('no se pudo convertir'))), 'image/webp', 0.85))
}

async function guardar(boton) {
  boton.disabled = true
  mensaje('Guardando…')
  const productos = Object.fromEntries(estado.productos.map(({ id, ...resto }) => [id, { ...resto, foto: resto.foto || undefined }]))
  const contenido = {
    negocio: estado.negocio,
    productos,
    eventos: estado.eventos.filter((e) => e.fecha && e.titulo),
    visitas: estado.visitas.filter((v) => v.src),
  }
  try {
    await api('contenido', { metodo: 'PUT', cuerpo: JSON.stringify(contenido), tipo: 'application/json' })
  } catch (err) {
    boton.disabled = false
    return mensaje(`No se guardó: ${err.message}`, 'mal')
  }
  boton.disabled = false
  mensaje('Guardado. Ya se ve en la web.', 'ok')
}

iniciar()
