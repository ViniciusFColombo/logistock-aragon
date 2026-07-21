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
    setIsDrawerOpen(false);
    fetchMovements(1);
    setCurrentPage(1);
    fetchAnalyticsData();
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto relative">
        {/* HEADBOARD */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{t('movements.title')}</h1>
            <p className="text-sm text-slate-400">{t('movements.subtitle')}</p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all duration-200"
          >
            + {t('movements.new_btn')}
          </button>
        </div>

        {/* ANALYTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:col-span-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{t('movements.pandas_title')}</h3>
            </div>
            {criticalItems.length === 0 ? (
              <p className="text-sm text-slate-500 italic mt-2">{t('movements.no_alerts')}</p>
            ) : (
              <div className="space-y-2 max-h-24 overflow-y-auto pr-2">
                {criticalItems.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-lg">
                    <span>⚠️</span>
                    <span>{t('movements.alert_critical', { name: item.product_name, days: item.estimated_days_left })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('movements.flow_summary')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{t('movements.total_in')} (IN):</span>
                <span className="font-bold text-emerald-400">+{totals.inputs}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{t('movements.total_out')} (OUT):</span>
                <span className="font-bold text-red-400 text-right">-{totals.outputs}</span>
              </div>
            </div>
          </div>
        </div>

        {/* HISTORY TABLE */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 text-slate-300 uppercase text-xs tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">{t('movements.col_date')}</th>
                  <th className="py-4 px-6">{t('movements.col_product')}</th>
                  <th className="py-4 px-6">{t('movements.col_type')}</th>
                  <th className="py-4 px-6 text-right">{t('movements.col_qty')}</th>
                  <th className="py-4 px-6">{t('movements.col_user')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr><td colSpan="5" className="py-10 text-center text-slate-500 italic">{t('movements.loading')}</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan="5" className="py-10 text-center text-slate-500 italic">{t('movements.no_data')}</td></tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/20 transition-all">
                      <td className="py-4 px-6 text-slate-400">{m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</td>
                      <td className="py-4 px-6 font-medium text-slate-200">
                        <div>
                          <p className="font-semibold text-slate-100">{m.product?.name || `Producto #${m.product_id}`}</p>
                          <p className="text-xs text-slate-500 font-mono">{m.product?.sku || '—'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                          m.movement_type === 'in' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {m.movement_type === 'in' ? t('movements.type_in') : t('movements.type_out')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-200 font-bold">{m.quantity}</td>
                      <td className="py-4 px-6 text-slate-400">User ID: {m.user_id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-800 bg-slate-900/20">
            <span className="text-xs text-slate-500">{t('movements.page')} {currentPage}</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold rounded text-slate-300">
                {t('movements.btn_prev')}
              </button>
              <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={movements.length < limit || loading} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold rounded text-slate-300">
                {t('movements.btn_next')}
              </button>
            </div>
          </div>
        </div>

        {/* Call the new drawer component. */}
        <MovementDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)} 
          onSuccess={handleMovementCreated} 
        />

      </main>
    </div>
  );
}