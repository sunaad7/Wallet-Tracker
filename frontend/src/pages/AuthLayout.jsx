import { Outlet, Link } from "react-router-dom";
import { Wallet, ShieldCheck, PiggyBank, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import { cn } from "../lib/format.js";

const FEATURES = [
  {
    icon: PiggyBank,
    title: "Category budgets",
    body: "Set monthly limits and see live progress across every category.",
  },
  {
    icon: ShieldCheck,
    title: "Your data stays yours",
    body: "No ads, no data resale. Your financial records are private.",
  },
];

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-dvh bg-slate-50 dark:bg-slate-950">
      {/* Brand panel (desktop) */}
      <div className="relative hidden w-[46%] flex-col justify-between bg-slate-900 p-10 text-white lg:flex xl:p-14">
        <div className="flex items-center gap-2.5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Wallet size={17} strokeWidth={2.4} />
            </div>
            <p className="text-lg font-semibold tracking-tight">Wallet Tracker</p>
          </Link>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight xl:text-4xl">
            Personal finance, without the guesswork.
          </h2>
          <ul className="mt-10 space-y-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <f.icon size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-500">© {new Date().getFullYear()} Wallet Tracker</p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 flex-col justify-between">
        {/* Mobile brand + theme toggle */}
        <div className="relative z-10 flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Wallet size={16} strokeWidth={2.4} />
            </div>
            <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">Wallet Tracker</p>
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200 cursor-pointer"
          >
            <Sun size={17} className={cn("transition-opacity", theme === "dark" ? "opacity-0" : "opacity-100")} />
            <Moon size={17} className={cn("-ml-[17px] transition-opacity", theme === "dark" ? "opacity-100" : "opacity-0")} />
          </button>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10 sm:px-12">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-card dark:border-white/10 dark:bg-slate-900">
            <Outlet />
          </div>
        </div>

        <p className="relative z-10 pb-6 text-center text-xs text-slate-400 dark:text-slate-600">
          © {new Date().getFullYear()} Wallet Tracker
        </p>
      </div>
    </div>
  );
}
