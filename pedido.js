/* ==========================================================================
   GeaCofi · pedido.js
   Carrito de la página Carta. "Agregar al pedido" en cada producto, en cada
   pareja y en "Elegí el tuyo"; un diálogo para personalizar cada línea, elegir
   local / llevar / envío y el horario; y un ticket de confirmación con fotos.
   El pedido sale armado por WhatsApp. Datos editables en negocio.js.
   ========================================================================== */
import { NEGOCIO, PRODUCTOS, PAREJAS, ELEGI, foto } from './negocio.js'
import { armarMensaje, detalleLinea, MODOS, pesos, totales, urlWhatsapp } from './pedido-texto.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const prod = (id) => PRODUCTOS.find((p) => p.id === id)
const porNombre = (n) => PRODUCTOS.find((p) => p.nombre.toLowerCase() === n.trim().toLowerCase())

/* ---------- estado ---------- */
let lineas = [] // { uid, id, cant, opc: { Leche: 'Común' }, nota }
let uid = 0
let ultimo = null // lo último que se mandó: { texto, datos }
const opcionesPorDefecto = (p) => Object.fromEntries(p.opciones.map((o) => [o.nombre, o.valores[0]]))
const cantidad = (id) => lineas.filter((l) => l.id === id).reduce((s, l) => s + l.cant, 0)
const totalUnidades = () => lineas.reduce((s, l) => s + l.cant, 0)

function sumar(id, n = 1) {
  const l = [...lineas].reverse().find((x) => x.id === id)
  if (l) l.cant += n
  else lineas.push({ uid: ++uid, id, cant: n, opc: opcionesPorDefecto(prod(id)), nota: '' })
}
function restar(id) {
  const l = [...lineas].reverse().find((x) => x.id === id)
  if (!l) return
  if (--l.cant <= 0) lineas = lineas.filter((x) => x !== l)
}

/* ---------- productos de la carta: botón / stepper ---------- */
const stepHTML = (id, nombre) => `
  <button type="button" data-act="menos" data-id="${id}" aria-label="Quitar un ${esc(nombre)}">−</button>
  <b aria-live="polite"></b>
  <button type="button" data-act="mas" data-id="${id}" aria-label="Agregar un ${esc(nombre)}">+</button>`

const tarjetas = []
$$('.c-item').forEach((el) => {
  const p = porNombre($('.c-name', el).textContent)
  if (!p) return
  const add = document.createElement('div')
  add.className = 'p-add'
  add.innerHTML = `
    ${p.precio != null ? `<span class="p-precio">${pesos(p.precio)}</span>` : ''}
    <button type="button" class="p-btn" data-act="mas" data-id="${p.id}">Agregar al pedido</button>
    <span class="p-step" hidden>${stepHTML(p.id, p.nombre)}</span>`
  $('.c-link', el).before(add)
  tarjetas.push({ p, btn: $('.p-btn', add), step: $('.p-step', add), num: $('b', add) })
})

/* parejas: un botón agrega las dos piezas */
$$('.c-pair').forEach((el, i) => {
  const ids = PAREJAS[i]
  if (!ids) return
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'p-btn p-btn--pareja'
  b.dataset.act = 'pareja'
  b.dataset.i = i
  b.textContent = 'Pedir esta pareja'
  el.append(b)
})

/* elegí el tuyo: agrega el café que esté seleccionado */
const pausaMain = $('.pausa-main')
let pausaBtn = null
if (pausaMain) {
  pausaBtn = document.createElement('button')
  pausaBtn.type = 'button'
  pausaBtn.className = 'p-btn p-btn--pausa'
  pausaBtn.dataset.act = 'pausa'
  pausaMain.append(pausaBtn)
  const pausaId = () => ELEGI[Math.max(0, $$('.pausa-options .btn').findIndex((b) => b.classList.contains('is-active')))]
  const pausaPintar = () => { pausaBtn.textContent = `Agregar ${prod(pausaId()).nombre} al pedido` }
  $('.pausa-options')?.addEventListener('click', () => queueMicrotask(pausaPintar))
  pausaBtn.pausaId = pausaId
  pausaPintar()
}

