import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Field, Input, PasswordInput } from "../components/ui/Form.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import SocialAuth from "../components/SocialAuth.jsx";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const notice = location.state?.notice;

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: "" }));
    setServerError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email";
    if (!form.password) next.password = "Password is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setServerError("");
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setServerError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  function handleSocialError(message) {
    setServerError(message);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Sign in
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        Sign in to manage your budgets, cash flow, and analytics.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4.5" noValidate>
        <Field label="Email address" htmlFor="login-email" error={errors.email}>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
        </Field>

        <Field label="Password" htmlFor="login-password" error={errors.password}>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
        </Field>

        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
            Keep me signed in
          </label>
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Forgot password?
          </Link>
        </div>

        {notice && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            {notice}
          </p>
        )}

        {serverError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {serverError}
          </p>
        )}

        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Sign in
          </Button>
        </div>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          or continue with
        </span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>

      <SocialAuth onError={handleSocialError} />

      <p className="mt-7 text-center text-xs text-slate-500 dark:text-slate-400">
        New to Wallet Tracker?{" "}
        <Link to="/register" className="font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400">
          Create an account
        </Link>
      </p>
    </div>
  );
}
