import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, ArrowDownLeft, ArrowUpRight, FilterX, ReceiptText, Download } from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Button, Field, Input, Select, TypeToggle } from "../components/ui/Form.jsx";
import Modal from "../components/ui/Modal.jsx";
import Badge from "../components/ui/Badge.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { apiClient } from "../lib/api.js";
import { getCategory, CATEGORY_META } from "../lib/mock.js";
import { useToast } from "../context/ToastContext.jsx";
import { exportTransactionsToCsv } from "../lib/exportCsv.js";
import { formatCurrency, formatRelativeDay, getCurrencySymbol, cn } from "../lib/format.js";

const PAGE_SIZE = 10;

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const toast = useToast();

  useEffect(() => {
    apiClient.transactions.list().then((t) => {
      setTransactions(t);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let rows = transactions;
    if (typeFilter !== "all") rows = rows.filter((t) => t.type === typeFilter);
    if (categoryFilter !== "all") rows = rows.filter((t) => t.category === categoryFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.merchant.toLowerCase().includes(q) ||
          getCategory(t.category).label.toLowerCase().includes(q) ||
          t.account.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [transactions, query, typeFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const summary = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(txn) {
    setEditing(txn);
    setModalOpen(true);
  }

  async function handleSave(payload) {
    if (editing) {
      const updated = await apiClient.transactions.update(editing.id, payload);
      setTransactions((list) => list.map((t) => (t.id === editing.id ? { ...t, ...updated } : t)));
    } else {
      const created = await apiClient.transactions.create(payload);
      setTransactions((list) => [created, ...list]);
    }
  }

  async function handleDelete(id) {
    await apiClient.transactions.remove(id);
    setTransactions((list) => list.filter((t) => t.id !== id));
  }

  function handleExport() {
    const listToExport = filtered.length > 0 ? filtered : transactions;
    const success = exportTransactionsToCsv(listToExport, `wallet_tracker_transactions_${new Date().toISOString().split("T")[0]}.csv`);
    if (success) {
      toast.success?.("Transactions exported to CSV");
    } else {
      toast.error?.("No transactions to export");
    }
  }

  const hasFilters = query || typeFilter !== "all" || categoryFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Every incoming and outgoing transaction — searchable, filterable, and categorized."
        breadcrumbs={[{ label: "Finance" }, { label: "Transactions" }]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="md" icon={Download} onClick={handleExport}>
              Export CSV
            </Button>
            <Button variant="primary" size="md" icon={Plus} onClick={openCreate}>
              Add transaction
            </Button>
          </div>
        }
      />

      {/* Period summary chips */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryChip label="Total Inflow" value={formatCurrency(summary.income)} tone="emerald" icon={ArrowDownLeft} />
        <SummaryChip label="Total Outflow" value={formatCurrency(summary.expense)} tone="rose" icon={ArrowUpRight} />
        <SummaryChip label="Net Flow" value={formatCurrency(summary.net)} tone={summary.net >= 0 ? "brand" : "rose"} icon={ReceiptText} />
      </div>

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3.5 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
          <div className="relative flex-1 sm:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Search by payee, merchant, category…"
              aria-label="Search transactions"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="pl-9.5 h-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              aria-label="Filter by type"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-auto! min-w-36 h-10"
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </Select>
            <Select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="w-auto! min-w-44 h-10"
            >
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                icon={FilterX}
                onClick={() => { setQuery(""); setTypeFilter("all"); setCategoryFilter("all"); setPage(1); }}
                className="h-10"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Table (desktop) */}
        {loading ? (
          <TableSkeleton />
        ) : pageRows.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title={hasFilters ? "No matching transactions" : "No transactions yet"}
            description={
              hasFilters
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Add your first transaction and it will show up here."
            }
            action={
              !hasFilters && (
                <Button variant="primary" icon={Plus} onClick={openCreate}>
                  Add your first transaction
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:border-white/[0.06] dark:text-slate-500">
                    <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Description</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Account</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Amount</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                  {pageRows.map((t) => {
                    const cat = getCategory(t.category);
                    const income = t.type === "income";
                    return (
                      <tr key={t.id} className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.025]">
                        <td className="px-5 py-3.5 text-[13px] whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {formatRelativeDay(new Date(t.date))}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              income
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
                            )}>
                              <cat.icon size={15.5} strokeWidth={2.1} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[13.5px] font-medium text-slate-800 dark:text-slate-100">{t.description}</p>
                              <p className="text-[11.5px] text-slate-400 dark:text-slate-500">{t.merchant}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone={cat.tone}>{cat.label}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] whitespace-nowrap text-slate-500 dark:text-slate-400">{t.account}</td>
                        <td className={cn("px-4 py-3.5 text-right text-[13.5px] font-semibold whitespace-nowrap tabular-nums", income ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-100")}>
                          {income ? "+" : "−"}{formatCurrency(t.amount)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <IconAction label={`Edit ${t.description}`} onClick={() => openEdit(t)}>
                              <Pencil size={14.5} />
                            </IconAction>
                            <IconAction label={`Delete ${t.description}`} danger onClick={() => handleDelete(t.id)}>
                              <Trash2 size={14.5} />
                            </IconAction>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 dark:border-white/[0.06]">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}</span> of{" "}
                <span className="font-semibold text-slate-600 dark:text-slate-300">{filtered.length}</span> transactions
              </p>
              <div className="flex items-center gap-1.5">
                <Button variant="secondary" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === safePage ? "page" : undefined}
                    className={cn(
                      "h-8 w-8 rounded-lg text-[13px] font-medium transition-colors",
                      p === safePage
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
                    )}
                  >
                    {p}
                  </button>
                ))}
                <Button variant="secondary" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Mobile card list */}
      {!loading && pageRows.length > 0 && (
        <div className="space-y-3 md:hidden">
          {pageRows.map((t) => {
            const cat = getCategory(t.category);
            const income = t.type === "income";
            return (
              <Card key={t.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", income ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400")}>
                    <cat.icon size={16} strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-slate-800 dark:text-slate-100">{t.description}</p>
                    <p className="text-[11.5px] text-slate-400 dark:text-slate-500">
                      {formatRelativeDay(new Date(t.date))} · {cat.label}
                    </p>
                  </div>
                  <span className={cn("text-[13.5px] font-semibold tabular-nums", income ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-100")}>
                    {income ? "+" : "−"}{formatCurrency(t.amount)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSave={handleSave}
        onDelete={editing ? handleDelete : null}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SummaryChip({ label, value, tone, icon: Icon }) {
  const iconTones = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    brand: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  };
  const textTones = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
    brand: "text-blue-600 dark:text-blue-400",
  };
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-white/[0.08] dark:bg-slate-900">
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", iconTones[tone])}>
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className={cn("mt-0.5 truncate text-xl font-semibold tracking-tight tabular-nums", textTones[tone])}>{value}</p>
      </div>
    </div>
  );
}

function IconAction({ label, onClick, danger = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        danger
          ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"
      )}
    >
      {children}
    </button>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-5" aria-label="Loading transactions">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-white/[0.04]" />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Transaction modal                                                          */
/* -------------------------------------------------------------------------- */

function TransactionModal({ open, onClose, editing, onSave, onDelete }) {
  const [form, setForm] = useState({ type: "expense", amount: "", description: "", category: "food", date: "", account: "Checking ••4831" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editing) {
      setForm({
        type: editing.type,
        amount: String(editing.amount),
        description: editing.description,
        category: editing.category,
        date: editing.date,
        account: editing.account,
      });
    } else {
      setForm({ type: "expense", amount: "", description: "", category: "food", date: new Date().toISOString().slice(0, 10), account: "Checking ••4831" });
    }
  }, [open, editing]);

  const expenseCats = Object.entries(CATEGORY_META).filter(([k]) => k !== "income");
  const incomeCats = [["income", CATEGORY_META.income], ["other", CATEGORY_META.other]];

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    const amount = parseFloat(form.amount);
    if (!form.description.trim()) next.description = "Add a short description";
    if (!amount || amount <= 0) next.amount = "Enter a valid amount";
    if (!form.date) next.date = "Pick a date";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSave({
        ...form,
        amount: Math.round(amount * 100) / 100,
        merchant: form.description.trim(),
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
      title={editing ? "Edit transaction" : "Add transaction"}
      description={editing ? "Update the details below." : "Log money in or out in seconds."}
      footer={
        <>
          {editing && onDelete && (
            <Button
              variant="dangerGhost"
              size="md"
              icon={Trash2}
              className="mr-auto"
              onClick={() => { onDelete(editing.id); onClose(); }}
            >
              Delete
            </Button>
          )}
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" type="submit" form="txn-form" loading={saving}>
            {editing ? "Save changes" : "Add transaction"}
          </Button>
        </>
      }
    >
      <form id="txn-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <TypeToggle value={form.type} onChange={(type) => setForm((f) => ({ ...f, type, category: type === "income" ? "income" : f.category === "income" ? "food" : f.category }))} />

        <Field label="Amount" htmlFor="txn-amount" error={errors.amount} required>
          <Input
            id="txn-amount"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            placeholder="0.00"
            leading={getCurrencySymbol()}
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            error={errors.amount}
            className="h-12 text-lg font-semibold tabular-nums"
          />
        </Field>

        <Field label="Description" htmlFor="txn-desc" error={errors.description} required>
          <Input
            id="txn-desc"
            placeholder={form.type === "income" ? "e.g. Freelance payment" : "e.g. Grocery run"}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            error={errors.description}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="txn-cat">
            <Select id="txn-cat" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {(form.type === "income" ? incomeCats : expenseCats).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Date" htmlFor="txn-date" error={errors.date}>
            <Input
              id="txn-date"
              type="date"
              value={form.date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              error={errors.date}
            />
          </Field>
        </div>

        <Field label="Account" htmlFor="txn-account">
          <Select id="txn-account" value={form.account} onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))}>
            <option>Checking ••4831</option>
            <option>Credit Card ••2209</option>
            <option>Savings ••9012</option>
            <option>Cash</option>
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
