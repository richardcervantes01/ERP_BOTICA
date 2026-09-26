import { Product, Customer, Sale, CashRegister, DisposalAct, User, TenantSettings, Liquidacion, CierreTurnoCajero, ArqueoGeneralDia, LibroOficialControladosEntry } from '../types/pharmacy';

function getDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

export const INITIAL_TENANTS: TenantSettings[] = [
  {
    id: 'tenant-1',
    nombreBotica: 'FarmaControl - Botica San José',
    ruc: '20601892341',
    direccion: 'Av. Aviación 2840, San Borja - Lima',
    telefono: '(01) 480-1200 / 984 512 890',
    emailContacto: 'contacto@boticasanjose.pe',
    regenteQF: 'Q.F. Fernando Ramos',
    colegiaturaQF: 'CQFP 14209',
    monedaSimbolo: 'S/',
    igvPorcentaje: 18,
    pieDeTicket: '¡Gracias por su preferencia! Verifique su medicina antes de retirarse de mostrador.',
    plan: 'pro',
    estadoLicencia: 'activa',
    fechaVencimientoLicencia: getDateOffset(365),
    fechaRegistro: getDateOffset(-60),
    codigoEstablecimientoDigemid: '0048201' // CodEstab oficial DIGEMID (7 caracteres)
  },
  {
    id: 'tenant-2',
    nombreBotica: 'Botica & Salud Santa María',
    ruc: '20789123451',
    direccion: 'Calle Los Pinos 302, Miraflores',
    telefono: '992 445 112',
    emailContacto: 'administracion@santamariafarma.pe',
    regenteQF: 'Q.F. Vanessa Paredes',
    colegiaturaQF: 'CQFP 18502',
    monedaSimbolo: 'S/',
    igvPorcentaje: 18,
    pieDeTicket: 'Salud y bienestar para su familia. Medicamentos refrigerados no tienen devolución.',
    plan: 'basico',
    estadoLicencia: 'activa',
    fechaVencimientoLicencia: getDateOffset(90),
    fechaRegistro: getDateOffset(-30),
    codigoEstablecimientoDigemid: '0075192'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    email: 'admin@farmacontrol.com',
    password: 'admin123',
    nombre: 'Super Administrador (Tú - Dueño del SaaS)',
    role: 'superadmin',
    activo: true
  },
  {
    id: 'user-tenant-1',
    email: 'demo@boticasanjose.pe',
    password: 'botica123',
    nombre: 'Dr. Carlos Mendoza (Dueño de Botica San José)',
    role: 'tenant_admin',
    tenantId: 'tenant-1',
    activo: true
  },
  {
    id: 'user-cajero-1',
    email: 'cajero@botica.pe',
    password: 'caja123',
    nombre: 'Téc. Lucía Gómez (Cajera Principal)',
    role: 'cashier',
    tenantId: 'tenant-1',
    assignedModules: ['pos', 'inventario', 'clientes'],
    activo: true
  },
  {
    id: 'user-cajero-2',
    email: 'roberto@botica.pe',
    password: 'caja456',
    nombre: 'Roberto Díaz (Cajero Turno Tarde)',
    role: 'cashier',
    tenantId: 'tenant-1',
    assignedModules: ['pos'],
    activo: true
  }
];

export const INITIAL_LIQUIDACIONES: Liquidacion[] = [
  {
    id: 'liq-001',
    tenantId: 'tenant-1',
    tenantNombre: 'FarmaControl - Botica San José',
    periodo: 'Septiembre 2026',
    plan: 'Plan Pro Anual',
    monto: 1490.00,
    fechaPago: getDateOffset(-20),
    metodoPago: 'Transferencia BCP',
    estado: 'pagado',
    comprobanteSaaS: 'FAC-SAAS-0089'
  },
  {
    id: 'liq-002',
    tenantId: 'tenant-2',
    tenantNombre: 'Botica & Salud Santa María',
    periodo: 'Septiembre 2026',
    plan: 'Plan Básico Mensual',
    monto: 120.00,
    fechaPago: getDateOffset(-10),
    metodoPago: 'Yape Empresa',
    estado: 'pagado',
    comprobanteSaaS: 'BOL-SAAS-0142'
  },
  {
    id: 'liq-003',
    tenantId: 'tenant-2',
    tenantNombre: 'Botica & Salud Santa María',
    periodo: 'Octubre 2026',
    plan: 'Plan Básico Mensual',
    monto: 120.00,
    fechaPago: getDateOffset(5),
    metodoPago: 'Pendiente',
    estado: 'pendiente',
    comprobanteSaaS: 'POR EMITIR'
  }
];

