import clsx from 'clsx';

export function Card({ className = '', children, variant, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-200 bg-white shadow-card dark:border-white/[0.08] dark:bg-slate-900 dark:shadow-card-dark',
        variant === 'hover' && 'transition-shadow hover:shadow-popover dark:hover:shadow-popover-dark',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '', children }) {
  return (
    <div className={clsx('flex items-start justify-between gap-3 px-5 pt-5', className)}>
      {children || <>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </>}
    </div>
  );
}

export function CardContent({ className = '', children }) {
  return <div className={clsx('p-5', className)}>{children}</div>;
}

export function CardFooter({ className = '', children }) {
  return <div className={clsx('flex items-center border-t border-slate-100 px-5 py-4 dark:border-white/[0.06]', className)}>{children}</div>;
}

export function CardTitle({ className = '', children }) {
  return <h2 className={clsx('text-base font-semibold tracking-tight text-slate-900 dark:text-white', className)}>{children}</h2>;
}

export function CardDescription({ className = '', children }) {
  return <p className={clsx('mt-0.5 text-xs text-slate-500 dark:text-slate-400', className)}>{children}</p>;
}

export default Card;
