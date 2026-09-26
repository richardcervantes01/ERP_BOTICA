import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Sale } from '../../types/pharmacy';
import {
  Search,
  Printer,
  Ban,
  Receipt,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { formatCurrency, formatDateTimeSpanish } from '../../utils/dateUtils';
import { ReceiptModal } from '../pos/ReceiptModal';

export const SalesHistory: React.FC = () => {
  const { sales, annulSale } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);
  const [tipoFilter, setTipoFilter] = useState<string>('todos');

  const filteredSales = sales.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.correlativo.toLowerCase().includes(q) ||
      s.clienteNombre.toLowerCase().includes(q) ||
      s.clienteDocumento.includes(q) ||
      s.items.some(i => i.nombre.toLowerCase().includes(q));

    const matchesTipo = tipoFilter === 'todos' || s.tipoComprobante === tipoFilter;

    return matchesSearch && matchesTipo;
  });

  const totalVendido = filteredSales
    .filter(s => s.estado === 'completada')
    .reduce((acc, s) => acc + s.total, 0);

  const handleAnnul = (sale: Sale) => {
    const motivo = window.prompt(
      `¿Desea anular el comprobante ${sale.correlativo}?\nIngrese el motivo de anulación (se devolverá el stock a inventario):`,
      'Error de digitación / Devolución inmediata'
    );
    if (motivo) {
      annulSale(sale.id, motivo);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Top metrics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Transacciones</p>
          <h3 className="text-xl font-extrabold text-slate-800">{filteredSales.length}</h3>
          <p className="text-[11px] text-slate-400">Comprobantes emitidos</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Facturación Total Filtrada</p>
          <h3 className="text-xl font-extrabold text-emerald-700">{formatCurrency(totalVendido)}</h3>
          <p className="text-[11px] text-slate-400">Excluye comprobantes anulados</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Ticket Promedio</p>
          <h3 className="text-xl font-extrabold text-indigo-700">
            {formatCurrency(filteredSales.length > 0 ? totalVendido / (filteredSales.filter(s => s.estado === 'completada').length || 1) : 0)}
          </h3>
          <p className="text-[11px] text-slate-400">Por venta efectiva</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por correlativo, cliente, DNI o medicamento..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={tipoFilter}
            onChange={e => setTipoFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="todos">Todos los Comprobantes</option>
            <option value="boleta">Solo Boletas</option>
            <option value="factura">Solo Facturas</option>
            <option value="ticket">Solo Tickets</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
            <tr>
              <th className="p-4">Comprobante</th>
              <th className="p-4">Fecha y Hora</th>
              <th className="p-4">Cliente / Paciente</th>
              <th className="p-4">Medicamentos Dispensados</th>
              <th className="p-4">Medio de Pago</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  No se encontraron ventas registradas.
                </td>
              </tr>
            ) : (
              filteredSales.map(sale => {
                const isAnulada = sale.estado === 'anulada';
                return (
                  <tr
                    key={sale.id}
                    className={`hover:bg-slate-50 transition ${isAnulada ? 'bg-slate-50/60 opacity-65' : ''}`}
                  >
                    <td className="p-4 font-mono font-bold text-slate-800">
                      {sale.correlativo}
                      <span className="block text-[10px] text-slate-400 font-sans uppercase">
                        {sale.tipoComprobante}
                      </span>
                    </td>

                    <td className="p-4 text-slate-600">
                      {formatDateTimeSpanish(sale.fecha)}
                      <span className="block text-[10px] text-slate-400">{sale.vendedor}</span>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{sale.clienteNombre}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Doc: {sale.clienteDocumento}</p>
                    </td>

                    <td className="p-4 max-w-xs">
                      <div className="space-y-0.5">
                        {sale.items.map((it, idx) => (
                          <div key={idx} className="text-[11px] text-slate-700 flex justify-between gap-2">
                            <span className="truncate">
                              {it.cantidad}x {it.nombre}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px] shrink-0">
                              Lote {it.lote}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase">
                        {sale.metodoPago.replace('_', ' / ')}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <span className={`text-sm font-bold ${isAnulada ? 'line-through text-slate-400' : 'text-emerald-700'}`}>
                        {formatCurrency(sale.total)}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAnulada
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isAnulada ? 'Anulada' : 'Emitida'}
                      </span>
                      {isAnulada && sale.motivoAnulacion && (
                        <span className="block text-[9px] text-rose-600 max-w-[120px] truncate mx-auto mt-0.5" title={sale.motivoAnulacion}>
                          {sale.motivoAnulacion}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedReceiptSale(sale)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                          title="Reimprimir Ticket 80mm"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {!isAnulada && (
                          <button
                            onClick={() => handleAnnul(sale)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Anular venta y reponer stock"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal for Re-printing */}
      <ReceiptModal
        sale={selectedReceiptSale}
        onClose={() => setSelectedReceiptSale(null)}
      />
    </div>
  );
};
