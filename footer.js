/* GeaCofi · footer.js — el pie de todas las páginas, armado con los datos de negocio.js. main.js lo importa. */
import { NEGOCIO } from './negocio.js'

const el = document.getElementById('footer')
if (el) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${NEGOCIO.nombre} ${NEGOCIO.direccion}`)}`
  const chat = NEGOCIO.telefono ? `https://wa.me/${NEGOCIO.telefono}` : NEGOCIO.chat
  el.innerHTML = `
    <div class="inner container ft">
      <div class="ft-cta">
        <p class="sub1" data-reveal>Pasá por ${esc(NEGOCIO.nombre)}</p>
        <h2 data-reveal>Hoy es buen día<br />para un café.</h2>
        <div class="ft-botones">
          <a class="btn" href="/carta.html">Pedir desde la carta</a>
          <a class="btn is-dark" href="${chat}" target="_blank" rel="noopener">Escribinos por WhatsApp</a>
        </div>
      </div>
      <div class="ft-cols">
        <div><h5>Dónde</h5><p>${esc(NEGOCIO.direccion)}</p><a class="ft-link" href="${mapa}" target="_blank" rel="noopener">Cómo llegar ↗</a></div>
        <div><h5>Horarios</h5><p>${NEGOCIO.horarios ? esc(NEGOCIO.horarios) : 'Consultá por WhatsApp'}</p></div>
        <div><h5>Seguinos</h5><a class="ft-link" href="${NEGOCIO.instagram}" target="_blank" rel="noopener">Instagram ↗</a><a class="ft-link" href="${chat}" target="_blank" rel="noopener">WhatsApp ↗</a></div>
        <div><h5>Recorré</h5><a class="ft-link" href="/">Inicio</a><a class="ft-link" href="/carta.html">Carta</a><a class="ft-link" href="/armar.html">Armá tu pedido</a><a class="ft-link" href="/#eventos">Eventos</a></div>
      </div>
      <div class="ft-base sub2"><span>© ${new Date().getFullYear()} ${esc(NEGOCIO.nombre)} · Café de especialidad</span><a class="ft-link" href="#top">Volver arriba ↑</a></div>
      <div class="ft-marca" aria-hidden="true">geacofi</div>
    </div>`
}
