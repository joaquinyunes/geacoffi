import { useEffect, useState } from 'react'
import { cargarRecorte } from './recorte'

type Estado = { src: string; ancho: number; alto: number; recortada: boolean }

/** Foto sin fondo claro. Si el canvas queda tainted (CORS) o falla, devuelve la original: usala con mix-blend-mode: multiply. */
export function useImagenRecortada(url: string): Estado {
  const [estado, setEstado] = useState<Estado>({ src: url, ancho: 1, alto: 1, recortada: false })

  useEffect(() => {
    let vivo = true
    let objeto = ''
    cargarRecorte(url)
      .then((c) => c.toBlob((b) => {
        if (!b || !vivo) return
        objeto = URL.createObjectURL(b)
        setEstado({ src: objeto, ancho: c.width, alto: c.height, recortada: true })
      }))
      .catch(() => undefined)
    return () => {
      vivo = false
      if (objeto) URL.revokeObjectURL(objeto)
    }
  }, [url])

  return estado
}
