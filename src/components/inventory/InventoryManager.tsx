import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Product } from '../../types/pharmacy';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Sliders,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import {
  formatCurrency,
  formatDateSpanish,
  getExpirationStatus,
  getExpirationLabel,
  getDaysUntilExpiration
} from '../../utils/dateUtils';
import { ProductModal } from './ProductModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';

export const InventoryManager: React.FC = () => {
  const { products, deleteProduct } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [stockStatusFilter, setStockStatusFilter] = useState<'todos' | 'bajo' | 'agotado' | 'vencido'>('todos');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map(p => p.categoria)));
    return ['todos', ...list];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.principioActivo.toLowerCase().includes(q) ||
        p.codigo.includes(q) ||
        p.lote.toLowerCase().includes(q) ||
        p.laboratorio.toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'todos' || p.categoria === categoryFilter;

      let matchesStock = true;
      const expStatus = getExpirationStatus(p.fechaVencimiento);

      if (stockStatusFilter === 'bajo') {
        matchesStock = p.stock > 0 && p.stock <= p.stockMinimo;
      } else if (stockStatusFilter === 'agotado') {
        matchesStock = p.stock === 0;
      } else if (stockStatusFilter === 'vencido') {
        matchesStock = expStatus === 'vencido';
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockStatusFilter]);

  // Inventory valuation
  const inventoryCostValue = products.reduce((acc, p) => acc + p.precioCosto * p.stock, 0);
  const inventorySaleValue = products.reduce((acc, p) => acc + p.precioVenta * p.stock, 0);
  const projectedProfit = inventorySaleValue - inventoryCostValue;

  const handleDelete = (p: Product) => {
    if (window.confirm(`¿Está seguro de eliminar ${p.nombre} del catálogo?`)) {
      deleteProduct(p.id);
    }
  };

  const handleExportCSV = () => {
    const headers = 'Codigo,Nombre,PrincipioActivo,Presentacion,Categoria,Laboratorio,Lote,Vencimiento,PrecioCosto,PrecioVenta,Stock,Ubicacion\n';
    const rows = products.map(p =>
      `"${p.codigo}","${p.nombre}","${p.principioActivo}","${p.presentacion}","${p.categoria}","${p.laboratorio}","${p.lote}","${p.fechaVencimiento}",${p.precioCosto},${p.precioVenta},${p.stock},"${p.ubicacion}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_farmacontrol_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Top Valuation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Valorizado al Costo</p>
          <h3 className="text-xl font-extrabold text-slate-800">{formatCurrency(inventoryCostValue)}</h3>
          <p className="text-[11px] text-slate-400">{products.length} productos registrados</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Valorizado a la Venta</p>
          <h3 className="text-xl font-extrabold text-emerald-700">{formatCurrency(inventorySaleValue)}</h3>
          <p className="text-[11px] text-slate-400">Total unidades: {products.reduce((acc, p) => acc + p.stock, 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Margen Comercial Estimado</p>
          <h3 className="text-xl font-extrabold text-indigo-700">{formatCurrency(projectedProfit)}</h3>
          <p className="text-[11px] text-slate-400">
            {inventoryCostValue > 0 ? ((projectedProfit / inventoryCostValue) * 100).toFixed(1) : 0}% sobre el costo
          </p>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filtrar por código, nombre, lote, laboratorio..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'todos' ? 'Todas las Categorías' : cat}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={e => setStockStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="todos">Todos los Estados</option>
            <option value="bajo">Stock Bajo (&le; Mínimo)</option>
            <option value="agotado">Agotados (Stock 0)</option>
            <option value="vencido">Vencidos (Cuarentena)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-slate-50 transition cursor-pointer"
            title="Descargar Kárdex en Excel/CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Medicamento</span>
          </button>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-4">Código</th>
                <th className="p-4">Medicamento / Principio</th>
                <th className="p-4">Lote / Vencimiento</th>
                <th className="p-4">Precio Venta</th>
                <th className="p-4">Costo & Margen</th>
                <th className="p-4">Stock Físico</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No se encontraron medicamentos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const expStatus = getExpirationStatus(p.fechaVencimiento);
                  const daysExp = getDaysUntilExpiration(p.fechaVencimiento);
                  const expLabel = getExpirationLabel(expStatus, daysExp);
                  const isLow = p.stock <= p.stockMinimo && p.stock > 0;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-mono text-[11px] text-slate-500">
                        {p.codigo}
                        <span className="block text-[10px] text-slate-400">{p.ubicacion}</span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-start gap-1.5">
                          <div>
                            <p className="font-bold text-slate-800">{p.nombre}</p>
                            <p className="text-[11px] text-slate-500">
                              {p.principioActivo} · <span className="text-slate-400">{p.laboratorio}</span>
                            </p>
                            <span className="text-[10px] text-slate-400">{p.categoria}</span>
                          </div>
                          {p.requiereReceta && (
                            <span className="px-1 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold rounded">
                              Rx
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="font-mono text-xs font-semibold text-slate-700">{p.lote}</p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border mt-1 ${expLabel.bg} ${expLabel.text} ${expLabel.border}`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>{expLabel.label}</span>
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-emerald-700 text-sm">
                          {formatCurrency(p.precioVenta)}
                        </span>
                        {p.descuentoPromocional && p.descuentoPromocional > 0 && (
                          <span className="block text-[10px] text-amber-600 font-bold">
                            -{p.descuentoPromocional}% FEFO Activo
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <p className="text-slate-600">{formatCurrency(p.precioCosto)}</p>
                        <p className="text-[10px] text-slate-400">
                          Margen: {(((p.precioVenta - p.precioCosto) / p.precioVenta) * 100).toFixed(1)}%
                        </p>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {p.stock} un.
                        </span>
                        {isLow && (
                          <span className="block text-[9px] text-amber-700 font-semibold mt-0.5">
                            Mínimo: {p.stockMinimo}
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setAdjustingProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                            title="Entrada / Ajuste de Stock"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition cursor-pointer"
                            title="Editar Ficha"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create/Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        product={adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
      />
    </div>
  );
};
