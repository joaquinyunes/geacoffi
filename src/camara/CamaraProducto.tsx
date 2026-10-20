import type { Producto, Tamano } from './tipos'
import { anchoPx } from './escala'

type Props = {
  producto: Producto
  tamano: Tamano
  pxPorCm: number
  pos: { x: number; y: number }
  img: { src: string; ancho: number; alto: number; recortada: boolean }
}

/** El producto a tamaño real (ancho en px = cm × px_por_cm), con su línea de cota. */
export default function CamaraProducto({ producto, tamano, pxPorCm, pos, img }: Props) {
  const aspecto = img.ancho / img.alto
  const ancho = tamano.medida === 'alto' ? anchoPx(tamano.cm, pxPorCm) * aspecto : anchoPx(tamano.cm, pxPorCm)
  const alto = ancho / aspecto
  const etiqueta = `${tamano.medida === 'diametro' ? 'Ø ' : ''}${tamano.cm} cm${tamano.estimado ? ' aprox.' : ''}`
  return (
    <div className="visor-producto" style={{ width: ancho, transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}>
      <img src={img.src} alt={producto.nombre} draggable={false} style={img.recortada ? undefined : { mixBlendMode: 'multiply' }} />
      {tamano.medida === 'alto' ? (
        <div className="cota cota--v" style={{ height: alto }}><span>{etiqueta}</span></div>
      ) : (
        <div className="cota cota--h"><span>{etiqueta}</span></div>
      )}
    </div>
  )
}
