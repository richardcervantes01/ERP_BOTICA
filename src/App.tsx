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
import { AdminCashAuditView } from './components/cash/AdminCashAuditView';
import { CashierShiftCloseModal } from './components/cash/CashierShiftCloseModal';
import { TenantCustomization } from './components/settings/TenantCustomization';
import { SaasAdminPortal } from './components/admin/SaasAdminPortal';
import { CashierProductivity } from './components/productivity/CashierProductivity';
import { CashierRolesManager } from './components/cashiers/CashierRolesManager';
import { SunatApiPlayground } from './components/sunat/SunatApiPlayground';
import { DigemidComplianceCenter } from './components/digemid/DigemidComplianceCenter';
import { LoginModal } from './components/auth/LoginModal';
import { Lock } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeView, currentUser } = usePharmacy();
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCashierShiftCloseModalOpen, setIsCashierShiftCloseModalOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case 'saas_admin':
      case 'saas_usuarios':
      case 'saas_ventas':
      case 'saas_liquidaciones':
        return <SaasAdminPortal />;
      case 'productividad':
        return <CashierProductivity />;
      case 'cajeros_permisos':
        return <CashierRolesManager />;
      case 'digemid':
        return <DigemidComplianceCenter />;
      case 'sunat_api':
        return <SunatApiPlayground />;
      case 'configuracion':
        return <TenantCustomization />;
      case 'pos':
        return <PointOfSale onOpenCloseShift={() => setIsCashierShiftCloseModalOpen(true)} />;
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
        if (currentUser?.role === 'cashier') {
          return (
            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center space-y-4">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Acceso Reservado al Administrador</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    El Arqueo General de Caja y Validación de Efectivo es gestionado exclusivamente por el Administrador de Botica.
                  </p>
                </div>
                <button
                  onClick={() => setIsCashierShiftCloseModalOpen(true)}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Realizar Entrega y Cierre de Mi Turno</span>
                </button>
              </div>
            </div>
          );
        }
        return <AdminCashAuditView />;
      default:
        return <PointOfSale onOpenCloseShift={() => setIsCashierShiftCloseModalOpen(true)} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar onOpenLoginModal={() => setIsLoginModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenCashModal={() => setIsCashModalOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onOpenCashierCloseShift={() => setIsCashierShiftCloseModalOpen(true)}
        />

        {/* Dynamic Section View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderActiveView()}
        </div>
      </main>

      {/* Global Cash Register Modal (Quick drawer view) */}
      <CashRegisterModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
      />

      {/* Cashier Shift Close & Delivery Modal */}
      <CashierShiftCloseModal
        isOpen={isCashierShiftCloseModalOpen}
        onClose={() => setIsCashierShiftCloseModalOpen(false)}
      />

      {/* Login & User Role Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
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