/* ---------- barra fija y diálogo ---------- */
const pedidos = NEGOCIO.pedidos
const horaAttrs = `${pedidos.desde ? `min="${pedidos.desde}"` : ''} ${pedidos.hasta ? `max="${pedidos.hasta}"` : ''}`
const horaAyuda = pedidos.desde && pedidos.hasta ? `Entre las ${pedidos.desde} y las ${pedidos.hasta} h.` : NEGOCIO.horarios ? `Horarios: ${NEGOCIO.horarios}.` : ''

document.body.insertAdjacentHTML('beforeend', `
  <button type="button" id="p-bar" class="btn" data-act="abrir" hidden></button>
  <dialog id="p-dialog" class="pedido" aria-labelledby="p-titulo">
    <div class="p-vista" data-vista="form">
      <form class="p-form" id="p-form">
        <div class="p-cab"><h2 id="p-titulo">Tu pedido</h2><button type="button" class="p-x" data-act="cerrar" aria-label="Cerrar">×</button></div>
        <ul class="p-list"></ul>
        <fieldset class="p-modos">
          <legend class="sub2">¿Cómo lo querés?</legend>
          ${Object.entries(MODOS).filter(([k]) => k !== 'envio' || NEGOCIO.envio.activo).map(([k, v], i) => `
            <label class="p-modo"><input type="radio" name="modo" value="${k}" ${i === 0 ? 'checked' : ''} /><span>${v}</span></label>`).join('')}
        </fieldset>
        <div class="p-envio" hidden>
          <label class="p-campo"><span class="sub2">Dirección</span><input type="text" name="direccion" maxlength="90" autocomplete="street-address" placeholder="Calle y número" /></label>
          <label class="p-campo"><span class="sub2">Referencias (opcional)</span><input type="text" name="referencias" maxlength="80" placeholder="Piso, timbre, color de casa…" /></label>
          <p class="p-nota-envio body3"></p>
        </div>
        <label class="p-campo"><span class="sub2" id="p-hora-t">¿A qué hora venís?</span><input type="time" name="hora" required ${horaAttrs} />${horaAyuda ? `<small>${horaAyuda}</small>` : ''}</label>
        <label class="p-campo"><span class="sub2">Tu nombre (opcional)</span><input type="text" name="nombre" maxlength="40" autocomplete="given-name" /></label>
        <div class="p-total" aria-live="polite"></div>
        <p class="p-aviso body3" role="alert" hidden></p>
        <div class="p-actions">
          <button type="submit" class="btn p-enviar">Enviar por WhatsApp</button>
          <button type="button" class="btn is-dark" data-act="cerrar">Seguir viendo</button>
          <button type="button" class="p-vaciar sub2" data-act="vaciar">Vaciar pedido</button>
        </div>
      </form>
    </div>
    <div class="p-vista p-ticket" data-vista="ticket" hidden></div>
  </dialog>`)

const bar = $('#p-bar'), dialogo = $('#p-dialog'), form = $('#p-form')
const lista = $('.p-list', dialogo), totalEl = $('.p-total', dialogo), avisoEl = $('.p-aviso', dialogo)
const modoActual = () => form.modo.value
const envio = NEGOCIO.envio

