import { useImagenRecortada } from '../camara/use-imagen-recortada'

/** Foto del producto sin su fondo claro (o con multiply si el recorte no se pudo hacer). */
export default function ProductoImagen({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const img = useImagenRecortada(src)
  return <img className={className} src={img.src} alt={alt} loading="lazy" style={img.recortada ? undefined : { mixBlendMode: 'multiply' }} />
}
