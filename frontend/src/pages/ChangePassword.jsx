import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function ChangePassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError(t('change_password.error_match'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('change_password.error_length'));
      return;
    }

    setLoading(true);

    const payload = {
      current_password: currentPassword,
      new_password: newPassword
    };

    try {
      await api.post('/auth/change-password', payload);
      
      setSuccess(t('change_password.success_message'));
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        localStorage.removeItem('token');
        navigate('/');
      }, 2500);

    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      if (errorDetail) {
        setError(errorDetail); 
      } else {
        setError(t('change_password.error_server'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800/50 p-8 border border-slate-700/50 backdrop-blur-sm flex flex-col gap-6">
        
        {/* Cabeçalho da Tela */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-emerald-400">{t('change_password.title')}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {t('change_password.subtitle')}
          </p>
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
          
          {/* Field: Current Password*/}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">{t('change_password.label_current')}</label>
            <input 
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden transition text-sm"
              placeholder={t('change_password.placeholder_current')}
              required
            />
          </div>

          {/* Field: New Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">{t('change_password.label_new')}</label>
            <input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden transition text-sm"
              placeholder={t('change_password.placeholder_new')}
              required
            />
          </div>

          {/* Field: Confirm New Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">{t('change_password.label_confirm')}</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden transition text-sm"
              placeholder={t('change_password.placeholder_confirm')}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-lg bg-emerald-500 py-2.5 font-semibold text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 transition shadow-lg disabled:opacity-50 text-sm mt-2"
          >
            {loading ? t('change_password.btn_updating') : t('change_password.btn_update')}
          </button>
        </form>

      </div>
    </div>
  );
}

export default ChangePassword;