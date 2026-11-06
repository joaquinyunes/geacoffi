/* ==========================================================================
   GeaCofi · admin.js
   Panel para cambiar datos, precios, fotos, eventos y visitas, y atender los pedidos, sin tocar código.
   Entra con la contraseña del panel (y el código del celular si está activado). La sesión vive en una cookie
   HttpOnly que controla el servidor; guarda en MongoDB vía /api/contenido, /api/foto y /api/pedido.
   ========================================================================== */
import { NEGOCIO, PRODUCTOS, EVENTOS, VISITAS } from './negocio.js'
import { ErrorApi, humano } from './mensajes.js'

async function api(ruta, { metodo = 'GET', cuerpo, tipo } = {}) {
  let r
  try {
    r = await fetch(`/api/${ruta}`, { method: metodo, headers: { ...(tipo ? { 'content-type': tipo } : {}), 'x-gc': '1' }, body: cuerpo })
  } catch { throw new ErrorApi('', 0) }
  const j = r.status === 204 ? {} : await r.json().catch(() => ({}))
  if (!r.ok) throw new ErrorApi(j.error || '', r.status)
  return j
}
const json = (o) => ({ cuerpo: JSON.stringify(o), tipo: 'application/json' })
const app = document.querySelector('#app')
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function mensaje(texto, tipo = '') {
  const m = document.querySelector('#msg')
  if (m) { m.textContent = texto; m.className = tipo }
}

/* ---------- entrada ---------- */
function login(aviso = '', segundoPaso = false) {
  app.innerHTML = `
    <h1>GeaCofi · Panel</h1>
    <form id="f-login">
      <label for="clave">Contraseña del panel</label><input id="clave" name="clave" type="password" autocomplete="current-password" required />
      ${segundoPaso ? '<label for="codigo">Código de la app de autenticación (6 números)</label><input id="codigo" name="codigo" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required />' : ''}
      <p id="msg" role="status" class="${aviso ? 'mal' : ''}">${esc(aviso)}</p>
      <button class="pri">Entrar</button>
    </form>`
  document.querySelector('#f-login').addEventListener('submit', async (e) => {
    e.preventDefault()
    mensaje('Entrando…')
    try { await api('login', { metodo: 'POST', ...json({ clave: e.target.clave.value, codigo: e.target.codigo?.value }) }) } catch (err) { return mensaje(humano(err), 'mal') }
    iniciar()
  })
}

