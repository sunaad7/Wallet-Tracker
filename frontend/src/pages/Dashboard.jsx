import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, PiggyBank, Plus, ArrowRight,
  Download, Sparkles, ChevronRight
} from "lucide-react";
import { apiClient } from "../lib/api.js";
import { getCategory } from "../lib/mock.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { exportTransactionsToCsv } from "../lib/exportCsv.js";
import { formatCurrency, formatCurrencyWhole, formatRelativeDay, formatMonthYear } from "../lib/format.js";
import StatCard from "../components/ui/StatCard.jsx";
import { Button } from "../components/ui/Form.jsx";
import { Card } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import LineHoverLink from "../components/ui/LineHoverLink.jsx";
import CashflowChart from "../components/charts/CashflowChart.jsx";
import SpendingDonut from "../components/charts/SpendingDonut.jsx";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    apiClient.dashboard.get().then((d) => {
      if (mounted) setData(d);
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      const txns = await apiClient.transactions.list();
      const success = exportTransactionsToCsv(txns, `wallet_tracker_transactions_${new Date().toISOString().split("T")[0]}.csv`);
      if (success) {
        toast.success?.("Transactions exported successfully!");
      } else {
        toast.error?.("No transactions found to export.");
      }
    } catch {
      toast.error?.("Failed to export transactions");
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const { stats, cashflow, categorySplit, recent, budgetSummary, goalsPreview } = data;
  const displayName = user?.name || "User";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {formatMonthYear(new Date())} · {new Date().toLocaleDateString("en-US", { weekday: "long" })}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Here's your financial picture at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="md"
            icon={Download}
            onClick={handleExport}
            loading={exporting}
          >
            <span>Export CSV</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate("/transactions")}
          >
            Add transaction
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total balance"
          value={stats.balance}
          format={formatCurrency}
          icon={Wallet}
          accent="brand"
          delta={stats.deltas.balance}
          deltaLabel="vs. last month"
        />
        <StatCard
          label="Income this month"
          value={stats.income}
          format={formatCurrency}
          icon={ArrowDownLeft}
          accent="emerald"
          delta={stats.deltas.income}
          deltaLabel="vs. last month"
        />
        <StatCard
          label="Spending this month"
          value={stats.expense}
          format={formatCurrency}
          icon={ArrowUpRight}
          accent="rose"
          delta={stats.deltas.expense}
          deltaLabel="vs. last month"
        />
        <StatCard
          label="Savings rate"
          value={stats.savingsRate * 100}
          format={(v) => `${v.toFixed(1)}%`}
          icon={PiggyBank}
          accent="sky"
          delta={stats.deltas.savingsRate}
          deltaLabel="vs. target (25%)"
        />
      </div>

      {/* Cashflow + Donut */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Cash flow</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Income vs. spending over 6 months</p>
            </div>
            <LineHoverLink to="/analytics" className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Full analytics <ChevronRight size={14} />
            </LineHoverLink>
          </div>
          <div className="p-5">
            <CashflowChart data={cashflow} height={264} />
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Spending mix</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Top categories breakdown</p>
          </div>
          <div className="p-5">
            <SpendingDonut data={categorySplit} height={190} centerValue={formatCurrencyWhole(stats.expense)} />
            <ul className="mt-4 space-y-2.5">
              {categorySplit.slice(0, 4).map((c) => (
                <li key={c.key} className="flex items-center gap-2.5 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.hex }} />
                  <span className="truncate font-medium text-slate-700 dark:text-slate-300">{c.label}</span>
                  <span className="ml-auto font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                    {formatCurrency(c.value)}
                  </span>
                  <span className="w-10 text-right font-medium text-slate-400 tabular-nums dark:text-slate-500">
                    {((c.value / stats.expense) * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Recent activity + Budgets */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent activity</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest transactions</p>
            </div>
            <LineHoverLink to="/transactions" className="text-xs font-medium text-blue-600 dark:text-blue-400">
              View all <ChevronRight size={14} />
            </LineHoverLink>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {recent.map((t) => {
              const cat = getCategory(t.category);
              const income = t.type === "income";
              return (
                <li key={t.id} className="flex items-center gap-3.5 px-5 py-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cat.tone === "income" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"}`}>
                    <cat.icon size={16} strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{t.description}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {cat.label} · {formatRelativeDay(new Date(t.date))}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${income ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"}`}>
                    {income ? "+" : "−"}{formatCurrency(t.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Active budgets</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monthly category allowances</p>
            </div>
            <LineHoverLink to="/budgets" className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Manage <ChevronRight size={14} />
            </LineHoverLink>
          </div>
          <div className="space-y-4 p-5">
            {budgetSummary.slice(0, 4).map((b) => {
              const cat = getCategory(b.category);
              const over = b.spent > b.limit;
              const near = !over && b.pct >= 80;
              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                      <cat.icon size={14} className="text-blue-500" />
                      {cat.label}
                    </span>
                    <span className="text-xs text-slate-400 tabular-nums dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(b.spent)}</span> / {formatCurrency(b.limit)}
                    </span>
                  </div>
                  <ProgressBar value={b.spent} max={b.limit} size="sm" />
                  {near && !over && (
                    <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Almost at the limit</p>
                  )}
                  {over && (
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                      Over by {formatCurrency(b.spent - b.limit)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Savings Goals Strip */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Savings goals</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Target milestones & progress</p>
          </div>
          <LineHoverLink to="/goals" className="text-xs font-medium text-blue-600 dark:text-blue-400">
            All goals <ChevronRight size={14} />
          </LineHoverLink>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {goalsPreview.map((g) => {
              const pct = Math.min(100, g.pct);
              return (
                <div
                  key={g.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{g.name}</span>
                    {pct >= 100 ? (
                      <Badge tone="success" dot>Achieved</Badge>
                    ) : (
                      <Badge tone="brand">{Math.round(pct)}%</Badge>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {formatCurrency(g.saved)} <span className="font-normal text-slate-400">of {formatCurrency(g.target)}</span>
                  </p>
                  <div className="mt-3">
                    <ProgressBar value={g.saved} max={g.target} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Insights teaser */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Sparkles size={20} strokeWidth={2} />
            </span>
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">2 new insights</p>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Including a <span className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(47)}/mo subscription reduction</span> recommendation.
              </p>
            </div>
          </div>
          <Link
            to="/insights"
            className="shrink-0"
          >
            <Button variant="primary" size="md" icon={ArrowRight}>Review insights</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200/70 dark:bg-white/5" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-xl bg-slate-200/70 lg:col-span-2 dark:bg-white/5" />
        <div className="h-80 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
      </div>
    </div>
  );
}
