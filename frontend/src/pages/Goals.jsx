import { useEffect, useMemo, useState } from "react";
import { Plus, Target, Shield, Plane, Laptop, Car, Trash2, CalendarDays } from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Button, Field, Input, Select } from "../components/ui/Form.jsx";
import Modal from "../components/ui/Modal.jsx";
import Badge from "../components/ui/Badge.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { apiClient } from "../lib/api.js";
import { formatCurrency, formatCurrencyWhole, daysUntil, formatISODate, getCurrencySymbol, cn } from "../lib/format.js";

const GOAL_ICONS = { shield: Shield, plane: Plane, laptop: Laptop, car: Car, target: Target };
const GOAL_COLORS = {
  emerald: { chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", bar: "bg-emerald-500", track: "bg-emerald-500/15" },
  sky: { chip: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400", bar: "bg-sky-500", track: "bg-sky-500/15" },
  brand: { chip: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", bar: "bg-blue-500", track: "bg-blue-500/15" },
  cyan: { chip: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400", bar: "bg-cyan-500", track: "bg-cyan-500/15" },
};

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [fundModal, setFundModal] = useState(null);

  useEffect(() => {
    apiClient.goals.list().then((g) => {
      setGoals(g);
      setLoading(false);
    });
  }, []);

  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.saved, 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.target, 0), [goals]);
  const achieved = goals.filter((g) => g.saved >= g.target).length;

  async function handleCreate(payload) {
    const created = await apiClient.goals.create(payload);
    setGoals((list) => [...list, created]);
  }

  async function handleContribute(id, amount) {
    await apiClient.goals.contribute(id, amount);
    setGoals((list) => list.map((g) => (g.id === id ? { ...g, saved: g.saved + amount } : g)));
  }

  async function handleDelete(id) {
    await apiClient.goals.remove(id);
    setGoals((list) => list.filter((g) => g.id !== id));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Savings Goals"
        description="Track savings targets with monthly contribution recommendations."
        breadcrumbs={[{ label: "Finance" }, { label: "Goals" }]}
        actions={
          <Button variant="primary" size="md" icon={Plus} onClick={() => setModalOpen(true)}>
            New goal
          </Button>
        }
      />

      {/* Summary */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Target size={21} strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Combined progress</p>
              <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {formatCurrencyWhole(totalSaved)} <span className="text-sm font-normal text-slate-400">of {formatCurrencyWhole(totalTarget)} target</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <span className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-white">
                {Math.round((totalSaved / Math.max(totalTarget, 1)) * 100)}
              </span>
              <p className="text-xs text-slate-400 dark:text-slate-500">overall saved</p>
            </div>
            <Badge tone={achieved > 0 ? "success" : "brand"} dot>
              {achieved > 0 ? `${achieved} achieved` : "In progress"}
            </Badge>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Set your first savings goal — a trip, a gadget, an emergency fund."
            action={
              <Button variant="primary" size="md" icon={Plus} onClick={() => setModalOpen(true)}>
                Create a goal
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {goals.map((g) => {
            const Icon = GOAL_ICONS[g.icon] || Target;
            const color = GOAL_COLORS[g.color] || GOAL_COLORS.brand;
            const pct = Math.min(100, (g.saved / g.target) * 100);
            const done = g.saved >= g.target;
            const daysLeft = daysUntil(g.deadline);
            const monthlyNeeded = done ? 0 : Math.max(0, (g.target - g.saved) / Math.max(1, Math.ceil(daysLeft / 30)));
            return (
              <Card key={g.id} className="group flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-start justify-between">
                    <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg", color.chip)}>
                      <Icon size={19} strokeWidth={2.2} />
                    </span>
                    {done ? <Badge tone="success" dot>Done!</Badge> : <Badge tone="brand">{Math.round(pct)}%</Badge>}
                  </div>

                  <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900 dark:text-white">{g.name}</h3>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {formatCurrencyWhole(g.saved)} of {formatCurrencyWhole(g.target)}
                  </p>

                  <div className="mt-4">
                    <ProgressBar value={g.saved} max={g.target} size="sm" />
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <p className="flex items-center gap-1.5 font-medium">
                      <CalendarDays size={13} className="shrink-0 text-slate-400" />
                      {done ? "Completed" : daysLeft < 0 ? `Due date passed (${formatISODate(g.deadline)})` : `${daysLeft} days left · ${formatISODate(g.deadline)}`}
                    </p>
                    {!done && daysLeft >= 0 && (
                      <p className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                        {formatCurrency(monthlyNeeded)}/mo recommended
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3.5 dark:border-white/[0.06]">
                  <Button
                    variant={done ? "secondary" : "primary"}
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={done}
                    onClick={() => setFundModal(g)}
                  >
                    Add funds
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDelete(g.id)}
                    aria-label={`Delete ${g.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <GoalModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
      <FundModal goal={fundModal} onClose={() => setFundModal(null)} onContribute={handleContribute} />
    </div>
  );
}

function GoalModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", target: "", deadline: "", icon: "target", color: "brand" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: "", target: "", deadline: "", icon: "target", color: "brand" });
      setErrors({});
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    const target = parseFloat(form.target);
    if (form.name.trim().length < 2) next.name = "Give your goal a name";
    if (!target || target <= 0) next.target = "Enter a target amount";
    if (!form.deadline) next.deadline = "Pick a target date";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onCreate({ ...form, target: Math.round(target * 100) / 100, saved: 0 });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New goal"
      description="Name it, size it, date it — we'll tell you what to save monthly."
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" type="submit" form="goal-form" loading={saving}>
            Create goal
          </Button>
        </>
      }
    >
      <form id="goal-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Goal name" htmlFor="goal-name" error={errors.name} required>
          <Input id="goal-name" placeholder="e.g. Bali trip" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Target amount" htmlFor="goal-target" error={errors.target} required>
            <Input id="goal-target" type="number" step="0.01" min="1" inputMode="decimal" placeholder="5000" leading={getCurrencySymbol()}
              value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} error={errors.target} />
          </Field>
          <Field label="Target date" htmlFor="goal-date" error={errors.deadline} required>
            <Input id="goal-date" type="date" value={form.deadline} min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} error={errors.deadline} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Icon">
            <Select value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}>
              <option value="target">Target</option>
              <option value="shield">Shield</option>
              <option value="plane">Plane</option>
              <option value="laptop">Laptop</option>
              <option value="car">Car</option>
            </Select>
          </Field>
          <Field label="Accent color">
            <Select value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}>
              <option value="brand">Blue</option>
              <option value="emerald">Emerald</option>
              <option value="sky">Sky</option>
              <option value="cyan">Cyan</option>
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  );
}

function FundModal({ goal, onClose, onContribute }) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (goal) { setAmount(""); }
  }, [goal]);

  if (!goal) return null;

  const quick = [50, 100, 250];

  async function handleSubmit(e) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setSaving(true);
    try {
      await onContribute(goal.id, Math.round(value * 100) / 100);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={!!goal}
      onClose={onClose}
      title={`Add funds — ${goal.name}`}
      description={`Currently ${formatCurrencyWhole(goal.saved)} of ${formatCurrencyWhole(goal.target)} saved.`}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" type="submit" form="fund-form" loading={saving}>
            Add funds
          </Button>
        </>
      }
    >
      <form id="fund-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="flex gap-2">
          {quick.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(q))}
              className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-[13px] font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-400 cursor-pointer"
            >
              {getCurrencySymbol()}{q}
            </button>
          ))}
        </div>
        <Field label="Amount" htmlFor="fund-amount" required>
          <Input id="fund-amount" type="number" step="0.01" min="1" inputMode="decimal" placeholder="100" leading={getCurrencySymbol()}
            value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 text-lg font-semibold tabular-nums" />
        </Field>
      </form>
    </Modal>
  );
}