async function iniciar() {
  let sesion
  try { sesion = await api('login') } catch (err) { return login(humano(err)) }
  if (!sesion.configurado) { app.innerHTML = '<h1>GeaCofi · Panel</h1><p class="nota">El panel todavía no está listo. Avisá a quien instaló la web para que termine la configuración.</p>'; return }
  if (sesion.sesion) return editor()
  login('', sesion.segundoPaso)
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

let temporizador
function editor() {
  const n = (r) => `negocio.${r}`
  app.innerHTML = `
    <h1>GeaCofi · Panel</h1>
    <p class="nota">Cambiá lo que quieras y tocá “Guardar”. En la web se ve al recargar.</p>

    <h2>Pedidos de la web</h2>
    <p class="nota">Los pedidos nuevos aparecen acá. Aceptalos o rechazalos: el cliente ve el estado en su pantalla.</p>
    <div id="pedidos" aria-live="polite"><p class="nota">Cargando pedidos…</p></div>

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

    <h2>Seguridad</h2>
    <details id="registro"><summary>Ver quién cambió qué (registro de cambios)</summary><div id="registro-lista" aria-live="polite"></div></details>
    <p class="nota">Si perdiste un celular o creés que alguien más entró, cerrá la sesión en todos los dispositivos.</p>
    <button type="button" class="peligro" id="salir-todos">Cerrar sesión en todos los dispositivos</button>

    <div class="barra"><span id="msg" role="status"></span><button type="button" class="pri" id="guardar">Guardar</button><button type="button" id="salir">Salir</button></div>`
  cargarPedidos()
  clearInterval(temporizador)
  temporizador = setInterval(() => { if (!document.hidden) cargarPedidos() }, 30_000)
}

/* ---------- pedidos ---------- */
const SIGUIENTES = { recibido: ['aceptado', 'rechazado'], aceptado: ['listo', 'rechazado'], listo: ['entregado'], entregado: [], rechazado: [] }
const VERBO = { aceptado: 'Aceptar', rechazado: 'Rechazar', listo: 'Marcar listo', entregado: 'Marcar entregado' }
const MODOS = { local: 'En el local', llevar: 'Para llevar', envio: 'Con envío' }
const MIN_ATRASO = 10

async function cargarPedidos() {
  const caja = document.querySelector('#pedidos')
  if (!caja) return
  let lista
  try { lista = await api('pedido?lista=1') } catch (err) { caja.innerHTML = `<p class="err">${esc(humano(err))}</p>`; return }
  if (!lista.length) { caja.innerHTML = '<p class="nota">Todavía no hay pedidos registrados.</p>'; return }
  const ahora = Date.now()
  caja.innerHTML = lista.map((p) => {
    const min = Math.floor((ahora - new Date(p.creado).getTime()) / 60000)
    const atrasado = p.estado === 'recibido' && min >= MIN_ATRASO
    return `
    <div class="tarjeta">
      <b>#${esc(p.codigo)} · ${esc(p.nombre || 'Sin nombre')}</b> <span class="pedido-estado ${esc(p.estado)}">${esc(p.estado)}</span>
      ${atrasado ? `<p class="atrasado" role="alert">⚠ Sin atender hace ${min} min</p>` : ''}
      <p class="nota">${MODOS[p.modo] || ''} · ${esc(p.hora)} h${p.modo === 'envio' ? ` · ${esc(p.direccion)}${p.referencias ? ` (${esc(p.referencias)})` : ''}` : ''} · ${p.total == null ? 'total a confirmar' : `$${Math.round(p.total).toLocaleString('es-AR')}`}</p>
      <ul>${p.lineas.map((l) => `<li>${l.cant} × ${esc(l.nombre)}${Object.keys(l.opc || {}).length ? ` <span class="nota">(${esc(Object.values(l.opc).join(', '))})</span>` : ''}${l.nota ? ` <span class="nota">“${esc(l.nota)}”</span>` : ''}</li>`).join('')}</ul>
      ${p.estado === 'rechazado' && p.motivo ? `<p class="nota">Motivo: ${esc(p.motivo)}</p>` : ''}
      <div class="pedido-acciones">${SIGUIENTES[p.estado].map((s) => `<button type="button" class="${s === 'rechazado' ? 'peligro' : 'pri'}" data-pedido="${esc(p.id)}" data-a="${s}">${VERBO[s]}</button>`).join('')}</div>
    </div>`
  }).join('')
}

async function cambiarPedido(id, nuevo) {
  let motivo = ''
  if (nuevo === 'rechazado') {
    motivo = prompt('¿Por qué lo rechazás? El cliente lo va a ver.', 'Nos quedamos sin stock') ?? null
    if (motivo === null) return
  }
  try { await api('pedido', { metodo: 'PATCH', ...json({ id, estado: nuevo, motivo }) }) } catch (err) { mensaje(humano(err), 'mal') }
  cargarPedidos()
}

async function cargarRegistro() {
  const caja = document.querySelector('#registro-lista')
  try {
    const filas = await api('auditoria')
    caja.innerHTML = filas.length ? filas.map((f) => `
      <div class="registro"><b>${esc(f.accion)}</b> · ${new Date(f.fecha).toLocaleString('es-AR')} · IP ${esc(f.ip)}
        ${(f.cambios || []).slice(0, 8).map((c) => `<br><span class="nota">${esc(c.campo)}: ${esc(JSON.stringify(c.antes) ?? '—')} → ${esc(JSON.stringify(c.despues) ?? '—')}</span>`).join('')}
      </div>`).join('') : '<p class="nota">Todavía no hay movimientos.</p>'
  } catch (err) { caja.innerHTML = `<p class="err">${esc(humano(err))}</p>` }
}

app.addEventListener('toggle', (e) => { if (e.target.id === 'registro' && e.target.open) cargarRegistro() }, true)

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
  if (b.dataset.pedido) return cambiarPedido(b.dataset.pedido, b.dataset.a)
  if (b.dataset.agregar) {
    estado[b.dataset.agregar].push(b.dataset.agregar === 'eventos' ? { fecha: '', hora: '', titulo: '', desc: '', foto: '' } : { src: '', pie: '', quien: '' })
    editor()
  } else if (b.dataset.quitar) {
    const [lista, i] = b.dataset.quitar.split('.')
    estado[lista].splice(Number(i), 1)
    editor()
  } else if (b.id === 'salir' || b.id === 'salir-todos') {
    if (b.id === 'salir-todos' && !confirm('Se va a cerrar tu sesión en el celular, la compu y cualquier otro dispositivo. ¿Seguro?')) return
    clearInterval(temporizador)
    try { await api(b.id === 'salir' ? 'login' : 'login?todas=1', { metodo: 'DELETE' }) } catch { /* si la sesión ya venció, igual se sale */ }
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
    mensaje(err instanceof ErrorApi ? humano(err) : 'No pudimos leer esa foto. Probá con otra (JPG, PNG o WebP).', 'mal')
  }
})

// la foto se achica a 1200 px y pasa a webp (además se borran los datos ocultos como la ubicación): carga rápido y entra en el límite de 3 MB
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
    await api('contenido', { metodo: 'PUT', ...json(contenido) })
  } catch (err) {
    boton.disabled = false
    if (err.estado === 401) return login(humano(err))
    return mensaje(`No se guardó. ${humano(err)}`, 'mal')
  }
  boton.disabled = false
  mensaje('Guardado. Ya se ve en la web.', 'ok')
}

iniciar()
