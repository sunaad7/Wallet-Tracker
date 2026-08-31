import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Field, Input, PasswordInput } from "../components/ui/Form.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!email.trim()) next.email = "Email is required";
    if (!code.trim()) next.code = "Reset code is required";
    else if (!/^\d{6}$/.test(code.trim())) next.code = "Enter the 6-digit code";
    if (!password) next.password = "New password is required";
    else if (password.length < 8) next.password = "Minimum 8 characters";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setServerError("");
    try {
      await resetPassword(email.trim(), code.trim(), password);
      setDone(true);
    } catch (err) {
      setServerError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Password updated
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          You're all set — you're now signed in with your new password.
        </p>
        <div className="mt-7">
          <Button variant="primary" size="lg" className="w-full" onClick={() => navigate("/dashboard")}>
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Reset password
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        Choose a new password for your account.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4.5" noValidate>
        <Field label="Email address" htmlFor="reset-email" error={errors.email}>
          <Input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((er) => ({ ...er, email: "" })); }}
            error={errors.email}
          />
        </Field>

        <Field label="Reset code" htmlFor="reset-code" error={errors.code} hint="The 6-digit code we emailed you.">
          <Input
            id="reset-code"
            name="code"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setErrors((er) => ({ ...er, code: "" })); }}
            error={errors.code}
          />
        </Field>

        <Field label="New password" htmlFor="reset-password" error={errors.password} hint="Minimum 8 characters.">
          <PasswordInput
            id="reset-password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((er) => ({ ...er, password: "" })); }}
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
            Reset password
          </Button>
        </div>
      </form>

      <p className="mt-7 text-center text-xs text-slate-500 dark:text-slate-400">
        Remembered your password?{" "}
        <Link to="/login" className="font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
