import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, Input } from "../components/ui/Form.jsx";
import { apiClient } from "../lib/api.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return setError("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email");

    setLoading(true);
    setError("");
    try {
      const data = await apiClient.auth.forgotPassword(email);
      setSent(true);
      setDevCode(data.devCode || "");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Forgot password
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        Enter your account email and we'll send you a reset code.
      </p>

      {sent ? (
        <div className="mt-7 space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            If that email is registered, a reset code has been sent. It's valid for 10 minutes.
          </div>
          {devCode && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Your reset code (dev mode)</p>
              <p className="mt-1 font-mono text-lg tracking-[0.3em] text-slate-800 select-all dark:text-slate-100">{devCode}</p>
            </div>
          )}
          <Button variant="primary" size="lg" className="w-full" onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}>
            Continue to reset password
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7 space-y-4.5" noValidate>
          <Field label="Email address" htmlFor="forgot-email" error={error}>
            <Input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              error={error}
            />
          </Field>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Send reset code
            </Button>
          </div>
        </form>
      )}

      <p className="mt-7 text-center text-xs text-slate-500 dark:text-slate-400">
        Remembered your password?{" "}
        <Link to="/login" className="font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