export const INITIAL_CIERRES_TURNO: CierreTurnoCajero[] = [
  {
    id: 'cierre-001',
    tenantId: 'tenant-1',
    cajeroId: 'user-cajero',
    cajeroNombre: 'Téc. Lucía Gómez (Cajera Mostrador)',
    fechaApertura: new Date(Date.now() - 3600000 * 8).toISOString(),
    fechaCierre: new Date(Date.now() - 3600000 * 1).toISOString(),
    saldoInicial: 150.00,
    totalVentasEfectivo: 85.50,
    totalVentasYape: 45.00,
    totalVentasTarjeta: 62.00,
    totalVentasTransferencia: 0,
    totalEfectivoTeorico: 235.50,
    efectivoDeclaradoPorCajero: 235.50,
    diferencia: 0.00,
    estadoRevision: 'pendiente_revision',
    notasCajero: 'Turno mañana entregado completo, billetes revisados.'
  },
  {
    id: 'cierre-002',
    tenantId: 'tenant-1',
    cajeroId: 'user-cajero-2',
    cajeroNombre: 'Roberto Díaz (Cajero Turno Tarde)',
    fechaApertura: new Date(Date.now() - 3600000 * 24).toISOString(),
    fechaCierre: new Date(Date.now() - 3600000 * 16).toISOString(),
    saldoInicial: 100.00,
    totalVentasEfectivo: 140.00,
    totalVentasYape: 80.00,
    totalVentasTarjeta: 0,
    totalVentasTransferencia: 0,
    totalEfectivoTeorico: 240.00,
    efectivoDeclaradoPorCajero: 238.00,
    diferencia: -2.00,
    estadoRevision: 'auditado_observado',
    notasCajero: 'Faltante de 2 soles por redondeo de monedas',
    notasAdministrador: 'Aceptado con descuento justificado por cambio',
    auditadoPor: 'Q.F. Fernando Ramos',
    fechaAuditoria: getDateOffset(-1)
  }
];

