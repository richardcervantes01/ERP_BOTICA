import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Sale,
  Customer,
  CashRegister,
  DisposalAct,
  TipoComprobante,
  MetodoPago,
  User,
  TenantSettings,
  Liquidacion,
  CierreTurnoCajero,
  ArqueoGeneralDia,
  UnidadDispensacion,
  RecetaMedicaControlada,
  LibroOficialControladosEntry,
  ProductBatch
} from '../types/pharmacy';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_CASH_REGISTER,
  INITIAL_DISPOSAL_ACTS,
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_LIQUIDACIONES,
  INITIAL_CIERRES_TURNO,
  INITIAL_ARQUEOS_DIARIOS,
  INITIAL_LIBRO_CONTROLADOS
} from '../data/initialData';
import { getExpirationStatus } from '../utils/dateUtils';
import {
  generateMockHashCpe,
  generateSunatQrString,
  generateSunatXmlUbl21,
  generateSunatCdrXml
} from '../services/sunatApi';
import { allocateFefoStock, isBatchExpired, getPreferredFefoBatch } from '../services/fefoEngine';
import { calculateMinimalUnits, getPriceForUnit } from '../services/fractioningEngine';

export type AppView =
  | 'pos'
  | 'dashboard'
  | 'inventario'
  | 'vencimientos'
  | 'ventas'
  | 'clientes'
  | 'caja'
  | 'configuracion'
  | 'productividad'
  | 'cajeros_permisos'
  | 'saas_admin'
  | 'saas_usuarios'
  | 'saas_ventas'
  | 'saas_liquidaciones'
  | 'sunat_api'
  | 'digemid'; // Centro de Cumplimiento Regulatorio DIGEMID / MINSA

interface PharmacyContextType {
  // Auth & Multi-tenant
  currentUser: User | null;
  users: User[];
  tenants: TenantSettings[];
  currentTenant: TenantSettings;
  liquidaciones: Liquidacion[];
  login: (email: string, pass: string) => { success: boolean; message?: string };
  logout: () => void;
  updateCurrentTenant: (updates: Partial<TenantSettings>) => void;
  createTenant: (
    tenantData: Omit<TenantSettings, 'id' | 'fechaRegistro'>,
    adminUserData: { email: string; pass: string; name: string }
  ) => void;
  updateTenantLicense: (tenantId: string, updates: Partial<TenantSettings>) => void;
  switchActiveTenant: (tenantId: string) => void;

