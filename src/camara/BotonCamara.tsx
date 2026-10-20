import { lazy, Suspense, useRef, useState } from 'react'
import type { Producto } from './tipos'

// El visor (y su cámara) se descarga recién al tocar el botón.
const CamaraVisor = lazy(() => import('./CamaraVisor'))

type Props = { producto: Producto; variante?: 'flotante' | 'fila' | 'miniatura' }

/** Botón "Ver en tu mesa". Se enchufa con una línea en cualquier tarjeta. */
export default function BotonCamara({ producto, variante = 'fila' }: Props) {
  const [abierto, setAbierto] = useState(false)
  const boton = useRef<HTMLButtonElement>(null)
  const cerrar = () => {
    setAbierto(false)
    boton.current?.focus()
  }
  return (
    <>
      <button
        ref={boton}
        type="button"
        className={`btn-camara btn-camara--${variante}`}
        aria-label={`Ver ${producto.nombre} en tu mesa`}
        onClick={() => setAbierto(true)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
        </svg>
        {variante !== 'miniatura' && <span>Ver en tu mesa</span>}
      </button>
      {abierto && (
        <Suspense fallback={null}>
          <CamaraVisor producto={producto} onClose={cerrar} />
        </Suspense>
      )}
    </>
  )
}
