import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: { icon: CheckCircle2, classes: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400' },
  error: { icon: XCircle, classes: 'border-rose-500/40 text-rose-600 dark:text-rose-400' },
  warning: { icon: AlertTriangle, classes: 'border-amber-500/40 text-amber-600 dark:text-amber-400' },
  info: { icon: Info, classes: 'border-sky-500/40 text-sky-600 dark:text-sky-400' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const value = useMemo(() => ({
    toast: show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    warning: (m) => show(m, 'warning'),
    info: (m) => show(m, 'info'),
  }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
        {toasts.map((t) => {
          const style = TOAST_STYLES[t.type] || TOAST_STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              className="animate-toast-in flex items-start gap-3 rounded-xl border bg-white dark:bg-slate-900 p-3.5 shadow-lg shadow-slate-900/10 dark:shadow-black/40"
            >
              <Icon size={18} className={`shrink-0 mt-0.5 ${style.classes}`} />
              <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  return ctx || { toast: () => {}, success: () => {}, error: () => {}, warning: () => {}, info: () => {} };
};
