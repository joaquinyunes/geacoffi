import { CanvasTexture, SRGBColorSpace } from 'three'
import { cargarRecorte } from '../camara/recorte'

export type TexturaSticker = { texture: CanvasTexture; aspect: number }

/** Textura con alfa a partir de la foto del producto. Devuelve null si no carga: un sticker roto no rompe la escena. */
export async function cargarTexturaSticker(url: string): Promise<TexturaSticker | null> {
  try {
    const canvas = await cargarRecorte(url)
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 4
    return { texture, aspect: canvas.width / canvas.height }
  } catch {
    return null
  }
}
