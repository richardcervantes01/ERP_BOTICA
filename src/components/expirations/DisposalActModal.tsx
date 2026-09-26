import React, { useState } from 'react';
import { Product } from '../../types/pharmacy';
import { usePharmacy } from '../../context/PharmacyContext';
import { X, ShieldAlert, CheckCircle, FileText } from 'lucide-react';
import { formatCurrency, formatDateSpanish } from '../../utils/dateUtils';

interface DisposalActModalProps {
  product: Product | null;
  onClose: () => void;
}

export const DisposalActModal: React.FC<DisposalActModalProps> = ({ product, onClose }) => {
  const { createDisposalAct } = usePharmacy();

  const [cantidad, setCantidad] = useState<number>(product ? product.stock : 1);
  const [motivo, setMotivo] = useState<'vencimiento' | 'deterioro' | 'rotura' | 'cuarentena_sanitaria'>('vencimiento');
  const [observaciones, setObservaciones] = useState('Medicamento caducado o deteriorado retirado de anaquel para destrucción y baja conforme a directiva sanitaria de DIGEMID.');
  const [responsableQF, setResponsableQF] = useState('Q.F. Fernando Ramos (Coleg. 14209)');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cantidad <= 0 || cantidad > product.stock) {
      alert(`La cantidad a dar de baja debe estar entre 1 y ${product.stock} unidades.`);
      return;
    }

    createDisposalAct({
      productId: product.id,
      cantidad,
      motivo,
      observaciones,
      responsableQF
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  const totalLoss = product.precioCosto * cantidad;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-rose-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-300" />
            <div>
              <h3 className="font-bold text-sm">Acta de Baja Sanitaria / Descarte</h3>
              <p className="text-[11px] text-rose-200">Retiro formal y ajuste de merma por caducidad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-rose-200 hover:text-white p-1 rounded-lg hover:bg-rose-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800">¡Acta Generada y Stock Depurado!</h4>
            <p className="text-xs text-slate-500">
              Se ha descontado del inventario y registrado en el kárdex de mermas sanitarias.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Product Snapshot Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-800 text-sm">{product.nombre}</span>
                <span className="text-slate-400 font-mono text-[11px]">{product.codigo}</span>
              </div>
              <p className="text-slate-600">Principio Activo: <strong>{product.principioActivo}</strong></p>
              <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                <span>Lote: <strong className="font-mono text-slate-700">{product.lote}</strong></span>
                <span>Vencimiento: <strong className="text-rose-600">{formatDateSpanish(product.fechaVencimiento)}</strong></span>
                <span>En Stock: <strong>{product.stock} un.</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Cantidad a dar de baja
                </label>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={cantidad}
                  onChange={e => setCantidad(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Causa / Motivo
                </label>
                <select
                  value={motivo}
                  onChange={e => setMotivo(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden cursor-pointer"
                >
                  <option value="vencimiento">Medicamento Caducado</option>
                  <option value="deterioro">Deterioro / Descomposición</option>
                  <option value="rotura">Rotura / Frasco Roto</option>
                  <option value="cuarentena_sanitaria">Observación Sanitaria / Recall</option>
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">
                Químico Farmacéutico Responsable
              </label>
              <input
                type="text"
                value={responsableQF}
                onChange={e => setResponsableQF(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden"
                required
              />
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">
                Observaciones y Destino Final
              </label>
              <textarea
                rows={3}
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden"
              />
            </div>

            {/* Loss Cost Summary */}
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex justify-between items-center text-xs">
              <span className="text-rose-900 font-medium">Impacto en costo (Pérdida valorizada):</span>
              <span className="text-rose-700 font-bold text-sm">{formatCurrency(totalLoss)}</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Firmar Acta y Retirar de Stock</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