export const INITIAL_ARQUEOS_DIARIOS: ArqueoGeneralDia[] = [
  {
    id: 'arq-001',
    tenantId: 'tenant-1',
    fecha: getDateOffset(-1),
    responsableAdmin: 'Q.F. Fernando Ramos',
    saldoInicialTotal: 250.00,
    ventasEfectivoTotal: 320.00,
    ventasDigitalesTotal: 195.00,
    egresosTotal: 25.00,
    totalTeoricoEsperado: 545.00,
    totalFisicoAuditado: 545.00,
    discrepancia: 0,
    estado: 'cuadrado',
    turnosAuditados: ['cierre-002'],
    observaciones: 'Cierre diario cuadrado conforme a libros contables y kárdex'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    codigo: '7750123001',
    nombre: 'Paracetamol 500mg (Caja x 100)',
    principioActivo: 'Paracetamol',
    presentacion: 'Caja x 100 tabletas',
    categoria: 'Analgésicos y Antipiréticos',
    laboratorio: 'Farmindustria',
    lote: 'LT-2026A',
    fechaVencimiento: getDateOffset(45), // Lote más próximo FEFO
    precioCosto: 7.20,
    precioVenta: 12.50,
    stock: 45,
    stockMinimo: 10,
    requiereReceta: false,
    ubicacion: 'Anaquel A-1',
    estadoDisposicion: 'disponible',

    // DIGEMID OPPF
    codDigemid: '01429',
    precio1Empaque: 12.50,
    precio2Fraccion: 0.20,
    tipoOperacionDigemid: 'M',
    reportarDigemid: true,

    // Fraccionamiento Multinivel (1 Caja = 10 blísteres = 100 pastillas)
    unidadEmpaque: 'Caja',
    unidadSubEmpaque: 'Blíster',
    unidadMinima: 'Pastilla',
    blistersPorCaja: 10,
    unidadesPorBlister: 10,
    factorConversionTotal: 100,
    precioSubEmpaque: 1.50,
    stockMinimasUnidades: 4500, // 45 cajas = 4,500 pastillas exactas

    // Lotes y FEFO
    lotes: [
      {
        id: 'lot-1-1',
        productId: 'prod-1',
        numeroLote: 'LT-2026A',
        registroSanitario: 'EE-01429-01',
        fechaFabricacion: getDateOffset(-300),
        fechaVencimiento: getDateOffset(45), // FEFO #1
        stockUnidades: 1500,
        estado: 'proximo'
      },
      {
        id: 'lot-1-2',
        productId: 'prod-1',
        numeroLote: 'LT-2026B',
        registroSanitario: 'EE-01429-01',
        fechaFabricacion: getDateOffset(-100),
        fechaVencimiento: getDateOffset(240), // FEFO #2
        stockUnidades: 3000,
        estado: 'vigente'
      }
    ],

    esFiscalizado: false,
    listaFiscalizacion: 'Ninguna'
  },
  {
    id: 'prod-2',
    codigo: '7750123002',
    nombre: 'Amoxicilina 500mg (Caja x 50)',
    principioActivo: 'Amoxicilina Trihidrato',
    presentacion: 'Caja x 50 cápsulas',
    categoria: 'Antibióticos',
    laboratorio: 'Genfar',
    lote: 'LT-4401X',
    fechaVencimiento: getDateOffset(18), // Crítico: 18 días
    precioCosto: 11.50,
    precioVenta: 18.00,
    stock: 4,
    stockMinimo: 10,
    requiereReceta: true, // Requiere Receta médica obligatoria
    ubicacion: 'Anaquel B-3',
    estadoDisposicion: 'disponible',
    descuentoPromocional: 15,

    codDigemid: '00854',
    precio1Empaque: 18.00,
    precio2Fraccion: 0.50,
    tipoOperacionDigemid: 'M',
    reportarDigemid: true,

    unidadEmpaque: 'Caja',
    unidadSubEmpaque: 'Blíster',
    unidadMinima: 'Cápsula',
    blistersPorCaja: 5,
    unidadesPorBlister: 10,
    factorConversionTotal: 50,
    precioSubEmpaque: 4.00,
    stockMinimasUnidades: 200,

    lotes: [
      {
        id: 'lot-2-1',
        productId: 'prod-2',
        numeroLote: 'LT-4401X',
        registroSanitario: 'EE-00854-02',
        fechaFabricacion: getDateOffset(-500),
        fechaVencimiento: getDateOffset(18),
        stockUnidades: 200,
        estado: 'critico'
      }
    ],

    esFiscalizado: false,
    listaFiscalizacion: 'Ninguna'
  },
  {
    id: 'prod-ctrl-1',
    codigo: '7750123099',
    nombre: 'Clonazepam 2mg (Caja x 30)',
    principioActivo: 'Clonazepam',
    presentacion: 'Caja x 30 comprimidos ranurados',
    categoria: 'Psicotrópicos y Sedantes',
    laboratorio: 'Roche / Medifarma',
    lote: 'LT-CLONA88',
    fechaVencimiento: getDateOffset(300),
    precioCosto: 15.00,
    precioVenta: 26.00,
    stock: 12,
    stockMinimo: 4,
    requiereReceta: true,
    esFiscalizado: true, // PSICOTRÓPICO CONTROLADO POR DIGEMID
    listaFiscalizacion: 'Lista IV',
    ubicacion: 'Caja Fuerte / Armario Bajo Llave',
    estadoDisposicion: 'disponible',

    codDigemid: '02891',
    precio1Empaque: 26.00,
    precio2Fraccion: 1.00,
    tipoOperacionDigemid: 'M',
    reportarDigemid: true,

    unidadEmpaque: 'Caja',
    unidadSubEmpaque: 'Blíster',
    unidadMinima: 'Comprimido',
    blistersPorCaja: 3,
    unidadesPorBlister: 10,
    factorConversionTotal: 30,
    precioSubEmpaque: 9.00,
    stockMinimasUnidades: 360,

    lotes: [
      {
        id: 'lot-ctrl-1',
        productId: 'prod-ctrl-1',
        numeroLote: 'LT-CLONA88',
        registroSanitario: 'EN-02891-04',
        fechaFabricacion: getDateOffset(-120),
        fechaVencimiento: getDateOffset(300),
        stockUnidades: 360,
        estado: 'vigente'
      }
    ]
  },
  {
    id: 'prod-ctrl-2',
    codigo: '7750123098',
    nombre: 'Tramadol Clorhidrato 50mg (Caja x 20)',
    principioActivo: 'Tramadol Clorhidrato',
    presentacion: 'Caja x 20 cápsulas',
    categoria: 'Analgésicos Narcóticos / Estupefacientes',
    laboratorio: 'Grünenthal',
    lote: 'LT-TRMD12',
    fechaVencimiento: getDateOffset(400),
    precioCosto: 22.00,
    precioVenta: 38.50,
    stock: 8,
    stockMinimo: 3,
    requiereReceta: true,
    esFiscalizado: true, // ESTUPEFACIENTE CONTROLADO POR DIGEMID
    listaFiscalizacion: 'Lista II',
    ubicacion: 'Caja Fuerte / Armario Bajo Llave',
    estadoDisposicion: 'disponible',

    codDigemid: '03411',
    precio1Empaque: 38.50,
    precio2Fraccion: 2.10,
    tipoOperacionDigemid: 'M',
    reportarDigemid: true,

    unidadEmpaque: 'Caja',
    unidadSubEmpaque: 'Blíster',
    unidadMinima: 'Cápsula',
    blistersPorCaja: 2,
    unidadesPorBlister: 10,
    factorConversionTotal: 20,
    precioSubEmpaque: 19.50,
    stockMinimasUnidades: 160,

    lotes: [
      {
        id: 'lot-ctrl-2',
        productId: 'prod-ctrl-2',
        numeroLote: 'LT-TRMD12',
        registroSanitario: 'EE-03411-01',
        fechaFabricacion: getDateOffset(-80),
        fechaVencimiento: getDateOffset(400),
        stockUnidades: 160,
        estado: 'vigente'
      }
    ]
  },
  {
    id: 'prod-3',
    codigo: '7750123003',
    nombre: 'Ibuprofeno 400mg (Blíster x 10)',
    principioActivo: 'Ibuprofeno',
    presentacion: 'Blíster x 10 tabletas',
    categoria: 'Antiinflamatorios',
    laboratorio: 'Portugal',
    lote: 'LT-9912B',
    fechaVencimiento: getDateOffset(500),
    precioCosto: 4.80,
    precioVenta: 8.50,
    stock: 32,
    stockMinimo: 8,
    requiereReceta: false,
    ubicacion: 'Anaquel A-2',
    estadoDisposicion: 'disponible',

    codDigemid: '00922',
    precio1Empaque: 8.50,
    precio2Fraccion: 0.90,
    tipoOperacionDigemid: 'M',
    reportarDigemid: true,

    unidadEmpaque: 'Caja',
    unidadSubEmpaque: 'Blíster',
    unidadMinima: 'Tableta',
    blistersPorCaja: 1,
    unidadesPorBlister: 10,
    factorConversionTotal: 10,
    precioSubEmpaque: 8.50,
    stockMinimasUnidades: 320,

    lotes: [
      {
        id: 'lot-3-1',
        productId: 'prod-3',
        numeroLote: 'LT-9912B',
        registroSanitario: 'EE-00922-03',
        fechaFabricacion: getDateOffset(-200),
        fechaVencimiento: getDateOffset(500),
        stockUnidades: 320,
        estado: 'vigente'
      }
    ],
    esFiscalizado: false,
    listaFiscalizacion: 'Ninguna'
  },
  {
    id: 'prod-8',
    codigo: '7750123008',
    nombre: 'Ciprofloxacino 500mg (Caja x 10) [LOTE EXPIRADO]',
    principioActivo: 'Ciprofloxacino Clorhidrato',
    presentacion: 'Caja x 10 tabletas',
    categoria: 'Antibióticos',
    laboratorio: 'Farmindustria',
    lote: 'LT-CP109',
    fechaVencimiento: getDateOffset(-12), // VENCIDO hace 12 días -> BLOQUEO DURO
    precioCosto: 9.00,
    precioVenta: 16.50,
    stock: 5,
    stockMinimo: 5,
    requiereReceta: true,
    ubicacion: 'Área Cuarentena Q-1',
    estadoDisposicion: 'cuarentena',

    codDigemid: '00344',
    precio1Empaque: 16.50,
    precio2Fraccion: 1.80,
    tipoOperacionDigemid: 'B', // Baja
    reportarDigemid: true,

    unidadEmpaque: 'Caja',
    unidadSubEmpaque: 'Blíster',
    unidadMinima: 'Tableta',
    blistersPorCaja: 1,
    unidadesPorBlister: 10,
    factorConversionTotal: 10,
    precioSubEmpaque: 16.50,
    stockMinimasUnidades: 50,

    lotes: [
      {
        id: 'lot-8-1',
        productId: 'prod-8',
        numeroLote: 'LT-CP109',
        registroSanitario: 'EE-00344-01',
        fechaFabricacion: getDateOffset(-700),
        fechaVencimiento: getDateOffset(-12),
        stockUnidades: 50,
        estado: 'vencido'
      }
    ],
    esFiscalizado: false,
    listaFiscalizacion: 'Ninguna'
  },
  {
    id: 'prod-6',
    codigo: '7750123006',
    nombre: 'Omeprazol 20mg (Caja x 30)',
    principioActivo: 'Omeprazol',
    presentacion: 'Caja x 30 cápsulas con microgránulos',
    categoria: 'Gastroenterología',
    laboratorio: 'Bago',
    lote: 'LT-OM221',
    fechaVencimiento: getDateOffset(420),
    precioCosto: 8.50,
    precioVenta: 14.00,
    stock: 18,
    stockMinimo: 6,
    requiereReceta: false,
    ubicacion: 'Anaquel D-1',
    estadoDisposicion: 'disponible',

    codDigemid: '01850',
    precio1Empaque: 14.00,
    precio2Fraccion: 0.60,
    tipoOperacionDigemid: 'M',
    reportarDigemid: true,

    unidadEmpaque: 'Caja',
    unidadSubEmpaque: 'Blíster',
    unidadMinima: 'Cápsula',
    blistersPorCaja: 3,
    unidadesPorBlister: 10,
    factorConversionTotal: 30,
    precioSubEmpaque: 5.00,
    stockMinimasUnidades: 540,

    lotes: [
      {
        id: 'lot-6-1',
        productId: 'prod-6',
        numeroLote: 'LT-OM221',
        registroSanitario: 'EE-01850-02',
        fechaFabricacion: getDateOffset(-150),
        fechaVencimiento: getDateOffset(420),
        stockUnidades: 540,
        estado: 'vigente'
      }
    ],
    esFiscalizado: false,
    listaFiscalizacion: 'Ninguna'
  },
  {
    id: 'prod-7',
    codigo: '7750123007',
    nombre: 'Loratadina 10mg (Caja x 30)',
    principioActivo: 'Loratadina',
    presentacion: 'Caja x 30 tabletas',
    categoria: 'Antihistamínicos',
    laboratorio: 'Genfar',
    lote: 'LT-LR882',
    fechaVencimiento: getDateOffset(22), // Crítico: 22 días
    precioCosto: 6.00,
    precioVenta: 11.00,
    stock: 8,
    stockMinimo: 10,
    requiereReceta: false,
    ubicacion: 'Anaquel C-2',
    estadoDisposicion: 'disponible',
    descuentoPromocional: 20,

    codDigemid: '01290',
    precio1Empaque: 11.00,
    precio2Fraccion: 0.45,
    tipoOperacionDigemid: 'M',
    reportarDigemid: true,

    unidadEmpaque: 'Caja',
    unidadSubEmpaque: 'Blíster',
    unidadMinima: 'Tableta',
    blistersPorCaja: 3,
    unidadesPorBlister: 10,
    factorConversionTotal: 30,
    precioSubEmpaque: 4.00,
    stockMinimasUnidades: 240,

    lotes: [
      {
        id: 'lot-7-1',
        productId: 'prod-7',
        numeroLote: 'LT-LR882',
        registroSanitario: 'EE-01290-01',
        fechaFabricacion: getDateOffset(-600),
        fechaVencimiento: getDateOffset(22),
        stockUnidades: 240,
        estado: 'critico'
      }
    ],
    esFiscalizado: false,
    listaFiscalizacion: 'Ninguna'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    documento: '45892341',
    nombre: 'María Elena Quispe Flores',
    telefono: '984 512 890',
    email: 'maria.quispe@gmail.com',
    direccion: 'Av. Las Palmeras 412, San Isidro',
    alergias: 'Penicilina y derivados',
    comprasRealizadas: 8,
    totalGastado: 215.50,
    ultimaVisita: getDateOffset(-2)
  },
  {
    id: 'cust-2',
    documento: '10745239',
    nombre: 'Carlos Alberto Mendoza R.',
    telefono: '992 143 876',
    email: 'cmendoza@empresa.pe',
    direccion: 'Jr. Huancavelica 780',
    alergias: 'Ninguna conocida',
    comprasRealizadas: 5,
    totalGastado: 142.00,
    ultimaVisita: getDateOffset(-5)
  },
  {
    id: 'cust-3',
    documento: '20601248911',
    nombre: 'Clínica Santa Beatriz S.A.C.',
    telefono: '01 445-9821',
    email: 'compras@santabeatriz.com.pe',
    direccion: 'Calle Los Sauces 102',
    alergias: 'Cuenta Corporativa',
    comprasRealizadas: 14,
    totalGastado: 1850.00,
    ultimaVisita: getDateOffset(-1)
  },
  {
    id: 'cust-4',
    documento: '71298453',
    nombre: 'Ana Lucía Torres Vega',
    telefono: '971 654 321',
    email: 'anatorres@outlook.com',
    direccion: 'Urb. Los Rosales Mz B Lt 4',
    alergias: 'Sulfas, AINEs en dosis altas',
    comprasRealizadas: 3,
    totalGastado: 78.50,
    ultimaVisita: getDateOffset(-8)
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-101',
    tenantId: 'tenant-1',
    correlativo: 'B001-000142',
    tipoComprobante: 'boleta',
    fecha: new Date(Date.now() - 3600000 * 4).toISOString(),
    clienteNombre: 'María Elena Quispe Flores',
    clienteDocumento: '45892341',
    items: [
      {
        productId: 'prod-1',
        codigo: '7750123001',
        nombre: 'Paracetamol 500mg (Caja x 100)',
        principioActivo: 'Paracetamol',
        lote: 'LT-2026A',
        fechaVencimiento: getDateOffset(240),
        cantidad: 1,
        precioUnitario: 12.50,
        descuentoUnitario: 0,
        subtotal: 12.50
      },
      {
        productId: 'prod-3',
        codigo: '7750123003',
        nombre: 'Ibuprofeno 400mg (Blíster x 10)',
        principioActivo: 'Ibuprofeno',
        lote: 'LT-9912B',
        fechaVencimiento: getDateOffset(500),
        cantidad: 2,
        precioUnitario: 8.50,
        descuentoUnitario: 0,
        subtotal: 17.00
      }
    ],
    subtotal: 25.00,
    igv: 4.50,
    total: 29.50,
    metodoPago: 'yape_plin',
    montoRecibido: 29.50,
    vuelto: 0,
    vendedor: 'Téc. Lucía Gómez (Cajera Principal)',
    cajeroId: 'user-cajero-1',
    estado: 'completada'
  },
  {
    id: 'sale-102',
    tenantId: 'tenant-1',
    correlativo: 'T001-000854',
    tipoComprobante: 'ticket',
    fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
    clienteNombre: 'Cliente Ocasional (Público General)',
    clienteDocumento: '00000000',
    items: [
      {
        productId: 'prod-4',
        codigo: '7750123004',
        nombre: 'Alcohol Etílico 70° 1 Litro',
        principioActivo: 'Alcohol Etílico 70%',
        lote: 'LT-1020',
        fechaVencimiento: getDateOffset(700),
        cantidad: 2,
        precioUnitario: 10.00,
        descuentoUnitario: 0,
        subtotal: 20.00
      }
    ],
    subtotal: 16.95,
    igv: 3.05,
    total: 20.00,
    metodoPago: 'efectivo',
    montoRecibido: 50.00,
    vuelto: 30.00,
    vendedor: 'Roberto Díaz (Cajero Turno Tarde)',
    cajeroId: 'user-cajero-2',
    estado: 'completada'
  },
  {
    id: 'sale-103',
    tenantId: 'tenant-1',
    correlativo: 'B001-000143',
    tipoComprobante: 'boleta',
    fecha: new Date(Date.now() - 3600000 * 1).toISOString(),
    clienteNombre: 'Carlos Alberto Mendoza R.',
    clienteDocumento: '10745239',
    items: [
      {
        productId: 'prod-6',
        codigo: '7750123006',
        nombre: 'Omeprazol 20mg (Caja x 30)',
        principioActivo: 'Omeprazol',
        lote: 'LT-OM221',
        fechaVencimiento: getDateOffset(420),
        cantidad: 1,
        precioUnitario: 14.00,
        descuentoUnitario: 0,
        subtotal: 14.00
      },
      {
        productId: 'prod-5',
        codigo: '7750123005',
        nombre: 'Azitromicina 500mg (Caja x 3)',
        principioActivo: 'Azitromicina',
        lote: 'LT-AZ501',
        fechaVencimiento: getDateOffset(350),
        cantidad: 1,
        precioUnitario: 22.00,
        descuentoUnitario: 0,
        subtotal: 22.00
      }
    ],
    subtotal: 30.51,
    igv: 5.49,
    total: 36.00,
    metodoPago: 'tarjeta',
    montoRecibido: 36.00,
    vuelto: 0,
    vendedor: 'Téc. Lucía Gómez (Cajera Principal)',
    cajeroId: 'user-cajero-1',
    estado: 'completada'
  },
  {
    id: 'sale-201',
    tenantId: 'tenant-2',
    correlativo: 'B001-000010',
    tipoComprobante: 'boleta',
    fecha: new Date(Date.now() - 3600000 * 5).toISOString(),
    clienteNombre: 'Paciente Farmacia Santa María',
    clienteDocumento: '44991122',
    items: [
      {
        productId: 'prod-1',
        codigo: '7750123001',
        nombre: 'Paracetamol 500mg (Caja x 100)',
        principioActivo: 'Paracetamol',
        lote: 'LT-2026A',
        fechaVencimiento: getDateOffset(240),
        cantidad: 2,
        precioUnitario: 12.50,
        descuentoUnitario: 0,
        subtotal: 25.00
      }
    ],
    subtotal: 21.19,
    igv: 3.81,
    total: 25.00,
    metodoPago: 'efectivo',
    montoRecibido: 30.00,
    vuelto: 5.00,
    vendedor: 'Q.F. Vanessa Paredes',
    estado: 'completada'
  }
];

