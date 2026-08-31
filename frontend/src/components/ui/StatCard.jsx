import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';

export default function StatCard({ label, value, sub, icon: Icon, tone = 'brand', trend, accent, delta, deltaLabel, hint, format = (v) => v }) {
  const tones = {
    brand: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    red: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  };

  const activeKey = accent || tone;
  const activeTone = tones[activeKey] || tones.brand;
  const display = typeof value === 'number' ? format(value) : value;

  return (
    <Card variant="hover" className="relative p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">{display}</p>
          {(sub || deltaLabel || hint) && (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              {(trend !== undefined || delta !== undefined) && ((trend ?? delta) > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <TrendingUp size={13} strokeWidth={2.5} />
                  {delta !== undefined ? `+${delta}%` : ''}
                </span>
              ) : (trend ?? delta) < 0 ? (
                <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-medium">
                  <TrendingDown size={13} strokeWidth={2.5} />
                  {delta !== undefined ? `${delta}%` : ''}
                </span>
              ) : null)}
              <span className="truncate">{deltaLabel || sub || hint}</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className={`shrink-0 p-2.5 rounded-lg ${activeTone}`}>
            <Icon size={18} strokeWidth={2.2} />
          </div>
        )}
      </div>
    </Card>
  );
}
