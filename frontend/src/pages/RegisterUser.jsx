import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function RegisterUser() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator'); 
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload = {
      name: name,
      email: email,
      role: role,
      password: password
    };

    try {
      await api.post('/auth/signup', payload);
      
      setSuccess(t('register.success_message'));
      
      setName('');
      setEmail('');
      setPassword('');
      setRole('operator');
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      
      if (errorDetail === 'Email already registered') {
        setError(t('register.error_email_exists'));
      } else {
        setError(t('register.error_server'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800/50 p-8 border border-slate-700/50 backdrop-blur-sm flex flex-col gap-6">
        
        {/* Screen header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-emerald-400">{t('register.title')}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('register.subtitle')}</p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center animate-fade-in">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400 text-center animate-fade-in">
            {success}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          
          {/* Field: Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">{t('register.label_name')}</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden transition text-sm"
              placeholder={t('register.placeholder_name')}
              required
            />
          </div>

          {/* Field: Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">{t('register.label_email')}</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden transition text-sm"
              placeholder="example@logistock.com"
              required
            />
          </div>

          {/* Field: Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">{t('register.label_password')}</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden transition text-sm"
              placeholder={t('register.placeholder_password')}
              required
            />
          </div>

          {/* Field: Role */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">{t('register.label_role')}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-hidden transition text-sm cursor-pointer"
            >
              <option value="operator">{t('register.role_operator')}</option>
              <option value="admin">{t('register.role_admin')}</option>
            </select>
          </div>

          {/* Sign Up Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-lg bg-emerald-500 py-2.5 font-semibold text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 transition shadow-lg disabled:opacity-50 text-sm mt-2"
          >
            {loading ? t('register.btn_registering') : t('register.btn_register')}
          </button>
        </form>

        {/* Back button */}
        <button 
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-full cursor-pointer rounded-lg bg-slate-800 py-2.5 font-semibold text-slate-300 border border-slate-700 hover:bg-slate-700 active:bg-slate-900 transition text-sm"
        >
          {t('register.btn_cancel')}
        </button>

      </div>
    </div>
  );
}

export default RegisterUser;