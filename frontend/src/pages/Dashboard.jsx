import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { jwtDecode } from 'jwt-decode';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { inventoryService } from '../services/Api'; 

function Dashboard() {
  const { t, i18n } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [userPrompt, setUserPrompt] = useState(''); // Saves the text typed into the AI ​​box.

  // Control states for real data from the Neon database
  const [stats, setStats] = useState({
    totalItems: 0,
    inputsMonth: 0, 
    outputsMonth: 0,
    lowStock: 0,
    inventoryValue: '0.00',
    estimatedRevenue: '0.00'
  });
  const [stockRunway, setStockRunway] = useState([]); // Stores the data calculated by the Pandas Engine.
  const [loadingData, setLoadingData] = useState(true); // Skeleton/panel loading control
  const [errorMessage, setErrorMessage] = useState(''); // Feedback if the local API changes or goes down

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // JWT Token decoding for controlling the display of administrative routes
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
        setLoadingData(true);

        // Executes queries concurrently using the centralized structure.
        const [summary, runway] = await Promise.all([
          inventoryService.getDashboardSummary(),
          inventoryService.getStockRunway()
        ]);
        
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
      } catch (err) {
        console.error("Error loading data from FastAPI/Neon:", err);
        setErrorMessage("Unable to connect to the inventory server.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleAiQuery = async (queryText) => {
    if (!queryText.trim()) return;

    setLoadingAi(true);
    setAiResponse('');
    
    try {
      // Makes the actual call to FastAPI, passing the question string.
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
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading LogiStock Aragón data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-black text-emerald-400 tracking-wider">LogiStock</h1>
            <p className="text-xs text-slate-500 mt-0.5">Aragón Dashboard</p>
          </div>
          <nav className="space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-medium text-sm">
              📊 {t('sidebar.dashboard')}
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition text-sm">
              📦 {t('sidebar.products')}
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition text-sm">
              🔄 {t('sidebar.movements')}
            </a>
            {isAdmin && (
              <a href="/admin/cadastro" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition text-sm border border-dashed border-slate-800 hover:border-slate-700">
                👤 {t('sidebar.register_user')}
              </a>
            )}
          </nav>
        </div>

        <div className="border-t border-slate-900 pt-4 flex flex-col gap-4">
          <div className="flex gap-2 justify-center bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => changeLanguage('en')} 
              className={`flex-1 text-[10px] py-1 rounded-md font-bold transition cursor-pointer ${i18n.language?.startsWith('en') ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
            >
              EN
            </button>
            <button 
              onClick={() => changeLanguage('es')} 
              className={`flex-1 text-[10px] py-1 rounded-md font-bold transition cursor-pointer ${i18n.language?.startsWith('es') ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
            >
              ES
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-600">
              {t('sidebar.logged_in_as')} <span className="text-slate-400 font-medium">{isAdmin ? 'Administrator' : 'Operator'}</span>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/';
              }}
              className="w-full cursor-pointer text-left text-xs font-semibold text-red-400 hover:text-red-300 transition py-1 flex items-center gap-2"
            >
              🚪 {t('sidebar.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{t('dashboard.subtitle')}</p>
          </div>
          {errorMessage && (
            <div className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg animate-pulse">
              ⚠️ {errorMessage}
            </div>
          )}
        </header>

        {/* EXCLUSIVE FINANCIAL SECTION */}
        {isAdmin && (
          <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <div className="bg-linear-to-br from-emerald-600/20 to-emerald-950/10 border border-emerald-500/20 rounded-xl p-6 backdrop-blur-sm shadow-lg shadow-emerald-950/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80">{t('dashboard.total_value')}</span>
              <h3 className="text-3xl font-black mt-2 text-emerald-300">€ {stats.inventoryValue}</h3>
              <p className="text-xs text-emerald-500/60 mt-1">{t('dashboard.total_value_desc')}</p>
            </div>
            <div className="bg-linear-to-br from-blue-600/20 to-blue-950/10 border border-blue-500/20 rounded-xl p-6 backdrop-blur-sm shadow-lg shadow-blue-950/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400/80">{t('dashboard.estimated_revenue')}</span>
              <h3 className="text-3xl font-black mt-2 text-blue-300">€ {stats.estimatedRevenue}</h3>
              <p className="text-xs text-blue-500/60 mt-1">{t('dashboard.estimated_revenue_desc')}</p>
            </div>
          </section>
        )}

        {/* OPERATION CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-medium text-slate-400 block">{t('dashboard.total_items')}</span>
            <span className="text-2xl font-bold mt-1 block">{stats.totalItems}</span>
          </div>
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-medium text-slate-400 block">{t('dashboard.inputs')}</span>
            <span className="text-2xl font-bold mt-1 block text-emerald-400">+{stats.inputsMonth}</span>
          </div>
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-medium text-slate-400 block">{t('dashboard.outputs')}</span>
            <span className="text-2xl font-bold mt-1 block text-amber-400">-{stats.outputsMonth}</span>
          </div>
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-medium text-slate-400 block">{t('dashboard.low_stock')}</span>
            <span className="text-2xl font-bold mt-1 block text-red-400">{stats.lowStock}</span>
          </div>
        </section>

        {/* HISTORY VS. AI AGENT */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
         {/* LEFT COLUMN: Stock Runway */}
          <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{t('dashboard.runway_title')}</h3>
              <span className="text-[10px] text-slate-500 font-mono">Pandas Engine</span>
            </div>
            <div className="space-y-3 max-h-90 overflow-y-auto pr-1">
              {stockRunway.length === 0 ? (
                <p className="text-xs text-slate-500 text-center italic mt-4">
                  {i18n.language?.startsWith('es') ? 'No hay datos predictivos disponibles en este momento.' : 'No predictive data available at the moment.'}
                </p>
              ) : (
                stockRunway.slice(0, 6).map((item) => (
                  <div key={item.product_id} className="flex justify-between items-center p-3 rounded-lg bg-slate-900 border border-slate-800/50 text-sm hover:border-slate-700/60 transition">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-slate-200">{item.product_name}</span>
                      <span className="text-xs text-slate-500">
                        {t('dashboard.tableSalesAvg', 'Vendas/Dia')}: {item.avg_sales_per_day} u
                      </span>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      {/* Dynamic and Translated Status Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'OK' ? 'bg-emerald-500/10 text-emerald-400' : 
                        item.status === 'CRITICAL' ? 'bg-amber-500/10 text-amber-400 animate-pulse' : 
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {item.status === 'OK' && t('dashboard.status_healthy')}
                        {item.status === 'CRITICAL' && t('dashboard.status_critical')}
                        {item.status === 'NO_SALES_DATA' && t('dashboard.status_no_sales')}
                      </span>
                      
                      {/* Dynamic and Translated Runway Text */}
                      <span className="text-xs text-slate-400 block font-medium">
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
          <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">{t('dashboard.ai_agent_title')}</h3>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Smart Assistant</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">{t('dashboard.ai_agent_subtitle')}</p>
              
              {/* AI RESPONSE TEXT BOX */}
              <div className="min-h-48 rounded-lg bg-slate-950 p-4 text-sm text-slate-300 border border-slate-800 overflow-y-auto max-h-64 font-sans leading-relaxed
                prose prose-invert max-w-none 
                [&_table]:w-full [&_table]:my-4 [&_table]:border-collapse
                [&_th]:border [&_th]:border-slate-800 [&_th]:p-2 [&_th]:bg-slate-900 [&_th]:text-purple-400 [&_th]:text-left
                [&_td]:border [&_td]:border-slate-800 [&_td]:p-2 [&_td]:text-xs">
                {loadingAi ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-4">
                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-500 text-xs animate-pulse">Running Scikit-Learn predictions & compiling prompt...</span>
                  </div>
                ) : aiResponse ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResponse}</ReactMarkdown>
                ) : (
                  <span className="text-slate-600 text-xs text-center italic block mt-8">Click a quick action below or type a query to prompt the agent.</span>
                )}
              </div>
            </div>

            {/* INTERACTIONS: BUTTONS AND INPUTS */}
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAiQuery(t('dashboard.ai_query_sales'))}
                  className="flex-1 cursor-pointer text-xs font-semibold bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 p-2.5 rounded-lg transition"
                  disabled={loadingAi}
                >
                  📊 {t('dashboard.ai_btn_sales')}
                </button>
                <button 
                  onClick={() => handleAiQuery(t('dashboard.ai_query_buy'))}
                  className="flex-1 cursor-pointer text-xs font-semibold bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 p-2.5 rounded-lg transition"
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
                  className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:border-purple-500 focus:outline-hidden"
                  disabled={loadingAi}
                />
                <button 
                  type="submit"
                  disabled={loadingAi || !userPrompt.trim()}
                  className={`text-xs font-bold px-4 py-2 rounded-lg transition ${
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