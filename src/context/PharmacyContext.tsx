import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Sale,
  Customer,
  CashRegister,
  DisposalAct,
  TipoComprobante,
  MetodoPago
} from '../types/pharmacy';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_CASH_REGISTER,
  INITIAL_DISPOSAL_ACTS
} from '../data/initialData';
import { getExpirationStatus } from '../utils/dateUtils';

interface PharmacyContextType {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  cart: CartItem[];
  cashRegister: CashRegister;
  disposalActs: DisposalAct[];
  activeView: 'pos' | 'dashboard' | 'inventario' | 'vencimientos' | 'ventas' | 'clientes' | 'caja';
  setActiveView: (view: 'pos' | 'dashboard' | 'inventario' | 'vencimientos' | 'ventas' | 'clientes' | 'caja') => void;

  // Cart operations
  addToCart: (product: Product, quantity?: number) => { success: boolean; message?: string };
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDiscount: number;
  cartTotal: number;

  // Sales & Checkout
  checkout: (params: {
    tipoComprobante: TipoComprobante;
    cliente: { id?: string; nombre: string; documento: string };
    metodoPago: MetodoPago;
    montoRecibido?: number;
    vendedor?: string;
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
  const [activeView, setActiveView] = useState<'pos' | 'dashboard' | 'inventario' | 'vencimientos' | 'ventas' | 'clientes' | 'caja'>('pos');

  // Load from localStorage or fallback to initial
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

  // Sync state to local storage
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

  // Cart operations
  const addToCart = (product: Product, quantity = 1): { success: boolean; message?: string } => {
    // Check if expired
    const status = getExpirationStatus(product.fechaVencimiento);
    if (status === 'vencido' || product.estadoDisposicion === 'cuarentena' || product.estadoDisposicion === 'merma') {
      return {
        success: false,
        message: '¡BLOQUEO SANITARIO! Este medicamento está caducado o en cuarentena y su dispensación está terminantemente prohibida.'
      };
    }

    if (product.stock <= 0) {
      return { success: false, message: 'Producto sin stock disponible.' };
    }

    const existingIndex = cart.findIndex(c => c.product.id === product.id);
    const discount = product.descuentoPromocional || 0;
    const finalPrice = discount > 0 ? product.precioVenta * (1 - discount / 100) : product.precioVenta;

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].cantidad;
      if (currentQty + quantity > product.stock) {
        return {
          success: false,
          message: `Stock máximo disponible alcanzado (${product.stock} unidades en existencia).`
        };
      }
      const updated = [...cart];
      updated[existingIndex].cantidad += quantity;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product,
          cantidad: Math.min(quantity, product.stock),
          precioAplicado: Number(finalPrice.toFixed(2)),
          descuentoUnitario: Number((product.precioVenta - finalPrice).toFixed(2))
        }
      ]);
    }
    return { success: true };
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const item = cart.find(c => c.product.id === productId);
    if (!item) return;

    if (quantity > item.product.stock) {
      alert(`Solo hay ${item.product.stock} unidades disponibles en inventario.`);
      return;
    }

    setCart(cart.map(c => c.product.id === productId ? { ...c, cantidad: quantity } : c));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.precioVenta * item.cantidad), 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.precioAplicado * item.cantidad), 0);
  const cartDiscount = cartSubtotal - cartTotal;

  // Checkout sale
  const checkout = (params: {
    tipoComprobante: TipoComprobante;
    cliente: { id?: string; nombre: string; documento: string };
    metodoPago: MetodoPago;
    montoRecibido?: number;
    vendedor?: string;
  }): Sale => {
    const saleId = `sale-${Date.now()}`;
    const nextCorrelativoNum = sales.length + 143;
    const prefix = params.tipoComprobante === 'boleta' ? 'B001' : params.tipoComprobante === 'factura' ? 'F001' : 'T001';
    const correlativo = `${prefix}-${String(nextCorrelativoNum).padStart(6, '0')}`;

    const items = cart.map(item => ({
      productId: item.product.id,
      codigo: item.product.codigo,
      nombre: item.product.nombre,
      principioActivo: item.product.principioActivo,
      lote: item.product.lote,
      fechaVencimiento: item.product.fechaVencimiento,
      cantidad: item.cantidad,
      precioUnitario: item.precioAplicado,
      descuentoUnitario: item.descuentoUnitario,
      subtotal: Number((item.precioAplicado * item.cantidad).toFixed(2))
    }));

    const totalAmount = Number(cartTotal.toFixed(2));
    const igv = Number((totalAmount * 0.18 / 1.18).toFixed(2));
    const subtotal = Number((totalAmount - igv).toFixed(2));

    const newSale: Sale = {
      id: saleId,
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
      vuelto: params.montoRecibido ? Math.max(0, Number((params.montoRecibido - totalAmount).toFixed(2))) : 0,
      vendedor: params.vendedor || 'Q.F. Fernando Ramos (Coleg. 14209)',
      estado: 'completada'
    };

    // Deduct stock from products
    setProducts(prevProducts => {
      return prevProducts.map(p => {
        const soldItem = cart.find(ci => ci.product.id === p.id);
        if (soldItem) {
          const newStock = Math.max(0, p.stock - soldItem.cantidad);
          return { ...p, stock: newStock };
        }
        return p;
      });
    });

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

    // Restore stock
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
      prev.map(s => (s.id === saleId ? { ...s, estado: 'anulada', motivoAnulacion: motivo } : s))
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
      responsableQF: params.responsableQF || 'Q.F. Fernando Ramos (CQFP 14209)',
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

    // Deduct stock and set disposition
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
  const addCustomer = (data: Omit<Customer, 'id' | 'comprasRealizadas' | 'totalGastado'>): Customer => {
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
      hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }),
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
    localStorage.removeItem('farmacontrol_products');
    localStorage.removeItem('farmacontrol_customers');
    localStorage.removeItem('farmacontrol_sales');
    localStorage.removeItem('farmacontrol_cart');
    localStorage.removeItem('farmacontrol_cash');
    localStorage.removeItem('farmacontrol_disposals');
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
        products,
        customers,
        sales,
        cart,
        cashRegister,
        disposalActs,
        activeView,
        setActiveView,
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
