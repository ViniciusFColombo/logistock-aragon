import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  
  const [loading, setLoading] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setLoading(true);

    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await api.post('/auth/signin', formData);
      const token = response.data.access_token;
      
      localStorage.setItem('token', token);
      
      const decoded = jwtDecode(token);

      if (decoded.requires_password_change) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
      
    } catch (err) {
      const mensagemOriginal = err.response?.data?.detail;

      if (mensagemOriginal === 'Incorrect email or password') {
        setError(t('login.errorCredentials'));
      } else {
        setError(t('login.errorServer'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800/50 p-8 border border-slate-700/50 backdrop-blur-sm">
        
        {/* Top Text Block */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400">{t('login.title')}</h1>
          <p className="mt-2 text-slate-400 text-sm">{t('login.subtitle')}</p>
        </div>
        
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Form integrated with the handleSubmit function*/}
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Email Field Container */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">
              {t('login.emailLabel')}
            </label>
            <input 
              type="email" 
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden transition text-sm"
              required
            />
          </div>

          {/* Password Field Container */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">
              {t('login.passwordLabel')}
            </label>
            <input 
              type="password" 
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden transition text-sm"
              required
            />
          </div>

          {/* Submit button with loading visual treatment */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-lg bg-emerald-500 py-3 font-semibold text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 transition shadow-lg shadow-emerald-500/10 mt-2 disabled:opacity-50"
          >
            {loading ? 'Connecting...' : t('login.submitButton')}
          </button>
        </form>

      </div>

      {/* Language buttons */}
      <div className="mt-6 flex gap-4">
        <button onClick={() => changeLanguage('en')} className="cursor-pointer rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 border border-slate-700 hover:bg-slate-700 transition">🇬🇧 English</button>
        <button onClick={() => changeLanguage('es')} className="cursor-pointer rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 border border-slate-700 hover:bg-slate-700 transition">🇪🇸 Español</button>
      </div>
    </div>
  );
}

export default Login;