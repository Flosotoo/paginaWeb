export type EstadoReserva =
  | 'PENDIENTE'
  | 'EN_PREPARACION'
  | 'ETIQUETA_PENDIENTE'
  | 'LISTA_PARA_RETIRO'
  | 'ENTREGADA'
  | 'CANCELADA';

export type RolUsuario = 'APODERADO' | 'ENCARGADO' | 'ADMINISTRADOR' | 'AUTORIZADOR';

export interface Producto {
  id: number;
  sku: string;
  codigoBarras: string;
  nombre: string;
  descripcion: string;
  imagenUrl?: string;
  cursoNivel: string;
  materia: string;
  precioVenta: number;
  margenUtilidad?: number;
  cpp: number;
  stockFisico: number;
  stockReservado: number;
  stockCritico: number;
  categoria: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

export interface Alumno {
  id: number;
  rut: string;
  nombre: string;
  curso: string;
  edad: number;
  age?: number;
  familyId?: string;
  balance: number;
  saldoComprometido: number;
  saldoDisponible: number;
  activo: boolean;
}

export interface Reserva {
  id: string;
  codigo: string;
  codigoBolsa?: string;
  alumnoId: number;
  nombreAlumno: string;
  apoderadoId: string;
  total: number;
  estado: EstadoReserva;
  fechaCreacion: string;
  scanned?: Record<number, number>;
  items: Array<{
    id: number;
    name: string;
    qty: number;
    price: number;
    barcode?: string;
  }>;
}

export interface Usuario {
  id: string;
  rut: string;
  name: string;
  last: string;
  mail: string;
  type: RolUsuario;
  state: 'PRIMER_ACCESO' | 'ACTIVA' | 'BLOQUEADA' | 'INACTIVA';
}
