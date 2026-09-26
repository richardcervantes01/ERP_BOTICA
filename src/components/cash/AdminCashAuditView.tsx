import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  FileCheck,
  ShieldCheck,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Users,
  Search,
  Check,
  X
} from 'lucide-react';
import { formatCurrency, formatDateTimeSpanish, formatDateSpanish } from '../../utils/dateUtils';
import { CierreTurnoCajero } from '../../types/pharmacy';

export const AdminCashAuditView: React.FC = () => {
  const {
    currentTenant,
    cashRegister,
    sales,
    cierresTurno,
    auditarCierreTurno,
    arqueosDiarios,
    generarArqueoGeneralDia,
    addCashExpense
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'arqueo_actual' | 'cierres_cajeros' | 'historial_arqueos'>('arqueo_actual');
  const [selectedCierreParaAuditar, setSelectedCierreParaAuditar] = useState<CierreTurnoCajero | null>(null);
  const [auditNotas, setAuditNotas] = useState('');
  const [auditStatus, setAuditStatus] = useState<'auditado_conforme' | 'auditado_observado'>('auditado_conforme');

  // New expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseMotivo, setExpenseMotivo] = useState('');
  const [expenseMonto, setExpenseMonto] = useState('');

  // Daily Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const salesToday = sales.filter(s => s.estado === 'completada' && s.fecha.startsWith(todayStr));

  const totalVentasEfectivo = salesToday
    .filter(s => s.metodoPago === 'efectivo')
    .reduce((acc, s) => acc + s.total, 0);

  const totalVentasDigitales = salesToday
    .filter(s => s.metodoPago !== 'efectivo')
    .reduce((acc, s) => acc + s.total, 0);

  const totalEgresos = cashRegister.gastos.reduce((acc, g) => acc + g.monto, 0);
  const saldoInicial = cashRegister.saldoInicial || 150;
  const efectivoTeoricoEsperado = saldoInicial + totalVentasEfectivo - totalEgresos;

  // Total declared by cashiers in reviewed shifts
  const efectivoAuditadoCajeros = cierresTurno.reduce(
    (acc, c) => acc + c.efectivoDeclaradoPorCajero,
    0
  );

  const diferencia = efectivoAuditadoCajeros > 0 ? efectivoAuditadoCajeros - efectivoTeoricoEsperado : 0;

  const handleAuditarCierre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCierreParaAuditar) return;

    auditarCierreTurno(selectedCierreParaAuditar.id, {
      estadoRevision: auditStatus,
      notasAdministrador: auditNotas || 'Validado por Administrador de Botica',
      auditadoPor: currentTenant.regenteQF || 'Administrador de Botica'
    });

    setSelectedCierreParaAuditar(null);
    setAuditNotas('');
  };

  const handleGenerarArqueoOficial = () => {
    if (window.confirm('¿Desea cerrar y sellar el Arqueo General del Día con el balance actual?')) {
      generarArqueoGeneralDia({
        saldoInicialTotal: saldoInicial,
        ventasEfectivoTotal: totalVentasEfectivo,
        ventasDigitalesTotal: totalVentasDigitales,
        egresosTotal: totalEgresos,
        totalTeoricoEsperado: efectivoTeoricoEsperado,
        totalFisicoAuditado: efectivoAuditadoCajeros > 0 ? efectivoAuditadoCajeros : efectivoTeoricoEsperado,
        discrepancia: diferencia,
        estado: Math.abs(diferencia) < 0.1 ? 'cuadrado' : 'con_diferencia',
        observaciones: `Arqueo oficial de cierre diario en ${currentTenant.nombreBotica}`
      });
      alert('¡Arqueo diario oficial sellado y guardado en el historial!');
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(expenseMonto);
    if (!expenseMotivo || isNaN(val) || val <= 0) {
      alert('Monto y motivo requeridos');
      return;
    }
    addCashExpense(expenseMotivo, val, 'Administrador');
    setExpenseMotivo('');
    setExpenseMonto('');
    setShowExpenseForm(false);
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Arqueo de Caja & Validación de Dinero del Día
          </h2>
          <p className="text-xs text-slate-500">
            Módulo exclusivo del Administrador para validar que las ventas físicas de los cajeros cuadren con el sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>Registrar Egreso</span>
          </button>

          <button
            onClick={handleGenerarArqueoOficial}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Sellar Arqueo Oficial del Día</span>
          </button>
        </div>
      </div>

      {/* Expense form modal / drawer if toggled */}
      {showExpenseForm && (
        <form onSubmit={handleAddExpense} className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex flex-wrap items-center gap-3 text-xs">
          <span className="font-bold text-rose-900 block">Nuevo Egreso / Salida de Efectivo:</span>
          <input
            type="text"
            value={expenseMotivo}
            onChange={e => setExpenseMotivo(e.target.value)}
            placeholder="Motivo (ej: Compra de bolsas, cambio, recibo luz)"
            className="flex-1 min-w-[200px] px-3 py-1.5 bg-white border border-rose-300 rounded-lg outline-hidden"
            required
          />
          <input
            type="number"
            step="0.5"
            value={expenseMonto}
            onChange={e => setExpenseMonto(e.target.value)}
            placeholder="Monto (S/)"
            className="w-28 px-3 py-1.5 bg-white border border-rose-300 rounded-lg outline-hidden font-bold"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setShowExpenseForm(false)}
              className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('arqueo_actual')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'arqueo_actual'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Cuadre General del Día</span>
        </button>

        <button
          onClick={() => setActiveTab('cierres_cajeros')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 relative ${
            activeTab === 'cierres_cajeros'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Turnos de Cajeros por Validar</span>
          {cierresTurno.filter(c => c.estadoRevision === 'pendiente_revision').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('historial_arqueos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'historial_arqueos'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Historial de Arqueos Sellados ({arqueosDiarios.length})</span>
        </button>
      </div>

      {/* TAB 1: CUADRE GENERAL DEL DÍA */}
      {activeTab === 'arqueo_actual' && (
        <div className="space-y-6">
          {/* Main Balance Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Esperado por Sistema */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Teórico por Sistema
              </span>
              <h3 className="text-2xl font-extrabold text-slate-800">
                {formatCurrency(efectivoTeoricoEsperado)}
              </h3>
              <p className="text-[11px] text-slate-500">
                (Saldo Inicial {formatCurrency(saldoInicial)} + Efectivo Ventas {formatCurrency(totalVentasEfectivo)} - Egresos {formatCurrency(totalEgresos)})
              </p>
            </div>

            {/* Físico Auditado de Cajeros */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Efectivo Físico Declarado por Cajeros
              </span>
              <h3 className="text-2xl font-extrabold text-emerald-700">
                {formatCurrency(efectivoAuditadoCajeros > 0 ? efectivoAuditadoCajeros : efectivoTeoricoEsperado)}
              </h3>
              <p className="text-[11px] text-slate-500">
                {cierresTurno.length} turnos de corte recibidos hoy
              </p>
            </div>

            {/* Estado del Arqueo / Diferencia */}
            <div
              className={`p-5 rounded-2xl border shadow-xs space-y-1 ${
                Math.abs(diferencia) < 0.1
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : diferencia > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider block">
                Resultado de Cuadre:
              </span>
              <div className="flex items-center gap-2">
                {Math.abs(diferencia) < 0.1 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                )}
                <h3 className="text-2xl font-extrabold">
                  {Math.abs(diferencia) < 0.1
                    ? 'CAJA CUADRADA'
                    : diferencia > 0
                    ? `SOBRANTE: +${formatCurrency(diferencia)}`
                    : `FALTANTE: ${formatCurrency(diferencia)}`}
                </h3>
              </div>
              <p className="text-[11px] opacity-80">
                {Math.abs(diferencia) < 0.1
                  ? 'El dinero físico coincide exactamente con las ventas.'
                  : 'Existe discrepancia entre el conteo del cajero y el registro del POS.'}
              </p>
            </div>
          </div>

          {/* Breakdown Table: Dinero en Efectivo vs Canales Digitales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Desglose de Ventas del Día */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">
                Desglose de Ingresos de Mostrador
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Fondo Inicial de Apertura:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(saldoInicial)}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Ventas en Efectivo Físico:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(totalVentasEfectivo)}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Ventas Yape / Plin / Billeteras:</span>
                  <span className="font-bold text-purple-700">
                    {formatCurrency(salesToday.filter(s => s.metodoPago === 'yape_plin').reduce((a, s) => a + s.total, 0))}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Ventas Tarjeta POS (Izipay / Niubiz):</span>
                  <span className="font-bold text-blue-700">
                    {formatCurrency(salesToday.filter(s => s.metodoPago === 'tarjeta').reduce((a, s) => a + s.total, 0))}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Total Facturado del Día:</span>
                  <span className="text-emerald-700">{formatCurrency(totalVentasEfectivo + totalVentasDigitales)}</span>
                </div>
              </div>
            </div>

            {/* Egresos y Gastos Menores */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">
                  Egresos y Gastos Menores ({cashRegister.gastos.length})
                </h3>
                <span className="text-rose-600 font-bold text-xs">
                  Total: -{formatCurrency(totalEgresos)}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                {cashRegister.gastos.length === 0 ? (
                  <p className="text-slate-400 py-6 text-center">No hay egresos de caja registrados hoy.</p>
                ) : (
                  cashRegister.gastos.map(g => (
                    <div key={g.id} className="py-2 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-800">{g.motivo}</p>
                        <p className="text-[10px] text-slate-400">{g.hora} • {g.responsable}</p>
                      </div>
                      <span className="font-bold text-rose-600">-{formatCurrency(g.monto)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TURNOS DE CAJEROS POR VALIDAR */}
      {activeTab === 'cierres_cajeros' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Cortes de Turno Entregados por los Cajeros</h3>
              <p className="text-xs text-slate-400">
                Revise el dinero en sobre/gaveta entregado por cada empleado y certifique si está conforme o con faltante.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-4">Cajero / Vendedor</th>
                  <th className="p-4">Hora Cierre</th>
                  <th className="p-4">Venta Efectivo</th>
                  <th className="p-4">Total Teórico</th>
                  <th className="p-4">Efectivo Declarado</th>
                  <th className="p-4">Diferencia</th>
                  <th className="p-4">Estado Revisión</th>
                  <th className="p-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cierresTurno.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No hay turnos cerrados por cajeros el día de hoy.
                    </td>
                  </tr>
                ) : (
                  cierresTurno.map(c => {
                    const isConforme = c.estadoRevision === 'auditado_conforme';
                    const isObservado = c.estadoRevision === 'auditado_observado';

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{c.cajeroNombre}</p>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {c.cajeroId}</span>
                        </td>

                        <td className="p-4 text-slate-600">
                          {formatDateTimeSpanish(c.fechaCierre)}
                        </td>

                        <td className="p-4 font-semibold text-emerald-700">
                          {formatCurrency(c.totalVentasEfectivo)}
                        </td>

                        <td className="p-4 text-slate-700">
                          {formatCurrency(c.totalEfectivoTeorico)}
                        </td>

                        <td className="p-4 font-bold text-slate-900">
                          {formatCurrency(c.efectivoDeclaradoPorCajero)}
                        </td>

                        <td className="p-4 font-bold">
                          <span
                            className={
                              Math.abs(c.diferencia) < 0.1
                                ? 'text-emerald-700'
                                : c.diferencia > 0
                                ? 'text-blue-700'
                                : 'text-rose-700'
                            }
                          >
                            {c.diferencia > 0 ? `+${formatCurrency(c.diferencia)}` : formatCurrency(c.diferencia)}
                          </span>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isConforme
                                ? 'bg-emerald-100 text-emerald-800'
                                : isObservado
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {isConforme
                              ? 'Auditado Conforme'
                              : isObservado
                              ? 'Observado (Faltante)'
                              : 'Pendiente Revisión'}
                          </span>
                          {c.notasAdministrador && (
                            <p className="text-[10px] text-slate-500 mt-0.5">{c.notasAdministrador}</p>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedCierreParaAuditar(c);
                              setAuditNotas(c.notasAdministrador || '');
                              setAuditStatus(c.diferencia < -0.1 ? 'auditado_observado' : 'auditado_conforme');
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                          >
                            Validar Turno
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORIAL DE ARQUEOS SELLADOS */}
      {activeTab === 'historial_arqueos' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm">Libro de Arqueos Oficiales Sellados</h3>
            <p className="text-xs text-slate-400">Actas de cierre diario con firma del Administrador / Químico Farmacéutico.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-4">Fecha Arqueo</th>
                  <th className="p-4">Administrador</th>
                  <th className="p-4">Fondo Inicial</th>
                  <th className="p-4">Ventas Efectivo</th>
                  <th className="p-4">Egresos</th>
                  <th className="p-4">Auditado Físico</th>
                  <th className="p-4">Diferencia</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Imprimir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {arqueosDiarios.map(arq => (
                  <tr key={arq.id} className="hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-800">{formatDateSpanish(arq.fecha)}</td>
                    <td className="p-4 text-slate-600">{arq.responsableAdmin}</td>
                    <td className="p-4 text-slate-600">{formatCurrency(arq.saldoInicialTotal)}</td>
                    <td className="p-4 font-bold text-emerald-700">{formatCurrency(arq.ventasEfectivoTotal)}</td>
                    <td className="p-4 text-rose-600">-{formatCurrency(arq.egresosTotal)}</td>
                    <td className="p-4 font-extrabold text-slate-900">{formatCurrency(arq.totalFisicoAuditado)}</td>
                    <td className="p-4 font-bold">
                      <span className={arq.discrepancia < -0.1 ? 'text-rose-600' : 'text-emerald-700'}>
                        {formatCurrency(arq.discrepancia)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          arq.estado === 'cuadrado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {arq.estado === 'cuadrado' ? 'CUADRADO' : 'CON DIFERENCIA'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => window.print()}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Imprimir Acta"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Validar / Auditar Cierre de Cajero */}
      {selectedCierreParaAuditar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Auditar Turno de {selectedCierreParaAuditar.cajeroNombre}
              </h3>
              <button
                onClick={() => setSelectedCierreParaAuditar(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Total Teórico Esperado:</span>
                <span className="font-bold text-slate-800">{formatCurrency(selectedCierreParaAuditar.totalEfectivoTeorico)}</span>
              </div>
              <div className="flex justify-between">
                <span>Efectivo Declarado por Cajero:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(selectedCierreParaAuditar.efectivoDeclaradoPorCajero)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                <span>Diferencia resultante:</span>
                <span className={selectedCierreParaAuditar.diferencia < -0.1 ? 'text-rose-600' : 'text-emerald-700'}>
                  {formatCurrency(selectedCierreParaAuditar.diferencia)}
                </span>
              </div>
              {selectedCierreParaAuditar.notasCajero && (
                <p className="text-[11px] text-slate-500 pt-1 italic">
                  Nota del cajero: "{selectedCierreParaAuditar.notasCajero}"
                </p>
              )}
            </div>

            <form onSubmit={handleAuditarCierre} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Dictamen de la Auditoría
                </label>
                <select
                  value={auditStatus}
                  onChange={e => setAuditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                >
                  <option value="auditado_conforme">Auditado Conforme (Dinero Completo / Aprobado)</option>
                  <option value="auditado_observado">Auditado Observado (Faltante pendiente de justificar)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Observaciones del Administrador
                </label>
                <textarea
                  rows={2}
                  value={auditNotas}
                  onChange={e => setAuditNotas(e.target.value)}
                  placeholder="Ej: Conteo físico verificado en caja fuerte, billetes conformes..."
                  className="w-full px-3 py-1.5 border rounded-lg outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedCierreParaAuditar(null)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Confirmar Sello de Auditoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
