import { useEffect, useState } from "react";
import { TrendingUp, Wallet, ArrowDownLeft, ArrowUpRight, Store, PieChart, BarChart3 } from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import { Card } from "../components/ui/Card.jsx";
import CashflowChart from "../components/charts/CashflowChart.jsx";
import SpendingDonut from "../components/charts/SpendingDonut.jsx";
import CategoryBars from "../components/charts/CategoryBars.jsx";
import Badge from "../components/ui/Badge.jsx";
import { apiClient } from "../lib/api.js";
import { formatCurrency, formatNumber, cn } from "../lib/format.js";

const RANGES = [
  { key: "3m", label: "3 months" },
  { key: "6m", label: "6 months" },
  { key: "12m", label: "1 year" },
];

export default function Analytics() {
  const [range, setRange] = useState("6m");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.analytics.get(range).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [range]);

  const cashflow = data?.cashflow || [];
  const visible = range === "3m" ? cashflow.slice(-3) : range === "6m" ? cashflow.slice(-6) : cashflow;

  const totals = visible.reduce(
    (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense }),
    { income: 0, expense: 0 }
  );
  const net = totals.income - totals.expense;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Income, spending patterns, and category distribution over time."
        actions={
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-white/10 dark:bg-slate-900" role="tablist" aria-label="Time range">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={range === r.key}
                onClick={() => setRange(r.key)}
                className={cn(
                  "rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  range === r.key
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {loading || !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total income" value={formatCurrency(totals.income)} icon={ArrowDownLeft} accent="emerald" hint="Across selected period" />
            <StatCard label="Total spending" value={formatCurrency(totals.expense)} icon={ArrowUpRight} accent="rose" hint="Across selected period" />
            <StatCard label="Net position" value={formatCurrency(net)} icon={Wallet} accent="brand" hint="Income minus spending" />
            <StatCard label="Avg. monthly spend" value={formatCurrency(totals.expense / Math.max(visible.length, 1))} icon={TrendingUp} accent="sky" hint={`Over ${visible.length} months`} />
          </div>

          {/* Cashflow Chart */}
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Cash flow</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Monthly income vs. spending</p>
              </div>
              <Badge tone="brand" dot>Period: {range.toUpperCase()}</Badge>
            </div>
            <div className="p-5">
              <CashflowChart data={visible} height={300} />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Category mix */}
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Spending mix</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Category share</p>
                </div>
                <PieChart size={18} className="text-blue-500" />
              </div>
              <div className="p-5">
                <SpendingDonut data={data.categoryBars} height={230} centerLabel="Total" centerValue={formatCurrency(data.categoryBars.reduce((s, c) => s + c.value, 0))} />
              </div>
            </Card>

            {/* Category bars */}
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Spend by category</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Top outflows</p>
                </div>
                <BarChart3 size={18} className="text-sky-500" />
              </div>
              <div className="p-5">
                <CategoryBars data={data.categoryBars.slice(0, 7)} height={260} />
              </div>
            </Card>
          </div>

          {/* Top merchants */}
          <Card>
            <div className="border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Top merchants</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Where spending goes most often</p>
            </div>
            <ul className="divide-y divide-slate-100 px-5 dark:divide-white/[0.04]">
              {data.topMerchants.map((m, i) => (
                <li key={m.name} className="flex items-center gap-4 py-3.5">
                  <span className="w-6 text-center text-xs font-semibold text-blue-500 dark:text-blue-400 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <Store size={16} strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{m.name}</p>
                      <p className="text-sm font-semibold text-slate-900 tabular-nums dark:text-white">{formatCurrency(m.spend)}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-4">
                      <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${(m.spend / data.topMerchants[0].spend) * 100}%` }}
                        />
                      </div>
                      <Badge tone="brand">{formatNumber(m.count)} visits</Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
