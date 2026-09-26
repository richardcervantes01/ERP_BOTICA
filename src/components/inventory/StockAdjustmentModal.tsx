import React, { useState } from 'react';
import { Product } from '../../types/pharmacy';
import { usePharmacy } from '../../context/PharmacyContext';
import { X, ArrowDownRight, ArrowUpRight, Sliders, CheckCircle } from 'lucide-react';
import { formatDateSpanish } from '../../utils/dateUtils';

interface StockAdjustmentModalProps {
  product: Product | null;
  onClose: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ product, onClose }) => {
  const { adjustStock } = usePharmacy();

  const [tipo, setTipo] = useState<'entrada_compra' | 'salida_merma' | 'ajuste_inventario'>('entrada_compra');
  const [cantidad, setCantidad] = useState<number>(10);
  const [motivo, setMotivo] = useState('Ingreso por factura de compra droguería / distribuidor');
  const [nuevoLote, setNuevoLote] = useState(product?.lote || '');
  const [nuevoVencimiento, setNuevoVencimiento] = useState(product?.fechaVencimiento || '');
  const [nuevoCosto, setNuevoCosto] = useState<number>(product?.precioCosto || 0);

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    adjustStock({
      productId: product.id,
      tipo,
      cantidad,
      motivo,
      nuevoLote: nuevoLote || product.lote,
      nuevoVencimiento: nuevoVencimiento || product.fechaVencimiento,
      nuevoCosto: nuevoCosto > 0 ? nuevoCosto : product.precioCosto
    });

    onClose();
  };

  const calculatedNewStock = () => {
    if (tipo === 'entrada_compra') return product.stock + cantidad;
    if (tipo === 'salida_merma') return Math.max(0, product.stock - cantidad);
    return cantidad;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Ajuste de Kárdex / Movimiento de Stock</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-800">{product.nombre}</p>
            <p className="text-slate-500 font-mono">Lote actual: {product.lote} · Vence: {formatDateSpanish(product.fechaVencimiento)}</p>
            <p className="text-slate-700 font-semibold pt-1">Stock Actual: {product.stock} unidades</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Tipo de Operación</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTipo('entrada_compra');
                  setMotivo('Ingreso por factura de compra droguería');
                }}
                className={`p-2 rounded-lg text-xs font-semibold border flex flex-col items-center gap-1 cursor-pointer ${
                  tipo === 'entrada_compra'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>Entrada / Compra</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipo('salida_merma');
                  setMotivo('Salida por rotura o deterioro interno');
                }}
                className={`p-2 rounded-lg text-xs font-semibold border flex flex-col items-center gap-1 cursor-pointer ${
                  tipo === 'salida_merma'
                    ? 'bg-rose-50 text-rose-800 border-rose-500 ring-1 ring-rose-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                <span>Salida / Merma</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipo('ajuste_inventario');
                  setMotivo('Conteo físico y cuadre de inventario');
                }}
                className={`p-2 rounded-lg text-xs font-semibold border flex flex-col items-center gap-1 cursor-pointer ${
                  tipo === 'ajuste_inventario'
                    ? 'bg-blue-50 text-blue-800 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Conteo Físico</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {tipo === 'ajuste_inventario' ? 'Nuevo Stock Real' : 'Cantidad'}
              </label>
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={e => setCantidad(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                required
              />
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-center">
              <span className="text-[10px] text-slate-500">Stock Resultante:</span>
              <span className="text-base font-extrabold text-emerald-700">
                {calculatedNewStock()} unidades
              </span>
            </div>
          </div>

          {tipo === 'entrada_compra' && (
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-emerald-900 block">Actualizar Datos de Nuevo Lote (Opcional):</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-600 mb-0.5">Nuevo Lote</label>
                  <input
                    type="text"
                    value={nuevoLote}
                    onChange={e => setNuevoLote(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 mb-0.5">Nuevo Vencimiento</label>
                  <input
                    type="date"
                    value={nuevoVencimiento}
                    onChange={e => setNuevoVencimiento(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="text-xs">
            <label className="block text-slate-700 font-semibold mb-1">Motivo / Documento de Referencia</label>
            <input
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirmar Ajuste</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
