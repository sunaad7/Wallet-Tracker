import { useEffect, useState } from "react";
import { Plus, PiggyBank, Trash2, TrendingDown, CircleCheck, TriangleAlert } from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Button, Field, Input, Select } from "../components/ui/Form.jsx";
import Modal from "../components/ui/Modal.jsx";
import Badge from "../components/ui/Badge.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { apiClient } from "../lib/api.js";
import { getCategory, CATEGORY_META } from "../lib/mock.js";
import { formatCurrency, formatCurrencyWhole, getCurrencySymbol, cn } from "../lib/format.js";

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    apiClient.budgets.list().then((b) => {
      setBudgets(b);
      setLoading(false);
    });
  }, []);

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overCount = budgets.filter((b) => b.spent > b.limit).length;

  async function handleCreate(payload) {
    const created = await apiClient.budgets.create(payload);
    setBudgets((list) => [...list, created]);
  }

  async function handleDelete(id) {
    await apiClient.budgets.remove(id);
    setBudgets((list) => list.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Category Budgets"
        description="Set monthly spending limits for each category."
        breadcrumbs={[{ label: "Finance" }, { label: "Budgets" }]}
        actions={
          <Button variant="primary" size="md" icon={Plus} onClick={() => setModalOpen(true)}>
            New budget
          </Button>
        }
      />

      {/* Overview strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <OverviewCard label="Total Budgeted" value={formatCurrencyWhole(totalLimit)} icon={PiggyBank} tone="brand" />
        <OverviewCard label="Total Spent" value={formatCurrencyWhole(totalSpent)} icon={TrendingDown} tone="amber" />
        <OverviewCard
          label={overCount === 0 ? "Budget Status" : `${overCount} over limit`}
          value={overCount === 0 ? "100% On Track" : `${Math.round((totalSpent / Math.max(totalLimit, 1)) * 100)}% Used`}
          icon={overCount === 0 ? CircleCheck : TriangleAlert}
          tone={overCount === 0 ? "emerald" : "rose"}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={PiggyBank}
            title="No budgets configured"
            description="Create your first budget cap to keep track of categorical spend in real-time."
            action={
              <Button variant="primary" size="md" icon={Plus} onClick={() => setModalOpen(true)}>
                Create a budget
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {budgets.map((b) => {
            const cat = getCategory(b.category);
            const pct = (b.spent / b.limit) * 100;
            const over = b.spent > b.limit;
            const near = !over && pct >= 80;
            const remaining = b.limit - b.spent;
            return (
              <Card key={b.id} className="group relative p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                      <cat.icon size={19} strokeWidth={2.2} />
                    </span>
                    <div>
                      <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">{cat.label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Monthly limit</p>
                    </div>
                  </div>
                  {over ? (
                    <Badge tone="danger" dot>Over limit</Badge>
                  ) : near ? (
                    <Badge tone="warning" dot>80%+ used</Badge>
                  ) : (
                    <Badge tone="success" dot>On track</Badge>
                  )}
                </div>

                <div className="mt-5 flex items-baseline justify-between">
                  <span className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-white">
                    {formatCurrency(b.spent)}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">of {formatCurrency(b.limit)}</span>
                </div>

                <div className="mt-3">
                  <ProgressBar value={b.spent} max={b.limit} />
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                  <p className={cn("text-xs font-semibold tabular-nums", over ? "text-rose-600 dark:text-rose-400" : near ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                    {over
                      ? `${formatCurrency(-remaining)} exceeded`
                      : `${formatCurrency(remaining)} remaining`}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    aria-label={`Delete ${cat.label} budget`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BudgetModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} usedCategories={budgets.map((b) => b.category)} />
    </div>
  );
}

function OverviewCard({ label, value, icon: Icon, tone }) {
  const tones = {
    brand: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  };
  return (
    <Card className="flex items-center gap-4 p-4">
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
        <Icon size={20} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-white">{value}</p>
      </div>
    </Card>
  );
}

function BudgetModal({ open, onClose, onCreate, usedCategories }) {
  const [form, setForm] = useState({ category: "food", limit: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const free = Object.entries(CATEGORY_META).find(([k]) => !usedCategories.includes(k) && k !== "income");
      setForm({ category: free?.[0] || "food", limit: "" });
      setErrors({});
    }
  }, [open, usedCategories]);

  const available = Object.entries(CATEGORY_META).filter(([k]) => !usedCategories.includes(k) && k !== "income");

  async function handleSubmit(e) {
    e.preventDefault();
    const limit = parseFloat(form.limit);
    if (!limit || limit <= 0) {
      setErrors({ limit: "Enter a monthly limit" });
      return;
    }
    setSaving(true);
    try {
      await onCreate({ category: form.category, limit: Math.round(limit * 100) / 100 });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New budget"
      description="Set a monthly spending limit for a category."
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" type="submit" form="budget-form" loading={saving}>
            Create budget
          </Button>
        </>
      }
    >
      <form id="budget-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Category" htmlFor="budget-cat">
          <Select id="budget-cat" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            {available.map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Monthly limit" htmlFor="budget-limit" error={errors.limit} required hint="We'll alert you at 80% and 100%.">
          <Input
            id="budget-limit"
            type="number"
            step="0.01"
            min="1"
            inputMode="decimal"
            placeholder="300"
            leading={getCurrencySymbol()}
            value={form.limit}
            onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value }))}
            error={errors.limit}
            className="h-12 text-lg font-semibold tabular-nums"
          />
        </Field>
      </form>
    </Modal>
  );
}
