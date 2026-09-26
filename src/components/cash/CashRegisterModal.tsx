import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Wallet,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatDateTimeSpanish } from '../../utils/dateUtils';

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({ isOpen, onClose }) => {
  const { cashRegister, sales, addCashExpense, openCashRegister, closeCashRegister } = usePharmacy();

  const [motivoGasto, setMotivoGasto] = useState('');
  const [montoGasto, setMontoGasto] = useState<string>('');
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Opening form
  const [saldoInicialInput, setSaldoInicialInput] = useState('150.00');
  const [responsableInput, setResponsableInput] = useState('Q.F. Fernando Ramos');

  if (!isOpen) return null;

  // Breakdown of sales by payment method
  const effectiveCashSales = sales
    .filter(s => s.estado === 'completada' && s.metodoPago === 'efectivo')
    .reduce((acc, s) => acc + s.total, 0);

  const yapeSales = sales
    .filter(s => s.estado === 'completada' && s.metodoPago === 'yape_plin')
    .reduce((acc, s) => acc + s.total, 0);

  const cardSales = sales
    .filter(s => s.estado === 'completada' && s.metodoPago === 'tarjeta')
    .reduce((acc, s) => acc + s.total, 0);

  const transferSales = sales
    .filter(s => s.estado === 'completada' && s.metodoPago === 'transferencia')
    .reduce((acc, s) => acc + s.total, 0);

  const totalExpenses = cashRegister.gastos.reduce((acc, g) => acc + g.monto, 0);
  const expectedCashInDrawer = cashRegister.saldoInicial + effectiveCashSales - totalExpenses;
  const totalTurnoRevenue = effectiveCashSales + yapeSales + cardSales + transferSales;

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(montoGasto);
    if (!motivoGasto.trim() || isNaN(val) || val <= 0) {
      alert('Ingrese un motivo y monto válido');
      return;
    }
    addCashExpense(motivoGasto, val, cashRegister.responsable);
    setMotivoGasto('');
    setMontoGasto('');
    setShowAddExpense(false);
  };

  const handleOpenTurn = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(saldoInicialInput);
    openCashRegister(isNaN(val) ? 100 : val, responsableInput);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Control & Arqueo de Caja Chica</h3>
              <p className="text-[11px] text-slate-400">Responsable: {cashRegister.responsable}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {cashRegister.estado === 'cerrada' ? (
            /* Caja Cerrada - Formulario de Apertura */
            <form onSubmit={handleOpenTurn} className="space-y-4 text-center py-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">La Caja se encuentra Cerrada</h4>
                <p className="text-slate-500">Ingrese el fondo inicial para abrir el turno de mostrador.</p>
              </div>

              <div className="max-w-xs mx-auto space-y-3 text-left">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Monto Inicial en Efectivo (S/)</label>
                  <input
                    type="number"
                    step="5"
                    value={saldoInicialInput}
                    onChange={e => setSaldoInicialInput(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-bold text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Q.F. / Cajero Responsable</label>
                  <input
                    type="text"
                    value={responsableInput}
                    onChange={e => setResponsableInput(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Abrir Turno de Caja</span>
                </button>
              </div>
            </form>
          ) : (
            /* Caja Abierta - Desglose y Movimientos */
            <>
              {/* Grand Total In Drawer */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
                    Efectivo Físico Esperado en Cajón
                  </span>
                  <h3 className="text-2xl font-extrabold text-emerald-700">
                    {formatCurrency(expectedCashInDrawer)}
                  </h3>
                  <p className="text-[10px] text-emerald-600">
                    (Saldo inicial + Cobros en efectivo - Egresos de caja)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Total Facturado en Turno:</span>
                  <span className="text-base font-bold text-slate-800">{formatCurrency(totalTurnoRevenue)}</span>
                </div>
              </div>

              {/* Breakdown by channel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Fondo Apertura</span>
                  <strong className="text-slate-800">{formatCurrency(cashRegister.saldoInicial)}</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Efectivo Cobrado</span>
                  <strong className="text-emerald-700">{formatCurrency(effectiveCashSales)}</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Yape / Plin</span>
                  <strong className="text-purple-700">{formatCurrency(yapeSales)}</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Tarjetas POS</span>
                  <strong className="text-blue-700">{formatCurrency(cardSales)}</strong>
                </div>
              </div>

              {/* Expenses List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                    Gastos Menores / Egresos de Turno ({cashRegister.gastos.length})
                  </span>
                  <button
                    onClick={() => setShowAddExpense(!showAddExpense)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Registrar Gasto
                  </button>
                </div>

                {showAddExpense && (
                  <form onSubmit={handleAddExpenseSubmit} className="bg-slate-50 p-3 rounded-xl border border-slate-300 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={motivoGasto}
                          onChange={e => setMotivoGasto(e.target.value)}
                          placeholder="Motivo del egreso (ej: bolsas, agua, vuelto)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs outline-hidden"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.5"
                          value={montoGasto}
                          onChange={e => setMontoGasto(e.target.value)}
                          placeholder="Monto (S/)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs outline-hidden font-bold"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddExpense(false)}
                        className="px-2 py-1 text-slate-500 hover:bg-slate-200 rounded"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded"
                      >
                        Guardar Egreso
                      </button>
                    </div>
                  </form>
                )}

                <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl px-3">
                  {cashRegister.gastos.length === 0 ? (
                    <p className="text-center text-slate-400 py-3 text-[11px]">No hay egresos registrados.</p>
                  ) : (
                    cashRegister.gastos.map(g => (
                      <div key={g.id} className="py-2 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-medium text-slate-800">{g.motivo}</p>
                          <span className="text-[10px] text-slate-400">{g.hora} · {g.responsable}</span>
                        </div>
                        <span className="font-bold text-rose-600">-{formatCurrency(g.monto)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Desea cerrar el turno de caja y generar el arqueo final?')) {
                      closeCashRegister();
                    }
                  }}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Cerrar Turno de Caja</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Listo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
