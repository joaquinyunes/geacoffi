export const ESTADOS = ['recibido', 'aceptado', 'listo', 'entregado', 'rechazado'] as const;
export type Estado = (typeof ESTADOS)[number];

/** A qué estados se puede pasar desde cada uno (el local no puede "des-rechazar" un pedido). */
export const SIGUIENTES: Record<Estado, Estado[]> = {
  recibido: ['aceptado', 'rechazado'],
  aceptado: ['listo', 'entregado', 'rechazado'],
  listo: ['entregado'],
  entregado: [],
  rechazado: [],
};

export interface Linea { nombre: string; cant: number; precio: number | null; opc: Record<string, string>; nota: string }
export interface PedidoNuevo { id?: string; lineas: Linea[]; modo: 'local' | 'llevar' | 'envio'; hora: string; nombre: string; direccion: string; referencias: string; total: number | null; texto: string }

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const cadena = (v: unknown, max: number) => (typeof v === 'string' && v.length <= max ? v.trim() : null);

/** Valida el pedido que arma el carrito. Devuelve el pedido limpio o un mensaje humano. Se copian solo los campos conocidos (nada de operadores `$` ni campos de más). */
export function validarPedido(d: unknown): PedidoNuevo | string {
  if (!esObj(d)) return 'No pudimos leer tu pedido.';
  if (!Array.isArray(d.lineas) || d.lineas.length < 1 || d.lineas.length > 30) return 'El pedido tiene que tener entre 1 y 30 productos.';
  const lineas: Linea[] = [];
  for (const l of d.lineas) {
    if (!esObj(l)) return 'Hay un producto mal formado en tu pedido.';
    const nombre = cadena(l.nombre, 60), nota = cadena(l.nota ?? '', 80);
    const cant = l.cant, precio = l.precio ?? null;
    if (!nombre || nota === null) return 'Hay un producto con datos de más.';
    if (typeof cant !== 'number' || !Number.isInteger(cant) || cant < 1 || cant > 50) return 'La cantidad de un producto no es válida (de 1 a 50).';
    if (precio !== null && (typeof precio !== 'number' || !Number.isFinite(precio) || precio < 0 || precio > 10_000_000)) return 'Un precio no es válido.';
    const opc: Record<string, string> = {};
    const entradas = esObj(l.opc) ? Object.entries(l.opc) : [];
    if (entradas.length > 8) return 'Un producto tiene demasiadas opciones.';
    for (const [k, v] of entradas) {
      const clave = cadena(k, 40), valor = cadena(v, 40);
      if (!clave || valor === null || clave.startsWith('$') || clave.includes('.')) return 'Una opción de un producto no es válida.';
      opc[clave] = valor;
    }
    lineas.push({ nombre, cant, precio, opc, nota });
  }
  const modo = d.modo;
  if (modo !== 'local' && modo !== 'llevar' && modo !== 'envio') return 'Elegí cómo querés tu pedido.';
  const hora = cadena(d.hora, 5), nombre = cadena(d.nombre ?? '', 40), direccion = cadena(d.direccion ?? '', 90), referencias = cadena(d.referencias ?? '', 80), texto = cadena(d.texto, 2000);
  if (!hora || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return 'La hora no es válida.';
  if (nombre === null || direccion === null || referencias === null) return 'Un dato del pedido es demasiado largo.';
  if (modo === 'envio' && !direccion) return 'Falta la dirección para el envío.';
  if (!texto) return 'Falta el detalle del pedido.';
  const total = d.total ?? null;
  if (total !== null && (typeof total !== 'number' || !Number.isFinite(total) || total < 0 || total > 100_000_000)) return 'El total no es válido.';
  const id = d.id === undefined ? undefined : typeof d.id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(d.id) ? d.id : null;
  if (id === null) return 'El código del pedido no es válido.';
  return { id, lineas, modo, hora, nombre, direccion, referencias, total, texto };
}

/** Código corto para ver en el WhatsApp y en el panel (los 4 primeros caracteres del id). */
export const codigoCorto = (id: string) => id.slice(0, 4).toUpperCase();
