import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Lock,
  X,
  Banknote,
  Receipt,
  CheckCircle,
  Printer,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDateTimeSpanish } from '../../utils/dateUtils';
import { CierreTurnoCajero } from '../../types/pharmacy';

interface CashierShiftCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashierShiftCloseModal: React.FC<CashierShiftCloseModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    currentUser,
    currentTenant,
    sales,
    cashRegister,
    registrarCierreTurnoCajero
  } = usePharmacy();

  const [efectivoDeclarado, setEfectivoDeclarado] = useState<string>('');
  const [notas, setNotas] = useState('');
  const [cierreGenerado, setCierreGenerado] = useState<CierreTurnoCajero | null>(null);

  if (!isOpen) return null;

  // Filter sales made by this cashier during current open shift
  const mySales = sales.filter(
    s =>
      s.estado === 'completada' &&
      (s.cajeroId === currentUser?.id || s.vendedor.includes(currentUser?.nombre || ''))
  );

  const efectivoVentas = mySales
    .filter(s => s.metodoPago === 'efectivo')
    .reduce((acc, s) => acc + s.total, 0);

  const yapeVentas = mySales
    .filter(s => s.metodoPago === 'yape_plin')
    .reduce((acc, s) => acc + s.total, 0);

  const tarjetaVentas = mySales
    .filter(s => s.metodoPago === 'tarjeta')
    .reduce((acc, s) => acc + s.total, 0);

  const transferenciaVentas = mySales
    .filter(s => s.metodoPago === 'transferencia')
    .reduce((acc, s) => acc + s.total, 0);

  const totalVendido = efectivoVentas + yapeVentas + tarjetaVentas + transferenciaVentas;
  const saldoInicial = cashRegister.saldoInicial || 100;
  const totalEfectivoTeorico = saldoInicial + efectivoVentas;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const declarado = parseFloat(efectivoDeclarado);
    if (isNaN(declarado) || declarado < 0) {
      alert('Por favor ingrese el importe de efectivo que está entregando');
      return;
    }

    const nuevoCierre = registrarCierreTurnoCajero({
      tenantId: currentTenant.id,
      cajeroId: currentUser?.id || 'cajero-temp',
      cajeroNombre: currentUser?.nombre || 'Cajero de Turno',
      fechaApertura: cashRegister.fechaApertura || new Date().toISOString(),
      fechaCierre: new Date().toISOString(),
      saldoInicial,
      totalVentasEfectivo: efectivoVentas,
      totalVentasYape: yapeVentas,
      totalVentasTarjeta: tarjetaVentas,
      totalVentasTransferencia: transferenciaVentas,
      totalEfectivoTeorico,
      efectivoDeclaradoPorCajero: declarado,
      diferencia: Number((declarado - totalEfectivoTeorico).toFixed(2)),
      estadoRevision: 'pendiente_revision',
      notasCajero: notas || 'Entrega de caja de turno finalizada'
    });

    setCierreGenerado(nuevoCierre);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Cierre de Turno de Cajero (Corte Z)</h3>
              <p className="text-[11px] text-emerald-300">
                {currentUser?.nombre} • {currentTenant.nombreBotica}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cierreGenerado ? (
          /* Shift Closure Success & Printable Ticket */
          <div className="p-6 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-950 text-sm">
                ¡Turno Cerrado y Enviado a Auditoría!
              </h4>
              <p className="text-xs text-emerald-700">
                El Administrador de la Botica revisará y validará tu arqueo para confirmar que el dinero del día esté completo.
              </p>
            </div>

            {/* Ticket Resumen de Cierre */}
            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 font-mono text-xs text-slate-800 space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <p className="font-bold uppercase text-slate-900">{currentTenant.nombreBotica}</p>
                <p className="text-[10px] text-slate-500">RESUMEN DE CIERRE DE CAJA</p>
                <p className="text-[10px] text-slate-500">Cajero: {cierreGenerado.cajeroNombre}</p>
                <p className="text-[10px] text-slate-500">Fecha: {formatDateTimeSpanish(cierreGenerado.fechaCierre)}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Fondo Apertura:</span>
                  <span>{formatCurrency(cierreGenerado.saldoInicial)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ventas en Efectivo:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(cierreGenerado.totalVentasEfectivo)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ventas Yape/Plin:</span>
                  <span>{formatCurrency(cierreGenerado.totalVentasYape)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ventas Tarjeta POS:</span>
                  <span>{formatCurrency(cierreGenerado.totalVentasTarjeta)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-300 pt-1 text-slate-900">
                  <span>Total Ventas Turno:</span>
                  <span>{formatCurrency(cierreGenerado.totalVentasEfectivo + cierreGenerado.totalVentasYape + cierreGenerado.totalVentasTarjeta + cierreGenerado.totalVentasTransferencia)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-300 pt-1 text-emerald-800 font-bold">
                  <span>Efectivo Declarado:</span>
                  <span>{formatCurrency(cierreGenerado.efectivoDeclaradoPorCajero)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-800"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Resumen</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de Cierre para el Cajero */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Resumen de Movimientos en tu Turno:
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Comprobantes Emitidos:</span>
                  <strong className="text-sm text-slate-800">{mySales.length} ventas</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Vendido (Todos los medios):</span>
                  <strong className="text-sm text-emerald-700">{formatCurrency(totalVendido)}</strong>
                </div>
              </div>
            </div>

            {/* Declaración de Efectivo (Conteo Ciego) */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2">
              <label className="block text-emerald-950 font-bold text-xs">
                Declaración de Efectivo Físico en Gaveta *
              </label>
              <p className="text-[11px] text-emerald-800">
                Cuente todos los billetes y monedas que entregará al Administrador:
              </p>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-slate-500 text-sm">
                  {currentTenant.monedaSimbolo || 'S/'}
                </span>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  value={efectivoDeclarado}
                  onChange={e => setEfectivoDeclarado(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-emerald-300 rounded-lg text-base font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Observaciones del Cajero (Opcional)
              </label>
              <textarea
                rows={2}
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Ej: Entregué sobre con billetes grandes y 50 soles en monedas sueltas..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Confirmar Cierre de Turno</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
