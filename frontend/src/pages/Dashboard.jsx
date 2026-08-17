import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { jwtDecode } from 'jwt-decode';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { inventoryService } from '../services/Api';
import Sidebar from '../components/Sidebar';

// Simple in-memory cache to avoid a blocking loading screen when re-navigating.
let cachedDashboardSummary = null;
let cachedStockRunway = null;

function Dashboard() {
  const { t, i18n } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');

  const [stats, setStats] = useState(() => {
    if (cachedDashboardSummary) {
      return {
        totalItems: cachedDashboardSummary.total_products,
        inputsMonth: cachedDashboardSummary.inputs_month || 0,
        outputsMonth: cachedDashboardSummary.outputs_month || 0,
        lowStock: cachedDashboardSummary.low_stock_count,
        inventoryValue: cachedDashboardSummary.total_inventory_value
          ? cachedDashboardSummary.total_inventory_value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : '0,00',
        estimatedRevenue: cachedDashboardSummary.estimated_revenue
          ? cachedDashboardSummary.estimated_revenue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : '0,00'
      };
    }
    return {
      totalItems: 0,
      inputsMonth: 0,
      outputsMonth: 0,
      lowStock: 0,
      inventoryValue: '0,00',
      estimatedRevenue: '0,00'
    };
  });

  const [stockRunway, setStockRunway] = useState(() => cachedStockRunway || []);
  
  // Only activate the full-screen spinner if we don't have anything cached
  const [loadingData, setLoadingData] = useState(!cachedDashboardSummary);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Decoding JWT Token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.role === 'admin');
      } catch (error) {
        console.error('Error decoding token', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (cachedDashboardSummary) {
          setIsRefreshing(true);
        } else {
          setLoadingData(true);
        }

        const [summary, runway] = await Promise.all([
          inventoryService.getDashboardSummary(),
          inventoryService.getStockRunway()
        ]);

        cachedDashboardSummary = summary;
        cachedStockRunway = runway;

        setStats({
          totalItems: summary.total_products,
          inputsMonth: summary.inputs_month || 0,
          outputsMonth: summary.outputs_month || 0,
          lowStock: summary.low_stock_count,
          inventoryValue: summary.total_inventory_value
            ? summary.total_inventory_value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0,00',
          estimatedRevenue: summary.estimated_revenue
            ? summary.estimated_revenue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0,00'
        });

        setStockRunway(runway);
        setErrorMessage('');
      } catch (err) {
        console.error("Error loading data from FastAPI/Neon:", err);
        setErrorMessage("Unable to connect to the inventory server.");
      } finally {
        setLoadingData(false);
        setIsRefreshing(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleAiQuery = async (queryText) => {
    if (!queryText.trim()) return;

    setLoadingAi(true);
    setAiResponse('');

    try {
      const data = await inventoryService.askAgent(queryText);

      if (data.status === 'success') {
        setAiResponse(data.agent_response);
      } else {
        setAiResponse('⚠️ Failed to process recommendation. Check backend logs.');
      }
    } catch (error) {
      console.error("Error communicating with AI Agent:", error);
      setAiResponse('❌ Error connecting to the AI Agent server.');
    } finally {
      setLoadingAi(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">{t('dashboard.loading_data', "Loading LogiStock Aragón data...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        {/* HEADER */}
        <header className="flex justify-between items-center mb-4 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight">{t('dashboard.title')}</h2>
              {isRefreshing && (
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  {t('dashboard.updating')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{t('dashboard.subtitle')}</p>
          </div>
          {errorMessage && (
            <div className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg animate-pulse">
              ⚠️ {errorMessage}
            </div>
          )}
        </header>

        {/* EXCLUSIVE FINANCIAL SECTION */}
        {isAdmin && (
          <section className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
            <div className="bg-linear-to-br from-emerald-600/20 to-emerald-950/10 border border-emerald-500/20 rounded-xl p-4 backdrop-blur-sm shadow-lg shadow-emerald-950/20">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/80">{t('dashboard.total_value')}</span>
              <h3 className="text-2xl font-black mt-1 text-emerald-300">€ {stats.inventoryValue}</h3>
              <p className="text-[11px] text-emerald-500/60 mt-0.5">{t('dashboard.total_value_desc')}</p>
            </div>
            <div className="bg-linear-to-br from-blue-600/20 to-blue-950/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm shadow-lg shadow-blue-950/20">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400/80">{t('dashboard.estimated_revenue')}</span>
              <h3 className="text-2xl font-black mt-1 text-blue-300">€ {stats.estimatedRevenue}</h3>
              <p className="text-[11px] text-blue-500/60 mt-0.5">{t('dashboard.estimated_revenue_desc')}</p>
            </div>
          </section>
        )}

        {/* OPERATION CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block">{t('dashboard.total_items')}</span>
            <span className="text-xl font-bold mt-1 block">{stats.totalItems}</span>
          </div>
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block">{t('dashboard.inputs')}</span>
            <span className="text-xl font-bold mt-1 block text-emerald-400">+{stats.inputsMonth}</span>
          </div>
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block">{t('dashboard.outputs')}</span>
            <span className="text-xl font-bold mt-1 block text-amber-400">-{stats.outputsMonth}</span>
          </div>
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block">{t('dashboard.low_stock')}</span>
            <span className="text-xl font-bold mt-1 block text-red-400">{stats.lowStock}</span>
          </div>
        </section>

        {/* HISTORY VS. AI AGENT */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          
          {/* LEFT COLUMN: Stock Runway */}
          <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-3 shrink-0">
              <h3 className="text-base font-bold">{t('dashboard.runway_title')}</h3>
              <span className="text-[10px] text-slate-500 font-mono">Pandas Engine</span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {stockRunway.length === 0 ? (
                <p className="text-xs text-slate-500 text-center italic mt-4">
                  {i18n.language?.startsWith('es') ? 'No hay datos predictivos disponibles en este momento.' : 'No predictive data available at the moment.'}
                </p>
              ) : (
                stockRunway.slice(0, 6).map((item) => (
                  <div key={item.product_id} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800/50 text-xs hover:border-slate-700/60 transition">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-slate-200">{item.product_name}</span>
                      <span className="text-[11px] text-slate-500">
                        {t('dashboard.tableSalesAvg', 'Vendas/Dia')}: {item.avg_sales_per_day} u
                      </span>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'OK' ? 'bg-emerald-500/10 text-emerald-400' : 
                        item.status === 'CRITICAL' ? 'bg-amber-500/10 text-amber-400 animate-pulse' : 
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {item.status === 'OK' && t('dashboard.status_healthy')}
                        {item.status === 'CRITICAL' && t('dashboard.status_critical')}
                        {item.status === 'NO_SALES_DATA' && t('dashboard.status_no_sales')}
                      </span>
                      
                      <span className="text-[11px] text-slate-400 block font-medium">
                        {item.status === 'NO_SALES_DATA' || item.estimated_days_left === null
                          ? t('dashboard.runway_no_data')
                          : `${item.estimated_days_left} ${t('dashboard.days_left')}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: AI Agent */}
          <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between min-h-0">
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-1 shrink-0">
                <h3 className="text-base font-bold">{t('dashboard.ai_agent_title')}</h3>
                <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Smart Assistant</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 shrink-0">{t('dashboard.ai_agent_subtitle')}</p>
              
              {/* AI RESPONSE TEXT BOX */}
              <div className="flex-1 min-h-0 rounded-lg bg-slate-950 p-3 text-xs text-slate-300 border border-slate-800 overflow-y-auto leading-relaxed
                prose prose-invert max-w-none 
                [&_table]:w-full [&_table]:my-2 [&_table]:border-collapse
                [&_th]:border [&_th]:border-slate-800 [&_th]:p-1.5 [&_th]:bg-slate-900 [&_th]:text-purple-400 [&_th]:text-left
                [&_td]:border [&_td]:border-slate-800 [&_td]:p-1.5 [&_td]:text-[11px]">
                {loadingAi ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-4">
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-500 text-xs animate-pulse">Running Scikit-Learn predictions & compiling prompt...</span>
                  </div>
                ) : aiResponse ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResponse}</ReactMarkdown>
                ) : (
                  <span className="text-slate-600 text-xs text-center italic block my-auto">{t('dashboard.agent', "Click a quick action below or type a query to prompt the agent.")}</span>
                )}
              </div>
            </div>

            {/* INTERACTIONS: BUTTONS AND INPUTS */}
            <div className="mt-3 space-y-2 shrink-0">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAiQuery(t('dashboard.ai_query_sales'))}
                  className="flex-1 cursor-pointer text-xs font-semibold bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 py-2 px-3 rounded-lg transition"
                  disabled={loadingAi}
                >
                  📊 {t('dashboard.ai_btn_sales')}
                </button>
                <button 
                  onClick={() => handleAiQuery(t('dashboard.ai_query_buy'))}
                  className="flex-1 cursor-pointer text-xs font-semibold bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 py-2 px-3 rounded-lg transition"
                  disabled={loadingAi}
                >
                  🛒 {t('dashboard.ai_btn_buy')}
                </button>
              </div>
              
              {/* MANUAL TEXT FORM */}
              <form onSubmit={(e) => { e.preventDefault(); handleAiQuery(userPrompt); setUserPrompt(''); }} className="flex gap-2">
                <input 
                  type="text" 
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder={t('dashboard.ai_prompt_placeholder')} 
                  className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:border-purple-500 focus:outline-hidden"
                  disabled={loadingAi}
                />
                <button 
                  type="submit"
                  disabled={loadingAi || !userPrompt.trim()}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                    loadingAi || !userPrompt.trim() 
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                      : 'bg-purple-500 hover:bg-purple-600 text-slate-950 font-bold cursor-pointer'
                  }`}
                >
                  {t('dashboard.btn_send')}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;