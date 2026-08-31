import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Wallet, ArrowRight, Sun, Moon, ArrowBigDownDash, ArrowBigUpDash,
  Percent, ReceiptText, PiggyBank, Target, Repeat, Sparkles, TrendingUp, ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { cn } from "../lib/format.js";

/* -------------------------------------------------------------------------- */
/* Statement simulation (the signature)                                        */
/* -------------------------------------------------------------------------- */

const OPENING = 3650.0;

const STATEMENT = [
  { date: "01 MAR", desc: "Salary", amount: 3200.0, type: "income" },
  { date: "02 MAR", desc: "Rent", amount: 1200.0, type: "expense" },
  { date: "04 MAR", desc: "Groceries", amount: 212.4, type: "expense" },
  { date: "12 MAR", desc: "Freelance", amount: 480.0, type: "income" },
  { date: "15 MAR", desc: "Internet", amount: 118.2, type: "expense" },
  { date: "21 MAR", desc: "Dinner out", amount: 46.8, type: "expense" },
];

const runningBalances = STATEMENT.reduce(
  (acc, row) => {
    acc.push(acc[acc.length - 1] + (row.type === "income" ? row.amount : -row.amount));
    return acc;
  },
  [OPENING],
);

const money = (value) => `₹${Math.abs(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CURRENCY_WORDS = ["dollar", "rupee"];

function useCurrencyWordCycle(enabled) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setVisible(true);
      setIndex(0);
      return undefined;
    }
    const timers = [];
    const WORD_SHOWN_MS = 2400;
    const FADE_MS = 450;
    timers.push(
      setTimeout(() => {
        setVisible(false);
        timers.push(
          setTimeout(() => {
            setIndex((i) => (i + 1) % CURRENCY_WORDS.length);
            setVisible(true);
          }, FADE_MS),
        );
      }, WORD_SHOWN_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [enabled, index]);

  return { word: CURRENCY_WORDS[index] ?? CURRENCY_WORDS[0], visible };
}

function FadingCurrencyWord() {
  const reduced = usePrefersReducedMotion();
  const { word, visible } = useCurrencyWordCycle(!reduced);

  return (
    <span
      aria-label={reduced ? "dollar" : undefined}
      className={cn(
        "inline-block text-blue-600 transition-opacity duration-500 ease-out dark:text-blue-400",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {word}
    </span>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useStatementCycle(reduced) {
  const [posted, setPosted] = useState(reduced ? STATEMENT.length : 0);

  useEffect(() => {
    if (reduced) return undefined;
    const timers = [];
    timers.push(setTimeout(() => setPosted(0), 0));
    STATEMENT.forEach((_, i) => {
      timers.push(setTimeout(() => setPosted(i + 1), 900 * (i + 1) + 600));
    });
    timers.push(setTimeout(() => setPosted(0), 900 * STATEMENT.length + 600 + 900 + 3400));
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  return posted;
}

function StatementCard() {
  const reduced = usePrefersReducedMotion();
  const posted = useStatementCycle(reduced);
  const [display, setDisplay] = useState(OPENING);
  const displayRef = useRef(OPENING);

  const target = runningBalances[posted] ?? OPENING;

  useEffect(() => {
    if (reduced) {
      setDisplay(target);
      displayRef.current = target;
      return undefined;
    }
    const from = displayRef.current;
    const to = target;
    const duration = 550;
    let raf;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        displayRef.current = to;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);

  const allRowsShown = posted === STATEMENT.length;

  return (
    <div className="relative">
      {/* ambient glow, kept quiet */}
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-500/15 via-transparent to-money/15 blur-2xl dark:from-blue-500/20 dark:to-money/15" />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-30px_rgba(11,31,51,0.35)] dark:border-white/10 dark:bg-slate-900 dark:shadow-black/40">
        {/* statement header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-white/[0.06]">
          <p className="font-mono text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">
            Account statement
          </p>
          <p className="font-mono text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">
            Mar 2026
          </p>
        </div>

        {/* rows */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-[3.4rem_1fr_auto_auto] gap-x-3 font-mono text-[10px] tracking-[0.12em] text-slate-400 uppercase dark:text-slate-500">
            <span>Date</span>
            <span>Description</span>
            <span className="text-right">Amount</span>
            <span className="w-20 text-right">Balance</span>
          </div>
          <div className="mt-1.5 space-y-0">
            {STATEMENT.map((row, index) => {
              const show = index < posted;
              const income = row.type === "income";
              return (
                <div
                  key={`${row.date}-${row.desc}`}
                  style={show ? { transitionDelay: `${index * 40}ms` } : undefined}
                  className={cn(
                    "grid grid-cols-[3.4rem_1fr_auto_auto] gap-x-3 border-t border-slate-100 py-2 text-[12.5px] transition-all duration-500 dark:border-white/[0.05]",
                    show ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
                  )}
                >
                  <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{row.date}</span>
                  <span className="truncate pr-2 font-medium text-slate-700 dark:text-slate-200">{row.desc}</span>
                  <span className={cn("font-mono font-medium tabular-nums text-right", income ? "text-money" : "text-spend")}>
                    {income ? "+" : "−"}{Math.abs(row.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="w-20 pr-0.5 text-right font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                    {money(runningBalances[index + 1])}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* closing balance */}
        <div className="flex items-end justify-between border-t border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">Balance</p>
            <p className="mt-1 font-mono text-xs text-slate-400 dark:text-slate-500">As of 21 Mar</p>
          </div>
          <p
            role="status"
            aria-label={`Balance ${money(target)}`}
            className={cn("font-display text-[2rem] leading-none font-bold tracking-tight tabular-nums", allRowsShown ? "text-money" : "text-night dark:text-white")}
          >
            {money(display)}
          </p>
        </div>
      </div>

      {/* faint second sheet behind for depth */}
      <div aria-hidden className="absolute -right-3 -bottom-3 -z-10 h-full w-full rounded-2xl border border-slate-200/70 bg-white/60 dark:border-white/5 dark:bg-white/[0.03]" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sections                                                                    */
/* -------------------------------------------------------------------------- */

const FACT_STRIP = [
  { label: "Money in", value: "₹3,900.00", tone: "income", body: "Salary, freelance, investments", icon: ArrowBigDownDash },
  { label: "Money out", value: "₹1,577.60", tone: "expense", body: "Living, subscriptions, extras", icon: ArrowBigUpDash },
  { label: "Kept", value: "57%", tone: "income", body: "Of this month's income", icon: Percent },
];

const FEATURES = [
  { tag: "TX", icon: ReceiptText, title: "Transactions", body: "Search, filter, sort, and export every entry with running totals." },
  { tag: "BUDGET", icon: PiggyBank, title: "Budgets", body: "Set monthly limits per category and watch live progress." },
  { tag: "GOAL", icon: Target, title: "Goals", body: "Save toward what matters and stay on pace, month after month." },
  { tag: "RECUR", icon: Repeat, title: "Recurring", body: "Subscriptions tracked automatically, so nothing surprises you." },
  { tag: "INSIGHT", icon: Sparkles, title: "Insights", body: "Spending intelligence drawn from your own history, not a billboard." },
  { tag: "ANALYTICS", icon: TrendingUp, title: "Analytics", body: "Monthly cash flow and category breakdowns at a glance." },
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

        <nav aria-label="Landing" className="hidden items-center gap-7 md:flex">
          <a href="#reads" className="text-[13px] font-medium text-slate-500 transition-colors hover:text-night dark:text-slate-400 dark:hover:text-white">
            How it reads
          </a>
          <a href="#features" className="text-[13px] font-medium text-slate-500 transition-colors hover:text-night dark:text-slate-400 dark:hover:text-white">
            Features
          </a>
          <a href="#join" className="text-[13px] font-medium text-slate-500 transition-colors hover:text-night dark:text-slate-400 dark:hover:text-white">
            Get started
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
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
            className="hidden rounded-lg px-3.5 py-2 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-200/60 hover:text-night sm:block dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Open a ledger
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pt-14 pb-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-20 lg:pb-24">
      <div>
        <p className="animate-rise font-mono text-[11px] font-medium tracking-[0.22em] text-blue-600 uppercase dark:text-blue-400">
          Personal finance, read at a glance
        </p>
        <h1 className="animate-rise mt-5 font-display text-4xl leading-[1.05] font-bold tracking-tight text-night sm:text-5xl lg:text-[3.6rem] dark:text-white" style={{ animationDelay: "60ms" }}>
          Every <FadingCurrencyWord />,
          <br />
          <span className="text-blue-600 dark:text-blue-400">accounted for.</span>
        </h1>
        <p className="animate-rise mt-6 max-w-md text-[15px] leading-relaxed text-slate-500 dark:text-slate-400" style={{ animationDelay: "120ms" }}>
          Wallet Tracker turns your income and spending into one clear, running
          balance — with budgets, goals, and trends built in. No spreadsheet, no guesswork.
        </p>

        <div className="animate-rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "180ms" }}>
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
          >
            Open your ledger
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#reads"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            See how it reads
            <ChevronDown size={15} />
          </a>
        </div>

        <div className="animate-rise mt-9 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] tracking-[0.14em] text-slate-400 uppercase dark:text-slate-500" style={{ animationDelay: "240ms" }}>
          <span>No ads</span>
          <span>No data resale</span>
          <span>Your data, yours</span>
        </div>
      </div>

      <div className="animate-rise" style={{ animationDelay: "200ms" }}>
        <StatementCard />
      </div>
    </section>
  );
}

function ReadsSection() {
  return (
    <section id="reads" className="border-y border-slate-200/80 bg-white py-16 sm:py-20 dark:border-white/[0.06] dark:bg-slate-900/40">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-blue-600 uppercase dark:text-blue-400">
          The story
        </p>
        <h2 className="mt-4 max-w-xl font-display text-3xl font-bold tracking-tight text-night sm:text-4xl dark:text-white">
          Your whole financial story in three lines.
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
          No dashboards full of charts you have to decode. The three numbers
          that matter, kept honest every day.
        </p>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {FACT_STRIP.map((item, index) => (
            <div
              key={item.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-paper p-6 transition-colors hover:border-slate-300 dark:border-white/[0.08] dark:bg-white/[0.03]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] font-medium tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">{item.label}</p>
                <item.icon
                  size={16}
                  className={cn(item.tone === "income" ? "text-money" : "text-spend")}
                  strokeWidth={2.2}
                />
              </div>
              <p
                className={cn(
                  "mt-4 font-display text-3xl font-bold tracking-tight tabular-nums",
                  item.tone === "income" ? "text-money" : "text-spend",
                )}
              >
                {item.value}
              </p>
              <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-blue-600 uppercase dark:text-blue-400">
          The whole ledger
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-night sm:text-4xl dark:text-white">
          Everything your money does, in one place.
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
          Built to feel like a well-kept ledger — precise, searchable, and
          impossible to lose track of.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_16px_40px_-24px_rgba(37,99,235,0.5)] dark:border-white/[0.08] dark:bg-slate-900 dark:hover:border-blue-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
                  <feature.icon size={18} strokeWidth={2} />
                </span>
                <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-slate-300 dark:text-slate-600">{feature.tag}</span>
              </div>
              <p className="mt-5 text-[15px] font-semibold tracking-tight text-night dark:text-white">{feature.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JoinSection() {
  return (
    <section id="join" className="px-5 pb-20 sm:px-8">
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-night px-6 py-16 text-center text-white sm:px-10 sm:py-20">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_120%_at_50%_-20%,rgba(37,99,235,0.35),transparent_70%)]" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative">
          <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-blue-300 uppercase">
            Start today
          </p>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl leading-tight font-bold tracking-tight sm:text-5xl">
            Open your ledger,<br />and keep it honest.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-slate-300">
            Free to start, private by design, quick to learn. Your first
            statement is one account away.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-night transition-colors hover:bg-blue-50"
            >
              Start free
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200/70 py-10 dark:border-white/[0.06]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-5 px-5 sm:flex-row sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Wallet size={13} strokeWidth={2.4} />
          </span>
          <p className="font-display text-[13px] font-semibold tracking-tight text-night dark:text-white">Wallet Tracker</p>
        </div>
        <div className="flex items-center gap-5 text-[12.5px] text-slate-400 dark:text-slate-500">
          <Link to="/login" className="hover:text-slate-600 dark:hover:text-slate-300">Sign in</Link>
          <Link to="/register" className="hover:text-slate-600 dark:hover:text-slate-300">Create account</Link>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function Landing() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-dvh bg-paper text-slate-900 antialiased dark:bg-abyss dark:text-slate-100">
      <Header />
      <main>
        <Hero />
        <ReadsSection />
        <FeaturesSection />
        <JoinSection />
      </main>
      <Footer />
    </div>
  );
}