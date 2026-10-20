import { NEGOCIO } from '../data/products'

/** Cinta de texto que corre sola, entre secciones. Es decorativa: el texto real está en el resto de la página. */
export default function Marquee({ texto = NEGOCIO.descriptor, inverso = false }: { texto?: string; inverso?: boolean }) {
  const tira = Array.from({ length: 8 }, (_, i) => <span key={i}>{texto} ✦ {NEGOCIO.nombre} ✦</span>)
  return (
    <div className={`marquee${inverso ? ' inverso' : ''}`} aria-hidden="true">
      <div className="marquee-pista">{tira}{tira}</div>
    </div>
  )
}
