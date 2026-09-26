import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { TenantSettings } from '../../types/pharmacy';
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
  FileCheck
} from 'lucide-react';
import { formatDateSpanish, formatCurrency, getDaysUntilExpiration } from '../../utils/dateUtils';

export const SaasAdminPortal: React.FC = () => {
  const {
    tenants,
    users,
    createTenant,
    updateTenantLicense,
    switchActiveTenant
  } = usePharmacy();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New tenant form
  const [nombreBotica, setNombreBotica] = useState('');
  const [ruc, setRuc] = useState('');
  const [direccion, setDireccion] = useState('');
  const [emailOwner, setEmailOwner] = useState('');
  const [passOwner, setPassOwner] = useState('');
  const [nombreOwner, setNombreOwner] = useState('');
  const [plan, setPlan] = useState<'basico' | 'pro' | 'enterprise'>('pro');
  const [duracionMeses, setDuracionMeses] = useState(12);

  // Stats
  const activeTenants = tenants.filter(t => t.estadoLicencia === 'activa');
  const suspendedTenants = tenants.filter(t => t.estadoLicencia === 'suspendida');

  const handleCreateSubmit = (e: React.FormEvent) => {
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

    setIsCreateModalOpen(false);
    setNombreBotica('');
    setRuc('');
    setDireccion('');
    setEmailOwner('');
    setPassOwner('');
    setNombreOwner('');
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
            Panel de Control Maestro • Gestión de Licencias & Clientes
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Aquí administra a los clientes que le compran el software: crea sus boticas, asigna sus credenciales de acceso, renueva suscripciones y supervisa el estado de sus licencias.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Dar de Alta Nueva Botica</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Boticas Clientes</p>
          <h3 className="text-2xl font-extrabold text-slate-800">{tenants.length}</h3>
          <p className="text-[11px] text-slate-400">Total empresas registradas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase">Licencias Activas</p>
          <h3 className="text-2xl font-extrabold text-emerald-700">{activeTenants.length}</h3>
          <p className="text-[11px] text-emerald-600">Al día con suscripción</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-700 uppercase">Suspendidas / Por Renovar</p>
          <h3 className="text-2xl font-extrabold text-amber-700">{suspendedTenants.length}</h3>
          <p className="text-[11px] text-amber-600">Acceso bloqueado</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs">
          <p className="text-[11px] font-semibold text-purple-700 uppercase">Usuarios Totales</p>
          <h3 className="text-2xl font-extrabold text-purple-700">{users.length}</h3>
          <p className="text-[11px] text-purple-600">Cuentas activas en la plataforma</p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Cartera de Boticas Suscritas</h3>
            <p className="text-xs text-slate-400">Listado de farmacias que han adquirido el software.</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
            {tenants.length} clientes
          </span>
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
                <th className="p-4 text-center">Acciones de Super Admin</th>
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
                        ></span>
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
                        {/* Renew 1 year */}
                        <button
                          onClick={() => handleRenewLicense(t, 12)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-medium transition cursor-pointer"
                          title="Extender 1 año"
                        >
                          +1 Año
                        </button>

                        {/* Suspend or Reactivate */}
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

                        {/* Impersonate/Enter Botica */}
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

      {/* Commercial Guide / Roadmap for the User */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800 text-sm">
            Flujo de Comercialización y Entrega a tus Clientes
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              1
            </span>
            <h4 className="font-bold text-slate-800">Venta y Creación de Cuenta</h4>
            <p className="text-slate-600">
              Cuando una botica o farmacia te compre el sistema (mensual, anual o pago único), haz clic en <strong>"Dar de Alta Nueva Botica"</strong> e ingresa su nombre, RUC y define su correo y contraseña.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              2
            </span>
            <h4 className="font-bold text-slate-800">Entrega de Credenciales al Cliente</h4>
            <p className="text-slate-600">
              Le envías el enlace web de la aplicación junto a su <strong>usuario y contraseña</strong>. Al ingresar, el cliente entra al módulo <strong>"Personalización"</strong> para poner su logotipo, dirección, teléfono y nombre de su farmacéutico regente.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              3
            </span>
            <h4 className="font-bold text-slate-800">Control de Licencias y Cobranza</h4>
            <p className="text-slate-600">
              Desde este panel de Super Admin tú controlas si la licencia vence. Si el cliente no renueva su suscripción mensual/anual, puedes suspender su acceso con un clic o reactivarlo tras recibir el pago.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Create New Tenant */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                Dar de Alta Nueva Botica / Cliente
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombre Comercial de la Botica *
                </label>
                <input
                  type="text"
                  value={nombreBotica}
                  onChange={e => setNombreBotica(e.target.value)}
                  placeholder="Ej: Farmacia San Lucas"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">RUC (Opcional)</label>
                  <input
                    type="text"
                    value={ruc}
                    onChange={e => setRuc(e.target.value)}
                    placeholder="20601892341"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dirección / Distrito</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    placeholder="Av. Los Fresnos 221"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Owner Credentials */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-[11px]">
                  Credenciales de Acceso para el Dueño de la Botica:
                </span>
                <div>
                  <label className="block text-slate-600 mb-0.5">Nombre del Dueño / Contacto</label>
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
                    <label className="block text-slate-600 mb-0.5">Correo de Ingreso *</label>
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

              {/* Plan and duration */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Plan Contratado</label>
                  <select
                    value={plan}
                    onChange={e => setPlan(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="basico">Básico (1 usuario, 1 caja)</option>
                    <option value="pro">Pro (Multiusuario, FEFO ilimitado)</option>
                    <option value="enterprise">Enterprise (Multisede / Cadenas)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Duración de la Licencia
                  </label>
                  <select
                    value={duracionMeses}
                    onChange={e => setDuracionMeses(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="1">1 Mes (Mensualidad)</option>
                    <option value="3">3 Meses (Trimestral)</option>
                    <option value="6">6 Meses (Semestral)</option>
                    <option value="12">12 Meses (Anual)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
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
    </div>
  );
};
