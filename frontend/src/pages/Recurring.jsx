import { useEffect, useState } from "react";
import { Plus, Repeat, CalendarClock, Trash2, Pause, Play } from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Button, Field, Input, Select, TypeToggle } from "../components/ui/Form.jsx";
import Modal from "../components/ui/Modal.jsx";
import Badge from "../components/ui/Badge.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { apiClient } from "../lib/api.js";
import { getCategory, CATEGORY_META } from "../lib/mock.js";
import { formatCurrency, formatISODay, daysUntil, getCurrencySymbol, cn } from "../lib/format.js";
import { useToast } from "../context/ToastContext.jsx";

export default function Recurring() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    apiClient.recurring.list().then((r) => {
      setItems(r);
      setLoading(false);
    });
  }, []);

  const monthlyTotal = items
    .filter((r) => r.active && r.frequency === "Monthly")
    .reduce((s, r) => s + r.amount, 0);
  const activeCount = items.filter((r) => r.active).length;
  const dueSoon = items.filter((r) => r.active && daysUntil(r.nextDue) >= 0 && daysUntil(r.nextDue) <= 7).length;

  async function handleCreate(payload) {
    const created = await apiClient.recurring.create(payload);
    setItems((list) => [created, ...list]);
    toast.success?.("Recurring payment added");
  }

  async function handleToggle(item) {
    const next = !item.active;
    await apiClient.recurring.toggle(item.id, next);
    setItems((list) => list.map((r) => (r.id === item.id ? { ...r, active: next } : r)));
  }

  async function handleDelete(id) {
    await apiClient.recurring.remove(id);
    setItems((list) => list.filter((r) => r.id !== id));
  }

  const sorted = [...items].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return new Date(a.nextDue) - new Date(b.nextDue);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Recurring Subscriptions"
        description="Keep track of recurring bills, subscriptions, and automatic payments."
        breadcrumbs={[{ label: "Finance" }, { label: "Recurring" }]}
        actions={
          <Button variant="primary" size="md" icon={Plus} onClick={() => setModalOpen(true)}>
            Add recurring
          </Button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Chip label="Monthly Total" value={formatCurrency(monthlyTotal)} tone="brand" />
        <Chip label="Active Contracts" value={String(activeCount)} tone="emerald" />
        <Chip label="Due in 7 days" value={String(dueSoon)} tone="amber" />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <EmptyState
            icon={Repeat}
            title="No recurring commitments"
            description="Add regular subscriptions to get automated billing alerts."
          />
        </Card>
      ) : (
        <div className="space-y-3.5">
          {sorted.map((r) => {
            const cat = getCategory(r.category);
            const d = daysUntil(r.nextDue);
            const upcoming = r.active && d >= 0 && d <= 7;
            const overdue = r.active && d < 0;
            return (
              <Card key={r.id} className={cn("p-5 transition-opacity", !r.active && "opacity-60")}>
                <div className="flex flex-wrap items-center gap-4">
                  <span className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                    r.active
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-600"
                  )}>
                    <cat.icon size={19} strokeWidth={2.2} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">{r.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {r.merchant} · {r.frequency} · {cat.label}
                    </p>
                  </div>

                  <div className="hidden sm:flex sm:items-center sm:gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <CalendarClock size={15} className="text-slate-400" />
                      {formatISODay(r.nextDue)}
                    </span>
                    {upcoming && <Badge tone="warning" dot>Due soon</Badge>}
                    {overdue && <Badge tone="danger" dot>Overdue</Badge>}
                    {!r.active && <Badge tone="neutral">Paused</Badge>}
                  </div>

                  <span className="text-base font-semibold text-slate-900 tabular-nums dark:text-white">
                    {formatCurrency(r.amount)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggle(r)}
                      aria-label={r.active ? `Pause ${r.name}` : `Resume ${r.name}`}
                      title={r.active ? "Pause" : "Resume"}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {r.active ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      aria-label={`Delete ${r.name}`}
                      title="Delete"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <RecurringModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
}

function RecurringModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({ type: "expense", name: "", amount: "", category: "food", frequency: "monthly", nextDueDate: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ type: "expense", name: "", amount: "", category: "food", frequency: "monthly", nextDueDate: new Date().toISOString().slice(0, 10) });
      setErrors({});
    }
  }, [open]);

  const expenseCats = Object.entries(CATEGORY_META).filter(([k]) => k !== "income");
  const incomeCats = [["income", CATEGORY_META.income], ["other", CATEGORY_META.other]];

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    const amount = parseFloat(form.amount);
    if (form.name.trim().length < 2) next.name = "Give it a short name";
    if (!amount || amount <= 0) next.amount = "Enter a valid amount";
    if (!form.nextDueDate) next.nextDueDate = "Pick the next due date";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onCreate({
        name: form.name.trim(),
        amount: Math.round(amount * 100) / 100,
        category: form.category,
        type: form.type,
        frequency: form.frequency,
        nextDueDate: form.nextDueDate,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add recurring payment"
      description="Schedule a subscription or regular charge that repeats automatically."
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" type="submit" form="recurring-form" loading={saving}>
            Add recurring
          </Button>
        </>
      }
    >
      <form id="recurring-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <TypeToggle value={form.type} onChange={(type) => setForm((f) => ({ ...f, type, category: type === "income" ? "income" : f.category === "income" ? "food" : f.category }))} />

        <Field label="Name" htmlFor="recur-name" error={errors.name} required>
          <Input id="recur-name" placeholder="e.g. Netflix" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Amount" htmlFor="recur-amount" error={errors.amount} required>
            <Input id="recur-amount" type="number" step="0.01" min="0.01" inputMode="decimal" placeholder="9.99" leading={getCurrencySymbol()}
              value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} error={errors.amount} className="h-12 text-lg font-semibold tabular-nums" />
          </Field>
          <Field label="Category" htmlFor="recur-cat">
            <Select id="recur-cat" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {(form.type === "income" ? incomeCats : expenseCats).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Frequency" htmlFor="recur-freq">
            <Select id="recur-freq" value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </Field>
          <Field label="Next due date" htmlFor="recur-date" error={errors.nextDueDate}>
            <Input id="recur-date" type="date" value={form.nextDueDate} onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))} error={errors.nextDueDate} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

function Chip({ label, value, tone }) {
  const tones = {
    brand: "text-blue-600 dark:text-blue-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-white/[0.08] dark:bg-slate-900">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tracking-tight tabular-nums", tones[tone])}>{value}</p>
    </div>
  );
}

