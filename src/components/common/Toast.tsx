import React from 'react';
import { useApp } from '../../context/useApp';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastStack: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderColor = 'border-slate-200 bg-white text-slate-900 shadow-lg';
        let icon = <Info className="w-5 h-5 text-orange-600 shrink-0" />;

        if (toast.type === 'success') {
          borderColor = 'border-slate-200 bg-white text-slate-900 shadow-lg';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
        } else if (toast.type === 'error') {
          borderColor = 'border-slate-200 bg-white text-slate-900 shadow-lg';
          icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-lg transition-all duration-200 shadow-md ${borderColor}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900">{toast.title}</h4>
              <p className="text-xs text-slate-600 mt-0.5 break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};


