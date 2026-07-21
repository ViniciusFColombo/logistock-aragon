import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.role === 'admin');
      } catch (error) {
        console.error('Error decoding token in Sidebar', error);
      }
    }
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between min-h-screen shrink-0">
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-black text-emerald-400 tracking-wider">LogiStock</h1>
          <p className="text-xs text-slate-500 mt-0.5">Aragón Dashboard</p>
        </div>
        <nav className="space-y-2">
          {/* LINK: DASHBOARD */}
          <Link 
            to="/dashboard" 
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition ${
              location.pathname === '/dashboard' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            📊 {t('sidebar.dashboard')}
          </Link>
          
          {/* LINK: PRODUCTS */}
          <Link 
            to="#" 
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition text-sm"
          >
            📦 {t('sidebar.products')}
          </Link>
          
          {/* LINK: MOVEMENTS */}
          <Link 
            to="/movements" 
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition ${
              location.pathname === '/movements' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            🔄 {t('sidebar.movements')}
          </Link>
          
          {/* EXCLUSIVE LINK: ADMIN */}
          {isAdmin && (
            <Link 
              to="/admin/cadastro" 
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition border border-dashed border-slate-800 hover:border-slate-700 ${
                location.pathname === '/admin/cadastro' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              👤 {t('sidebar.register_user')}
            </Link>
          )}
        </nav>
      </div>

      <div className="border-t border-slate-900 pt-4 flex flex-col gap-4">
        {/* LANGUAGE SELECTOR */}
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

        {/* LOGOUT */}
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
  );
}