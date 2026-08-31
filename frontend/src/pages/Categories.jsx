import { useEffect, useState } from "react";
import { Plus, Tags, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Button, Field, Input } from "../components/ui/Form.jsx";
import Modal from "../components/ui/Modal.jsx";
import Badge from "../components/ui/Badge.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { apiClient } from "../lib/api.js";
import { getCategory } from "../lib/mock.js";
import { formatCurrency, cn } from "../lib/format.js";
import { useToast } from "../context/ToastContext.jsx";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const toast = useToast();

  async function refresh() {
    const list = await apiClient.categories.list();
    setCategories(list);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const maxTotal = Math.max(1, ...categories.map((c) => c.total));

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(category) {
    setEditing(category);
    setModalOpen(true);
  }

  async function handleSave(payload) {
    if (editing) {
      const updated = await apiClient.categories.update(editing.id, payload);
      setCategories((list) => list.map((c) => (c.id === editing.id ? { ...c, ...updated, total: c.total, transactionCount: c.transactionCount } : c)));
      toast.success?.("Category updated");
    } else {
      const created = await apiClient.categories.create(payload);
      setCategories((list) => [...list, created]);
      toast.success?.("Category created");
    }
  }

  async function handleDelete(category) {
    await apiClient.categories.remove(category.id);
    setCategories((list) => list.filter((c) => c.id !== category.id));
    toast.success?.("Category deleted");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Spending Categories"
        description="Custom tags that keep your transactions organized everywhere."
        breadcrumbs={[{ label: "Setup" }, { label: "Categories" }]}
        actions={
          <Button variant="primary" size="md" icon={Plus} onClick={openCreate}>
            New category
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <EmptyState icon={Tags} title="No categories found" description="Categories keep your ledger neat and structured." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => {
            const meta = getCategory(c.key);
            const share = (c.total / maxTotal) * 100;
            return (
              <Card key={c.id} className="group p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg", meta.tone === "income" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400")}>
                      <meta.icon size={19} strokeWidth={2.2} />
                    </span>
                    <div>
                      <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">{c.label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {c.transactionCount} transactions
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      aria-label={`Edit ${c.label}`}
                      onClick={() => openEdit(c)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${c.label}`}
                      onClick={() => handleDelete(c)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex items-baseline justify-between">
                  <p className="text-xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-white">
                    {formatCurrency(c.total)}
                  </p>
                  <Badge tone={meta.tone === "income" ? "success" : "neutral"}>{Math.round(share)}% of max</Badge>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${share}%`, background: meta.hex }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CategoryModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} onSave={handleSave} />
    </div>
  );
}

function CategoryModal({ open, onClose, editing, onSave }) {
  const [form, setForm] = useState({ name: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: editing?.label || "" });
      setErrors({});
    }
  }, [open, editing]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setErrors({ name: "Use at least 2 characters" });
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: form.name.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit category" : "New category"}
      description={editing ? "Update the category name below." : "Custom categories appear in filters and charts everywhere."}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" type="submit" form="cat-form" loading={saving}>
            {editing ? "Save changes" : "Create category"}
          </Button>
        </>
      }
    >
      <form id="cat-form" onSubmit={handleSubmit} className="space-y-5">
        <Field label="Category name" htmlFor="cat-name" error={errors.name} required>
          <Input id="cat-name" placeholder="e.g. Pets" value={form.name} error={errors.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
      </form>
    </Modal>
  );
}
