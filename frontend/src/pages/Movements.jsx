import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import MovementDrawer from '../components/MovementDrawer';
import { inventoryService } from '../services/Api';

export default function Movements() {
  const { t } = useTranslation();

  // Main Screen States
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [criticalItems, setCriticalItems] = useState([]);
  const [totals, setTotals] = useState({ inputs: 0, outputs: 0 });
  const limit = 10;

  // State to control the visibility of the Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // --- API SEARCHES ---
  const fetchMovements = async (page) => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const data = await inventoryService.getMovements(skip, limit);
      if (data && Array.isArray(data)) {
        setMovements(data);
      } else {
        setMovements([]);
      }
    } catch (error) {
      console.error("Failed to fetch paginated movements:", error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const [summary, runway] = await Promise.all([
        inventoryService.getDashboardSummary(),
        inventoryService.getStockRunway()
      ]);

      const critical = runway.filter(item => item.status === 'CRITICAL');
      setCriticalItems(critical);
      setTotals({ inputs: summary.inputs_month || 0, outputs: summary.outputs_month || 0 });
    } catch (error) {
      console.error("Failed to load inventory analytics data:", error);
    }
  };

  useEffect(() => {
    fetchMovements(currentPage);
    fetchAnalyticsData();
  }, [currentPage]);

  // Function called by the Drawer when a transaction is successfully completed.
  const handleMovementCreated = () => {
    fetchMovements(1);
    setCurrentPage(1);
    fetchAnalyticsData();
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col p-6 overflow-hidden space-y-4">
        {/* HEADBOARD */}
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-100">{t('movements.title')}</h1>
            <p className="text-xs text-slate-400">{t('movements.subtitle')}</p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-3.5 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer"
          >
            + {t('movements.new_btn')}
          </button>
        </div>

        {/* ANALYTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 md:col-span-2 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('movements.pandas_title')}</h3>
            </div>
            {criticalItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic">{t('movements.no_alerts')}</p>
            ) : (
              <div className="space-y-1.5 max-h-20 overflow-y-auto pr-1">
                {criticalItems.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 p-2 rounded-lg">
                    <span>⚠️</span>
                    <span>{t('movements.alert_critical', { name: item.product_name, days: item.estimated_days_left })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('movements.flow_summary')}</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">{t('movements.total_in')} (IN):</span>
                <span className="font-bold text-emerald-400">+{totals.inputs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('movements.total_out')} (OUT):</span>
                <span className="font-bold text-red-400 text-right">-{totals.outputs}</span>
              </div>
            </div>
          </div>
        </div>

        {/* HISTORY TABLE CONTAINER */}
        <div className="flex-1 flex flex-col justify-between bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden min-h-0">
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-300 uppercase text-[11px] tracking-wider border-b border-slate-800 select-none">
                <tr>
                  <th className="py-2.5 px-4">{t('movements.col_date')}</th>
                  <th className="py-2.5 px-4">{t('movements.col_product')}</th>
                  <th className="py-2.5 px-4">{t('movements.col_type')}</th>
                  <th className="py-2.5 px-4 text-center">{t('movements.col_qty')}</th>
                  <th className="py-2.5 px-4 text-center">{t('movements.col_user')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr><td colSpan="5" className="py-8 text-center text-slate-500 italic">{t('movements.loading')}</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan="5" className="py-8 text-center text-slate-500 italic">{t('movements.no_data')}</td></tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/20 transition-all">
                      <td className="py-2.5 px-4 text-slate-400">{m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-200">
                        <div>
                          <p className="font-semibold text-slate-100 text-xs">{m.product?.name || `Producto #${m.product_id}`}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{m.product?.sku || '—'}</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          m.movement_type === 'in' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {m.movement_type === 'in' ? t('movements.type_in') : t('movements.type_out')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-slate-200 font-bold">{m.quantity}</td>
                      <td className="py-2.5 px-4 text-center text-slate-300 font-mono">{m.user_id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="flex justify-between items-center px-4 py-2.5 border-t border-slate-800 bg-slate-900/40 shrink-0">
            <span className="text-xs text-slate-500">{t('movements.page')} {currentPage}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1 || loading} 
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold rounded text-slate-300 transition cursor-pointer"
              >
                {t('movements.btn_prev')}
              </button>
              <button 
                onClick={() => setCurrentPage(prev => prev + 1)} 
                disabled={movements.length < limit || loading} 
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold rounded text-slate-300 transition cursor-pointer"
              >
                {t('movements.btn_next')}
              </button>
            </div>
          </div>
        </div>

        {/* Call the new drawer component */}
        <MovementDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)} 
          onSuccess={handleMovementCreated} 
        />
      </main>
    </div>
  );
}