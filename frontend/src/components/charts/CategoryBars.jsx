import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../../lib/format';

const COLORS = ['#2563eb', '#3b82f6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'];

export default function CategoryBars({ data, height = 260 }) {
  return <div style={{ height }}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 12, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="3 3" /><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={86} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} /><Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} /><Bar dataKey="value" radius={[0, 6, 6, 0]}>{data.map((item, index) => <Cell key={item.name || index} fill={item.hex || COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div>;
}
