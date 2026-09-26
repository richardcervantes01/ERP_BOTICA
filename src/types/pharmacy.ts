export type ExpirationStatus = 'vencido' | 'critico' | 'proximo' | 'vigente';

export type UserRole = 'superadmin' | 'tenant_admin' | 'cashier';

export interface User {
  id: string;
  email: string;
  password?: string;
  nombre: string;
  role: UserRole;
  tenantId?: string;
}

export interface TenantSettings {
  id: string;
  nombreBotica: string;
  ruc: string;
  direccion: string;
  telefono: string;
  emailContacto: string;
  regenteQF: string;
  colegiaturaQF: string;
  monedaSimbolo: string;
  igvPorcentaje: number;
  pieDeTicket: string;
  plan: 'basico' | 'pro' | 'enterprise';
  estadoLicencia: 'activa' | 'prueba' | 'suspendida' | 'vencida';
  fechaVencimientoLicencia: string;
  fechaRegistro: string;
}

export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  principioActivo: string;
  presentacion: string;
  categoria: string;
  laboratorio: string;
  lote: string;
  fechaVencimiento: string; // YYYY-MM-DD
  precioCosto: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  requiereReceta: boolean;
  ubicacion: string;
  estadoDisposicion: 'disponible' | 'cuarentena' | 'merma';
  descuentoPromocional?: number; // percentage e.g. 15 for 15%
}

export interface CartItem {
  product: Product;
  cantidad: number;
  precioAplicado: number;
  descuentoUnitario: number;
}

export type TipoComprobante = 'boleta' | 'factura' | 'ticket';
export type MetodoPago = 'efectivo' | 'yape_plin' | 'tarjeta' | 'transferencia';

export interface SaleItem {
  productId: string;
  codigo: string;
  nombre: string;
  principioActivo: string;
  lote: string;
  fechaVencimiento: string;
  cantidad: number;
  precioUnitario: number;
  descuentoUnitario: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  correlativo: string;
  tipoComprobante: TipoComprobante;
  fecha: string; // ISO String
  clienteId?: string;
  clienteNombre: string;
  clienteDocumento: string;
  items: SaleItem[];
  subtotal: number;
  igv: number;
  total: number;
  metodoPago: MetodoPago;
  montoRecibido?: number;
  vuelto?: number;
  vendedor: string;
  estado: 'completada' | 'anulada';
  motivoAnulacion?: string;
}

export interface Customer {
  id: string;
  documento: string; // DNI o RUC
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
  alergias?: string;
  comprasRealizadas: number;
  totalGastado: number;
  ultimaVisita?: string;
}

export interface CashExpense {
  id: string;
  hora: string;
  motivo: string;
  monto: number;
  responsable: string;
}

export interface CashRegister {
  estado: 'abierta' | 'cerrada';
  fechaApertura: string;
  saldoInicial: number;
  responsable: string;
  gastos: CashExpense[];
}

export interface DisposalAct {
  id: string;
  numeroActa: string;
  fecha: string;
  responsableQF: string;
  motivo: 'vencimiento' | 'deterioro' | 'rotura' | 'cuarentena_sanitaria';
  productos: {
    productId: string;
    nombre: string;
    lote: string;
    fechaVencimiento: string;
    cantidad: number;
    costoTotalPerdido: number;
  }[];
  observaciones: string;
  estado: 'ejecutada';
}
