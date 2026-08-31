import { useEffect, useState } from "react";
import { UserRound, Bell, ShieldCheck, Palette, Save } from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Button, Field, Input, PasswordInput, Select, Switch } from "../components/ui/Form.jsx";
import { apiClient } from "../lib/api.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Settings() {
  const [user, setUser] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const { updateUser } = useAuth();
  const toast = useToast();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.settings.get().then(setUser);
  }, []);

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-72 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
      </div>
    );
  }

  function update(patch) {
    setUser((u) => ({ ...u, ...patch }));
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await apiClient.settings.update(user);
      updateUser(updated);
      setUser((prev) => ({ ...prev, ...updated }));
      setSaved(true);
      toast.success?.("Settings saved");
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      toast.error?.(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const sections = [
    {
      icon: UserRound,
      title: "Profile",
      description: "Your display name, contact email, and avatar.",
      body: (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="set-name">
            <Input id="set-name" value={user.name} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label="Email address" htmlFor="set-email" hint="Used for authentication and notifications.">
            <Input id="set-email" type="email" value={user.email} onChange={(e) => update({ email: e.target.value })} />
          </Field>
          <div className="flex items-center gap-4 sm:col-span-2 pt-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white">
              {user.initials}
            </span>
            <div>
              <Button variant="secondary" size="sm">Update picture</Button>
              <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">PNG, JPG, or WebP up to 2MB.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Palette,
      title: "Preferences",
      description: "Currency, date format, and appearance.",
      body: (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Operating Currency">
            <Select value={user.currency} onChange={(e) => update({ currency: e.target.value })}>
              <option value="INR">INR (₹) — Indian Rupee</option>
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
              <option value="JPY">JPY (¥) — Japanese Yen</option>
            </Select>
          </Field>
          <Field label="Date format">
            <Select value={user.dateFormat} onChange={(e) => update({ dateFormat: e.target.value })}>
              <option value="MMM d, yyyy">Aug 12, 2026 (Default)</option>
              <option value="d MMM yyyy">12 Aug 2026</option>
              <option value="yyyy-MM-dd">2026-08-12 (ISO)</option>
            </Select>
          </Field>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/[0.06] px-4 py-3 sm:col-span-2 bg-slate-50 dark:bg-white/[0.02]">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Color mode</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Active: {theme === "dark" ? "Dark" : "Light"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={toggleTheme}>
                Switch to {theme === "dark" ? "Light" : "Dark"}
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Choose which alerts you want to receive.",
      body: (
        <div className="space-y-3">
          <ToggleRow label="Weekly summary" hint="A weekly summary of income, expenses, and cash flow."
            checked={user.weeklyDigest} onChange={(v) => update({ weeklyDigest: v })} />
          <ToggleRow label="Budget threshold alerts" hint="Alerts at 80% usage and when a category limit is exceeded."
            checked={user.budgetAlerts} onChange={(v) => update({ budgetAlerts: v })} />
          <ToggleRow label="Insight notifications" hint="Notify me when new savings opportunities are found."
            checked={user.insightAlerts} onChange={(v) => update({ insightAlerts: v })} />
          <ToggleRow label="Security alerts" hint="Alerts for new devices and password changes."
            checked={user.securityAlerts} onChange={(v) => update({ securityAlerts: v })} />
        </div>
      ),
    },
    {
      icon: ShieldCheck,
      title: "Security",
      description: "Password and account security.",
      body: (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Current password" htmlFor="set-pass-current">
            <PasswordInput id="set-pass-current" placeholder="••••••••" />
          </Field>
          <div className="hidden sm:block" />
          <Field label="New password" htmlFor="set-pass-new" hint="Minimum 8 characters with numbers & symbols.">
            <PasswordInput id="set-pass-new" placeholder="••••••••" />
          </Field>
          <Field label="Confirm new password" htmlFor="set-pass-confirm">
            <PasswordInput id="set-pass-confirm" placeholder="••••••••" />
          </Field>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Settings"
        description="Profile, preferences, notifications, and security."
        breadcrumbs={[{ label: "Account" }, { label: "Settings" }]}
        actions={
          <Button variant="primary" size="md" icon={Save} onClick={save} loading={saving}>
            {saved ? "Saved" : "Save changes"}
          </Button>
        }
      />

      <div className="space-y-6">
        {sections.map((s) => (
          <Card key={s.title}>
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/[0.06] px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <s.icon size={18} strokeWidth={2.2} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{s.title}</h2>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{s.description}</p>
              </div>
            </div>
            <div className="p-5">{s.body}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 dark:border-white/[0.06] px-4 py-3 bg-slate-50 dark:bg-white/[0.02]">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

