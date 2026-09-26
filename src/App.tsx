import React, { useState } from 'react';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PointOfSale } from './components/pos/PointOfSale';
import { ExpirationManager } from './components/expirations/ExpirationManager';
import { InventoryManager } from './components/inventory/InventoryManager';
import { SalesHistory } from './components/sales/SalesHistory';
import { CustomerManager } from './components/customers/CustomerManager';
import { Dashboard } from './components/dashboard/Dashboard';
import { CashRegisterModal } from './components/cash/CashRegisterModal';

const AppContent: React.FC = () => {
  const { activeView } = usePharmacy();
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case 'pos':
        return <PointOfSale />;
      case 'vencimientos':
        return <ExpirationManager />;
      case 'inventario':
        return <InventoryManager />;
      case 'ventas':
        return <SalesHistory />;
      case 'clientes':
        return <CustomerManager />;
      case 'dashboard':
        return <Dashboard />;
      case 'caja':
        return (
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Módulo de Control y Cuadre de Caja</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Revise los saldos en efectivo, registre egresos de turno o realice el arqueo de cierre.
                </p>
              </div>
              <button
                onClick={() => setIsCashModalOpen(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Abrir Panel de Arqueo de Caja
              </button>
            </div>
          </div>
        );
      default:
        return <PointOfSale />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header onOpenCashModal={() => setIsCashModalOpen(true)} />

        {/* Dynamic Section View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderActiveView()}
        </div>
      </main>

      {/* Global Cash Register Modal */}
      <CashRegisterModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <PharmacyProvider>
      <AppContent />
    </PharmacyProvider>
  );
}
