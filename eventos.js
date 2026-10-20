/* GeaCofi · eventos.js — sección de eventos y fotos de visitas de la portada, con los datos de negocio.js. main.js lo importa. */
import { NEGOCIO, EVENTOS, VISITAS } from './negocio.js'
import { urlWhatsapp } from './pedido-texto.js'

const el = document.getElementById('eventos')
if (el) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  const wa = (texto) => (NEGOCIO.telefono ? urlWhatsapp(NEGOCIO.telefono, texto) : NEGOCIO.chat)
  const hoy = new Date().toISOString().slice(0, 10)
  const proximos = EVENTOS.filter((e) => e.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const fecha = (iso) => { const d = new Date(`${iso}T12:00:00`); return { dia: d.getDate(), mes: d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''), sem: d.toLocaleDateString('es-AR', { weekday: 'long' }) } }

  const lista = proximos.length
    ? proximos.map((e) => {
        const f = fecha(e.fecha)
        return `
        <article class="ev-item">
          <div class="ev-fecha" aria-label="${esc(f.sem)} ${f.dia} de ${esc(f.mes)}"><b>${f.dia}</b><span class="sub2">${esc(f.mes)}</span></div>
          <div class="ev-info">
            <p class="sub2">${esc(f.sem)}${e.hora ? ` · ${esc(e.hora)} h` : ''}</p>
            <h3>${esc(e.titulo)}</h3>
            ${e.desc ? `<p class="body2">${esc(e.desc)}</p>` : ''}
            <a class="ev-link sub2" href="${wa(`Hola! Quiero reservar lugar para "${e.titulo}" (${f.dia}/${e.fecha.slice(5, 7)}).`)}" target="_blank" rel="noopener">Reservar lugar ↗</a>
          </div>
          ${e.foto ? `<img class="ev-foto" src="${esc(e.foto)}" alt="" loading="lazy" decoding="async" />` : ''}
        </article>`
      }).join('')
    : `
        <article class="ev-item ev-vacio">
          <div class="ev-info">
            <p class="sub2">Próximo evento</p>
            <h3>Lo anunciamos en Instagram</h3>
            <p class="body2">Seguinos en <b>@geacofi</b> para enterarte primero de lo que viene.</p>
            <a class="ev-link sub2" href="${NEGOCIO.instagram}" target="_blank" rel="noopener">Ver Instagram ↗</a>
          </div>
        </article>`

  const muro = VISITAS.slice(0, 8).map((v) => `
        <figure class="ev-tile"><img src="${esc(v.src)}" alt="${esc(v.pie || 'Visita en GeaCofi')}" loading="lazy" decoding="async" />${v.pie || v.quien ? `<figcaption class="sub2">${esc(v.pie || '')}${v.quien ? ` <i>${esc(v.quien)}</i>` : ''}</figcaption>` : ''}</figure>`).join('')

  el.innerHTML = `
    <div class="inner container ev">
      <div class="ev-bg" aria-hidden="true">EVENTOS</div>
      <header class="ev-head">
        <p class="sub1" data-reveal>Eventos y comunidad</p>
        <h2 data-reveal>Pasan cosas<br />en GeaCofi.</h2>
        <p class="body1" data-reveal>Seguido hay algo para compartir. Mirá lo que viene, y si querés hacer el tuyo acá, escribinos.</p>
        <a class="btn" href="${wa('Hola! Quiero consultar por un evento en GeaCofi.')}" target="_blank" rel="noopener">Consultar por un evento</a>
      </header>
      <div class="ev-lista">${lista}</div>
      <div class="ev-muro${VISITAS.length ? '' : ' ev-muro--vacio'}">
        ${muro}
        <a class="ev-tile ev-invita" href="${NEGOCIO.instagram}" target="_blank" rel="noopener">
          <span class="ev-camara" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg></span>
          <b>¿Pasaste por GeaCofi?</b>
          <span class="body3">Etiquetanos en Instagram y tu foto puede aparecer acá.</span>
        </a>
      </div>
    </div>`
}
