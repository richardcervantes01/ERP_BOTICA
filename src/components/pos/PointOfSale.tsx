import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Product, Sale, UnidadDispensacion } from '../../types/pharmacy';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CheckCircle,
  AlertTriangle,
  FileText,
  Percent,
  Clock,
  Lock,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { formatCurrency, formatDateSpanish, getExpirationStatus, getExpirationLabel, getDaysUntilExpiration } from '../../utils/dateUtils';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';

interface PointOfSaleProps {
  onOpenCloseShift?: () => void;
}

export const PointOfSale: React.FC<PointOfSaleProps> = ({ onOpenCloseShift }) => {
  const {
    products,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartDiscount,
    cartTotal,
    currentUser
  } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [filterDiscountOnly, setFilterDiscountOnly] = useState(false);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.categoria)));
    return ['todos', ...cats];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.principioActivo.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.codDigemid && p.codDigemid.toLowerCase().includes(q)) ||
        p.laboratorio.toLowerCase().includes(q) ||
        p.lote.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'todos' || p.categoria === selectedCategory;
      const matchesDiscount = !filterDiscountOnly || (p.descuentoPromocional && p.descuentoPromocional > 0);

      return matchesQuery && matchesCat && matchesDiscount;
    });
  }, [products, searchQuery, selectedCategory, filterDiscountOnly]);

  const handleProductClick = (product: Product, unidad: UnidadDispensacion = 'caja') => {
    const result = addToCart(product, 1, unidad);
    if (!result.success) {
      setFeedbackMsg({ text: result.message || 'No se pudo agregar el producto', type: 'error' });
      setTimeout(() => setFeedbackMsg(null), 5000);
    } else {
      setFeedbackMsg({ text: `${product.nombre} [${unidad.toUpperCase()}] agregado al carrito`, type: 'success' });
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  };

  const handleSaleSuccess = (sale: Sale) => {
    setIsPaymentModalOpen(false);
    setCompletedSale(sale);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`fixed top-20 right-8 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top duration-200 ${
            feedbackMsg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {feedbackMsg.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-hidden">
        {/* LEFT COLUMN: Catalog & Search (Span 2) */}
        <div className="lg:col-span-2 flex flex-col bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 overflow-hidden">
          {/* Search bar & quick filters */}
          <div className="space-y-3 shrink-0">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por código de barra, nombre comercial, principio activo o laboratorio..."
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Category horizontal filter bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                onClick={() => setFilterDiscountOnly(!filterDiscountOnly)}
                className={`px-3 py-1.5 rounded-lg font-medium shrink-0 flex items-center gap-1.5 transition cursor-pointer ${
                  filterDiscountOnly
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Percent className="w-3 h-3" />
                <span>Ofertas Rotación FEFO</span>
              </button>

              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium shrink-0 transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                  }`}
                >
                  {cat === 'todos' ? 'Todos los Fármacos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Search className="w-8 h-8 text-slate-300 mb-2" />
                <p>No se encontraron medicamentos con los filtros aplicados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredProducts.map(p => {
                  const expStatus = getExpirationStatus(p.fechaVencimiento);
                  const daysExp = getDaysUntilExpiration(p.fechaVencimiento);
                  const expLabel = getExpirationLabel(expStatus, daysExp);
                  const isBlocked = expStatus === 'vencido' || p.estadoDisposicion !== 'disponible';
                  const isLowStock = p.stock <= p.stockMinimo && p.stock > 0;
                  const isOutOfStock = p.stock <= 0;

                  const hasDiscount = p.descuentoPromocional && p.descuentoPromocional > 0;
                  const finalPrice = hasDiscount
                    ? p.precioVenta * (1 - p.descuentoPromocional! / 100)
                    : p.precioVenta;

                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-xl border transition flex flex-col justify-between select-none relative ${
                        isBlocked
                          ? 'bg-rose-50/50 border-rose-300 opacity-90'
                          : isOutOfStock
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md group'
                      }`}
                    >
                      {/* Top row: Barcode, DIGEMID & Rx/Fiscalizado */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                          <span className="flex items-center gap-1">
                            {p.codigo}
                            {p.codDigemid && (
                              <span className="text-[9px] bg-slate-100 text-slate-700 px-1 rounded font-bold">
                                OPPF:{p.codDigemid}
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            {p.esFiscalizado && (
                              <span className="text-[9px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <ShieldAlert className="w-2.5 h-2.5" /> Fiscalizado
                              </span>
                            )}
                            {p.requiereReceta && !p.esFiscalizado && (
                              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <FileText className="w-2.5 h-2.5" /> Rx
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title and presentation */}
                        <h4 className="font-semibold text-xs text-slate-800 line-clamp-2 group-hover:text-emerald-700 transition leading-snug">
                          {p.nombre}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {p.principioActivo} · <span className="text-slate-400">{p.laboratorio}</span>
                        </p>

                        {/* Expiration Tag & Batch */}
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-mono">Lote FEFO: {p.lote}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] border flex items-center gap-1 ${expLabel.bg} ${expLabel.text} ${expLabel.border}`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {expLabel.label}
                          </span>
                        </div>
                      </div>

                      {/* Hard lock error banner */}
                      {isBlocked && (
                        <div className="mt-2 p-1.5 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-[10px] font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-rose-700 shrink-0" />
                          <span>¡BLOQUEO FEFO! Lote caducado. Venta prohibida (D.S. 014-2011-SA).</span>
                        </div>
                      )}

                      {/* Bottom row: Multi-level fractioning actions */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] text-slate-400">Stock Disponible</p>
                            {isBlocked ? (
                              <span className="text-[11px] font-black text-rose-700">BLOQUEADO</span>
                            ) : isOutOfStock ? (
                              <span className="text-[11px] font-bold text-slate-500">AGOTADO</span>
                            ) : (
                              <div>
                                <span className={`text-xs font-bold ${isLowStock ? 'text-amber-600' : 'text-slate-700'}`}>
                                  {p.stock} {p.unidadEmpaque || 'Cajas'}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  ({p.stockMinimasUnidades || (p.stock * (p.factorConversionTotal || 1))} {p.unidadMinima}s)
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            {hasDiscount && (
                              <p className="text-[10px] text-slate-400 line-through">
                                {formatCurrency(p.precioVenta)}
                              </p>
                            )}
                            <span className="text-sm font-bold text-emerald-700">
                              {formatCurrency(finalPrice)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">por {p.unidadEmpaque || 'Caja'}</span>
                          </div>
                        </div>

                        {/* Multi-level Quick Dispense Buttons */}
                        {!isBlocked && !isOutOfStock && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => handleProductClick(p, 'caja')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                              title={`Dispensar 1 ${p.unidadEmpaque || 'Caja'}`}
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>{p.unidadEmpaque || 'Caja'}</span>
                            </button>

                            {p.blistersPorCaja && p.blistersPorCaja > 1 && (
                              <button
                                type="button"
                                onClick={() => handleProductClick(p, 'blister')}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                                title={`Dispensar 1 ${p.unidadSubEmpaque || 'Blíster'}`}
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>{p.unidadSubEmpaque || 'Blíster'}</span>
                              </button>
                            )}

                            {p.factorConversionTotal > 1 && (
                              <button
                                type="button"
                                onClick={() => handleProductClick(p, 'fraccion')}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                                title={`Dispensar 1 ${p.unidadMinima} (Fracción)`}
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>1 {p.unidadMinima}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Promo discount sticker badge */}
                      {hasDiscount && (
                        <div className="absolute top-2 right-2 bg-amber-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-xs">
                          -{p.descuentoPromocional}% FEFO
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Cart & Billing (Span 1) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-full overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden space-y-3">
            {/* Cashier Shift Status & Close Button */}
            {currentUser?.role === 'cashier' && onOpenCloseShift && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs shrink-0">
                <div>
                  <p className="font-bold text-amber-900 text-[11px]">Turno de Caja Activo</p>
                  <p className="text-[10px] text-amber-700">Cajero: {currentUser.nombre}</p>
                </div>
                <button
                  onClick={onOpenCloseShift}
                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                  title="Finalizar turno y declarar efectivo para arqueo"
                >
                  <Lock className="w-3 h-3" />
                  <span>Cerrar Turno</span>
                </button>
              </div>
            )}

            {/* Cart Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" /> Detalle de Venta
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {cart.reduce((acc, i) => acc + i.cantidad, 0)} items
                </span>
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Vaciar
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-2">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <p className="font-medium text-slate-600">Carrito vacío</p>
                  <p className="text-[11px] text-slate-400 text-center max-w-[200px] mt-1">
                    Haga clic sobre un medicamento del catálogo para añadirlo a la dispensación.
                  </p>
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={`${item.product.id}-${item.unidadDispensada}`}
                    className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/90 text-xs space-y-2.5 shadow-2xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-slate-800">{item.product.nombre}</p>
                          {item.product.esFiscalizado && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                              Fiscalizado
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Lote FEFO: <strong className="font-mono text-emerald-800">{item.loteAsignadoFefo?.numeroLote || item.product.lote}</strong> · Vence:{' '}
                          {formatDateSpanish(item.loteAsignadoFefo?.fechaVencimiento || item.product.fechaVencimiento)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                        title="Quitar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Multi-level Unit Selection in Cart */}
                    <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-slate-200 text-[11px]">
                      <span className="text-slate-500 font-medium">Unidad Despacho:</span>
                      <div className="flex items-center gap-1 font-bold">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.cantidad, 'caja')}
                          className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition ${
                            item.unidadDispensada === 'caja'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {item.product.unidadEmpaque || 'Caja'}
                        </button>
                        {item.product.blistersPorCaja && item.product.blistersPorCaja > 1 && (
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.cantidad, 'blister')}
                            className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition ${
                              item.unidadDispensada === 'blister'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {item.product.unidadSubEmpaque || 'Blíster'}
                          </button>
                        )}
                        {item.product.factorConversionTotal > 1 && (
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.cantidad, 'fraccion')}
                            className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition ${
                              item.unidadDispensada === 'fraccion'
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {item.product.unidadMinima || 'Fracción'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                      {/* Quantity Controls & Minimal units breakdown */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.cantidad - 1, item.unidadDispensada)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.product.stock * 10}
                            value={item.cantidad}
                            onChange={e =>
                              updateCartQuantity(item.product.id, parseInt(e.target.value) || 1, item.unidadDispensada)
                            }
                            className="w-8 text-center text-xs font-bold text-slate-800 outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.cantidad + 1, item.unidadDispensada)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          = {item.unidadesMinimasTotal} {item.product.unidadMinima}s
                        </span>
                      </div>

                      {/* Item Total Price */}
                      <div className="text-right">
                        {item.descuentoUnitario > 0 && (
                          <span className="text-[10px] text-emerald-600 block">
                            Ahorro: -{formatCurrency(item.descuentoUnitario * item.cantidad)}
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-800">
                          {formatCurrency(item.precioAplicado * item.cantidad)}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          (S/ {item.precioAplicado.toFixed(2)} c/u)
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart Bottom: Totals & Checkout Button */}
          <div className="border-t border-slate-200 pt-4 space-y-3 shrink-0">
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal Catálogo:</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Descuentos Rotación FEFO:</span>
                  <span>-{formatCurrency(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-800 pt-1 border-t border-slate-100">
                <span>Total a Pagar:</span>
                <span className="text-emerald-700 text-lg font-extrabold">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => setIsPaymentModalOpen(true)}
              className={`w-full py-3 px-4 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-98'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirmar & Cobrar ({formatCurrency(cartTotal)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handleSaleSuccess}
      />

      {/* Finished Sale Printable Receipt Modal */}
      <ReceiptModal
        sale={completedSale}
        onClose={() => setCompletedSale(null)}
      />
    </div>
  );
};
