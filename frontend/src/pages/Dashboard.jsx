import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { jwtDecode } from 'jwt-decode';

function Dashboard() {
  const { t, i18n } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Data simulation
  const stats = {
    totalItems: 1420,
    inputsMonth: 340,
    outputsMonth: 185,
    lowStock: 4,
    inventoryValue: '12,450.00',
    estimatedRevenue: '4,120.00'
  };

  const recentMovements = [
    { id: 1, product: 'Product A', qty: 10, type: 'IN', user: 'Admin' },
    { id: 2, product: 'Product B', qty: 2, type: 'OUT', user: 'Operator_1' },
    { id: 3, product: 'Product C', qty: 15, type: 'IN', user: 'Admin' },
  ];

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

  const handleAiQuery = (queryType) => {
    setLoadingAi(true);
    setAiResponse('');
    
    setTimeout(() => {
      if (queryType === 'sales') {
        setAiResponse('🤖 AI Agent: In the last 30 days, your top selling item was Product B with 85 units moved out. Total estimated revenue is €1,240.00.');
      } else if (queryType === 'buy') {
        setAiResponse('🤖 AI Agent: You have 4 items below critical level. I recommend restocking Product D (1 unit left) and Product E (2 units left) immediately.');
      }
      setLoadingAi(false);
    }, 800);
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      
      {/* SIDEBAR ESQUERDA */}
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
          
          {/* LEFT COLUMN: Recent Movements */}
          <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">{t('dashboard.recent_movements')}</h3>
            <div className="space-y-3">
              {recentMovements.map((move) => (
                <div key={move.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-900 border border-slate-800/50 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${move.type === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {move.type}
                    </span>
                    <span className="font-medium text-slate-200">{move.product}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-300 block font-medium">{move.type === 'IN' ? '+' : '-'}{move.qty} units</span>
                    <span className="text-xs text-slate-500 block">by {move.user}</span>
                  </div>
                </div>
              ))}
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
              
              <div className="min-h-25 rounded-lg bg-slate-950 p-4 text-sm text-slate-300 border border-slate-800 flex items-center justify-center">
                {loadingAi ? (
                  <span className="text-slate-500 animate-pulse text-xs">Analyzing database logs...</span>
                ) : (
                  aiResponse || <span className="text-slate-600 text-xs text-center italic">Click a quick action below or type a query to prompt the agent.</span>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAiQuery('sales')}
                  className="flex-1 cursor-pointer text-xs font-semibold bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 p-2.5 rounded-lg transition"
                >
                  📊 What sold in the last 30 days?
                </button>
                <button 
                  onClick={() => handleAiQuery('buy')}
                  className="flex-1 cursor-pointer text-xs font-semibold bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 p-2.5 rounded-lg transition"
                >
                  🛒 What do I need to buy?
                </button>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder={t('dashboard.ai_prompt_placeholder')} 
                  className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-hidden"
                  disabled
                />
                <button className="bg-emerald-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg opacity-50 cursor-not-allowed">
                  {t('dashboard.btn_send')}
                </button>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}

export default Dashboard;