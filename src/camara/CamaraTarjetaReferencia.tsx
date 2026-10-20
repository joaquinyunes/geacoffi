import { anchoPx, TARJETA_CM } from './escala'

/** Silueta de una tarjeta (8,56 × 5,4 cm) a la misma escala que el producto, para calibrar contra una tarjeta real. */
export default function CamaraTarjetaReferencia({ pxPorCm }: { pxPorCm: number }) {
  return (
    <div
      className="visor-tarjeta"
      style={{ width: anchoPx(TARJETA_CM.ancho, pxPorCm), height: anchoPx(TARJETA_CM.alto, pxPorCm), borderRadius: anchoPx(0.318, pxPorCm) }}
    >
      <span>Tarjeta · 8,56 × 5,4 cm</span>
    </div>
  )
}
