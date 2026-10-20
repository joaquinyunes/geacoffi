import { useEffect, useRef, useState } from 'react'
import type { EstadoCamara } from './tipos'

/** Cámara trasera en vivo. Apaga las pistas al desmontar. Los fallos quedan en `estado`, nunca lanzan. */
export function useCamaraStream() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [estado, setEstado] = useState<EstadoCamara>(() => {
    if (!window.isSecureContext) return 'sin-https'
    return typeof navigator.mediaDevices?.getUserMedia === 'function' ? 'pidiendo' : 'sin-camara'
  })

  useEffect(() => {
    if (estado !== 'pidiendo') return
    let stream: MediaStream | null = null
    let cancelado = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((s) => {
        if (cancelado) return s.getTracks().forEach((t) => t.stop())
        stream = s
        const v = videoRef.current
        if (v) {
          v.srcObject = s
          void v.play().catch(() => undefined)
        }
        setEstado('activa')
      })
      .catch((e: unknown) => {
        if (!cancelado) setEstado((e as DOMException)?.name === 'NotAllowedError' ? 'denegada' : 'sin-camara')
      })
    return () => {
      cancelado = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [estado])

  return { estado, videoRef }
}
