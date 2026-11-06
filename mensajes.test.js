import { describe, expect, it } from 'vitest'
import { ErrorApi, humano, textoEstado } from './mensajes.js'

describe('mensajes humanos del panel', () => {
  it('nunca muestra texto técnico', () => {
    for (const crudo of ['Error 500', 'SyntaxError: Unexpected token < in JSON', 'Failed to fetch', 'MongoServerError: E11000', 'undefined', 'TypeError: x is null']) {
      const t = humano(new ErrorApi(crudo, 500))
      expect(t).not.toMatch(/error \d|syntax|fetch|mongo|undefined|null|json/i)
      expect(t.length).toBeGreaterThan(20)
    }
  })
  it('respeta un mensaje del servidor que ya está en castellano', () => {
    expect(humano(new ErrorApi('El precio de «Medialuna» tiene que ser un número.', 400))).toBe('El precio de «Medialuna» tiene que ser un número.')
  })
  it('sin red y sin estado explica qué hacer', () => {
    expect(humano(new ErrorApi('Failed to fetch'))).toMatch(/internet/)
    expect(humano(new TypeError('Failed to fetch'))).toMatch(/internet/)
  })
  it('cada estado usa su propia frase', () => {
    expect(humano(new ErrorApi('', 413))).toMatch(/foto/)
    expect(humano(new ErrorApi('', 429))).toMatch(/minutos/)
    expect(humano(new ErrorApi('', 401))).toMatch(/sesión/)
    expect(humano(new ErrorApi('', 502))).toMatch(/de nuestro lado/)
  })
  it('el estado del pedido se explica sin jerga', () => {
    expect(textoEstado('rechazado', 'Nos quedamos sin medialunas').detalle).toBe('Nos quedamos sin medialunas.')
    expect(textoEstado('rechazado').tono).toBe('mal')
    expect(textoEstado('listo').titulo).toBe('Listo')
    expect(textoEstado('cualquiera').tono).toBe('espera')
  })
})
