import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { TipoComprobante, MetodoPago, Sale } from '../../types/pharmacy';
import {
  CreditCard,
  Banknote,
  QrCode,
  Building2,
  X,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/dateUtils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sale: Sale) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { cart, cartTotal, cartDiscount, customers, checkout } = usePharmacy();

  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('boleta');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');

  // Customer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customDoc, setCustomDoc] = useState('');
  const [customName, setCustomName] = useState('Público General');

  // Payment cash state
  const [montoEfectivo, setMontoEfectivo] = useState<string>(cartTotal.toFixed(2));
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    if (!custId) {
      setCustomDoc('00000000');
      setCustomName('Público General');
      return;
    }
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      setCustomDoc(cust.documento);
      setCustomName(cust.nombre);
    }
  };

  const cashReceived = parseFloat(montoEfectivo) || 0;
  const vuelto = Math.max(0, cashReceived - cartTotal);

  const handleFastCash = (amount: number) => {
    setMontoEfectivo(amount.toFixed(2));
    setErrorMsg('');
  };

  const handleProcessCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('El carrito está vacío.');
      return;
    }

    if (tipoComprobante === 'factura') {
      if (customDoc.trim().length !== 11) {
        setErrorMsg('Para Factura Electrónica se requiere un RUC válido de 11 dígitos.');
        return;
      }
      if (!customName.trim() || customName === 'Público General') {
        setErrorMsg('Ingrese la Razón Social de la empresa para la factura.');
        return;
      }
    }

    if (metodoPago === 'efectivo' && cashReceived < cartTotal) {
      setErrorMsg(`El monto recibido (${formatCurrency(cashReceived)}) es menor al total (${formatCurrency(cartTotal)}).`);
      return;
    }

    try {
      const sale = checkout({
        tipoComprobante,
        cliente: {
          id: selectedCustomerId || undefined,
          nombre: customName,
          documento: customDoc || '00000000'
        },
        metodoPago,
        montoRecibido: metodoPago === 'efectivo' ? cashReceived : cartTotal
      });

      onSuccess(sale);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Error al procesar la venta');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Confirmación de Venta & Cobro
            </h2>
            <p className="text-xs text-slate-400">Total a pagar: <strong className="text-emerald-400 font-bold text-sm">{formatCurrency(cartTotal)}</strong></p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleProcessCheckout} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tipo de Comprobante */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Tipo de Comprobante
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'boleta' as const, label: 'Boleta de Venta' },
                { id: 'factura' as const, label: 'Factura (RUC)' },
                { id: 'ticket' as const, label: 'Ticket Interno' }
              ].map(comp => (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setTipoComprobante(comp.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer text-center ${
                    tipoComprobante === comp.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {comp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cliente Info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Datos del Paciente / Cliente
              </label>
              <select
                value={selectedCustomerId}
                onChange={handleCustomerSelect}
                className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- Cliente Rápido / Ocasional --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.documento})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">
                  {tipoComprobante === 'factura' ? 'RUC (11 dígitos)' : 'DNI / Documento'}
                </label>
                <input
                  type="text"
                  value={customDoc}
                  onChange={e => setCustomDoc(e.target.value)}
                  placeholder={tipoComprobante === 'factura' ? '20601248911' : '45892341'}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">
                  {tipoComprobante === 'factura' ? 'Razón Social' : 'Nombre Completo'}
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Ej: Juan Pérez / Empresa S.A."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Medio de Pago
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'efectivo' as const, label: 'Efectivo', icon: Banknote },
                { id: 'yape_plin' as const, label: 'Yape / Plin', icon: QrCode },
                { id: 'tarjeta' as const, label: 'Tarjeta POS', icon: CreditCard },
                { id: 'transferencia' as const, label: 'Transferencia', icon: Building2 }
              ].map(m => {
                const Icon = m.icon;
                const isSelected = metodoPago === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMetodoPago(m.id);
                      if (m.id === 'efectivo') {
                        setMontoEfectivo(cartTotal.toFixed(2));
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold ring-1 ring-emerald-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detalle específico según medio de pago */}
          {metodoPago === 'efectivo' && (
            <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900">Monto Entregado (Efectivo):</span>
                <div className="relative w-36">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">S/</span>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={montoEfectivo}
                    onChange={e => setMontoEfectivo(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-right font-bold text-slate-800 bg-white border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Botones de efectivo rápido */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => handleFastCash(cartTotal)}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Exacto
                </button>
                <button
                  type="button"
                  onClick={() => handleFastCash(Math.ceil(cartTotal / 10) * 10)}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                >
                  S/ {Math.ceil(cartTotal / 10) * 10}
                </button>
                <button
                  type="button"
                  onClick={() => handleFastCash(50)}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                >
                  S/ 50
                </button>
                <button
                  type="button"
                  onClick={() => handleFastCash(100)}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                >
                  S/ 100
                </button>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                <span className="text-xs font-bold text-slate-700">Vuelto a Entregar:</span>
                <span className={`text-base font-extrabold ${cashReceived < cartTotal ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatCurrency(vuelto)}
                </span>
              </div>
            </div>
          )}

          {metodoPago === 'yape_plin' && (
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl flex items-center gap-4">
              <div className="w-20 h-20 bg-white border border-purple-200 rounded-lg flex flex-col items-center justify-center p-2 shadow-xs shrink-0">
                <QrCode className="w-12 h-12 text-purple-700" />
                <span className="text-[8px] font-bold text-purple-900 mt-1 uppercase">Yape / Plin</span>
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-purple-950">Pago móvil con Código QR</p>
                <p className="text-slate-600">Número celular: <strong className="text-purple-800 font-mono">984 512 890</strong></p>
                <p className="text-slate-600">Titular: <strong>Botica FarmaControl E.I.R.L.</strong></p>
                <p className="text-[11px] text-slate-500">Monto exacto a escanear: <strong className="text-emerald-700">{formatCurrency(cartTotal)}</strong></p>
              </div>
            </div>
          )}

          {metodoPago === 'tarjeta' && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-blue-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-blue-900">Cobro en Terminal POS (Izipay / Niubiz)</p>
                <p className="text-slate-600">Acepta tarjetas de débito y crédito (Visa, Mastercard, Diners, Amex).</p>
                <p className="text-emerald-700 font-semibold mt-1">Sin comisión adicional al paciente.</p>
              </div>
            </div>
          )}

          {metodoPago === 'transferencia' && (
            <div className="bg-slate-100 border border-slate-300 p-3.5 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-800">Cuentas Corrientes Botica:</p>
              <p className="text-slate-600 font-mono text-[11px]">BCP Soles: 191-8849201-0-45 (CCI: 00219100884920104552)</p>
              <p className="text-slate-600 font-mono text-[11px]">BBVA Soles: 0011-0482-0100094121</p>
            </div>
          )}

          {/* Resumen del cobro */}
          <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
            {cartDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Descuentos FEFO / Promoción aplicados:</span>
                <span>-{formatCurrency(cartDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-bold text-slate-800">
              <span>Total a Liquidar:</span>
              <span className="text-emerald-700 text-lg">{formatCurrency(cartTotal)}</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Emitir Comprobante y Cobrar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
