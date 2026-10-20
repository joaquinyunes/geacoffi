export type Medida = 'diametro' | 'largo' | 'alto'

export type Producto = {
  id: string
  nombre: string
  desc: string
  foto: string
  /** Dónde aparece en la sala: la barra (bebidas) o la vitrina (panadería). */
  categoria: 'bebida' | 'panaderia'
  precio?: string
  /** Medida real en cm de la foto recortada (ancho del recorte; alto si medida es 'alto'). */
  tamanoCm?: number
  medida?: Medida
  pesoGr?: number
  incluye?: string[]
  alergenos?: string[]
  calorias?: number
  picante?: string
}

export type Tamano = { cm: number; medida: Medida; estimado: boolean }

export type EstadoCamara = 'pidiendo' | 'activa' | 'sin-https' | 'denegada' | 'sin-camara'
