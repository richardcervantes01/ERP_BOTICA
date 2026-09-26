import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Customer } from '../../types/pharmacy';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  AlertOctagon,
  ShoppingBag,
  X,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, formatDateSpanish } from '../../utils/dateUtils';

export const CustomerManager: React.FC = () => {
  const { customers, addCustomer, sales } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New customer form state
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [alergias, setAlergias] = useState('');

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      c.nombre.toLowerCase().includes(q) ||
      c.documento.includes(q) ||
      c.telefono.includes(q) ||
      (c.alergias && c.alergias.toLowerCase().includes(q))
    );
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !documento.trim()) {
      alert('Nombre y documento son obligatorios');
      return;
    }

    addCustomer({
      nombre,
      documento,
      telefono: telefono || 'Sin teléfono',
      email,
      direccion,
      alergias: alergias || 'Ninguna conocida'
    });

    setIsAddModalOpen(false);
    setNombre('');
    setDocumento('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setAlergias('');
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Cartera de Clientes & Pacientes Frecuentes
          </h2>
          <p className="text-xs text-slate-500">
            Fidelización, historial de medicación y registro de contraindicaciones/alergias farmacológicas.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Paciente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar por DNI, RUC, nombre o alergias..."
          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCustomers.map(cust => {
          const hasAllergies = cust.alergias && cust.alergias !== 'Ninguna conocida';
          return (
            <div
              key={cust.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{cust.nombre}</h3>
                    <p className="text-[11px] font-mono text-slate-500">DNI/RUC: {cust.documento}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {cust.comprasRealizadas} compras
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cust.telefono}</span>
                  </div>
                  {cust.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}
                  {cust.direccion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{cust.direccion}</span>
                    </div>
                  )}
                </div>

                {/* Allergies / Clinical Notice */}
                <div
                  className={`mt-3 p-2 rounded-lg text-xs flex items-start gap-1.5 border ${
                    hasAllergies
                      ? 'bg-rose-50 border-rose-200 text-rose-800 font-medium'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <AlertOctagon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${hasAllergies ? 'text-rose-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-semibold block text-[10px] uppercase">Alergias / Restricciones:</span>
                    <span className="text-[11px]">{cust.alergias || 'Ninguna registrada'}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Totals */}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Facturado:</span>
                <span className="font-bold text-emerald-700 text-sm">{formatCurrency(cust.totalGastado)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Registrar Nuevo Paciente</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Laura Sofía Morales"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">DNI / RUC *</label>
                  <input
                    type="text"
                    value={documento}
                    onChange={e => setDocumento(e.target.value)}
                    placeholder="8 dígitos / 11 dígitos"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    placeholder="999 888 777"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="paciente@correo.com"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dirección / Distrito</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                  placeholder="Av. Los Rosales 123"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Alergias o Condiciones Clínicas
                </label>
                <input
                  type="text"
                  value={alergias}
                  onChange={e => setAlergias(e.target.value)}
                  placeholder="Ej: Penicilina, AINEs, Asma, Hipertensión"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
