import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Product } from '../../types/pharmacy';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  ShieldAlert,
  Tag,
  ArrowRight,
  FileText,
  Printer,
  Calendar,
  Lock
} from 'lucide-react';
import {
  formatCurrency,
  formatDateSpanish,
  getExpirationStatus,
  getExpirationLabel,
  getDaysUntilExpiration
} from '../../utils/dateUtils';
import { DisposalActModal } from './DisposalActModal';

export const ExpirationManager: React.FC = () => {
  const { products, disposalActs, applyPromotionalDiscount, quarantineProduct } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'todos' | 'vencidos' | 'criticos' | 'proximos' | 'actas'>('todos');
  const [selectedProductForDisposal, setSelectedProductForDisposal] = useState<Product | null>(null);
  const [discountInputModal, setDiscountInputModal] = useState<{ product: Product; discount: number } | null>(null);

  // Grouped counts and metrics
  const stats = useMemo(() => {
    let vencidosUnits = 0;
    let vencidosCost = 0;
    let criticosUnits = 0;
    let criticosCost = 0;
    let proximosUnits = 0;
    let proximosCost = 0;

    products.forEach(p => {
      const exp = getExpirationStatus(p.fechaVencimiento);
      const totalCost = p.precioCosto * p.stock;

      if (exp === 'vencido') {
        vencidosUnits += p.stock;
        vencidosCost += totalCost;
      } else if (exp === 'critico') {
        criticosUnits += p.stock;
        criticosCost += totalCost;
      } else if (exp === 'proximo') {
        proximosUnits += p.stock;
        proximosCost += totalCost;
      }
    });

    return {
      vencidosUnits,
      vencidosCost,
      criticosUnits,
      criticosCost,
      proximosUnits,
      proximosCost
    };
  }, [products]);

  // Filtered products sorted by expiration date ascending (FEFO)
  const filteredProducts = useMemo(() => {
    const list = [...products].sort((a, b) => {
      return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime();
    });

    if (activeTab === 'vencidos') {
      return list.filter(p => getExpirationStatus(p.fechaVencimiento) === 'vencido');
    }
    if (activeTab === 'criticos') {
      return list.filter(p => getExpirationStatus(p.fechaVencimiento) === 'critico');
    }
    if (activeTab === 'proximos') {
      return list.filter(p => getExpirationStatus(p.fechaVencimiento) === 'proximo');
    }
    return list;
  }, [products, activeTab]);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* FEFO Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-emerald-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-400/30">
              PRINCIPIO FEFO: First Expired, First Out
            </span>
          </div>
          <h2 className="text-lg font-bold">Matriz de Control y Trazabilidad de Vencimientos</h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Priorice siempre la venta de los lotes más próximos a vencer. Los medicamentos vencidos se bloquean automáticamente en el POS para proteger la salud de los pacientes y cumplir con las inspecciones sanitarias.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vencidos */}
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-rose-600 font-bold uppercase tracking-wider">Vencidos (Baja Urgente)</p>
            <h3 className="text-xl font-extrabold text-slate-900">{stats.vencidosUnits} <span className="text-xs font-normal text-slate-500">unidades</span></h3>
            <p className="text-[11px] text-slate-500">Pérdida: <strong className="text-rose-600">{formatCurrency(stats.vencidosCost)}</strong></p>
          </div>
        </div>

        {/* Crítico ≤ 30 días */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wider">Crítico (&le; 30 días)</p>
            <h3 className="text-xl font-extrabold text-slate-900">{stats.criticosUnits} <span className="text-xs font-normal text-slate-500">unidades</span></h3>
            <p className="text-[11px] text-slate-500">En riesgo: <strong className="text-amber-700">{formatCurrency(stats.criticosCost)}</strong></p>
          </div>
        </div>

        {/* Próximos 31-90 días */}
        <div className="bg-white p-4 rounded-xl border border-yellow-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-yellow-800 font-bold uppercase tracking-wider">Próximos (31 - 90 días)</p>
            <h3 className="text-xl font-extrabold text-slate-900">{stats.proximosUnits} <span className="text-xs font-normal text-slate-500">unidades</span></h3>
            <p className="text-[11px] text-slate-500">Valorizado: <strong>{formatCurrency(stats.proximosCost)}</strong></p>
          </div>
        </div>

        {/* Total Actas de Baja */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Actas de Baja</p>
            <h3 className="text-xl font-extrabold text-slate-900">{disposalActs.length} <span className="text-xs font-normal text-slate-500">registradas</span></h3>
            <p className="text-[11px] text-slate-500">Auditoría Sanitaria</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          {[
            { id: 'todos' as const, label: 'Todos los Lotes FEFO' },
            { id: 'vencidos' as const, label: 'Lotes Vencidos', count: products.filter(p => getExpirationStatus(p.fechaVencimiento) === 'vencido').length },
            { id: 'criticos' as const, label: 'Críticos (≤ 30 días)', count: products.filter(p => getExpirationStatus(p.fechaVencimiento) === 'critico').length },
            { id: 'proximos' as const, label: 'Próximos (31-90 días)', count: products.filter(p => getExpirationStatus(p.fechaVencimiento) === 'proximo').length },
            { id: 'actas' as const, label: 'Actas de Baja Sanitaria', count: disposalActs.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : tab.id === 'vencidos' && tab.count > 0
                      ? 'bg-rose-100 text-rose-700 font-bold'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => window.print()}
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs cursor-pointer hover:bg-slate-50"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir Reporte FEFO</span>
        </button>
      </div>

      {/* TAB CONTENT: PRODUCTS LOTS */}
      {activeTab !== 'actas' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-4">Prioridad / Fármaco</th>
                <th className="p-4">Lote & Laboratorio</th>
                <th className="p-4">Caducidad</th>
                <th className="p-4">Semáforo</th>
                <th className="p-4">Stock & Costo</th>
                <th className="p-4">Descuento FEFO</th>
                <th className="p-4 text-center">Acciones Sanitarias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p, idx) => {
                const expStatus = getExpirationStatus(p.fechaVencimiento);
                const daysExp = getDaysUntilExpiration(p.fechaVencimiento);
                const expLabel = getExpirationLabel(expStatus, daysExp);
                const isExpired = expStatus === 'vencido';

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/80 transition ${
                      isExpired ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400 w-5">#{idx + 1}</span>
                        <div>
                          <p className="font-bold text-slate-800">{p.nombre}</p>
                          <p className="text-[11px] text-slate-500">{p.principioActivo}</p>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {p.codigo}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-mono font-semibold text-slate-700">{p.lote}</p>
                      <p className="text-[11px] text-slate-500">{p.laboratorio}</p>
                      <p className="text-[10px] text-slate-400">{p.ubicacion}</p>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{formatDateSpanish(p.fechaVencimiento)}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.fechaVencimiento}</p>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${expLabel.bg} ${expLabel.text} ${expLabel.border}`}
                      >
                        {isExpired ? (
                          <Lock className="w-3 h-3 text-rose-600" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{expLabel.label}</span>
                      </span>
                      {p.estadoDisposicion === 'cuarentena' && (
                        <span className="block mt-1 text-[10px] text-amber-700 font-bold">
                          [EN CUARENTENA]
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">{p.stock} un.</p>
                      <p className="text-[11px] text-slate-500">
                        Costo: {formatCurrency(p.precioCosto * p.stock)}
                      </p>
                    </td>

                    <td className="p-4">
                      {p.descuentoPromocional && p.descuentoPromocional > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-xs">
                            -{p.descuentoPromocional}%
                          </span>
                          <button
                            onClick={() => applyPromotionalDiscount(p.id, 0)}
                            className="text-slate-400 hover:text-rose-500 text-[10px] cursor-pointer"
                            title="Quitar descuento"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDiscountInputModal({ product: p, discount: 20 })}
                          disabled={isExpired}
                          className={`text-[11px] text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 cursor-pointer ${
                            isExpired ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                        >
                          <Tag className="w-3 h-3" />
                          <span>Aplicar %</span>
                        </button>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {isExpired || p.estadoDisposicion === 'cuarentena' ? (
                          <button
                            onClick={() => setSelectedProductForDisposal(p)}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Dar de Baja</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Aislar ${p.nombre} a cuarentena sanitaria?`)) {
                                  quarantineProduct(p.id);
                                }
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[11px] font-medium transition cursor-pointer"
                              title="Aislar lote de la venta"
                            >
                              Cuarentena
                            </button>
                            <button
                              onClick={() => setSelectedProductForDisposal(p)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition cursor-pointer"
                              title="Generar merma"
                            >
                              Baja
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* TAB CONTENT: ACTAS DE BAJA SANITARIA */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
            <div>
              <h3 className="font-bold text-slate-800">Libro Oficial de Actas de Baja y Destrucción</h3>
              <p className="text-slate-500">Documento regulatorio para fiscalización de DIGEMID / Dirección de Medicamentos.</p>
            </div>
            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
              Total Registros: {disposalActs.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-4">N° de Acta</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Medicamento & Lote</th>
                  <th className="p-4">Cantidad</th>
                  <th className="p-4">Pérdida en Costo</th>
                  <th className="p-4">Causa / Observación</th>
                  <th className="p-4">Responsable Sanitario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {disposalActs.map(act => (
                  <tr key={act.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-800">{act.numeroActa}</td>
                    <td className="p-4 text-slate-600">{formatDateSpanish(act.fecha)}</td>
                    <td className="p-4">
                      {act.productos.map((prod, i) => (
                        <div key={i}>
                          <p className="font-semibold text-slate-800">{prod.nombre}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Lote: {prod.lote} · Venció: {formatDateSpanish(prod.fechaVencimiento)}</p>
                        </div>
                      ))}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {act.productos.reduce((acc, p) => acc + p.cantidad, 0)} unidades
                    </td>
                    <td className="p-4 font-bold text-rose-700">
                      {formatCurrency(act.productos.reduce((acc, p) => acc + p.costoTotalPerdido, 0))}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 text-[10px] font-semibold border border-rose-200 uppercase">
                        {act.motivo}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs">{act.observaciones}</p>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {act.responsableQF}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal to Set Promotional Discount */}
      {discountInputModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Aplicar Descuento Rotación FEFO</h3>
            <p className="text-xs text-slate-500">
              {discountInputModal.product.nombre} (Vence en {getDaysUntilExpiration(discountInputModal.product.fechaVencimiento)} días).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Porcentaje de Descuento</label>
              <div className="flex gap-2 mb-3">
                {[10, 15, 20, 30, 50].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountInputModal({ ...discountInputModal, discount: pct })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${
                      discountInputModal.discount === pct
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="90"
                value={discountInputModal.discount}
                onChange={e => setDiscountInputModal({ ...discountInputModal, discount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDiscountInputModal(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  applyPromotionalDiscount(discountInputModal.product.id, discountInputModal.discount);
                  setDiscountInputModal(null);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer"
              >
                Guardar Descuento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Sanitary Disposal Act */}
      <DisposalActModal
        product={selectedProductForDisposal}
        onClose={() => setSelectedProductForDisposal(null)}
      />
    </div>
  );
};
