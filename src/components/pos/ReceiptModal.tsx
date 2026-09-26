import React, { useRef } from 'react';
import { Sale } from '../../types/pharmacy';
import { usePharmacy } from '../../context/PharmacyContext';
import { Printer, Check, X, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDateTimeSpanish, formatDateSpanish } from '../../utils/dateUtils';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { currentTenant } = usePharmacy();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const getComprobanteName = () => {
    switch (sale.tipoComprobante) {
      case 'boleta':
        return 'BOLETA DE VENTA ELECTRÓNICA';
      case 'factura':
        return 'FACTURA ELECTRÓNICA';
      case 'ticket':
        return 'TICKET DE VENTA INTERNO';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-300" />
            <h3 className="font-semibold text-sm">Venta Procesada Exitosamente</h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content (Simulates 80mm thermal receipt) */}
        <div className="p-6 bg-slate-50 flex justify-center max-h-[70vh] overflow-y-auto">
          <div
            ref={receiptRef}
            className="w-full bg-white p-5 rounded-lg border border-slate-200 shadow-xs font-mono text-xs text-slate-800 leading-tight space-y-3"
          >
            {/* Header Botica */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
              <h2 className="font-bold text-sm tracking-wider uppercase text-slate-900">
                {currentTenant.nombreBotica}
              </h2>
              <p className="text-[10px] text-slate-600">RUC: {currentTenant.ruc}</p>
              <p className="text-[10px] text-slate-600">{currentTenant.direccion}</p>
              <p className="text-[10px] text-slate-600">Tel: {currentTenant.telefono}</p>
              <div className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Establecimiento Farmacéutico Autorizado</span>
              </div>
            </div>

            {/* Document Info */}
            <div className="border-b border-dashed border-slate-300 pb-2 text-[11px] space-y-1">
              <div className="text-center font-bold text-slate-900">{getComprobanteName()}</div>
              <div className="text-center font-bold text-emerald-700 text-sm">{sale.correlativo}</div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Fecha:</span>
                <span>{formatDateTimeSpanish(sale.fecha)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cliente:</span>
                <span className="font-semibold text-slate-800 text-right">{sale.clienteNombre}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Doc/DNI/RUC:</span>
                <span>{sale.clienteDocumento}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Dispensador:</span>
                <span>{sale.vendedor}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-b border-dashed border-slate-300 pb-3 space-y-2">
              <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase pb-1 border-b border-slate-200">
                <span className="col-span-2">Cant</span>
                <span className="col-span-6">Descripción / Lote</span>
                <span className="col-span-2 text-right">P.U.</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              {sale.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 text-[11px] items-start py-0.5">
                  <span className="col-span-2 font-semibold text-slate-700">{item.cantidad} un.</span>
                  <div className="col-span-6 pr-1">
                    <p className="font-medium text-slate-900">{item.nombre}</p>
                    <p className="text-[10px] text-slate-500">
                      Lote: {item.lote} · Vence: {formatDateSpanish(item.fechaVencimiento)}
                    </p>
                    {item.descuentoUnitario > 0 && (
                      <p className="text-[10px] text-emerald-600 font-semibold">
                        Ahorro: -{formatCurrency(item.descuentoUnitario * item.cantidad)}
                      </p>
                    )}
                  </div>
                  <span className="col-span-2 text-right text-slate-600">{item.precioUnitario.toFixed(2)}</span>
                  <span className="col-span-2 text-right font-bold text-slate-900">{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>OP. GRAVADA:</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>I.G.V. (18%):</span>
                <span>{formatCurrency(sale.igv)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-300">
                <span>TOTAL:</span>
                <span className="text-emerald-700">{formatCurrency(sale.total)}</span>
              </div>

              <div className="pt-2 text-[10px] text-slate-500 space-y-0.5 border-t border-slate-200">
                <div className="flex justify-between">
                  <span>Método de pago:</span>
                  <span className="font-semibold text-slate-700 uppercase">
                    {sale.metodoPago.replace('_', ' / ')}
                  </span>
                </div>
                {sale.metodoPago === 'efectivo' && sale.montoRecibido && (
                  <>
                    <div className="flex justify-between">
                      <span>Importe Recibido:</span>
                      <span>{formatCurrency(sale.montoRecibido)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Vuelto:</span>
                      <span>{formatCurrency(sale.vuelto || 0)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Footer Regulatory Notice */}
            <div className="border-t border-dashed border-slate-300 pt-3 text-center space-y-1 text-[9px] text-slate-500">
              <p className="font-semibold text-slate-700">{currentTenant.pieDeTicket || '¡GRACIAS POR SU PREFERENCIA!'}</p>
              <p>Revisar su vuelto y medicamento antes de salir de mostrador.</p>
              <p>Medicamentos no admiten cambio ni devolución conforme a normativa sanitaria.</p>
              <div className="pt-1 text-[8px] font-mono text-slate-400">
                Hash: 4a9f2c81e7d0bb6e31008c | Representación impresa de Comprobante de Pago Electrónico
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket (80mm)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
