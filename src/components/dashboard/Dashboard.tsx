import React from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  DollarSign,
  Pill,
  AlertTriangle,
  Users,
  Calendar,
  ShoppingCart,
  TrendingUp,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import {
  formatCurrency,
  formatDateTimeSpanish,
  getExpirationStatus,
  getExpirationLabel,
  getDaysUntilExpiration
} from '../../utils/dateUtils';

export const Dashboard: React.FC = () => {
  const { products, sales, customers, metrics, setActiveView } = usePharmacy();

  // Low stock products
  const lowStockProducts = products
    .filter(p => p.stock <= p.stockMinimo)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  // Critical expiring products
  const criticalExpiring = products
    .filter(p => {
      const s = getExpirationStatus(p.fechaVencimiento);
      return s === 'vencido' || s === 'critico';
    })
    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
    .slice(0, 5);

  // Top selling products calculated from sales
  const salesMap: { [prodId: string]: { name: string; quantity: number; revenue: number } } = {};
  sales.forEach(sale => {
    if (sale.estado === 'completada') {
      sale.items.forEach(it => {
        if (!salesMap[it.productId]) {
          salesMap[it.productId] = { name: it.nombre, quantity: 0, revenue: 0 };
        }
        salesMap[it.productId].quantity += it.cantidad;
        salesMap[it.productId].revenue += it.subtotal;
      });
    }
  });

  const topSelling = Object.values(salesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Recent 5 sales
  const recentSales = sales.slice(0, 5);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* 4 STAT CARDS (Replicating and enhancing the format) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ventas de Hoy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Ventas de Hoy</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(metrics.ventasHoy)}</h3>
          </div>
        </div>

        {/* Card 2: Productos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Productos en Catálogo</p>
            <h3 className="text-2xl font-bold text-slate-800">{metrics.totalProductos}</h3>
          </div>
        </div>

        {/* Card 3: Stock Bajo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Stock Bajo (&le; Mínimo)</p>
            <h3 className="text-2xl font-bold text-amber-600">{metrics.stockBajoCount}</h3>
          </div>
        </div>

        {/* Card 4: Clientes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Clientes Registrados</p>
            <h3 className="text-2xl font-bold text-purple-700">{metrics.totalClientes}</h3>
          </div>
        </div>
      </div>

      {/* QUICK SHORTCUTS & ACTION BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveView('pos')}
          className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-sm flex items-center justify-between text-left transition cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/30 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-100">Mostrador Activo</p>
              <h4 className="font-bold text-sm">Abrir Punto de Venta (POS)</h4>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition" />
        </button>

        <button
          onClick={() => setActiveView('vencimientos')}
          className="p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-sm flex items-center justify-between text-left transition cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 rounded-xl">
              <Calendar className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-300">Auditoría Sanitaria</p>
              <h4 className="font-bold text-sm">
                Control de Vencimientos ({metrics.vencidosCount + metrics.criticosCount} en alerta)
              </h4>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
        </button>

        <button
          onClick={() => setActiveView('inventario')}
          className="p-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between text-left transition cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <Pill className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Gestión de Stock</p>
              <h4 className="font-bold text-sm">Administrar Medicamentos</h4>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
        </button>
      </div>

      {/* TWO COLUMN GRID: EXPIRATIONS & LOW STOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Expirations Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-800 text-sm">Lotes con Vencimiento Crítico</h3>
              </div>
              <button
                onClick={() => setActiveView('vencimientos')}
                className="text-xs text-emerald-700 hover:underline font-semibold cursor-pointer"
              >
                Ver todos
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {criticalExpiring.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No hay lotes vencidos ni críticos por ahora.
                </p>
              ) : (
                criticalExpiring.map(p => {
                  const expStatus = getExpirationStatus(p.fechaVencimiento);
                  const days = getDaysUntilExpiration(p.fechaVencimiento);
                  const expLabel = getExpirationLabel(expStatus, days);

                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{p.nombre}</p>
                        <p className="text-[11px] text-slate-500">
                          Lote: <span className="font-mono">{p.lote}</span> · Stock: <strong>{p.stock} un.</strong>
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${expLabel.bg} ${expLabel.text} ${expLabel.border}`}
                      >
                        {expLabel.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-sm">Alerta de Reposición (Stock Bajo)</h3>
              </div>
              <button
                onClick={() => setActiveView('inventario')}
                className="text-xs text-emerald-700 hover:underline font-semibold cursor-pointer"
              >
                Ver inventario
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Todos los medicamentos cuentan con stock superior al mínimo.
                </p>
              ) : (
                lowStockProducts.map(p => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{p.nombre}</p>
                      <p className="text-[11px] text-slate-500">
                        {p.laboratorio} · Ubicación: {p.ubicacion}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-xs">
                        {p.stock} un.
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Mínimo: {p.stockMinimo}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT SALES & TOP SELLING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">Medicamentos de Mayor Rotación</h3>
            </div>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {topSelling.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aún no hay ventas registradas.</p>
            ) : (
              topSelling.map((it, i) => (
                <div key={i} className="py-2.5 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600">
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-800">{it.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{it.quantity} un.</span>
                    <span className="text-[10px] text-emerald-600 block">{formatCurrency(it.revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">Últimos Comprobantes de Venta</h3>
            </div>
            <button
              onClick={() => setActiveView('ventas')}
              className="text-xs text-emerald-700 hover:underline font-semibold cursor-pointer"
            >
              Ver historial
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {recentSales.map(sale => (
              <div key={sale.id} className="py-2.5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-800 font-mono">{sale.correlativo}</p>
                  <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                    {sale.clienteNombre} · {sale.items.length} items
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 text-sm">{formatCurrency(sale.total)}</span>
                  <span className="text-[10px] text-slate-400 block uppercase">{sale.metodoPago.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
