import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { ChartTooltip } from './IncomeExpenseChart';
import { PALETTE } from './CategoryPieChart';

export default function CategoryBarChart({ data, currency, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: 'currentColor' }} className="text-slate-400 dark:text-slate-500" tickLine={false} axisLine={false} tickFormatter={(v) => formatShort(v, currency)} />
        <YAxis type="category" dataKey="category" width={92} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-slate-400 dark:text-slate-500" tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Bar dataKey="amount" name="Spent" radius={[0, 8, 8, 0]} barSize={18}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function formatShort(v, currency) {
  const abs = Math.abs(v);
  const sym = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  if (abs >= 1000) return `${sym}${(abs / 1000).toFixed(1)}k`;
  return `${sym}${abs}`;
}
