import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Store,
  Save,
  CheckCircle2,
  Receipt,
  ShieldCheck,
  Calendar,
  Sparkles,
  Building,
  Phone,
  Mail,
  MapPin,
  Award
} from 'lucide-react';
import { formatDateSpanish } from '../../utils/dateUtils';

export const TenantCustomization: React.FC = () => {
  const { currentTenant, updateCurrentTenant } = usePharmacy();

  const [nombreBotica, setNombreBotica] = useState(currentTenant.nombreBotica);
  const [ruc, setRuc] = useState(currentTenant.ruc);
  const [direccion, setDireccion] = useState(currentTenant.direccion);
  const [telefono, setTelefono] = useState(currentTenant.telefono);
  const [emailContacto, setEmailContacto] = useState(currentTenant.emailContacto);
  const [regenteQF, setRegenteQF] = useState(currentTenant.regenteQF);
  const [colegiaturaQF, setColegiaturaQF] = useState(currentTenant.colegiaturaQF);
  const [monedaSimbolo, setMonedaSimbolo] = useState(currentTenant.monedaSimbolo || 'S/');
  const [igvPorcentaje, setIgvPorcentaje] = useState(currentTenant.igvPorcentaje || 18);
  const [pieDeTicket, setPieDeTicket] = useState(currentTenant.pieDeTicket);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentTenant({
      nombreBotica,
      ruc,
      direccion,
      telefono,
      emailContacto,
      regenteQF,
      colegiaturaQF,
      monedaSimbolo,
      igvPorcentaje: Number(igvPorcentaje),
      pieDeTicket
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            Personalización de su Botica / Farmacia
          </h2>
          <p className="text-xs text-slate-500">
            Configure la identidad comercial, datos fiscales y encabezados oficiales que aparecerán en sus comprobantes y ventas.
          </p>
        </div>

        {/* License Pill */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <div className="text-xs">
            <p className="font-bold text-emerald-900 uppercase text-[10px]">
              Plan {currentTenant.plan.toUpperCase()} • Licencia {currentTenant.estadoLicencia.toUpperCase()}
            </p>
            <p className="text-[11px] text-emerald-700">
              Vigente hasta: <strong>{formatDateSpanish(currentTenant.fechaVencimientoLicencia)}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Customization Form (Span 2) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          {savedSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡Datos de su botica guardados y actualizados en todo el sistema!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Identidad Comercial & Fiscal</h3>
              <p className="text-[11px] text-slate-400">Datos que se imprimen en Boletas y Facturas electrónicas.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombre Comercial de la Botica *
                </label>
                <input
                  type="text"
                  value={nombreBotica}
                  onChange={e => setNombreBotica(e.target.value)}
                  placeholder="Ej: Botica FarmaSalud San Borja"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  RUC de la Empresa / Persona con Negocio *
                </label>
                <input
                  type="text"
                  value={ruc}
                  onChange={e => setRuc(e.target.value)}
                  placeholder="20601892341"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Dirección Física del Establecimiento Farmacéutico *
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                  placeholder="Av. Aviación 2840, San Borja - Lima"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Teléfono de Atención / Delivery
                </label>
                <input
                  type="text"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="(01) 480-1200 / 984 512 890"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Correo Electrónico de Contacto
                </label>
                <input
                  type="email"
                  value={emailContacto}
                  onChange={e => setEmailContacto(e.target.value)}
                  placeholder="administracion@mifarmacia.pe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div className="border-b border-slate-100 pb-3 pt-3">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Regencia Farmacéutica & Dirección Técnica</h3>
              <p className="text-[11px] text-slate-400">Requerido por DIGEMID en actas de baja sanitaria e inspecciones.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombre del Químico Farmacéutico (Q.F.) Regente
                </label>
                <input
                  type="text"
                  value={regenteQF}
                  onChange={e => setRegenteQF(e.target.value)}
                  placeholder="Q.F. Fernando Ramos"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Número de Colegiatura Profesional (CQFP)
                </label>
                <input
                  type="text"
                  value={colegiaturaQF}
                  onChange={e => setColegiaturaQF(e.target.value)}
                  placeholder="CQFP 14209"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>
            </div>

            <div className="border-b border-slate-100 pb-3 pt-3">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Formato de Ticket Térmico 80mm & Moneda</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Símbolo de Moneda
                </label>
                <input
                  type="text"
                  value={monedaSimbolo}
                  onChange={e => setMonedaSimbolo(e.target.value)}
                  placeholder="S/"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tasa de IGV / Impuesto (%)
                </label>
                <input
                  type="number"
                  value={igvPorcentaje}
                  onChange={e => setIgvPorcentaje(parseFloat(e.target.value) || 0)}
                  placeholder="18"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-700 font-semibold mb-1">
                  Mensaje de Pie de Página en Ticket
                </label>
                <textarea
                  rows={2}
                  value={pieDeTicket}
                  onChange={e => setPieDeTicket(e.target.value)}
                  placeholder="¡Gracias por su preferencia! Verifique su medicina antes de retirarse..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Personalización</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Real-Time Ticket Preview (Span 1) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col space-y-3">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs pb-2 border-b">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Vista Previa de su Ticket Térmico</span>
          </div>

          <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 font-mono text-[10px] text-slate-800 space-y-2 leading-tight">
            <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
              <h4 className="font-bold text-xs uppercase text-slate-900">{nombreBotica || 'NOMBRE DE BOTICA'}</h4>
              <p className="text-slate-600">RUC: {ruc || '20000000000'}</p>
              <p className="text-slate-600">{direccion || 'Dirección de su local'}</p>
              <p className="text-slate-600">Tel: {telefono || 'Teléfono / Delivery'}</p>
              <p className="text-emerald-800 text-[9px] pt-1">
                QF: {regenteQF || 'Nombre Químico'} ({colegiaturaQF || 'CQFP'})
              </p>
            </div>

            <div className="text-center font-bold py-1 border-b border-dashed border-slate-300 text-[11px] text-emerald-700">
              BOLETA ELECTRÓNICA: B001-000143
            </div>

            <div className="space-y-1 text-slate-600 py-1 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span>1x Paracetamol 500mg</span>
                <span className="font-bold text-slate-900">{monedaSimbolo} 12.50</span>
              </div>
              <p className="text-[9px] text-slate-400">Lote LT-2026A · Vence 15-May-2027</p>
            </div>

            <div className="space-y-0.5 pt-1">
              <div className="flex justify-between text-slate-600">
                <span>OP. GRAVADA:</span>
                <span>{monedaSimbolo} 10.59</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IGV ({igvPorcentaje}%):</span>
                <span>{monedaSimbolo} 1.91</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-xs pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span className="text-emerald-700">{monedaSimbolo} 12.50</span>
              </div>
            </div>

            <div className="pt-2 text-center text-[9px] text-slate-500 border-t border-dashed border-slate-300">
              <p>{pieDeTicket || 'Mensaje de agradecimiento o advertencia sanitaria'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