function opcionesHTML(l) {
  const p = prod(l.id)
  return p.opciones.map((o) => `
    <label class="p-opt"><span class="sub2">${esc(o.nombre)}</span>
      <select data-uid="${l.uid}" data-op="${esc(o.nombre)}">${o.valores.map((v) => `<option${l.opc[o.nombre] === v ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select>
    </label>`).join('')
}

function pintarLista() {
  const foco = document.activeElement?.dataset?.fk
  lista.innerHTML = lineas.map((l) => {
    const p = prod(l.id)
    return `
    <li class="p-linea">
      <div class="p-linea-top">
        <img src="${foto(p.id)}" alt="" width="56" height="56" />
        <b>${esc(p.nombre)}${p.precio != null ? `<small>${pesos(p.precio * l.cant)}</small>` : ''}</b>
        <span class="p-step">
          <button type="button" data-act="lmenos" data-uid="${l.uid}" data-fk="m${l.uid}" aria-label="Quitar un ${esc(p.nombre)}">−</button>
          <b aria-live="polite">${l.cant}</b>
          <button type="button" data-act="lmas" data-uid="${l.uid}" data-fk="p${l.uid}" aria-label="Agregar un ${esc(p.nombre)}">+</button>
        </span>
      </div>
      ${p.opciones.length ? `<div class="p-opts">${opcionesHTML(l)}</div>` : ''}
      <input type="text" class="p-nota" data-uid="${l.uid}" data-nota maxlength="80" placeholder="Aclaración (opcional)" aria-label="Aclaración para ${esc(p.nombre)}" value="${esc(l.nota)}" />
      <button type="button" class="p-otro sub2" data-act="otro" data-uid="${l.uid}">+ Otro ${esc(p.nombre.toLowerCase())}, distinto</button>
    </li>`
  }).join('')
  if (foco) $(`[data-fk="${foco}"]`, lista)?.focus()
}

const lineasConDatos = () => lineas.map((l) => { const p = prod(l.id); return { nombre: p.nombre, cant: l.cant, precio: p.precio, opc: l.opc, nota: l.nota.trim() } })

function pintarTotal() {
  const t = totales(lineasConDatos(), modoActual(), envio)
  const filas = []
  if (t.sub !== null) filas.push(['Productos', pesos(t.sub)])
  if (modoActual() === 'envio') filas.push(['Envío', t.costo === null ? 'a confirmar' : t.costo ? pesos(t.costo) : 'sin cargo'])
  filas.push(['Total', t.total === null ? 'a confirmar' : pesos(t.total)])
  totalEl.innerHTML = filas.map(([k, v], i) => `<div${i === filas.length - 1 ? ' class="p-total-final"' : ''}><span>${k}</span><b>${v}</b></div>`).join('')
  if (t.total === null) totalEl.insertAdjacentHTML('beforeend', '<p class="body3">Te confirmamos el precio final por WhatsApp.</p>')
  return t
}

function pintarModo() {
  const m = modoActual()
  const envioEl = $('.p-envio', dialogo)
  envioEl.hidden = m !== 'envio'
  form.direccion.required = m === 'envio'
  $('#p-hora-t').textContent = m === 'llevar' ? '¿A qué hora lo retirás?' : m === 'envio' ? '¿A qué hora lo querés recibir?' : '¿A qué hora venís?'
  $('.p-nota-envio', dialogo).textContent = [
    envio.zona ? `Zona de envío: ${envio.zona}.` : 'Te confirmamos por WhatsApp si llegamos a tu zona.',
    typeof envio.minimo === 'number' ? `Pedido mínimo: ${pesos(envio.minimo)}.` : '',
  ].filter(Boolean).join(' ')
  avisoEl.hidden = true
  pintarTotal()
}

function pintar() {
  const unidades = totalUnidades()
  tarjetas.forEach(({ p, btn, step, num }) => {
    const n = cantidad(p.id)
    btn.hidden = n > 0
    step.hidden = n === 0
    num.textContent = n
  })
  bar.hidden = unidades === 0
  bar.textContent = `Ver mi pedido · ${unidades} ${unidades === 1 ? 'producto' : 'productos'}`
  if (!unidades) { if (dialogo.open) dialogo.close(); return }
  pintarLista()
  pintarTotal()
}

/* ---------- ticket de confirmación ---------- */
function mostrarTicket(datos, texto, abrio) {
  const t = totales(datos.lineas, datos.modo, envio)
  const filas = [
    ['Modalidad', MODOS[datos.modo]],
    datos.modo === 'envio' ? ['Dirección', datos.direccion + (datos.referencias ? ` (${datos.referencias})` : '')] : null,
    ['Horario', `${datos.hora} h`],
    datos.modo === 'envio' ? ['Envío', t.costo === null ? 'a confirmar' : t.costo ? pesos(t.costo) : 'sin cargo'] : null,
    ['Total', t.total === null ? 'a confirmar' : pesos(t.total)],
  ].filter(Boolean)
  const ids = lineas.map((l) => l.id)
  $('[data-vista=ticket]', dialogo).innerHTML = `
    <div class="p-form">
      <div class="p-cab"><span class="p-check" aria-hidden="true">✓</span><button type="button" class="p-x" data-act="cerrar" aria-label="Cerrar">×</button></div>
      <h2 id="p-titulo-t" tabindex="-1">Tu pedido está armado</h2>
      <p class="p-paso">${abrio
        ? 'Último paso: <b>enviá el mensaje en WhatsApp</b> para que lo recibamos.'
        : 'Último paso: abrimos el chat y copiamos tu pedido. <b>Pegalo y enviá el mensaje</b> para que lo recibamos.'} ${esc(NEGOCIO.respuesta)}</p>
      <div class="p-recibo">
        <p class="p-recibo-cab sub2">${esc(NEGOCIO.nombre)} · Pedido${datos.nombre ? ` de ${esc(datos.nombre)}` : ''}</p>
        <ul>${datos.lineas.map((l, i) => `
          <li><img src="${foto(ids[i])}" alt="" width="64" height="64" />
            <div><b>${l.cant} × ${esc(l.nombre)}</b>${detalleLinea(l) ? `<small>${esc(detalleLinea(l))}</small>` : ''}</div>
            ${l.precio != null ? `<span>${pesos(l.precio * l.cant)}</span>` : ''}</li>`).join('')}
        </ul>
        <dl>${filas.map(([k, v]) => `<div><dt class="sub2">${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      </div>
      <div class="p-actions">
        <button type="button" class="btn p-enviar" data-act="reabrir">Abrir WhatsApp</button>
        <button type="button" class="btn is-dark" data-act="copiar">Copiar pedido</button>
        <button type="button" class="p-vaciar sub2" data-act="editar">Volver a editar</button>
      </div>
      <button type="button" class="p-vaciar sub2" data-act="terminar">Listo, terminé</button>
      <button type="button" class="p-vaciar sub2" data-act="ver">Ver el mensaje</button>
      <pre class="p-texto" hidden>${esc(texto)}</pre>
    </div>`
  $('[data-vista=form]', dialogo).hidden = true
  $('[data-vista=ticket]', dialogo).hidden = false
  $('#p-titulo-t', dialogo).focus()
}

function enviarWhatsApp(texto) {
  if (NEGOCIO.telefono) { open(urlWhatsapp(NEGOCIO.telefono, texto), '_blank', 'noopener'); return true }
  // shortcut: sin NEGOCIO.telefono el link wa.me/message no admite texto; se copia y el cliente lo pega. Cargá el número en negocio.js.
  navigator.clipboard?.writeText(texto).catch(() => {})
  open(NEGOCIO.chat, '_blank', 'noopener')
  return false
}

function volverAlForm() {
  $('[data-vista=form]', dialogo).hidden = false
  $('[data-vista=ticket]', dialogo).hidden = true
}

/* ---------- eventos ---------- */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]')
  if (!b) return
  const act = b.dataset.act
  switch (act) {
    case 'mas': sumar(b.dataset.id); pintar(); if (b.closest('.p-add')) $('[data-act=mas]', b.closest('.p-add').querySelector('.p-step'))?.focus(); break
    case 'menos': restar(b.dataset.id); pintar(); if (b.closest('.p-add') && !cantidad(b.dataset.id)) $('.p-btn', b.closest('.p-add'))?.focus(); break
    case 'lmas': case 'lmenos': {
      const l = lineas.find((x) => x.uid === +b.dataset.uid)
      if (!l) break
      l.cant += act === 'lmas' ? 1 : -1
      if (l.cant <= 0) lineas = lineas.filter((x) => x !== l)
      pintar()
      break
    }
    case 'otro': { const l = lineas.find((x) => x.uid === +b.dataset.uid); if (!l) break; const i = lineas.indexOf(l); lineas.splice(i + 1, 0, { uid: ++uid, id: l.id, cant: 1, opc: { ...l.opc }, nota: l.nota }); pintar(); break }
    case 'pareja': PAREJAS[+b.dataset.i].forEach((id) => sumar(id)); pintar(); confirmar(b, 'Agregada ✓'); break
    case 'pausa': sumar(pausaBtn.pausaId()); pintar(); confirmar(b, 'Agregado ✓'); break
    case 'vaciar': lineas = []; pintar(); break
    case 'abrir': volverAlForm(); pintarModo(); dialogo.showModal(); break
    case 'cerrar': dialogo.close(); break
    case 'reabrir': if (ultimo) enviarWhatsApp(ultimo.texto); break
    case 'copiar': if (ultimo) { navigator.clipboard?.writeText(ultimo.texto).then(() => { b.textContent = 'Copiado ✓' }, () => { b.textContent = 'Usá "Ver el mensaje"' }) } break
    case 'ver': $('.p-texto', dialogo).hidden = !$('.p-texto', dialogo).hidden; break
    case 'editar': volverAlForm(); break
    case 'terminar': lineas = []; ultimo = null; volverAlForm(); pintar(); if (dialogo.open) dialogo.close(); break
  }
})

function confirmar(btn, texto) {
  const original = btn.dataset.txt ?? btn.textContent
  btn.dataset.txt = original
  btn.textContent = texto
  clearTimeout(btn.t)
  btn.t = setTimeout(() => { btn.textContent = btn.dataset.txt; delete btn.dataset.txt }, 1600)
}

dialogo.addEventListener('input', (e) => {
  const t = e.target
  const l = lineas.find((x) => x.uid === +t.dataset.uid)
  if (l && t.dataset.nota !== undefined) l.nota = t.value
})
dialogo.addEventListener('change', (e) => {
  const t = e.target
  const l = lineas.find((x) => x.uid === +t.dataset.uid)
  if (l && t.dataset.op) { l.opc[t.dataset.op] = t.value; return }
  if (t.name === 'modo') pintarModo()
})

form.addEventListener('submit', (e) => {
  e.preventDefault()
  const f = new FormData(form)
  const modo = modoActual()
  const datos = {
    lineas: lineasConDatos(), modo, hora: String(f.get('hora')), nombre: String(f.get('nombre')).trim(),
    direccion: String(f.get('direccion')).trim(), referencias: String(f.get('referencias')).trim(), envio,
  }
  const t = totales(datos.lineas, modo, envio)
  if (t.bajoMinimo) {
    avisoEl.textContent = `El envío tiene un pedido mínimo de ${pesos(envio.minimo)}. Sumá algo más o elegí otra modalidad.`
    avisoEl.hidden = false
    return
  }
  const texto = armarMensaje({ ...datos, total: t.total })
  ultimo = { texto, datos }
  const abrio = enviarWhatsApp(texto)
  mostrarTicket(datos, texto, abrio)
})

// "Armá tu pedido" (armar.js) manda lo elegido: se arma el carrito y se abre el diálogo
document.addEventListener('gc:pedir', (e) => {
  lineas = []
  e.detail.ids.filter(prod).forEach((id) => sumar(id))
  pintar()
  if (e.detail.nombre) form.nombre.value = e.detail.nombre
  volverAlForm(); pintarModo(); dialogo.showModal()
})

dialogo.addEventListener('close', volverAlForm)
// main.js frena el wheel de toda la ventana (scroll suave); dentro del diálogo tiene que scrollear nativo.
dialogo.addEventListener('wheel', (e) => e.stopPropagation())
pintar()