export const INITIAL_CASH_REGISTER: CashRegister = {
  estado: 'abierta',
  fechaApertura: new Date().toISOString(),
  saldoInicial: 150.00,
  responsable: 'Q.F. Fernando Ramos',
  gastos: [
    {
      id: 'g-1',
      hora: '10:15 AM',
      motivo: 'Compra de bolsas biodegradables y rollos térmicos',
      monto: 25.00,
      responsable: 'Q.F. Fernando Ramos'
    }
  ]
};

export const INITIAL_DISPOSAL_ACTS: DisposalAct[] = [
  {
    id: 'acta-001',
    numeroActa: 'ACTA-BAJA-2026-004',
    fecha: getDateOffset(-10),
    responsableQF: 'Q.F. Fernando Ramos (CQFP 14209)',
    motivo: 'vencimiento',
    productos: [
      {
        productId: 'old-1',
        nombre: 'Diclofenaco 50mg Gel 30g',
        lote: 'LT-DC99',
        fechaVencimiento: getDateOffset(-15),
        cantidad: 4,
        costoTotalPerdido: 24.00
      }
    ],
    observaciones: 'Retiro y descarte conforme a la normativa sanitaria de control de sustancias y medicamentos caducos.',
    estado: 'ejecutada'
  }
];

export const INITIAL_LIBRO_CONTROLADOS: LibroOficialControladosEntry[] = [
  {
    id: 'lib-001',
    tenantId: 'tenant-1',
    saleId: 'sale-ctrl-001',
    correlativoVenta: 'B001-000139',
    fecha: getDateOffset(-2),
    productId: 'prod-ctrl-1',
    nombreMedicamento: 'Clonazepam 2mg (Caja x 30)',
    principioActivo: 'Clonazepam',
    presentacion: 'Caja x 30 comprimidos',
    numeroLote: 'LT-CLONA88',
    fechaVencimiento: getDateOffset(300),
    cantidadMinima: 30, // 30 comprimidos
    unidadMinima: 'Comprimido',
    pacienteNombre: 'María Elena Quispe Flores',
    pacienteDni: '45892341',
    medicoNombre: 'Dr. Alejandro Benavides Vargas',
    medicoCMP: '48291',
    recetaFolio: 'REC-PSI-009842',
    recetaFechaEmision: getDateOffset(-3),
    dispensadoPor: 'Q.F. Fernando Ramos (CQFP 14209)'
  }
];
