import type { Producto } from '../camara/tipos'

// Todo lo editable del sitio vive acá: contacto, horarios, pizarra y carta.
// Dejá un campo vacío u omitido para que no se muestre. Las medidas que no cargues se estiman por el nombre
// y el visor las marca como aproximadas.
export const NEGOCIO = {
  nombre: 'GeaCofi',
  descriptor: 'Café de especialidad',
  direccion: '9 de Julio 996',
  instagram: 'https://www.instagram.com/geacofi/',
  whatsapp: 'https://wa.me/message/KFA3BBGBV2PLA1',
  horarios: '', // ej: 'Lun a Sáb · 8 a 20 h'. Vacío = "Consultá por WhatsApp".
  pizarra: '', // mensaje del día en la pizarra, ej: 'Hoy: cold brew en promo'. Vacío = invita a dibujar.
}

export const PRODUCTOS: Producto[] = [
  { id: 'cafe-filtrado', nombre: 'Café filtrado', desc: 'Chemex o V60, granos de especialidad.', foto: '/img/cafe-filtrado.png', categoria: 'bebida' },
  { id: 'cafe-de-siempre', nombre: 'Café de siempre', desc: 'El de todos los días, bien hecho.', foto: '/img/cafe-de-siempre.png', categoria: 'bebida' },
  { id: 'cafe-frio', nombre: 'Café frío', desc: 'Con hielo y mucha cabeza fría.', foto: '/img/cafe-frio.png', categoria: 'bebida' },
  { id: 'rol-de-canela', nombre: 'Rol de canela', desc: 'Tibio, con glaseado.', foto: '/img/rol-de-canela.png', categoria: 'panaderia' },
  { id: 'medialuna', nombre: 'Medialuna', desc: 'De manteca, dorada y recién salida.', foto: '/img/medialuna.png', categoria: 'panaderia' },
  { id: 'tostado', nombre: 'Tostado', desc: 'Jamón y queso, pan crocante.', foto: '/img/tostado.png', categoria: 'panaderia' },
]
