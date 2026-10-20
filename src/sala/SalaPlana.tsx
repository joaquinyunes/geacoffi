import ProductoImagen from '../components/ProductoImagen'
import Logo from '../components/Logo'
import { NEGOCIO, PRODUCTOS } from '../data/products'
import type { Razon } from './use-sala-mode'

const MOTIVOS: Record<Razon, string> = {
  'sin-webgl': 'Tu dispositivo no soporta la sala 3D.',
  'movimiento-reducido': 'Tenés activado "reducir movimiento", así que mostramos la versión simple.',
  'ahorro-datos': 'Con el ahorro de datos activado mostramos la versión simple.',
  falla: 'La sala 3D no pudo cargar, así que mostramos la versión simple.',
  elegido: '',
  '': '',
}

/** Respaldo sin 3D: lo mismo que la sala (qué somos, dónde, cuándo, WhatsApp), sin animación. */
export default function SalaPlana({ razon, onActivar }: { razon: Razon; onActivar: () => void }) {
  return (
    <section className="plana" aria-label="Presentación">
      <div className="plana-copy">
        <a className="marca" href="#top" aria-label={`${NEGOCIO.nombre}, inicio`}><Logo size={52} /></a>
        <p className="kicker">{NEGOCIO.descriptor}</p>
        <h1>{NEGOCIO.nombre}</h1>
        <p className="plana-dir"><b>{NEGOCIO.direccion}</b> · {NEGOCIO.horarios || 'Horarios: consultá por WhatsApp'}</p>
        <div className="ctas">
          <a className="btn" href="#carta">Ver la carta</a>
          <a className="btn rojo" href={NEGOCIO.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          {razon !== 'sin-webgl' && <button type="button" className="btn" onClick={onActivar}>Entrar a la sala 3D</button>}
        </div>
        {MOTIVOS[razon] && <p className="nota">{MOTIVOS[razon]}</p>}
      </div>
      <div className="plana-fotos" aria-hidden="true">
        {PRODUCTOS.slice(0, 3).map((p) => <ProductoImagen key={p.id} src={p.foto} alt="" />)}
      </div>
    </section>
  )
}
