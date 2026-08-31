import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { ButtonLoader } from './Spinner';

export function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, disabled, icon: Icon, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-white/20',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    dangerGhost: 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <ButtonLoader />}
      {!loading && Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

const inputBase =
  'w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 hover:border-slate-300 dark:hover:border-white/20';

export function Input({ label, error, className = '', leading, ...props }) {
  return (
    <div>
      {label && <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>}
      <div className="relative">
        {leading && <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-slate-400 dark:text-slate-500">{leading}</span>}
        <input className={clsx(inputBase, leading && 'pl-8', error && 'border-rose-400 focus:ring-rose-400/40 focus:border-rose-500', className)} {...props} />
      </div>
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div>
      {label && <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>}
      <div className="relative">
        <select className={clsx(inputBase, 'appearance-none pr-9 cursor-pointer', error && 'border-rose-400', className)} {...props}>
          {children}
        </select>
        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div>
      {label && <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>}
      <textarea className={clsx(inputBase, 'min-h-[90px] resize-y', error && 'border-rose-400', className)} {...props} />
    </div>
  );
}

export function Field({ label, error, children, htmlFor, hint, required }) {
  return (
    <div>
      {label && <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}{required && <span className="ml-1 text-rose-500">*</span>}</label>}
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs font-medium text-rose-500">{error}</span>}
    </div>
  );
}

export function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={clsx('pr-10', className)} {...props} />
      <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Hide password' : 'Show password'} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[13px] font-medium text-slate-600 dark:text-slate-300">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative h-5.5 w-10 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 p-0.5',
          checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
        )}
      >
        <span
          className={clsx(
            'block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4.5' : 'translate-x-0'
          )}
        />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}

export function TypeToggle({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] p-1 border border-slate-200/60 dark:border-white/5">
      {['expense', 'income'].map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={clsx(
            'rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
            value === type
              ? type === 'income'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          )}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
