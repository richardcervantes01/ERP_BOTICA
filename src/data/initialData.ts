import { Product, Customer, Sale, CashRegister, DisposalAct, User, TenantSettings } from '../types/pharmacy';

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
    fechaRegistro: getDateOffset(-60)
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
    fechaRegistro: getDateOffset(-30)
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    email: 'admin@farmacontrol.com',
    password: 'admin123',
    nombre: 'Super Administrador (Tú - Dueño del SaaS)',
    role: 'superadmin'
  },
  {
    id: 'user-tenant-1',
    email: 'demo@boticasanjose.pe',
    password: 'botica123',
    nombre: 'Dr. Carlos Mendoza (Dueño de Botica)',
    role: 'tenant_admin',
    tenantId: 'tenant-1'
  },
  {
    id: 'user-cajero',
    email: 'cajero@botica.pe',
    password: 'caja123',
    nombre: 'Téc. Lucía Gómez (Cajera Mostrador)',
    role: 'cashier',
    tenantId: 'tenant-1'
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
    fechaVencimiento: getDateOffset(240), // 8 months
    precioCosto: 7.20,
    precioVenta: 12.50,
    stock: 45,
    stockMinimo: 10,
    requiereReceta: false,
    ubicacion: 'Anaquel A-1',
    estadoDisposicion: 'disponible'
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
    stock: 4, // Stock bajo
    stockMinimo: 10,
    requiereReceta: true,
    ubicacion: 'Anaquel B-3',
    estadoDisposicion: 'disponible',
    descuentoPromocional: 15
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
    estadoDisposicion: 'disponible'
  },
  {
    id: 'prod-4',
    codigo: '7750123004',
    nombre: 'Alcohol Etílico 70° 1 Litro',
    principioActivo: 'Alcohol Etílico 70%',
    presentacion: 'Frasco 1000ml',
    categoria: 'Antisépticos y Curación',
    laboratorio: 'Alkofarma',
    lote: 'LT-1020',
    fechaVencimiento: getDateOffset(700),
    precioCosto: 6.00,
    precioVenta: 10.00,
    stock: 15,
    stockMinimo: 5,
    requiereReceta: false,
    ubicacion: 'Estante Inferior C',
    estadoDisposicion: 'disponible'
  },
  {
    id: 'prod-5',
    codigo: '7750123005',
    nombre: 'Azitromicina 500mg (Caja x 3)',
    principioActivo: 'Azitromicina',
    presentacion: 'Caja x 3 tabletas recubiertas',
    categoria: 'Antibióticos',
    laboratorio: 'Medifarma',
    lote: 'LT-AZ501',
    fechaVencimiento: getDateOffset(350),
    precioCosto: 14.00,
    precioVenta: 22.00,
    stock: 22,
    stockMinimo: 6,
    requiereReceta: true,
    ubicacion: 'Anaquel B-2',
    estadoDisposicion: 'disponible'
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
    estadoDisposicion: 'disponible'
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
    descuentoPromocional: 20
  },
  {
    id: 'prod-8',
    codigo: '7750123008',
    nombre: 'Ciprofloxacino 500mg (Caja x 10)',
    principioActivo: 'Ciprofloxacino Clorhidrato',
    presentacion: 'Caja x 10 tabletas',
    categoria: 'Antibióticos',
    laboratorio: 'Farmindustria',
    lote: 'LT-CP109',
    fechaVencimiento: getDateOffset(-12), // VENCIDO: hace 12 días
    precioCosto: 9.00,
    precioVenta: 16.50,
    stock: 5,
    stockMinimo: 5,
    requiereReceta: true,
    ubicacion: 'Área Cuarentena Q-1',
    estadoDisposicion: 'cuarentena'
  },
  {
    id: 'prod-9',
    codigo: '7750123009',
    nombre: 'Salbutamol Inhalador 100mcg (200 Dosis)',
    principioActivo: 'Salbutamol Sulfato',
    presentacion: 'Frasco aerosol x 200 dosis',
    categoria: 'Neumología',
    laboratorio: 'GlaxoSmithKline',
    lote: 'LT-SB330',
    fechaVencimiento: getDateOffset(580),
    precioCosto: 18.00,
    precioVenta: 28.50,
    stock: 12,
    stockMinimo: 4,
    requiereReceta: true,
    ubicacion: 'Anaquel E-3',
    estadoDisposicion: 'disponible'
  },
  {
    id: 'prod-10',
    codigo: '7750123010',
    nombre: 'Complejo B Forte Ampolla 3x2ml',
    principioActivo: 'Vitaminas B1, B6, B12',
    presentacion: 'Caja x 3 ampollas + jeringas',
    categoria: 'Vitaminas y Suplementos',
    laboratorio: 'Medifarma',
    lote: 'LT-CB771',
    fechaVencimiento: getDateOffset(55), // Próximo: 55 días
    precioCosto: 12.00,
    precioVenta: 19.50,
    stock: 14,
    stockMinimo: 5,
    requiereReceta: false,
    ubicacion: 'Anaquel F-1',
    estadoDisposicion: 'disponible'
  },
  {
    id: 'prod-11',
    codigo: '7750123011',
    nombre: 'Naproxeno Sódico 550mg (Caja x 20)',
    principioActivo: 'Naproxeno Sódico',
    presentacion: 'Caja x 20 tabletas',
    categoria: 'Antiinflamatorios',
    laboratorio: 'Bago',
    lote: 'LT-NP411',
    fechaVencimiento: getDateOffset(310),
    precioCosto: 9.50,
    precioVenta: 15.00,
    stock: 25,
    stockMinimo: 8,
    requiereReceta: false,
    ubicacion: 'Anaquel A-3',
    estadoDisposicion: 'disponible'
  },
  {
    id: 'prod-12',
    codigo: '7750123012',
    nombre: 'Dexametasona 4mg/2ml (Ampolla Inyectable)',
    principioActivo: 'Dexametasona Fosfato',
    presentacion: 'Caja x 1 ampolla 2ml',
    categoria: 'Corticoide y Antiinflamatorio',
    laboratorio: 'Farmindustria',
    lote: 'LT-DX890',
    fechaVencimiento: getDateOffset(-4), // VENCIDO: hace 4 días
    precioCosto: 2.80,
    precioVenta: 6.00,
    stock: 7,
    stockMinimo: 5,
    requiereReceta: true,
    ubicacion: 'Área Cuarentena Q-2',
    estadoDisposicion: 'cuarentena'
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
    vendedor: 'Q.F. Fernando Ramos (Coleg. 14209)',
    estado: 'completada'
  },
  {
    id: 'sale-102',
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
        cantidad: 1,
        precioUnitario: 10.00,
        descuentoUnitario: 0,
        subtotal: 10.00
      }
    ],
    subtotal: 8.47,
    igv: 1.53,
    total: 10.00,
    metodoPago: 'efectivo',
    montoRecibido: 20.00,
    vuelto: 10.00,
    vendedor: 'Téc. Farmacia Diana C.',
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
