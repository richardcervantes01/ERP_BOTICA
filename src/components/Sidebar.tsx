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
  RotateCcw,
  Shield,
  Store,
  Sliders,
  TrendingUp,
  Award,
  FileCode2,
  ShieldCheck
} from 'lucide-react';
import { usePharmacy, AppView } from '../context/PharmacyContext';

interface SidebarProps {
  onOpenLoginModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenLoginModal }) => {
  const {
    activeView,
    setActiveView,
    metrics,
    resetDatabase,
    currentUser,
    currentTenant
  } = usePharmacy();

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isTenantAdmin = currentUser?.role === 'tenant_admin';
  const isCashier = currentUser?.role === 'cashier';

  // Allowed modules for cashier
  const cashierModules = currentUser?.assignedModules || ['pos'];

  const allNavItems: {
    id: AppView;
    label: string;
    icon: any;
    badge: React.ReactNode;
    show: boolean;
  }[] = [
    {
      id: 'saas_admin',
      label: 'Panel Maestro SaaS',
      icon: Shield,
      badge: (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-600 text-white">
          Super Admin
        </span>
      ),
      show: isSuperAdmin
    },
    {
      id: 'pos',
      label: 'Punto de Venta (POS)',
      icon: ShoppingCart,
      badge: null,
      show: isSuperAdmin || isTenantAdmin || (isCashier && cashierModules.includes('pos'))
    },
    {
      id: 'vencimientos',
      label: 'Control de Vencimientos',
      icon: Calendar,
      badge:
        metrics.vencidosCount + metrics.criticosCount > 0 ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white animate-pulse">
            {metrics.vencidosCount + metrics.criticosCount}
          </span>
        ) : null,
      show: isSuperAdmin || isTenantAdmin || (isCashier && cashierModules.includes('vencimientos'))
    },
    {
      id: 'inventario',
      label: 'Medicamentos & Stock',
      icon: Pill,
      badge:
        metrics.stockBajoCount > 0 ? (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
            {metrics.stockBajoCount}
          </span>
        ) : null,
      show: isSuperAdmin || isTenantAdmin || (isCashier && cashierModules.includes('inventario'))
    },
    {
      id: 'ventas',
      label: 'Historial de Ventas',
      icon: Receipt,
      badge: null,
      show: isSuperAdmin || isTenantAdmin
    },
    {
      id: 'dashboard',
      label: 'Dashboard & Resumen',
      icon: LayoutDashboard,
      badge: null,
      show: isSuperAdmin || isTenantAdmin
    },
    {
      id: 'productividad',
      label: 'Productividad de Cajeros',
      icon: TrendingUp,
      badge: (
        <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
          Rankings
        </span>
      ),
      show: isSuperAdmin || isTenantAdmin
    },
    {
      id: 'cajeros_permisos',
      label: 'Gestión de Cajeros',
      icon: Sliders,
      badge: null,
      show: isSuperAdmin || isTenantAdmin
    },
    {
      id: 'clientes',
      label: 'Clientes & Pacientes',
      icon: Users,
      badge: null,
      show: isSuperAdmin || isTenantAdmin || (isCashier && cashierModules.includes('clientes'))
    },
    {
      id: 'caja',
      label: 'Control y Arqueo de Caja',
      icon: Wallet,
      badge: null,
      show: isSuperAdmin || isTenantAdmin // Cajero NEVER sees cash drawer arqueo
    },
    {
      id: 'digemid',
      label: 'Regulatorio DIGEMID / MINSA',
      icon: ShieldCheck,
      badge: (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
          OPPF & FEFO
        </span>
      ),
      show: isSuperAdmin || isTenantAdmin
    },
    {
      id: 'sunat_api',
      label: 'Facturación SUNAT (API)',
      icon: FileCode2,
      badge: (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
          UBL 2.1
        </span>
      ),
      show: isSuperAdmin || isTenantAdmin // Cajero NEVER manages fiscal API
    },
    {
      id: 'configuracion',
      label: 'Personalización Botica',
      icon: Store,
      badge: null,
      show: isSuperAdmin || isTenantAdmin // Cajero NEVER customizes botica
    }
  ];

  const visibleNavItems = allNavItems.filter(item => item.show);

  return (
    <aside className="w-64 bg-emerald-950 text-white flex flex-col justify-between shrink-0 select-none border-r border-emerald-900/50">
      <div className="flex flex-col overflow-hidden">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 bg-emerald-900/90 gap-3 border-b border-emerald-800/80 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30 shrink-0">
            <Cross className="text-emerald-400 w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="text-base font-bold tracking-wide text-white block truncate">
              {currentTenant.nombreBotica || 'FarmaControl'}
            </span>
            <p className="text-[10px] text-emerald-300 font-mono tracking-wider uppercase">
              RUC: {currentTenant.ruc}
            </p>
          </div>
        </div>

        {/* User Role Indicator Banner */}
        <div className="px-4 py-2.5 bg-emerald-900/40 border-b border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <div
              className={`w-2 h-2 rounded-full ${
                isSuperAdmin
                  ? 'bg-purple-400 animate-ping'
                  : isTenantAdmin
                  ? 'bg-emerald-400'
                  : 'bg-blue-400'
              }`}
            />
            <div className="truncate">
              <p className="text-[11px] font-bold text-white truncate">
                {currentUser ? currentUser.nombre : 'Invitado'}
              </p>
              <p className="text-[9px] text-emerald-300 uppercase">
                {isSuperAdmin
                  ? 'Super Admin (Tú)'
                  : isTenantAdmin
                  ? 'Admin de Botica'
                  : 'Cajero Mostrador'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenLoginModal}
            className="text-[10px] text-emerald-300 hover:text-white bg-emerald-800/60 hover:bg-emerald-800 px-2 py-1 rounded transition cursor-pointer shrink-0"
            title="Cambiar de usuario o rol"
          >
            Cambiar
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {visibleNavItems.map(item => {
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
      <div className="p-3 border-t border-emerald-900/70 bg-emerald-950/60 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[11px] text-emerald-400 px-1">
          <span>Licencia: {currentTenant.plan.toUpperCase()}</span>
          {isSuperAdmin && (
            <button
              onClick={() => {
                if (window.confirm('¿Deseas restaurar la base de datos de prueba?')) {
                  resetDatabase();
                }
              }}
              title="Restaurar datos de prueba"
              className="text-emerald-400/80 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reiniciar
            </button>
          )}
        </div>
        <p className="text-[10px] text-emerald-500/80 text-center font-mono">
          DIGEMID / FEFO Standard • v2.2 Multi-Rol
        </p>
      </div>
    </aside>
  );
};
