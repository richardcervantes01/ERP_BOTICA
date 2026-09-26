export type ExpirationStatus = 'vencido' | 'critico' | 'proximo' | 'vigente';

export type UserRole = 'superadmin' | 'tenant_admin' | 'cashier';

export interface User {
  id: string;
  email: string;
  password?: string;
  nombre: string;
  role: UserRole;
  tenantId?: string;
  assignedModules?: string[]; // Allowed module IDs e.g. ['pos', 'inventario', 'clientes', 'vencimientos']
  activo?: boolean;
}

export interface Liquidacion {
  id: string;
  tenantId: string;
  tenantNombre: string;
  periodo: string;
  plan: string;
  monto: number;
  fechaPago: string;
  metodoPago: string;
  estado: 'pagado' | 'pendiente';
  comprobanteSaaS: string;
}

export interface SunatConfig {
  modo: 'beta' | 'produccion';
  ruc: string;
  usuarioSol: string;
  claveSol: string;
  endpointSunat: string;
  certificadoActivo: boolean;
  autoEnvio: boolean;
  serieBoleta: string;
  serieFactura: string;
  serieNotaCredito: string;
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
  codigoEstablecimientoDigemid: string; // CodEstab oficial DIGEMID (6-8 caracteres alfanuméricos)
  sunatConfig?: SunatConfig;
}

export interface ProductBatch {
  id: string;
  productId: string;
  numeroLote: string;
  registroSanitario: string;
  fechaFabricacion: string;
  fechaVencimiento: string; // YYYY-MM-DD
  stockUnidades: number; // Existencias en mínima unidad de dispensación
  estado: 'vigente' | 'proximo' | 'critico' | 'vencido' | 'cuarentena';
}

export type TipoOperacionDigemid = 'A' | 'B' | 'M'; // Alta, Baja, Modificación

export type UnidadDispensacion = 'caja' | 'blister' | 'fraccion';

export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  principioActivo: string;
  presentacion: string;
  categoria: string;
  laboratorio: string;
  lote: string; // Lote principal o lote FEFO preferente
  fechaVencimiento: string; // YYYY-MM-DD del lote activo más próximo
  precioCosto: number;
  precioVenta: number; // Precio estándar de venta (por empaque / unidad principal)
  stock: number; // Stock expresado en empaques principales (calculado desde mínimas unidades)
  stockMinimo: number;
  requiereReceta: boolean;
  ubicacion: string;
  estadoDisposicion: 'disponible' | 'cuarentena' | 'merma';
  descuentoPromocional?: number; // percentage e.g. 15 for 15%

  // --- REGLA 1: OBSERVATORIO DE PRECIOS DIGEMID (OPPF) ---
  codDigemid: string; // CodProd: Código oficial asignado por DIGEMID (ej. '01429')
  precio1Empaque: number; // Precio 1: Numérico, 2 decimales (por empaque/caja)
  precio2Fraccion: number; // Precio 2: Numérico, 2 decimales (precio unitario/fracción)
  tipoOperacionDigemid: TipoOperacionDigemid; // 'A' | 'B' | 'M'
  reportarDigemid: boolean; // Flag para inclusión en reporte mensual DIGEMID OPPF

  // --- REGLA 2: FEFO & TRAZABILIDAD POR LOTES ---
  lotes: ProductBatch[]; // Lista de lotes con fechas de vencimiento y stock individual

  // --- REGLA 3: FRACCIONAMIENTO MULTINIVEL ---
  unidadEmpaque: string; // Nivel 1: ej. 'Caja'
  unidadSubEmpaque?: string; // Nivel 2: ej. 'Blíster'
  unidadMinima: string; // Nivel 3: ej. 'Tableta', 'Cápsula', 'Ampolla'
  blistersPorCaja?: number; // ej. 10 blísteres por caja
  unidadesPorBlister?: number; // ej. 10 tabletas por blíster
  factorConversionTotal: number; // Total unidades mínimas por caja (ej. 10 * 10 = 100 pastillas)
  precioSubEmpaque?: number; // Precio por blíster (ej. S/ 3.50)
  stockMinimasUnidades: number; // Stock absoluto y exacto a la mínima unidad sin redondeo

  // --- REGLA 4: PRODUCTOS FISCALIZADOS & ESTUPEFACIENTES ---
  esFiscalizado: boolean; // Flag estupefacientes/psicotrópicos controlados por DIGEMID
  listaFiscalizacion?: 'Lista II' | 'Lista III' | 'Lista IV' | 'Lista V' | 'Ninguna';
}

