import { expect, test } from 'vitest'
import { armarMensaje, detalleLinea, totales, urlWhatsapp } from './pedido-texto.js'

const medialuna = { nombre: 'Medialuna', cant: 2, precio: null, opc: { Servida: 'Tibia' }, nota: '' }
const cafe = { nombre: 'Café frío', cant: 1, precio: null, opc: {}, nota: 'poco hielo' }

test('el mensaje lleva productos, opciones, modalidad, horario y nombre', () => {
  const t = armarMensaje({ lineas: [medialuna, cafe], modo: 'llevar', hora: '09:30', nombre: 'Ana' })
  expect(t).toContain('a nombre de Ana')
  expect(t).toContain('• 2 × Medialuna')
  expect(t).toContain('Servida: Tibia')
  expect(t).toContain('"poco hielo"')
  expect(t).toContain('Modalidad: Para llevar')
  expect(t).toContain('Horario: 09:30 h')
  expect(t).toContain('Total: a confirmar')
  expect(t).not.toContain('Dirección')
})

test('con envío lleva dirección y costo a confirmar si no hay costo cargado', () => {
  const t = armarMensaje({ lineas: [medialuna], modo: 'envio', hora: '10:00', nombre: '', direccion: 'Belgrano 123', referencias: 'portón negro', envio: { costo: null } })
  expect(t).toContain('Dirección: Belgrano 123 (portón negro)')
  expect(t).toContain('Envío: a confirmar')
  expect(t).not.toContain('a nombre de')
})

test('el total solo existe si todo tiene precio', () => {
  const a = { ...medialuna, precio: 1000 }
  expect(totales([a, cafe], 'local').total).toBeNull()
  expect(totales([a], 'local').total).toBe(2000)
  expect(totales([a], 'envio', { costo: 500 }).total).toBe(2500)
  expect(totales([a], 'envio', { costo: null }).total).toBeNull()
  expect(totales([a], 'envio', { costo: 0, minimo: 3000 }).bajoMinimo).toBe(true)
  expect(totales([a], 'local', { minimo: 3000 }).bajoMinimo).toBe(false)
})

test('detalleLinea junta opciones y nota', () => {
  expect(detalleLinea({ opc: { Leche: 'Vegetal', Azúcar: 'Sin azúcar' }, nota: '' })).toBe('Leche: Vegetal · Azúcar: Sin azúcar')
  expect(detalleLinea({ opc: {}, nota: '' })).toBe('')
})

test('la url codifica el texto', () => {
  expect(urlWhatsapp('5491100000000', 'a b\nc')).toBe('https://wa.me/5491100000000?text=a%20b%0Ac')
})

test('el mensaje lleva el código del pedido para cruzarlo con el panel', () => {
  const m = armarMensaje({ lineas: [medialuna], modo: 'local', hora: '10:00', nombre: '', ref: 'A1B2' })
  expect(m.split('\n').at(-1)).toBe('Pedido #A1B2')
  expect(armarMensaje({ lineas: [medialuna], modo: 'local', hora: '10:00', nombre: '' })).not.toContain('Pedido #')
})
