import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  Sliders,
  CheckSquare,
  Square
} from 'lucide-react';

export const CashierRolesManager: React.FC = () => {
  const { users, currentTenant, updateUserAssignedModules, updateUser } = usePharmacy();

  const [savedUserId, setSavedUserId] = useState<string | null>(null);

  // Cashiers belonging to current botica
  const boticaCashiers = users.filter(
    u => u.tenantId === currentTenant.id && u.role === 'cashier'
  );

  const availableModules = [
    {
      id: 'pos',
      label: 'Punto de Venta (POS) & Cobranza',
      description: 'Dispensación rápida, búsqueda de productos y emisión de comprobantes'
    },
    {
      id: 'inventario',
      label: 'Consulta de Medicamentos & Stock',
      description: 'Ver precios de venta, existencia y principios activos'
    },
    {
      id: 'clientes',
      label: 'Consulta de Pacientes & Clientes',
      description: 'Buscar clientes frecuentes y verificar alergias'
    },
    {
      id: 'vencimientos',
      label: 'Monitoreo de Lotes & Vencimientos',
      description: 'Ver fechas de caducidad para rotación FEFO en mostrador'
    }
  ];

  const handleToggleModule = (userId: string, currentModules: string[], moduleId: string) => {
    let nextModules: string[];
    if (currentModules.includes(moduleId)) {
      nextModules = currentModules.filter(m => m !== moduleId);
      if (nextModules.length === 0) {
        alert('El cajero debe tener al menos un módulo asignado (por ejemplo, POS).');
        return;
      }
    } else {
      nextModules = [...currentModules, moduleId];
    }

    updateUserAssignedModules(userId, nextModules);
    setSavedUserId(userId);
    setTimeout(() => setSavedUserId(null), 2500);
  };

  const handleToggleActive = (userId: string, currentStatus: boolean | undefined) => {
    updateUser(userId, { activo: currentStatus === false ? true : false });
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-50 text-blue-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
              POLÍTICA DE SEGURIDAD & ACCESOS
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            Asignación de Módulos & Roles a Cajeros
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Configure qué pantallas puede ver y operar cada cajero en su botica. Los cajeros solo trabajarán con los módulos que usted marque aquí.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl max-w-md text-xs text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Control interno:</strong> Los cajeros solo son dados de alta por el Super Administrador del SaaS. Ellos <strong>no tienen acceso</strong> al Arqueo de Caja ni a Personalización de la Botica.
          </span>
        </div>
      </div>

      {/* Cashier Cards */}
      <div className="space-y-4">
        {boticaCashiers.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">No hay cajeros asignados a su botica</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Comuníquese con el Super Administrador del SaaS para dar de alta nuevos cajeros para su botica.
            </p>
          </div>
        ) : (
          boticaCashiers.map(cajero => {
            const assigned = cajero.assignedModules || ['pos'];
            const isActive = cajero.activo !== false;

            return (
              <div
                key={cajero.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
              >
                {/* Header of Cashier Card */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {cajero.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-sm">{cajero.nombre}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isActive ? 'Activo para Vender' : 'Acceso Pausado'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        Correo: {cajero.email} · Clave: {cajero.password}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {savedUserId === cajero.id && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4" /> ¡Permisos guardados!
                      </span>
                    )}

                    <button
                      onClick={() => handleToggleActive(cajero.id, cajero.activo)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        isActive
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{isActive ? 'Pausar Acceso' : 'Reactivar Acceso'}</span>
                    </button>
                  </div>
                </div>

                {/* Modules Checklist */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Módulos Habilitados para {cajero.nombre}:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {availableModules.map(mod => {
                      const isChecked = assigned.includes(mod.id);
                      return (
                        <div
                          key={mod.id}
                          onClick={() => handleToggleModule(cajero.id, assigned, mod.id)}
                          className={`p-3.5 rounded-xl border text-left transition select-none cursor-pointer flex items-start gap-2.5 ${
                            isChecked
                              ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                              : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="mt-0.5">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4
                              className={`text-xs font-bold ${
                                isChecked ? 'text-emerald-950' : 'text-slate-600'
                              }`}
                            >
                              {mod.label}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                              {mod.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Restricted Features Note */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>
                    Módulos restringidos por el sistema (Solo Administrador): <strong>Arqueo de Caja Chica</strong>, <strong>Personalización de la Botica</strong>, <strong>Reporte de Productividad</strong>.
                  </span>
                  <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                    Rol: Cajero Operativo
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
