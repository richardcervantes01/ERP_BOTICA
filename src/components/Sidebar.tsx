import React from 'react';
import {
  ShoppingCart,
  LayoutDashboard,
  Pill,
  Users,
  Calendar,
  Receipt,
  Wallet,
  Cross,
  RotateCcw
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, metrics, resetDatabase } = usePharmacy();

  const navItems = [
    {
      id: 'pos' as const,
      label: 'Punto de Venta (POS)',
      icon: ShoppingCart,
      badge: null
    },
    {
      id: 'vencimientos' as const,
      label: 'Control de Vencimientos',
      icon: Calendar,
      badge: metrics.vencidosCount + metrics.criticosCount > 0 ? (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white animate-pulse">
          {metrics.vencidosCount + metrics.criticosCount}
        </span>
      ) : null
    },
    {
      id: 'inventario' as const,
      label: 'Medicamentos & Stock',
      icon: Pill,
      badge: metrics.stockBajoCount > 0 ? (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
          {metrics.stockBajoCount}
        </span>
      ) : null
    },
    {
      id: 'ventas' as const,
      label: 'Historial de Ventas',
      icon: Receipt,
      badge: null
    },
    {
      id: 'dashboard' as const,
      label: 'Dashboard & Resumen',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'clientes' as const,
      label: 'Clientes',
      icon: Users,
      badge: null
    },
    {
      id: 'caja' as const,
      label: 'Control de Caja',
      icon: Wallet,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-emerald-950 text-white flex flex-col justify-between shrink-0 select-none border-r border-emerald-900/50">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 bg-emerald-900/90 gap-3 border-b border-emerald-800/80">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
            <Cross className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-wide text-white">
              Farma<span className="text-emerald-400">Control</span>
            </span>
            <p className="text-[10px] text-emerald-300 font-mono tracking-wider uppercase">ERP & Botica</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-emerald-200/90 hover:bg-emerald-900/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Reset */}
      <div className="p-3 border-t border-emerald-900/70 bg-emerald-950/60 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-emerald-400 px-1">
          <span>Mi Botica v2.0 • FEFO</span>
          <button
            onClick={() => {
              if (window.confirm('¿Deseas restaurar los medicamentos y ventas de prueba?')) {
                resetDatabase();
              }
            }}
            title="Restaurar datos de prueba"
            className="text-emerald-400/80 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reiniciar
          </button>
        </div>
        <p className="text-[10px] text-emerald-500/80 text-center font-mono">
          DIGEMID / BPA Standard
        </p>
      </div>
    </aside>
  );
};