export interface CartItem {
  product: Product;
  cantidad: number; // Cantidad seleccionada en la unidad elegida
  unidadDispensada: UnidadDispensacion; // 'caja' | 'blister' | 'fraccion'
  unidadesMinimasTotal: number; // Cantidad total calculada en mínimas unidades
  precioAplicado: number;
  descuentoUnitario: number;
  loteAsignadoFefo?: ProductBatch; // Lote asignado por algoritmo FEFO
}

export type TipoComprobante = 'boleta' | 'factura' | 'ticket';
export type MetodoPago = 'efectivo' | 'yape_plin' | 'tarjeta' | 'transferencia';

export interface LoteDespachado {
  loteId: string;
  numeroLote: string;
  fechaVencimiento: string;
  cantidadMinima: number;
}

export interface SaleItem {
  productId: string;
  codigo: string;
  nombre: string;
  principioActivo: string;
  lote: string;
  fechaVencimiento: string;
  cantidad: number;
  unidadDispensada: UnidadDispensacion;
  unidadesMinimas: number;
  lotesDespachados?: LoteDespachado[];
  precioUnitario: number;
  descuentoUnitario: number;
  subtotal: number;
}

export type SunatStatus = 'ACEPTADO' | 'RECHAZADO' | 'PENDIENTE_ENVIO' | 'ANULADO' | 'NO_APLICA';

export interface RecetaMedicaControlada {
  pacienteNombre: string;
  pacienteDocumentoTipo: 'DNI' | 'CE' | 'Pasaporte';
  pacienteDocumento: string;
  pacienteTelefono?: string;
  medicoNombre: string;
  medicoCMP: string; // Colegio Médico del Perú
  medicoEspecialidad?: string;
  recetaSerieFolio: string; // Folio de la receta física
  recetaFechaEmision: string; // YYYY-MM-DD
  diagnosticoCIE10?: string;
}

export interface Sale {
  id: string;
  tenantId?: string;
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
  cajeroId?: string;
  estado: 'completada' | 'anulada';
  motivoAnulacion?: string;

  // REGLA 4: Receta médica de fiscalizados / estupefacientes
  esVentaControlada?: boolean;
  datosReceta?: RecetaMedicaControlada;

  // SUNAT UBL 2.1 E-invoicing Attributes
  codigoTipoComprobante?: '01' | '03' | '07' | '00'; // 01=Factura, 03=Boleta, 07=Nota de Crédito, 00=Ticket
  serie?: string;
  numero?: number;
  sunatStatus?: SunatStatus;
  sunatResponseCode?: string;
  sunatDescription?: string;
  hashCPE?: string;
  qrCodeData?: string;
  xmlContent?: string;
  cdrContent?: string;
  fechaEnvioSunat?: string;
}

export interface LibroOficialControladosEntry {
  id: string;
  tenantId: string;
  saleId: string;
  correlativoVenta: string;
  fecha: string;
  productId: string;
  nombreMedicamento: string;
  principioActivo: string;
  presentacion: string;
  numeroLote: string;
  fechaVencimiento: string;
  cantidadMinima: number;
  unidadMinima: string;
  pacienteNombre: string;
  pacienteDni: string;
  medicoNombre: string;
  medicoCMP: string;
  recetaFolio: string;
  recetaFechaEmision: string;
  dispensadoPor: string;
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

export interface CierreTurnoCajero {
  id: string;
  tenantId: string;
  cajeroId: string;
  cajeroNombre: string;
  fechaApertura: string;
  fechaCierre: string;
  saldoInicial: number;
  totalVentasEfectivo: number;
  totalVentasYape: number;
  totalVentasTarjeta: number;
  totalVentasTransferencia: number;
  totalEfectivoTeorico: number; // SaldoInicial + EfectivoVendido
  efectivoDeclaradoPorCajero: number; // Conteo físico del cajero
  diferencia: number; // Declarado - Teórico (+ Sobrante, - Faltante)
  estadoRevision: 'pendiente_revision' | 'auditado_conforme' | 'auditado_observado';
  notasCajero?: string;
  notasAdministrador?: string;
  auditadoPor?: string;
  fechaAuditoria?: string;
}

export interface ArqueoGeneralDia {
  id: string;
  tenantId: string;
  fecha: string;
  responsableAdmin: string;
  saldoInicialTotal: number;
  ventasEfectivoTotal: number;
  ventasDigitalesTotal: number;
  egresosTotal: number;
  totalTeoricoEsperado: number;
  totalFisicoAuditado: number;
  discrepancia: number;
  estado: 'cuadrado' | 'con_diferencia';
  turnosAuditados: string[];
  observaciones: string;
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
