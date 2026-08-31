import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../lib/format';

const COLORS = ['#2563eb', '#3b82f6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'];

export default function SpendingDonut({ data, height = 220, centerLabel = 'Spent', centerValue }) {
  const chartData = data.map((item, index) => ({ ...item, name: item.name || item.label || item.key, value: Number(item.value) || 0, color: item.hex || COLORS[index % COLORS.length] }));
  return <div className="relative" style={{ height }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="86%" paddingAngle={3} stroke="none">{chartData.map((item, index) => <Cell key={item.name || index} fill={item.color} />)}</Pie><Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-[11px] text-slate-400 dark:text-slate-500">{centerLabel}</span><span className="text-sm font-semibold text-slate-800 dark:text-white">{centerValue}</span></div></div>;
}
