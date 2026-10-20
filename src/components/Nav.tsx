import { NEGOCIO } from '../data/products'
import Logo from './Logo'

const ENLACES = [
  { href: '#carta', etiqueta: 'Carta' },
  { href: '#panaderia', etiqueta: 'Panadería' },
  { href: '#pizarra', etiqueta: 'Pizarra' },
  { href: '#galeria', etiqueta: 'Galería' },
  { href: '#visitanos', etiqueta: 'Visitanos' },
]

/** Barra fija: marca, secciones, dirección y WhatsApp siempre a mano, con o sin 3D. */
export default function Nav() {
  return (
    <header className="nav">
      <a className="marca" href="#top" aria-label={`${NEGOCIO.nombre}, inicio`}>
        <Logo size={40} />
        <span>{NEGOCIO.nombre}</span>
      </a>
      <nav className="nav-links" aria-label="Secciones">
        {ENLACES.map((e) => <a key={e.href} className="pildora" href={e.href}>{e.etiqueta}</a>)}
      </nav>
      <span className="nav-dir">{NEGOCIO.direccion}</span>
      <a className="btn rojo" href={NEGOCIO.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
    </header>
  )
}