  // Global user management
  createUser: (userData: Omit<User, 'id'>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  updateUserModules: (userId: string, modules: string[]) => void;
  updateUserAssignedModules: (userId: string, modules: string[]) => void;
  toggleUserStatus: (userId: string) => void;

  // Liquidaciones
  addLiquidacion: (data: Omit<Liquidacion, 'id'>) => void;
  updateLiquidacionStatus: (id: string, status: 'pagado' | 'pendiente') => void;
  registrarPagoLiquidacion: (liquidacionId: string) => void;

  // Navigation
  activeView: AppView;
  setActiveView: (view: AppView) => void;

  // Domain data
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  cart: CartItem[];
  cashRegister: CashRegister;
  disposalActs: DisposalAct[];
  libroControlados: LibroOficialControladosEntry[];
  exportarLibroControladosCsv: () => string;

  // Turnos & Arqueos (Cajero vs Administrador)
  cierresTurno: CierreTurnoCajero[];
  arqueosDiarios: ArqueoGeneralDia[];
  registrarCierreTurnoCajero: (cierre: Omit<CierreTurnoCajero, 'id'>) => CierreTurnoCajero;
  auditarCierreTurno: (cierreId: string, updates: Partial<CierreTurnoCajero>) => void;
  generarArqueoGeneralDia: (arqueo: Omit<ArqueoGeneralDia, 'id' | 'tenantId' | 'fecha' | 'responsableAdmin' | 'turnosAuditados'> & { observaciones?: string }) => ArqueoGeneralDia;

  // SUNAT
  reintentarEnvioSunat: (saleId: string) => void;

  // Cart operations (con soporte FEFO y Fraccionamiento multinivel)
  addToCart: (
    product: Product,
    quantity?: number,
    unidad?: UnidadDispensacion
  ) => { success: boolean; message?: string };
  updateCartQuantity: (
    productId: string,
    quantity: number,
    unidad?: UnidadDispensacion
  ) => { success: boolean; message?: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDiscount: number;
  cartTotal: number;

  // Sales & Checkout (con validación obligatoria de recetas y fiscalizados)
  checkout: (params: {
    tipoComprobante: TipoComprobante;
    cliente: { id?: string; nombre: string; documento: string };
    metodoPago: MetodoPago;
    montoRecibido?: number;
    vendedor?: string;
    datosReceta?: RecetaMedicaControlada;
  }) => Sale;
  annulSale: (saleId: string, motivo: string) => void;

  // Product & Inventory
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (params: {
    productId: string;
    tipo: 'entrada_compra' | 'salida_merma' | 'ajuste_inventario';
    cantidad: number;
    motivo: string;
    nuevoLote?: string;
    nuevoVencimiento?: string;
    nuevoCosto?: number;
  }) => void;
  applyPromotionalDiscount: (productId: string, discountPercent: number) => void;
  quarantineProduct: (productId: string) => void;
  createDisposalAct: (params: {
    productId: string;
    cantidad: number;
    motivo: 'vencimiento' | 'deterioro' | 'rotura' | 'cuarentena_sanitaria';
    observaciones: string;
    responsableQF: string;
  }) => void;

  // Customer
  addCustomer: (customer: Omit<Customer, 'id' | 'comprasRealizadas' | 'totalGastado'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;

  // Cash Register
  addCashExpense: (motivo: string, monto: number, responsable: string) => void;
  openCashRegister: (saldoInicial: number, responsable: string) => void;
  closeCashRegister: () => void;

  // Stats
  metrics: {
    ventasHoy: number;
    totalProductos: number;
    stockBajoCount: number;
    vencidosCount: number;
    criticosCount: number;
    proximosCount: number;
    totalClientes: number;
  };

  // Reset
  resetDatabase: () => void;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const PharmacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<TenantSettings[]>(() => {
    try {
      const saved = localStorage.getItem('farmacontrol_tenants');
      return saved ? JSON.parse(saved) : INITIAL_TENANTS;
    } catch {
      return INITIAL_TENANTS;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('farmacontrol_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>(() => {
    try {
      const saved = localStorage.getItem('farmacontrol_liquidaciones');
      return saved ? JSON.parse(saved) : INITIAL_LIQUIDACIONES;
    } catch {
      return INITIAL_LIQUIDACIONES;
    }
  });

  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    try {
      return localStorage.getItem('farmacontrol_current_tenant_id') || 'tenant-1';
    } catch {
      return 'tenant-1';
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('farmacontrol_current_user');
      return saved ? JSON.parse(saved) : INITIAL_USERS[1]; // Botica admin default
    } catch {
      return INITIAL_USERS[1];
    }
  });

  const [activeView, setActiveView] = useState<AppView>('pos');

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('farmacontrol_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('farmacontrol_customers');
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem('farmacontrol_sales');
      return saved ? JSON.parse(saved) : INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('farmacontrol_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cashRegister, setCashRegister] = useState<CashRegister>(() => {
    try {
      const saved = localStorage.getItem('farmacontrol_cash');
      return saved ? JSON.parse(saved) : INITIAL_CASH_REGISTER;
    } catch {
      return INITIAL_CASH_REGISTER;
    }
  });

  const [disposalActs, setDisposalActs] = useState<DisposalAct[]>(() => {
    try {
      const saved = localStorage.getItem('farmacontrol_disposals');
      return saved ? JSON.parse(saved) : INITIAL_DISPOSAL_ACTS;
    } catch {
      return INITIAL_DISPOSAL_ACTS;
    }
  });

  const [cierresTurno, setCierresTurno] = useState<CierreTurnoCajero[]>(() => {
    try {
      const saved = localStorage.getItem('farmacontrol_cierres_turno');
      return saved ? JSON.parse(saved) : INITIAL_CIERRES_TURNO;
    } catch {
      return INITIAL_CIERRES_TURNO;
    }
  });

  const [arqueosDiarios, setArqueosDiarios] = useState<ArqueoGeneralDia[]>(() => {
    try {
      const saved = localStorage.getItem('farmacontrol_arqueos_diarios');
      return saved ? JSON.parse(saved) : INITIAL_ARQUEOS_DIARIOS;
    } catch {
      return INITIAL_ARQUEOS_DIARIOS;
    }
  });

  const [libroControlados, setLibroControlados] = useState<LibroOficialControladosEntry[]>(() => {
    try {
      const saved = localStorage.getItem('farmacontrol_libro_controlados');
      return saved ? JSON.parse(saved) : INITIAL_LIBRO_CONTROLADOS;
    } catch {
      return INITIAL_LIBRO_CONTROLADOS;
    }
  });

  // Local storage synchronization
  useEffect(() => {
    try {
      localStorage.setItem('farmacontrol_tenants', JSON.stringify(tenants));
    } catch (e) {
      console.error(e);
    }
  }, [tenants]);

  useEffect(() => {
    try {
      localStorage.setItem('farmacontrol_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('farmacontrol_liquidaciones', JSON.stringify(liquidaciones));
    } catch (e) {
      console.error(e);
    }
  }, [liquidaciones]);

  useEffect(() => {
    try {
      localStorage.setItem('farmacontrol_current_tenant_id', currentTenantId);
    } catch (e) {
      console.error(e);
    }
  }, [currentTenantId]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('farmacontrol_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('farmacontrol_current_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('farmacontrol_products', JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('farmacontrol_customers', JSON.stringify(customers));
    } catch (e) {
      console.error(e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem('farmacontrol_sales', JSON.stringify(sales));
    } catch (e) {
      console.error(e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem('farmacontrol_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('farmacontrol_cash', JSON.stringify(cashRegister));
    } catch (e) {
      console.error(e);
    }
  }, [cashRegister]);

  useEffect(() => {
    try {
      localStorage.setItem('farmacontrol_disposals', JSON.stringify(disposalActs));
    } catch (e) {
      console.error(e);
    }
  }, [disposalActs]);

  useEffect(() => {
    try {
      localStorage.setItem('farmacontrol_cierres_turno', JSON.stringify(cierresTurno));
    } catch (e) {
      console.error(e);
    }
  }, [cierresTurno]);

  useEffect(() => {
    try {
      localStorage.setItem('farmacontrol_arqueos_diarios', JSON.stringify(arqueosDiarios));
    } catch (e) {
      console.error(e);
    }
  }, [arqueosDiarios]);

  useEffect(() => {
    try {
      localStorage.setItem('farmacontrol_libro_controlados', JSON.stringify(libroControlados));
    } catch (e) {
      console.error(e);
    }
  }, [libroControlados]);

  const currentTenant =
    tenants.find(t => t.id === currentTenantId) || tenants[0] || INITIAL_TENANTS[0];

  const login = (email: string, pass: string): { success: boolean; message?: string } => {
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === pass
    );

    if (!foundUser) {
      return { success: false, message: 'Correo o contraseña incorrectos.' };
    }

    if (foundUser.activo === false) {
      return { success: false, message: 'Este usuario se encuentra inactivo. Comuníquese con su administrador.' };
    }

    if (foundUser.role !== 'superadmin' && foundUser.tenantId) {
      const userTenant = tenants.find(t => t.id === foundUser.tenantId);
      if (userTenant) {
        if (userTenant.estadoLicencia === 'suspendida') {
          return {
            success: false,
            message: 'Esta botica ha sido suspendida. Comuníquese con el administrador del SaaS.'
          };
        }
        setCurrentTenantId(userTenant.id);
      }
    }

    setCurrentUser(foundUser);
    if (foundUser.role === 'superadmin') {
      setActiveView('saas_admin');
    } else {
      setActiveView('pos');
    }

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateCurrentTenant = (updates: Partial<TenantSettings>) => {
    setTenants(prev =>
      prev.map(t => (t.id === currentTenant.id ? { ...t, ...updates } : t))
    );
  };

  const createTenant = (
    tenantData: Omit<TenantSettings, 'id' | 'fechaRegistro'>,
    adminUserData: { email: string; pass: string; name: string }
  ) => {
    const newTenantId = `tenant-${Date.now()}`;
    const newTenant: TenantSettings = {
      ...tenantData,
      id: newTenantId,
      fechaRegistro: new Date().toISOString().split('T')[0]
    };

    const newAdminUser: User = {
      id: `user-${Date.now()}`,
      email: adminUserData.email,
      password: adminUserData.pass,
      nombre: adminUserData.name,
      role: 'tenant_admin',
      tenantId: newTenantId,
      assignedModules: [
        'pos',
        'inventario',
        'vencimientos',
        'ventas',
        'clientes',
        'caja',
        'configuracion',
        'productividad',
        'cajeros_permisos'
      ],
      activo: true
    };

    setTenants(prev => [...prev, newTenant]);
    setUsers(prev => [...prev, newAdminUser]);
  };

  const updateTenantLicense = (tenantId: string, updates: Partial<TenantSettings>) => {
    setTenants(prev => prev.map(t => (t.id === tenantId ? { ...t, ...updates } : t)));
  };

  const switchActiveTenant = (tenantId: string) => {
    const target = tenants.find(t => t.id === tenantId);
    if (target) {
      setCurrentTenantId(target.id);
      setActiveView('pos');
    }
  };

  const createUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updates } : u)));
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const updateUserModules = (userId: string, modules: string[]) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, assignedModules: modules } : u))
    );
  };

  const updateUserAssignedModules = updateUserModules;

  const toggleUserStatus = (userId: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, activo: !u.activo } : u))
    );
  };

  const addLiquidacion = (data: Omit<Liquidacion, 'id'>) => {
    const newLiq: Liquidacion = {
      ...data,
      id: `liq-${Date.now()}`
    };
    setLiquidaciones(prev => [newLiq, ...prev]);
  };

  const updateLiquidacionStatus = (id: string, status: 'pagado' | 'pendiente') => {
    setLiquidaciones(prev =>
      prev.map(l =>
        l.id === id
          ? {
              ...l,
              estado: status,
              fechaPago: status === 'pagado' ? new Date().toISOString().split('T')[0] : l.fechaPago
            }
          : l
      )
    );
  };

  const registrarPagoLiquidacion = (liquidacionId: string) => {
    setLiquidaciones(prev =>
      prev.map(l =>
        l.id === liquidacionId
          ? {
              ...l,
              estado: 'pagado',
              fechaPago: new Date().toISOString().split('T')[0],
              comprobanteSaaS: `FAC-SAAS-${Math.floor(1000 + Math.random() * 9000)}`
            }
          : l
      )
    );
  };

  // Turnos & Arqueos (Cajero y Admin)
  const registrarCierreTurnoCajero = (cierreData: Omit<CierreTurnoCajero, 'id'>): CierreTurnoCajero => {
    const nuevoCierre: CierreTurnoCajero = {
      ...cierreData,
      id: `cierre-${Date.now()}`,
      tenantId: currentTenant.id
    };
    setCierresTurno(prev => [nuevoCierre, ...prev]);
    return nuevoCierre;
  };

  const auditarCierreTurno = (cierreId: string, updates: Partial<CierreTurnoCajero>) => {
    setCierresTurno(prev =>
      prev.map(c =>
        c.id === cierreId
          ? {
              ...c,
              ...updates,
              fechaAuditoria: new Date().toISOString()
            }
          : c
      )
    );
  };

  const generarArqueoGeneralDia = (
    arqueoData: Omit<ArqueoGeneralDia, 'id' | 'tenantId' | 'fecha' | 'responsableAdmin' | 'turnosAuditados'> & { observaciones?: string }
  ): ArqueoGeneralDia => {
    const nuevoArqueo: ArqueoGeneralDia = {
      ...arqueoData,
      id: `arq-${Date.now()}`,
      tenantId: currentTenant.id,
      fecha: new Date().toISOString().split('T')[0],
      responsableAdmin: currentTenant.regenteQF || currentUser?.nombre || 'Administrador',
      turnosAuditados: cierresTurno.map(c => c.id),
      observaciones: arqueoData.observaciones || 'Arqueo oficial diario verificado'
    };
    setArqueosDiarios(prev => [nuevoArqueo, ...prev]);
    return nuevoArqueo;
  };

  const reintentarEnvioSunat = (saleId: string) => {
    setSales(prev =>
      prev.map(s => {
        if (s.id !== saleId) return s;
        const hash = s.hashCPE || generateMockHashCpe(s.correlativo, s.total);
        const qr = s.qrCodeData || generateSunatQrString(s, currentTenant.ruc, hash);
        const xml = s.xmlContent || generateSunatXmlUbl21(s, currentTenant, hash);
        const cdr = s.cdrContent || generateSunatCdrXml(s, currentTenant.ruc, hash);

        return {
          ...s,
          sunatStatus: 'ACEPTADO',
          sunatResponseCode: '0',
          sunatDescription: `Comprobante ${s.correlativo} reenviado y ACEPTADO por SUNAT con CDR.`,
          hashCPE: hash,
          qrCodeData: qr,
          xmlContent: xml,
          cdrContent: cdr,
          fechaEnvioSunat: new Date().toISOString()
        };
      })
    );
  };

  // Cart operations (FEFO & Fraccionamiento multinivel)
  const addToCart = (
    product: Product,
    quantity = 1,
    unidad: UnidadDispensacion = 'caja'
  ): { success: boolean; message?: string } => {
    // 1. REGLA 2: Bloqueo duro si el producto o sus lotes vigentes están vencidos (fecha_vencimiento <= fecha_actual)
    if (isBatchExpired(product.fechaVencimiento)) {
      return {
        success: false,
        message: `¡BLOQUEO SANITARIO FEFO! El medicamento "${product.nombre}" tiene lote caducado (${product.fechaVencimiento}). Su comercialización está penada por la Ley General de Salud N° 26842 y D.S. N° 014-2011-SA.`
      };
    }

    if (product.estadoDisposicion === 'cuarentena' || product.estadoDisposicion === 'merma') {
      return {
        success: false,
        message: `¡BLOQUEO SANITARIO! El medicamento "${product.nombre}" se encuentra en estado de ${product.estadoDisposicion.toUpperCase()} y no puede ser dispensado.`
      };
    }

    // 2. REGLA 3: Cálculo a nivel de mínima unidad de despacho
    const requiredMinimas = calculateMinimalUnits(product, quantity, unidad);
    const availableMinimas = product.stockMinimasUnidades ?? (product.stock * (product.factorConversionTotal || 1));

    if (availableMinimas <= 0) {
      return { success: false, message: `Producto "${product.nombre}" sin existencias disponibles en almacén.` };
    }

    // 3. REGLA 2: Asignación por algoritmo FEFO (First Expired, First Out)
    const fefoResult = allocateFefoStock(product, requiredMinimas);
    if (!fefoResult.success) {
      return {
        success: false,
        message: fefoResult.error || 'No hay lotes vigentes suficientes para dispensar este medicamento.'
      };
    }

    const unitPrice = getPriceForUnit(product, unidad);
    const discount = product.descuentoPromocional || 0;
    const finalPrice = discount > 0 ? unitPrice * (1 - discount / 100) : unitPrice;
    const descUnit = unitPrice - finalPrice;

    const existingIndex = cart.findIndex(
      c => c.product.id === product.id && c.unidadDispensada === unidad
    );

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].cantidad;
      const newTotalQty = currentQty + quantity;
      const newTotalMinimas = calculateMinimalUnits(product, newTotalQty, unidad);

      if (newTotalMinimas > availableMinimas) {
        return {
          success: false,
          message: `Stock insuficiente. Disponible: ${availableMinimas} unidades mínimas.`
        };
      }

      const updated = [...cart];
      updated[existingIndex].cantidad = newTotalQty;
      updated[existingIndex].unidadesMinimasTotal = newTotalMinimas;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product,
          cantidad: quantity,
          unidadDispensada: unidad,
          unidadesMinimasTotal: requiredMinimas,
          precioAplicado: Number(finalPrice.toFixed(2)),
          descuentoUnitario: Number(descUnit.toFixed(2)),
          loteAsignadoFefo: fefoResult.loteCriticoExpiraPronto || getPreferredFefoBatch(product) || undefined
        }
      ]);
    }
    return { success: true };
  };

  const updateCartQuantity = (
    productId: string,
    quantity: number,
    unidad?: UnidadDispensacion
  ): { success: boolean; message?: string } => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true };
    }
    const item = cart.find(c => c.product.id === productId);
    if (!item) return { success: false, message: 'Producto no encontrado en el carrito' };

    const targetUnidad = unidad || item.unidadDispensada;
    const requiredMinimas = calculateMinimalUnits(item.product, quantity, targetUnidad);
    const availableMinimas = item.product.stockMinimasUnidades ?? (item.product.stock * (item.product.factorConversionTotal || 1));

    if (requiredMinimas > availableMinimas) {
      return {
        success: false,
        message: `Solo hay ${availableMinimas} unidades mínimas disponibles en inventario.`
      };
    }

    const fefoCheck = allocateFefoStock(item.product, requiredMinimas);
    if (!fefoCheck.success) {
      return { success: false, message: fefoCheck.error };
    }

    const unitPrice = getPriceForUnit(item.product, targetUnidad);
    const discount = item.product.descuentoPromocional || 0;
    const finalPrice = discount > 0 ? unitPrice * (1 - discount / 100) : unitPrice;

    setCart(
      cart.map(c =>
        c.product.id === productId
          ? {
              ...c,
              cantidad: quantity,
              unidadDispensada: targetUnidad,
              unidadesMinimasTotal: requiredMinimas,
              precioAplicado: Number(finalPrice.toFixed(2)),
              descuentoUnitario: Number((unitPrice - finalPrice).toFixed(2)),
              loteAsignadoFefo: fefoCheck.loteCriticoExpiraPronto || c.loteAsignadoFefo
            }
          : c
      )
    );
    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((acc, item) => {
    const origUnitPrice = getPriceForUnit(item.product, item.unidadDispensada);
    return acc + origUnitPrice * item.cantidad;
  }, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.precioAplicado * item.cantidad, 0);
  const cartDiscount = cartSubtotal - cartTotal;

  // Exportar el Libro Oficial de Psicotrópicos y Estupefacientes
  const exportarLibroControladosCsv = (): string => {
    const header =
      'CorrelativoVenta,Fecha,Medicamento,PrincipioActivo,Lote,FechaVencimiento,CantidadDispensada,Unidad,PacienteNombre,PacienteDNI,MedicoPrescriptor,CMP,RecetaFolio,RecetaFecha,QFResponsable';
    const rows = libroControlados.map(e => {
      return `"${e.correlativoVenta}","${e.fecha}","${e.nombreMedicamento}","${e.principioActivo}","${e.numeroLote}","${e.fechaVencimiento}",${e.cantidadMinima},"${e.unidadMinima}","${e.pacienteNombre}","${e.pacienteDni}","${e.medicoNombre}","${e.medicoCMP}","${e.recetaFolio}","${e.recetaFechaEmision}","${e.dispensadoPor}"`;
    });
    return [header, ...rows].join('\r\n');
  };

  // Checkout sale with SUNAT UBL 2.1 & DIGEMID Regulatory Compliance
  const checkout = (params: {
    tipoComprobante: TipoComprobante;
    cliente: { id?: string; nombre: string; documento: string };
    metodoPago: MetodoPago;
    montoRecibido?: number;
    vendedor?: string;
    datosReceta?: RecetaMedicaControlada;
  }): Sale => {
    if (cart.length === 0) {
      throw new Error('El carrito de compras está vacío.');
    }

    // 4. REGLA 4: Control de Recetas y Productos Fiscalizados
    const requiresRecipe = cart.some(ci => ci.product.requiereReceta || ci.product.esFiscalizado);
    const hasFiscalized = cart.some(ci => ci.product.esFiscalizado);

    if (requiresRecipe) {
      if (
        !params.datosReceta ||
        !params.datosReceta.pacienteNombre?.trim() ||
        !params.datosReceta.pacienteDocumento?.trim() ||
        !params.datosReceta.medicoNombre?.trim() ||
        !params.datosReceta.medicoCMP?.trim() ||
        !params.datosReceta.recetaSerieFolio?.trim() ||
        !params.datosReceta.recetaFechaEmision?.trim()
      ) {
        throw new Error(
          '¡BLOQUEO REGULATORIO DIGEMID! La transacción contiene medicamentos sujetos a control o receta obligatoria (D.S. N° 023-2001-SA). Se exige registrar: Nombre y DNI del Paciente, Médico Prescriptor, CMP, Serie/Folio de Receta y Fecha de Emisión.'
        );
      }
    }

    const saleId = `sale-${Date.now()}`;
    const nextCorrelativoNum = sales.length + 143;
    const prefix =
      params.tipoComprobante === 'boleta'
        ? 'B001'
        : params.tipoComprobante === 'factura'
        ? 'F001'
        : 'T001';
    const correlativo = `${prefix}-${String(nextCorrelativoNum).padStart(6, '0')}`;

    // Construcción de items con trazabilidad FEFO por lote
    const items = cart.map(item => {
      const fefoRes = allocateFefoStock(item.product, item.unidadesMinimasTotal);
      const lotesDespachados = fefoRes.allocations;
      const lotePrincipal = lotesDespachados[0] || {
        numeroLote: item.product.lote,
        fechaVencimiento: item.product.fechaVencimiento
      };

      return {
        productId: item.product.id,
        codigo: item.product.codigo,
        nombre: item.product.nombre,
        principioActivo: item.product.principioActivo,
        lote: lotePrincipal.numeroLote,
        fechaVencimiento: lotePrincipal.fechaVencimiento,
        cantidad: item.cantidad,
        unidadDispensada: item.unidadDispensada,
        unidadesMinimas: item.unidadesMinimasTotal,
        lotesDespachados,
        precioUnitario: item.precioAplicado,
        descuentoUnitario: item.descuentoUnitario,
        subtotal: Number((item.precioAplicado * item.cantidad).toFixed(2))
      };
    });

    const totalAmount = Number(cartTotal.toFixed(2));
    const taxRate = (currentTenant.igvPorcentaje || 18) / 100;
    const igv = Number(((totalAmount * taxRate) / (1 + taxRate)).toFixed(2));
    const subtotal = Number((totalAmount - igv).toFixed(2));

    const codigoTipoComprobante =
      params.tipoComprobante === 'factura' ? '01' : params.tipoComprobante === 'boleta' ? '03' : '00';

    let hashCPE = 'N/A';
    let qrCodeData = '';
    let xmlContent = '';
    let cdrContent = '';

    const tempSaleForSunat: Sale = {
      id: saleId,
      tenantId: currentTenant.id,
      correlativo,
      tipoComprobante: params.tipoComprobante,
      fecha: new Date().toISOString(),
      clienteId: params.cliente.id,
      clienteNombre: params.cliente.nombre || 'Cliente General',
      clienteDocumento: params.cliente.documento || '00000000',
      items,
      subtotal,
      igv,
      total: totalAmount,
      metodoPago: params.metodoPago,
      montoRecibido: params.montoRecibido || totalAmount,
      vuelto: params.montoRecibido
        ? Math.max(0, Number((params.montoRecibido - totalAmount).toFixed(2)))
        : 0,
      vendedor: params.vendedor || currentUser?.nombre || `${currentTenant.regenteQF} (${currentTenant.colegiaturaQF})`,
      cajeroId: currentUser?.id,
      estado: 'completada',
      esVentaControlada: hasFiscalized,
      datosReceta: requiresRecipe ? params.datosReceta : undefined
    };

    if (params.tipoComprobante !== 'ticket') {
      hashCPE = generateMockHashCpe(correlativo, totalAmount);
      qrCodeData = generateSunatQrString(tempSaleForSunat, currentTenant.ruc, hashCPE);
      xmlContent = generateSunatXmlUbl21(tempSaleForSunat, currentTenant, hashCPE);
      cdrContent = generateSunatCdrXml(tempSaleForSunat, currentTenant.ruc, hashCPE);
    }

    const newSale: Sale = {
      ...tempSaleForSunat,
      codigoTipoComprobante,
      serie: prefix,
      numero: nextCorrelativoNum,
      sunatStatus: params.tipoComprobante === 'ticket' ? 'NO_APLICA' : 'ACEPTADO',
      sunatResponseCode: params.tipoComprobante === 'ticket' ? 'N/A' : '0',
      sunatDescription:
        params.tipoComprobante === 'ticket'
          ? 'Ticket de control interno'
          : `El comprobante ${correlativo} ha sido ACEPTADO por SUNAT con CDR.`,
      hashCPE,
      qrCodeData,
      xmlContent,
      cdrContent,
      fechaEnvioSunat: new Date().toISOString()
    };

    // 2. REGLA 2 y 3: Descuento estricto de inventario por lotes FEFO y a nivel de mínimas unidades
    setProducts(prevProducts => {
      return prevProducts.map(p => {
        const soldItem = cart.find(ci => ci.product.id === p.id);
        if (!soldItem) return p;

        const unidadesDescontadas = soldItem.unidadesMinimasTotal;
        const currentMinimas = p.stockMinimasUnidades ?? (p.stock * (p.factorConversionTotal || 1));
        const newMinimas = Math.max(0, currentMinimas - unidadesDescontadas);
        const factor = p.factorConversionTotal || 1;
        const newStockCajas = Math.floor(newMinimas / factor);

        // Actualizar lotes descontando del más próximo a vencer (FEFO)
        let pending = unidadesDescontadas;
        const updatedLotes = (p.lotes || []).map(b => {
          if (pending <= 0) return b;
          const takeFromBatch = Math.min(b.stockUnidades, pending);
          pending -= takeFromBatch;
          return {
            ...b,
            stockUnidades: b.stockUnidades - takeFromBatch
          };
        });

        // Seleccionar nuevo lote preferente no vencido
        const nuevoLotePreferente = updatedLotes
          .filter(b => b.stockUnidades > 0 && !isBatchExpired(b.fechaVencimiento))
          .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())[0];

        return {
          ...p,
          stockMinimasUnidades: newMinimas,
          stock: newStockCajas,
          lotes: updatedLotes,
          lote: nuevoLotePreferente ? nuevoLotePreferente.numeroLote : p.lote,
          fechaVencimiento: nuevoLotePreferente ? nuevoLotePreferente.fechaVencimiento : p.fechaVencimiento
        };
      });
    });

    // 4. REGLA 4: Asentar en Libro Oficial de Fiscalizados si contiene estupefacientes / psicotrópicos
    if (hasFiscalized && params.datosReceta) {
      const fiscalizedItems = cart.filter(ci => ci.product.esFiscalizado);
      const newEntries: LibroOficialControladosEntry[] = fiscalizedItems.map(fi => ({
        id: `lib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tenantId: currentTenant.id,
        saleId,
        correlativoVenta: correlativo,
        fecha: new Date().toISOString().split('T')[0],
        productId: fi.product.id,
        nombreMedicamento: fi.product.nombre,
        principioActivo: fi.product.principioActivo,
        presentacion: fi.product.presentacion,
        numeroLote: fi.product.lote,
        fechaVencimiento: fi.product.fechaVencimiento,
        cantidadMinima: fi.unidadesMinimasTotal,
        unidadMinima: fi.product.unidadMinima,
        pacienteNombre: params.datosReceta!.pacienteNombre,
        pacienteDni: params.datosReceta!.pacienteDocumento,
        medicoNombre: params.datosReceta!.medicoNombre,
        medicoCMP: params.datosReceta!.medicoCMP,
        recetaFolio: params.datosReceta!.recetaSerieFolio,
        recetaFechaEmision: params.datosReceta!.recetaFechaEmision,
        dispensadoPor: `${currentTenant.regenteQF} (${currentTenant.colegiaturaQF})`
      }));

      setLibroControlados(prev => [...newEntries, ...prev]);
    }

    // Update customer stats if registered
    if (params.cliente.id) {
      setCustomers(prevCust => {
        return prevCust.map(c => {
          if (c.id === params.cliente.id) {
            return {
              ...c,
              comprasRealizadas: c.comprasRealizadas + 1,
              totalGastado: Number((c.totalGastado + totalAmount).toFixed(2)),
              ultimaVisita: new Date().toISOString().split('T')[0]
            };
          }
          return c;
        });
      });
    }

    setSales(prev => [newSale, ...prev]);
    clearCart();
    return newSale;
  };

  const annulSale = (saleId: string, motivo: string) => {
    const saleToAnnul = sales.find(s => s.id === saleId);
    if (!saleToAnnul || saleToAnnul.estado === 'anulada') return;

    setProducts(prev => {
      return prev.map(p => {
        const item = saleToAnnul.items.find(i => i.productId === p.id);
        if (item) {
          return { ...p, stock: p.stock + item.cantidad };
        }
        return p;
      });
    });

    setSales(prev =>
      prev.map(s =>
        s.id === saleId
          ? {
              ...s,
              estado: 'anulada',
              motivoAnulacion: motivo,
              sunatStatus: s.tipoComprobante === 'ticket' ? 'NO_APLICA' : 'ANULADO',
              sunatDescription: `Comprobante ${s.correlativo} anulado con Nota de Crédito Electrónica: ${motivo}`
            }
          : s
      )
    );
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const adjustStock = (params: {
    productId: string;
    tipo: 'entrada_compra' | 'salida_merma' | 'ajuste_inventario';
    cantidad: number;
    motivo: string;
    nuevoLote?: string;
    nuevoVencimiento?: string;
    nuevoCosto?: number;
  }) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== params.productId) return p;

        let newStock = p.stock;
        if (params.tipo === 'entrada_compra') {
          newStock += params.cantidad;
        } else if (params.tipo === 'salida_merma') {
          newStock = Math.max(0, p.stock - params.cantidad);
        } else {
          newStock = params.cantidad;
        }

        return {
          ...p,
          stock: newStock,
          lote: params.nuevoLote || p.lote,
          fechaVencimiento: params.nuevoVencimiento || p.fechaVencimiento,
          precioCosto: params.nuevoCosto ?? p.precioCosto
        };
      })
    );
  };

  const applyPromotionalDiscount = (productId: string, discountPercent: number) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, descuentoPromocional: discountPercent } : p))
    );
  };

  const quarantineProduct = (productId: string) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, estadoDisposicion: 'cuarentena' } : p))
    );
  };

  const createDisposalAct = (params: {
    productId: string;
    cantidad: number;
    motivo: 'vencimiento' | 'deterioro' | 'rotura' | 'cuarentena_sanitaria';
    observaciones: string;
    responsableQF: string;
  }) => {
    const prod = products.find(p => p.id === params.productId);
    if (!prod) return;

    const lostCost = Number((prod.precioCosto * params.cantidad).toFixed(2));
    const newAct: DisposalAct = {
      id: `acta-${Date.now()}`,
      numeroActa: `ACTA-BAJA-${new Date().getFullYear()}-${String(disposalActs.length + 5).padStart(3, '0')}`,
      fecha: new Date().toISOString().split('T')[0],
      responsableQF: params.responsableQF || `${currentTenant.regenteQF} (${currentTenant.colegiaturaQF})`,
      motivo: params.motivo,
      productos: [
        {
          productId: prod.id,
          nombre: prod.nombre,
          lote: prod.lote,
          fechaVencimiento: prod.fechaVencimiento,
          cantidad: params.cantidad,
          costoTotalPerdido: lostCost
        }
      ],
      observaciones: params.observaciones,
      estado: 'ejecutada'
    };

    setProducts(prev =>
      prev.map(p => {
        if (p.id === params.productId) {
          const remStock = Math.max(0, p.stock - params.cantidad);
          return {
            ...p,
            stock: remStock,
            estadoDisposicion: remStock === 0 ? 'merma' : p.estadoDisposicion
          };
        }
        return p;
      })
    );

    setDisposalActs(prev => [newAct, ...prev]);
  };

  // Customers
  const addCustomer = (
    data: Omit<Customer, 'id' | 'comprasRealizadas' | 'totalGastado'>
  ): Customer => {
    const newCust: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      comprasRealizadas: 0,
      totalGastado: 0,
      ultimaVisita: new Date().toISOString().split('T')[0]
    };
    setCustomers(prev => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  // Cash Register
  const addCashExpense = (motivo: string, monto: number, responsable: string) => {
    const expense = {
      id: `exp-${Date.now()}`,
      hora: new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      motivo,
      monto,
      responsable
    };
    setCashRegister(prev => ({
      ...prev,
      gastos: [expense, ...prev.gastos]
    }));
  };

  const openCashRegister = (saldoInicial: number, responsable: string) => {
    setCashRegister({
      estado: 'abierta',
      fechaApertura: new Date().toISOString(),
      saldoInicial,
      responsable,
      gastos: []
    });
  };

  const closeCashRegister = () => {
    setCashRegister(prev => ({
      ...prev,
      estado: 'cerrada'
    }));
  };

  const resetDatabase = () => {
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setSales(INITIAL_SALES);
    setCart([]);
    setCashRegister(INITIAL_CASH_REGISTER);
    setDisposalActs(INITIAL_DISPOSAL_ACTS);
    setTenants(INITIAL_TENANTS);
    setUsers(INITIAL_USERS);
    setLiquidaciones(INITIAL_LIQUIDACIONES);
    setCierresTurno(INITIAL_CIERRES_TURNO);
    setArqueosDiarios(INITIAL_ARQUEOS_DIARIOS);
    setCurrentTenantId('tenant-1');
    setCurrentUser(INITIAL_USERS[1]);
    localStorage.clear();
  };

  // Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const ventasHoy = sales
    .filter(s => s.estado === 'completada' && s.fecha.startsWith(todayStr))
    .reduce((acc, cur) => acc + cur.total, 0);

  let vencidosCount = 0;
  let criticosCount = 0;
  let proximosCount = 0;
  let stockBajoCount = 0;

  products.forEach(p => {
    const exp = getExpirationStatus(p.fechaVencimiento);
    if (exp === 'vencido') vencidosCount++;
    else if (exp === 'critico') criticosCount++;
    else if (exp === 'proximo') proximosCount++;

    if (p.stock <= p.stockMinimo) stockBajoCount++;
  });

  const metrics = {
    ventasHoy,
    totalProductos: products.length,
    stockBajoCount,
    vencidosCount,
    criticosCount,
    proximosCount,
    totalClientes: customers.length
  };

  return (
    <PharmacyContext.Provider
      value={{
        currentUser,
        users,
        tenants,
        currentTenant,
        liquidaciones,
        login,
        logout,
        updateCurrentTenant,
        createTenant,
        updateTenantLicense,
        switchActiveTenant,
        createUser,
        updateUser,
        deleteUser,
        updateUserModules,
        updateUserAssignedModules,
        toggleUserStatus,
        addLiquidacion,
        updateLiquidacionStatus,
        registrarPagoLiquidacion,
        activeView,
        setActiveView,
        products,
        customers,
        sales,
        cart,
        cashRegister,
        disposalActs,
        libroControlados,
        exportarLibroControladosCsv,
        cierresTurno,
        arqueosDiarios,
        registrarCierreTurnoCajero,
        auditarCierreTurno,
        generarArqueoGeneralDia,
        reintentarEnvioSunat,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartDiscount,
        cartTotal,
        checkout,
        annulSale,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        applyPromotionalDiscount,
        quarantineProduct,
        createDisposalAct,
        addCustomer,
        updateCustomer,
        addCashExpense,
        openCashRegister,
        closeCashRegister,
        metrics,
        resetDatabase
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
};
