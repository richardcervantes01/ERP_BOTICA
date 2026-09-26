import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { TenantSettings, UserRole } from '../../types/pharmacy';
import {
  Shield,
  Building,
  Plus,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Key,
  Calendar,
  Lock,
  Unlock,
  LogIn,
  DollarSign,
  TrendingUp,
  X,
  FileCheck,
  Receipt,
  UserCheck,
  Filter,
  CreditCard,
  Trash2,
  Search
} from 'lucide-react';
import {
  formatDateSpanish,
  formatCurrency,
  getDaysUntilExpiration,
  formatDateTimeSpanish
} from '../../utils/dateUtils';

export const SaasAdminPortal: React.FC = () => {
  const {
    tenants,
    users,
    sales,
    liquidaciones,
    createTenant,
    updateTenantLicense,
    switchActiveTenant,
    createUser,
    updateUser,
    deleteUser,
    addLiquidacion,
    updateLiquidacionStatus
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'boticas' | 'usuarios' | 'ventas' | 'liquidaciones'>('boticas');

  // Modals state
  const [isCreateTenantModalOpen, setIsCreateTenantModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isAddLiquidacionModalOpen, setIsAddLiquidacionModalOpen] = useState(false);

  // New tenant form
  const [nombreBotica, setNombreBotica] = useState('');
  const [ruc, setRuc] = useState('');
  const [direccion, setDireccion] = useState('');
  const [emailOwner, setEmailOwner] = useState('');
  const [passOwner, setPassOwner] = useState('');
  const [nombreOwner, setNombreOwner] = useState('');
  const [plan, setPlan] = useState<'basico' | 'pro' | 'enterprise'>('pro');
  const [duracionMeses, setDuracionMeses] = useState(12);

  // New user form (specifically for creating cashiers or botica admins)
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('cashier');
  const [newUserTenantId, setNewUserTenantId] = useState(tenants[0]?.id || '');

  // Liquidacion form
  const [liqTenantId, setLiqTenantId] = useState(tenants[0]?.id || '');
  const [liqPeriodo, setLiqPeriodo] = useState('Octubre 2026');
  const [liqPlan, setLiqPlan] = useState('Plan Mensual Básico');
  const [liqMonto, setLiqMonto] = useState('120.00');
  const [liqMetodo, setLiqMetodo] = useState('Transferencia BCP');

  // Filter for Global Sales
  const [salesTenantFilter, setSalesTenantFilter] = useState('todos');
  const [salesSearchQuery, setSalesSearchQuery] = useState('');

  // Stats
  const activeTenants = tenants.filter(t => t.estadoLicencia === 'activa');
  const suspendedTenants = tenants.filter(t => t.estadoLicencia === 'suspendida');
  const totalGlobalSales = sales
    .filter(s => s.estado === 'completada')
    .reduce((acc, s) => acc + s.total, 0);

  const totalSaaSIncome = liquidaciones
    .filter(l => l.estado === 'pagado')
    .reduce((acc, l) => acc + l.monto, 0);

  const filteredGlobalSales = useMemo(() => {
    return sales.filter(s => {
      const matchesTenant = salesTenantFilter === 'todos' || s.tenantId === salesTenantFilter;
      const q = salesSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.correlativo.toLowerCase().includes(q) ||
        s.clienteNombre.toLowerCase().includes(q) ||
        s.vendedor.toLowerCase().includes(q);
      return matchesTenant && matchesSearch;
    });
  }, [sales, salesTenantFilter, salesSearchQuery]);

  const handleCreateTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreBotica || !emailOwner || !passOwner) {
      alert('Complete los campos obligatorios');
      return;
    }

    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + Number(duracionMeses));

    createTenant(
      {
        nombreBotica,
        ruc: ruc || '20000000000',
        direccion: direccion || 'Dirección Principal',
        telefono: '999 888 777',
        emailContacto: emailOwner,
        regenteQF: 'Q.F. Por Registrar',
        colegiaturaQF: 'CQFP 00000',
        monedaSimbolo: 'S/',
        igvPorcentaje: 18,
        pieDeTicket: '¡Gracias por su compra!',
        plan,
        estadoLicencia: 'activa',
        fechaVencimientoLicencia: expDate.toISOString().split('T')[0]
      },
      {
        email: emailOwner,
        pass: passOwner,
        name: nombreOwner || `Administrador ${nombreBotica}`
      }
    );

    setIsCreateTenantModalOpen(false);
    setNombreBotica('');
    setRuc('');
    setDireccion('');
    setEmailOwner('');
    setPassOwner('');
    setNombreOwner('');
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPass) {
      alert('Complete los campos requeridos');
      return;
    }

    createUser({
      nombre: newUserName,
      email: newUserEmail,
      password: newUserPass,
      role: newUserRole,
      tenantId: newUserTenantId,
      assignedModules: newUserRole === 'cashier' ? ['pos'] : undefined,
      activo: true
    });

    setIsCreateUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPass('');
  };

  const handleAddLiquidacionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = tenants.find(ten => ten.id === liqTenantId);
    addLiquidacion({
      tenantId: liqTenantId,
      tenantNombre: t ? t.nombreBotica : 'Botica Cliente',
      periodo: liqPeriodo,
      plan: liqPlan,
      monto: parseFloat(liqMonto) || 0,
      fechaPago: new Date().toISOString().split('T')[0],
      metodoPago: liqMetodo,
      estado: 'pagado',
      comprobanteSaaS: `FAC-SAAS-${Math.floor(1000 + Math.random() * 9000)}`
    });

    setIsAddLiquidacionModalOpen(false);
  };

  const handleRenewLicense = (t: TenantSettings, months: number) => {
    const current = new Date(t.fechaVencimientoLicencia);
    const baseDate = current > new Date() ? current : new Date();
    baseDate.setMonth(baseDate.getMonth() + months);

    updateTenantLicense(t.id, {
      fechaVencimientoLicencia: baseDate.toISOString().split('T')[0],
      estadoLicencia: 'activa'
    });
  };

  const handleToggleSuspend = (t: TenantSettings) => {
    const nextState = t.estadoLicencia === 'suspendida' ? 'activa' : 'suspendida';
    if (window.confirm(`¿Desea cambiar el estado de ${t.nombreBotica} a ${nextState.toUpperCase()}?`)) {
      updateTenantLicense(t.id, { estadoLicencia: nextState });
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-indigo-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-purple-400/30">
              ROL: SUPER ADMINISTRADOR SAAS
            </span>
          </div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Panel de Control Maestro • Gestión Global del Sistema
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Administre boticas clientes, alta de usuarios y cajeros, historial global de ventas de sus clientes y liquidaciones de suscripción.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateUserModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Crear Cajero / Usuario</span>
          </button>
          <button
            onClick={() => setIsCreateTenantModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Botica</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Boticas Clientes</p>
          <h3 className="text-2xl font-extrabold text-slate-800">{tenants.length}</h3>
          <p className="text-[11px] text-slate-400">{activeTenants.length} activas · {suspendedTenants.length} suspendidas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs">
          <p className="text-[11px] font-semibold text-purple-700 uppercase">Usuarios & Cajeros</p>
          <h3 className="text-2xl font-extrabold text-purple-700">{users.length}</h3>
          <p className="text-[11px] text-purple-600">
            {users.filter(u => u.role === 'cashier').length} cajeros dados de alta
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
          <p className="text-[11px] font-semibold text-blue-700 uppercase">Ventas Globales Clientes</p>
          <h3 className="text-2xl font-extrabold text-blue-700">{formatCurrency(totalGlobalSales)}</h3>
          <p className="text-[11px] text-blue-600">Dispensado en toda la red</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase">Recaudación Licencias</p>
          <h3 className="text-2xl font-extrabold text-emerald-700">{formatCurrency(totalSaaSIncome)}</h3>
          <p className="text-[11px] text-emerald-600">Cobrado en suscripciones</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'boticas' as const, label: 'Boticas & Licencias', count: tenants.length, icon: Building },
          { id: 'usuarios' as const, label: 'Administración de Usuarios & Cajeros', count: users.length, icon: Users },
          { id: 'ventas' as const, label: 'Historial de Ventas de Clientes', count: sales.length, icon: Receipt },
          { id: 'liquidaciones' as const, label: 'Liquidaciones & Cobranzas SaaS', count: liquidaciones.length, icon: CreditCard }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BOTICAS & LICENCIAS */}
      {activeTab === 'boticas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Cartera de Boticas Suscritas</h3>
              <p className="text-xs text-slate-400">Listado de farmacias que han adquirido el software.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-4">Establecimiento / RUC</th>
                  <th className="p-4">Dueño & Credenciales</th>
                  <th className="p-4">Plan SaaS</th>
                  <th className="p-4">Estado Licencia</th>
                  <th className="p-4">Vencimiento</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map(t => {
                  const tenantAdminUser = users.find(
                    u => u.tenantId === t.id && u.role === 'tenant_admin'
                  );
                  const daysRemaining = getDaysUntilExpiration(t.fechaVencimientoLicencia);
                  const isSuspended = t.estadoLicencia === 'suspendida';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <p className="font-bold text-slate-800 text-sm">{t.nombreBotica}</p>
                        <p className="text-[11px] font-mono text-slate-500">RUC: {t.ruc}</p>
                        <p className="text-[10px] text-slate-400">{t.direccion}</p>
                      </td>

                      <td className="p-4">
                        {tenantAdminUser ? (
                          <div>
                            <p className="font-semibold text-slate-800">{tenantAdminUser.nombre}</p>
                            <p className="text-[11px] text-slate-500">{tenantAdminUser.email}</p>
                            <span className="text-[10px] font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">
                              Clave: {tenantAdminUser.password}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Sin usuario asignado</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Plan {t.plan}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                            isSuspended
                              ? 'bg-rose-100 text-rose-800'
                              : daysRemaining <= 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSuspended ? 'bg-rose-600' : 'bg-emerald-600'
                            }`}
                          />
                          <span>{t.estadoLicencia.toUpperCase()}</span>
                        </span>
                      </td>

                      <td className="p-4">
                        <p className="font-semibold text-slate-800">
                          {formatDateSpanish(t.fechaVencimientoLicencia)}
                        </p>
                        <p
                          className={`text-[10px] font-medium ${
                            daysRemaining <= 30 ? 'text-amber-700 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {daysRemaining <= 0
                            ? 'Vencida'
                            : `Quedan ${daysRemaining} días de servicio`}
                        </p>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleRenewLicense(t, 12)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-medium transition cursor-pointer"
                            title="Extender 1 año"
                          >
                            +1 Año
                          </button>

                          <button
                            onClick={() => handleToggleSuspend(t)}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                              isSuspended
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                            title={isSuspended ? 'Reactivar servicio' : 'Suspender botica por falta de pago'}
                          >
                            {isSuspended ? 'Activar' : 'Suspender'}
                          </button>

                          <button
                            onClick={() => switchActiveTenant(t.id)}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                            title="Ingresar a la botica para soporte técnico"
                          >
                            <LogIn className="w-3 h-3" />
                            <span>Ingresar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ADMINISTRACIÓN GLOBAL DE USUARIOS & CAJEROS */}
      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Control Centralizado de Usuarios & Cajeros</h3>
              <p className="text-xs text-slate-500">
                Por política de seguridad, <strong>los cajeros solo son dados de alta por el Super Administrador</strong>.
              </p>
            </div>
            <button
              onClick={() => setIsCreateUserModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Dar de Alta Nuevo Cajero</span>
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-4">Nombre de Usuario</th>
                <th className="p-4">Correo Electrónico</th>
                <th className="p-4">Contraseña</th>
                <th className="p-4">Botica Asignada</th>
                <th className="p-4">Rol en el Sistema</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const tenantOfUser = tenants.find(t => t.id === u.tenantId);
                const isSuper = u.role === 'superadmin';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{u.nombre}</p>
                      {u.role === 'cashier' && u.assignedModules && (
                        <p className="text-[10px] text-slate-400">
                          Módulos: {u.assignedModules.join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-600">{u.email}</td>
                    <td className="p-4 font-mono text-slate-700 font-bold bg-slate-50/60">{u.password}</td>
                    <td className="p-4">
                      {isSuper ? (
                        <span className="text-purple-700 font-bold text-[11px]">Todas las Boticas (Global)</span>
                      ) : (
                        <span className="font-medium text-slate-800">{tenantOfUser?.nombreBotica || 'Sin botica'}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'superadmin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'tenant_admin'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role === 'superadmin' ? 'Super Admin' : u.role === 'tenant_admin' ? 'Dueño Botica' : 'Cajero'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.activo === false ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.activo === false ? 'Inactivo' : 'Activo'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {!isSuper && (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              const newPass = window.prompt(`Cambiar clave para ${u.nombre}:`, u.password);
                              if (newPass) updateUser(u.id, { password: newPass });
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Cambiar contraseña"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              updateUser(u.id, { activo: u.activo === false ? true : false });
                            }}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"
                            title={u.activo === false ? 'Reactivar' : 'Desactivar'}
                          >
                            {u.activo === false ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: HISTORIAL GLOBAL DE VENTAS DE CLIENTES */}
      {activeTab === 'ventas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Historial Consolidado de Ventas de Boticas Clientes</h3>
              <p className="text-xs text-slate-500">
                Supervisión en tiempo real de transacciones dispensadas en toda la plataforma SaaS.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={salesTenantFilter}
                onChange={e => setSalesTenantFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700"
              >
                <option value="todos">Todas las Boticas Clientes</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.nombreBotica}</option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  value={salesSearchQuery}
                  onChange={e => setSalesSearchQuery(e.target.value)}
                  placeholder="Buscar comprobante, cajero..."
                  className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-4">Establecimiento</th>
                <th className="p-4">Comprobante</th>
                <th className="p-4">Fecha y Hora</th>
                <th className="p-4">Cajero / Vendedor</th>
                <th className="p-4">Paciente / Cliente</th>
                <th className="p-4">Medio de Pago</th>
                <th className="p-4 text-right">Total Venta</th>
                <th className="p-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGlobalSales.map(s => {
                const sTenant = tenants.find(t => t.id === s.tenantId);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-slate-800">
                      {sTenant?.nombreBotica || 'Botica San José'}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700">
                      {s.correlativo}
                      <span className="block text-[10px] text-slate-400 uppercase font-sans">{s.tipoComprobante}</span>
                    </td>
                    <td className="p-4 text-slate-600">{formatDateTimeSpanish(s.fecha)}</td>
                    <td className="p-4 font-medium text-slate-800">{s.vendedor}</td>
                    <td className="p-4">{s.clienteNombre}</td>
                    <td className="p-4 uppercase text-[10px] font-semibold text-slate-600">
                      {s.metodoPago.replace('_', ' / ')}
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-700 text-sm">
                      {formatCurrency(s.total)}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.estado === 'anulada' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {s.estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: LIQUIDACIONES & COBRANZAS SAAS */}
      {activeTab === 'liquidaciones' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Control de Liquidaciones & Suscripciones SaaS</h3>
              <p className="text-xs text-slate-500">
                Registro de pagos de licencias recibidos de cada botica cliente.
              </p>
            </div>
            <button
              onClick={() => setIsAddLiquidacionModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Liquidación / Cobro</span>
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-4">N° Comprobante SaaS</th>
                <th className="p-4">Botica Cliente</th>
                <th className="p-4">Periodo / Concepto</th>
                <th className="p-4">Plan Contratado</th>
                <th className="p-4">Fecha de Pago</th>
                <th className="p-4">Medio de Cobro</th>
                <th className="p-4 text-right">Monto Liquidado</th>
                <th className="p-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {liquidaciones.map(liq => (
                <tr key={liq.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-mono font-bold text-slate-800">{liq.comprobanteSaaS}</td>
                  <td className="p-4 font-semibold text-slate-800">{liq.tenantNombre}</td>
                  <td className="p-4 text-slate-700">{liq.periodo}</td>
                  <td className="p-4 text-slate-600">{liq.plan}</td>
                  <td className="p-4 text-slate-600">{formatDateSpanish(liq.fechaPago)}</td>
                  <td className="p-4 text-slate-600">{liq.metodoPago}</td>
                  <td className="p-4 text-right font-bold text-emerald-700 text-sm">
                    {formatCurrency(liq.monto)}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() =>
                        updateLiquidacionStatus(liq.id, liq.estado === 'pagado' ? 'pendiente' : 'pagado')
                      }
                      className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer ${
                        liq.estado === 'pagado'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      {liq.estado.toUpperCase()}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create New Tenant */}
      {isCreateTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                Dar de Alta Nueva Botica / Cliente
              </h3>
              <button onClick={() => setIsCreateTenantModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenantSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre Comercial de la Botica *</label>
                <input
                  type="text"
                  value={nombreBotica}
                  onChange={e => setNombreBotica(e.target.value)}
                  placeholder="Ej: Farmacia San Lucas"
                  required
                  className="w-full px-3 py-2 border rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">RUC</label>
                  <input
                    type="text"
                    value={ruc}
                    onChange={e => setRuc(e.target.value)}
                    placeholder="20601892341"
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dirección / Distrito</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    placeholder="Av. Los Fresnos 221"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-[11px]">
                  Credenciales de Acceso para el Dueño de la Botica:
                </span>
                <div>
                  <label className="block text-slate-600 mb-0.5">Nombre del Dueño</label>
                  <input
                    type="text"
                    value={nombreOwner}
                    onChange={e => setNombreOwner(e.target.value)}
                    placeholder="Dr. Jorge Valdivia"
                    className="w-full px-3 py-1.5 bg-white border rounded text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-0.5">Correo *</label>
                    <input
                      type="email"
                      value={emailOwner}
                      onChange={e => setEmailOwner(e.target.value)}
                      placeholder="dueño@farmacia.pe"
                      required
                      className="w-full px-3 py-1.5 bg-white border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Contraseña Inicial *</label>
                    <input
                      type="text"
                      value={passOwner}
                      onChange={e => setPassOwner(e.target.value)}
                      placeholder="botica2026"
                      required
                      className="w-full px-3 py-1.5 bg-white border rounded text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Plan Contratado</label>
                  <select
                    value={plan}
                    onChange={e => setPlan(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="basico">Básico</option>
                    <option value="pro">Pro (Recomendado)</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Duración Licencia</label>
                  <select
                    value={duracionMeses}
                    onChange={e => setDuracionMeses(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="1">1 Mes</option>
                    <option value="3">3 Meses</option>
                    <option value="6">6 Meses</option>
                    <option value="12">12 Meses (Anual)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateTenantModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Crear y Activar Botica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create User / Cashier (Only Super Admin can create cashiers) */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                Dar de Alta Nuevo Cajero / Usuario
              </h3>
              <button onClick={() => setIsCreateUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Botica Asignada *</label>
                <select
                  value={newUserTenantId}
                  onChange={e => setNewUserTenantId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                  required
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombreBotica} ({t.ruc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Rol a Asignar *</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                >
                  <option value="cashier">Cajero / Mostrador Operativo</option>
                  <option value="tenant_admin">Administrador / Dueño de Botica</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="Ej: Téc. Mariana Reyes"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Correo de Acceso *</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    placeholder="mariana@botica.pe"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contraseña *</label>
                  <input
                    type="text"
                    value={newUserPass}
                    onChange={e => setNewUserPass(e.target.value)}
                    placeholder="caja789"
                    required
                    className="w-full px-3 py-2 border rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-[11px] text-purple-900">
                Una vez creado, el <strong>Administrador de la Botica</strong> podrá asignar qué módulos (POS, inventario, etc.) tendrá habilitado este cajero.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Crear Cajero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Liquidacion */}
      {isAddLiquidacionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Registrar Cobro de Licencia SaaS
              </h3>
              <button onClick={() => setIsAddLiquidacionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLiquidacionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Botica Cliente</label>
                <select
                  value={liqTenantId}
                  onChange={e => setLiqTenantId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.nombreBotica}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Periodo Facturado</label>
                  <input
                    type="text"
                    value={liqPeriodo}
                    onChange={e => setLiqPeriodo(e.target.value)}
                    placeholder="Noviembre 2026"
                    className="w-full px-3 py-2 border rounded-lg font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Monto Cobrado (S/)</label>
                  <input
                    type="number"
                    step="5"
                    value={liqMonto}
                    onChange={e => setLiqMonto(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Concepto / Plan</label>
                <input
                  type="text"
                  value={liqPlan}
                  onChange={e => setLiqPlan(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Medio de Pago</label>
                <select
                  value={liqMetodo}
                  onChange={e => setLiqMetodo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="Transferencia BCP">Transferencia BCP</option>
                  <option value="Transferencia BBVA">Transferencia BBVA</option>
                  <option value="Yape Empresa">Yape Empresa / Plin</option>
                  <option value="Efectivo en Oficina">Efectivo en Oficina</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddLiquidacionModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Guardar Liquidación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
