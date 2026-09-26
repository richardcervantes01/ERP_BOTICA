import React from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { AlertTriangle, Clock, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/dateUtils';

export const Header: React.FC<{ onOpenCashModal: () => void }> = ({ onOpenCashModal }) => {
  const { activeView, setActiveView, metrics, cashRegister, sales } = usePharmacy();

  const getTitle = () => {
    switch (activeView) {
      case 'pos':
        return {
          title: 'Punto de Venta (POS)',
          subtitle: 'Dispensación rápida, búsqueda por principio activo y facturación'
        };
      case 'vencimientos':
        return {
          title: 'Control de Vencimientos & Trazabilidad FEFO',
          subtitle: 'Monitoreo de lotes próximos a caducar, actas de baja y promociones'
        };
      case 'inventario':
        return {
          title: 'Catálogo de Medicamentos & Stock',
          subtitle: 'Kárdex, precios, márgenes comerciales y reposición de stock'
        };
      case 'ventas':
        return {
          title: 'Historial de Ventas & Comprobantes',
          subtitle: 'Boletas, facturas electrónicas, tickets y reimpresión'
        };
      case 'dashboard':
        return {
          title: 'Dashboard & Indicadores de Gestión',
          subtitle: 'Rendimiento comercial, alertas sanitarias y valorización'
        };
      case 'clientes':
        return {
          title: 'Cartera de Clientes & Pacientes',
          subtitle: 'Historial de compras, control de alergias y fidelización'
        };
      case 'caja':
        return {
          title: 'Gestión y Cuadre de Caja',
          subtitle: 'Apertura, egresos, arqueo de turno y balance en efectivo'
        };
    }
  };

  const { title, subtitle } = getTitle();

  const cashSalesToday = sales
    .filter(s => s.estado === 'completada' && s.metodoPago === 'efectivo')
    .reduce((acc, s) => acc + s.total, 0);

  const totalExpenses = cashRegister.gastos.reduce((acc, g) => acc + g.monto, 0);
  const currentCashInDrawer = cashRegister.saldoInicial + cashSalesToday - totalExpenses;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
      <div>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
          {title}
        </h1>
        <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Expiration Alert */}
        {metrics.vencidosCount > 0 && (
          <button
            onClick={() => setActiveView('vencimientos')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-100 transition cursor-pointer"
            title="Ver medicamentos vencidos bloqueados"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
            <span className="font-semibold">{metrics.vencidosCount}</span>
            <span className="hidden md:inline">Vencido(s)</span>
          </button>
        )}

        {metrics.criticosCount > 0 && (
          <button
            onClick={() => setActiveView('vencimientos')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium hover:bg-amber-100 transition cursor-pointer"
            title="Lotes por vencer en menos de 30 días"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold">{metrics.criticosCount}</span>
            <span className="hidden md:inline">&le; 30 días</span>
          </button>
        )}

        {/* Cash Drawer Status */}
        <button
          onClick={onOpenCashModal}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
            cashRegister.estado === 'abierta'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Ver arqueo de caja"
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-600" />
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                cashRegister.estado === 'abierta' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            ></span>
            <span>{cashRegister.estado === 'abierta' ? 'Caja Abierta' : 'Caja Cerrada'}</span>
          </span>
          {cashRegister.estado === 'abierta' && (
            <span className="font-semibold text-emerald-700 border-l border-emerald-200 pl-2">
              {formatCurrency(currentCashInDrawer)}
            </span>
          )}
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-emerald-500/20">
            QF
          </div>
          <div className="hidden lg:block text-left text-xs leading-tight">
            <p className="font-semibold text-slate-700">{cashRegister.responsable}</p>
            <p className="text-[10px] text-slate-400">Regente Farmacéutico</p>
          </div>
        </div>
      </div>
    </header>
  );
};
