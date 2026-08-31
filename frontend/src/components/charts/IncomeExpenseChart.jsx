import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/format';

export function ChartTooltip({ active, payload, label, currency, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg px-3.5 py-2.5">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.payload?.fill }} />
          <span className="text-slate-600 dark:text-slate-300 capitalize">{entry.name}:</span>
          <span className="font-semibold text-slate-900 dark:text-white ml-auto pl-3">
            {formatter ? formatter(entry.value) : formatCurrency(entry.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function IncomeExpenseChart({ data, currency, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'currentColor' }} className="text-slate-400 dark:text-slate-500" tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12, fill: 'currentColor' }} className="text-slate-400 dark:text-slate-500" tickLine={false} axisLine={false} width={52} tickFormatter={(v) => formatCurrency(v, currency)} />
        <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ stroke: '#6366f1', strokeDasharray: '4 4' }} />
        <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.5} fill="url(#gradIncome)" />
        <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gradExpense)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
