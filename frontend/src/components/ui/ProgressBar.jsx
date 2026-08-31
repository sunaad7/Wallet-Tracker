import clsx from 'clsx';

export default function ProgressBar({ value, max = 100, color = '#3b82f6', trackClass = '', className = '', size = 'md' }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div className={clsx(size === 'sm' ? 'h-1.5' : 'h-2', 'overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]', trackClass, className)}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
