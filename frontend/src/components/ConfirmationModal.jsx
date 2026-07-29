import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  type = 'confirm', // 'confirm' | 'success' | 'delete'
  title,
  subtitle,
  details = [], // Array de { label, value, highlight }
  onConfirm,
  onCancel,
  confirmText = 'Confirmar y Guardar',
  cancelText = 'Volver',
  loading = false,
}) {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const isDelete = type === 'delete';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-start gap-3.5">
          {isSuccess && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
          )}
          {isDelete && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
          )}
          {!isSuccess && !isDelete && (
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{subtitle}</p>}
          </div>
        </div>

        {/* Details Card */}
        {details.length > 0 && (
          <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-4 space-y-2.5 text-sm font-mono">
            {details.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{item.label}:</span>
                <span className={`font-semibold ${item.highlight || 'text-slate-200'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-800/60">
          {!isSuccess && (
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-5 py-2 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-lg cursor-pointer flex items-center justify-center min-w-25 ${
              isSuccess
                ? 'w-full bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                : isDelete
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'
            }`}
          >
            {loading ? '...' : confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}