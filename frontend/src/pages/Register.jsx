import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, Input, PasswordInput } from "../components/ui/Form.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: "" }));
    setServerError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = "Please enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email";
    if (form.password.length < 8) next.password = "Use at least 8 characters";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setServerError("");
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setServerError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        Start tracking your income and spending in minutes.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4.5" noValidate>
        <Field label="Full name" htmlFor="reg-name" error={errors.name}>
          <Input
            id="reg-name"
            name="name"
            autoComplete="name"
            placeholder="Alex Morgan"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />
        </Field>

        <Field label="Email address" htmlFor="reg-email" error={errors.email}>
          <Input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
        </Field>

        <Field label="Password" htmlFor="reg-password" error={errors.password} hint="At least 8 characters">
          <PasswordInput
            id="reg-password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
        </Field>

        {serverError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {serverError}
          </p>
        )}

        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Create account
          </Button>
        </div>

        <p className="text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          By signing up, you agree to our{" "}
          <span className="font-medium text-slate-600 dark:text-slate-400">Terms</span> and{" "}
          <span className="font-medium text-slate-600 dark:text-slate-400">Privacy Policy</span>.
        </p>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400">
          Sign in
        </Link>
      </p>
    </div>
  );
}
