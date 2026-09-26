import React, { useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Award,
  TrendingUp,
  Receipt,
  Users,
  DollarSign,
  UserCheck,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatDateTimeSpanish } from '../../utils/dateUtils';

export const CashierProductivity: React.FC = () => {
  const { sales, users, currentTenant } = usePharmacy();

  // Filter sales belonging to current botica and completed
  const tenantSales = useMemo(() => {
    return sales.filter(
      s => s.estado === 'completada' && (s.tenantId === currentTenant.id || !s.tenantId)
    );
  }, [sales, currentTenant.id]);

  const totalBoticaSales = tenantSales.reduce((acc, s) => acc + s.total, 0);

  // Group by cashier / seller
  const cashierStats = useMemo(() => {
    const stats: {
      [key: string]: {
        cajeroId?: string;
        nombre: string;
        email?: string;
        total: number;
        ticketsCount: number;
      };
    } = {};

    // First list all cashiers of this botica
    const boticaUsers = users.filter(
      u => u.tenantId === currentTenant.id && (u.role === 'cashier' || u.role === 'tenant_admin')
    );

    boticaUsers.forEach(u => {
      stats[u.id] = {
        cajeroId: u.id,
        nombre: u.nombre,
        email: u.email,
        total: 0,
        ticketsCount: 0
      };
    });

    // Accumulate sales
    tenantSales.forEach(s => {
      const sellerKey = s.cajeroId || s.vendedor;
      if (stats[sellerKey]) {
        stats[sellerKey].total += s.total;
        stats[sellerKey].ticketsCount += 1;
      } else {
        // Find by name if key not found
        const byName = Object.values(stats).find(st => st.nombre === s.vendedor);
        if (byName) {
          byName.total += s.total;
          byName.ticketsCount += 1;
        } else {
          stats[sellerKey] = {
            cajeroId: s.cajeroId,
            nombre: s.vendedor,
            total: s.total,
            ticketsCount: 1
          };
        }
      }
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [tenantSales, users, currentTenant.id]);

  const topSeller = cashierStats[0];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-emerald-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400/30">
              AUDITORÍA DE CAJEROS & DISPENSADORES
            </span>
          </div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Productividad y Ranking de Ventas por Cajero
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Supervise el rendimiento de cada cajero en {currentTenant.nombreBotica}: quién vendió más, número de boletas emitidas, ticket promedio y porcentaje de contribución.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Cajero Líder en Ventas</p>
            <h3 className="text-base font-extrabold text-slate-800 truncate max-w-[160px]">
              {topSeller ? topSeller.nombre : 'Sin ventas'}
            </h3>
            <p className="text-[11px] text-emerald-700 font-bold">
              {topSeller ? formatCurrency(topSeller.total) : 'S/ 0.00'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Facturación Total Botica</p>
            <h3 className="text-xl font-extrabold text-slate-800">{formatCurrency(totalBoticaSales)}</h3>
            <p className="text-[11px] text-slate-400">{tenantSales.length} comprobantes en total</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Ticket Promedio Global</p>
            <h3 className="text-xl font-extrabold text-slate-800">
              {formatCurrency(tenantSales.length > 0 ? totalBoticaSales / tenantSales.length : 0)}
            </h3>
            <p className="text-[11px] text-slate-400">Por transacción en mostrador</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Personal Registrado</p>
            <h3 className="text-xl font-extrabold text-slate-800">{cashierStats.length}</h3>
            <p className="text-[11px] text-slate-400">Cajeros / Vendedores</p>
          </div>
        </div>
      </div>

      {/* Cashier Ranking Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Ranking de Productividad por Vendedor</h3>
            <p className="text-xs text-slate-400">
              Ordenado de mayor a menor volumen total de ventas dispensadas.
            </p>
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
            <tr>
              <th className="p-4">Puesto / Cajero</th>
              <th className="p-4">Correo de Acceso</th>
              <th className="p-4 text-center">Tickets Emitidos</th>
              <th className="p-4 text-right">Total Vendido (S/)</th>
              <th className="p-4 text-right">Ticket Promedio</th>
              <th className="p-4">Participación en Ventas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cashierStats.map((cajero, idx) => {
              const share = totalBoticaSales > 0 ? (cajero.total / totalBoticaSales) * 100 : 0;
              const avgTicket = cajero.ticketsCount > 0 ? cajero.total / cajero.ticketsCount : 0;

              return (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-700'
                            : idx === 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-800">{cajero.nombre}</p>
                        {idx === 0 && (
                          <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                            <Award className="w-3 h-3" /> Mayor Venta
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="p-4 font-mono text-slate-500">{cajero.email || '-'}</td>

                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-xs">
                      {cajero.ticketsCount} ventas
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <span className="font-bold text-emerald-700 text-sm">
                      {formatCurrency(cajero.total)}
                    </span>
                  </td>

                  <td className="p-4 text-right text-slate-700 font-medium">
                    {formatCurrency(avgTicket)}
                  </td>

                  <td className="p-4 w-48">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">{share.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, share)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent Sales with Cashier Tag */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600" />
          Últimas Ventas con Identificación de Cajero
        </h3>

        <div className="divide-y divide-slate-100">
          {tenantSales.slice(0, 5).map(sale => (
            <div key={sale.id} className="py-2.5 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-slate-800 font-mono">{sale.correlativo}</p>
                <p className="text-[11px] text-slate-500">
                  Cajero: <strong className="text-slate-700">{sale.vendedor}</strong> · {sale.items.length} productos
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-700 text-sm">{formatCurrency(sale.total)}</span>
                <span className="text-[10px] text-slate-400 block uppercase">
                  {formatDateTimeSpanish(sale.fecha)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
