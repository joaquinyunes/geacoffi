import { NEGOCIO } from '../data/products'

export type Vec = [number, number, number]
export type Pose = { pos: Vec; look: Vec }

export type Estacion = {
  id: string
  kicker: string
  titulo: string
  /** Texto corto y concreto que acompaña al título. */
  texto: string
  /** Lo que dice la mascota al llegar. */
  frase: string
  cta?: { etiqueta: string; href: string }
  cam: Pose
}

// Coordenadas de la sala (ver build-sala.ts): x ancho, y alto, z profundidad; la cámara arranca en z=9 mirando hacia -z.
// El recorrido es una lista de estaciones: al scrollear la cámara va de una a la siguiente y se queda un rato en cada una.
export const ESTACIONES: Estacion[] = [
  { id: 'inicio', kicker: NEGOCIO.direccion, titulo: 'Café de especialidad', texto: 'Scrolleá y recorré la casa.',
    frase: '¡Hola! Bajá con el scroll y te muestro todo.', cta: { etiqueta: 'Ver la carta', href: '#carta' },
    cam: { pos: [0, 1.7, 9], look: [0, 1.6, -6] } },
  { id: 'carta', kicker: 'La barra', titulo: 'Café de verdad', texto: 'Filtrado, de siempre o bien frío.',
    frase: 'Acá sale el café. Yo no tomo, soy taza.', cta: { etiqueta: 'Ver los cafés', href: '#carta' },
    cam: { pos: [-2.4, 1.7, 0.4], look: [-5.1, 1.3, -2.4] } },
  { id: 'panaderia', kicker: 'La vitrina', titulo: 'Panadería del día', texto: 'Medialunas, roles de canela y tostados.',
    frase: 'Las medialunas salen tibias. Después no digas que no avisé.', cta: { etiqueta: 'Ver la panadería', href: '#panaderia' },
    cam: { pos: [-2.6, 1.6, -4.6], look: [-5.0, 1.2, -7.7] } },
  { id: 'pizarra', kicker: 'La pizarra', titulo: 'Dibujá algo', texto: 'Agarrá un marcador, es tuya.',
    frase: '¡La pizarra! Me dibujan siempre con un solo ojo.', cta: { etiqueta: 'Ir a dibujar', href: '#pizarra' },
    cam: { pos: [2.6, 1.75, -0.9], look: [2.6, 1.8, -4] } },
  { id: 'galeria', kicker: 'Los cuadros', titulo: 'Retratos de la carta', texto: 'Cada producto, enmarcado.',
    frase: 'Esos cuadros los eligió el dueño. Tiene buen gusto.', cta: { etiqueta: 'Ver la galería', href: '#galeria' },
    cam: { pos: [0.8, 2.0, -3.0], look: [6, 2.3, -4.6] } },
  { id: 'ubicacion', kicker: 'La ventana', titulo: 'Pasá a visitarnos', texto: `Estamos en ${NEGOCIO.direccion}.`,
    frase: 'Desde la ventana se ve la calle. Falta que vengas.', cta: { etiqueta: 'Cómo llegar', href: '#visitanos' },
    cam: { pos: [0, 1.9, -5.4], look: [0, 2.5, -10] } },
  { id: 'contacto', kicker: 'El teléfono', titulo: 'Hablemos', texto: 'Escribinos por WhatsApp.',
    frase: 'Si algo no está claro, escribinos. Yo no atiendo.', cta: { etiqueta: 'Contacto', href: '#visitanos' },
    cam: { pos: [1.4, 1.7, 6.2], look: [3.4, 1.0, 3.5] } },
]

/** Fracción del tramo entre estaciones en la que la cámara se mueve; el resto es pausa en cada estación. */
const MOVIMIENTO = [0.3, 0.7] as const

const acotar = (p: number) => Math.min(1, Math.max(0, p))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpVec = (a: Vec, b: Vec, t: number): Vec => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

/** Pose de la cámara para un progreso de scroll 0..1: pausa en cada estación y viaja suave entre una y otra. */
export function poseEn(progreso: number): Pose {
  const n = ESTACIONES.length
  const u = acotar(progreso) * (n - 1)
  const i = Math.min(Math.floor(u), n - 2)
  const t = acotar((u - i - MOVIMIENTO[0]) / (MOVIMIENTO[1] - MOVIMIENTO[0]))
  const s = t * t * (3 - 2 * t)
  const a = ESTACIONES[i].cam, b = ESTACIONES[i + 1].cam
  return { pos: lerpVec(a.pos, b.pos, s), look: lerpVec(a.look, b.look, s) }
}

/** Índice de la estación más cercana para un progreso de scroll 0..1. */
export const estacionEn = (progreso: number) => Math.round(acotar(progreso) * (ESTACIONES.length - 1))
