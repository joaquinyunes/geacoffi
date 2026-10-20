import { NEGOCIO } from '../data/products'
import type { Producto, Tamano } from './tipos'
import { traeDe } from './trae'

const ETIQUETA_MEDIDA = { diametro: 'Diámetro', largo: 'Largo', alto: 'Alto' } as const

/** Ficha del producto. Solo muestra los datos que estén cargados. */
export default function CamaraFicha({ producto, tamano }: { producto: Producto; tamano: Tamano }) {
  const trae = traeDe(producto)
  return (
    <aside className="visor-ficha">
      <h2 id="visor-titulo">{producto.nombre}</h2>
      {producto.precio && <p className="ficha-precio">{producto.precio}</p>}
      <dl>
        <dt>{ETIQUETA_MEDIDA[tamano.medida]}</dt>
        <dd>{tamano.cm} cm{tamano.estimado && ' (aprox.)'}</dd>
        {producto.pesoGr && (<><dt>Peso</dt><dd>{producto.pesoGr} g</dd></>)}
        {producto.calorias && (<><dt>Calorías</dt><dd>{producto.calorias} kcal</dd></>)}
        {producto.picante && (<><dt>Picante</dt><dd>{producto.picante}</dd></>)}
      </dl>
      {trae.length > 0 && (
        <>
          <h3>Trae</h3>
          <ul className="chips">{trae.map((t) => <li key={t}>{t}</li>)}</ul>
        </>
      )}
      {producto.alergenos?.length ? <p className="ficha-alergenos">Alérgenos: {producto.alergenos.join(', ')}</p> : null}
      {tamano.estimado && <p className="ficha-nota">Medida aproximada, a confirmar con el local. La foto es ilustrativa.</p>}
      <a className="btn terra" href={NEGOCIO.whatsapp} target="_blank" rel="noopener noreferrer">Pedir por WhatsApp</a>
    </aside>
  )
}
