import { Link, Navigate } from "react-router-dom";
import { Wallet, ArrowRight, Sun, Moon, PiggyBank, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const BLURBS = [
  {
    icon: PiggyBank,
    title: "Category budgets",
    body: "Set monthly limits and see live progress across every category.",
  },
  {
    icon: Lock,
    title: "Your data stays yours",
    body: "No ads, no data resale. Your financial records are private.",
  },
];

function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-paper/85 backdrop-blur-md dark:border-white/[0.06] dark:bg-abyss/85">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-8 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Wallet Tracker home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Wallet size={15} strokeWidth={2.4} />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight text-night dark:text-white">
            Wallet Tracker
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-night dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white cursor-pointer"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link
            to="/login"
            className="hidden rounded-lg px-3.5 py-2 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-200/60 hover:text-night md:block dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 sm:px-4 sm:text-[13px]"
          >
            <span className="hidden sm:inline">Open a ledger</span>
            <span className="sm:hidden">Sign up</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Landing() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="no-scrollbar min-h-dvh bg-paper text-slate-900 antialiased dark:bg-abyss dark:text-slate-100">
      <Header />
      <main className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-6xl flex-col items-center justify-center px-5 py-12 text-center sm:px-8">
        <p className="animate-rise font-mono text-[11px] font-medium tracking-[0.22em] text-blue-600 uppercase dark:text-blue-400">
          Personal finance, read at a glance
        </p>

        <h1
          className="animate-rise mt-5 max-w-3xl font-display text-4xl leading-[1.08] font-bold tracking-tight text-night sm:text-5xl lg:text-6xl dark:text-white"
          style={{ animationDelay: "60ms" }}
        >
          Personal finance, without the guesswork.
        </h1>

        <p
          className="animate-rise mt-6 max-w-xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400"
          style={{ animationDelay: "120ms" }}
        >
          Track income and spending, set budgets, and keep a clear financial
          picture — all in one private ledger.
        </p>

        <div
          className="animate-rise mt-10 grid w-full max-w-2xl gap-4 text-left sm:grid-cols-2"
          style={{ animationDelay: "180ms" }}
        >
          {BLURBS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-white/[0.08] dark:bg-slate-900 sm:text-left"
            >
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 sm:mx-0">
                <Icon size={18} strokeWidth={2} />
              </span>
              <p className="font-display text-[15px] font-semibold tracking-tight text-night dark:text-white">
                {title}
              </p>
              <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                {body}
              </p>
            </div>
          ))}
        </div>

        <div
          className="animate-rise mt-10 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
          >
            Sign up free
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
}