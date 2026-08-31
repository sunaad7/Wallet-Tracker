import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, Sparkles, ArrowLeftRight, PiggyBank, Target,
  Repeat, Tags, Settings, Bell, Sun, Moon, Menu, X, Search, ChevronsLeft,
  ChevronsRight, Wallet, LogOut, UserRound, LifeBuoy,
} from "lucide-react";
import { cn } from "../lib/format.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { apiClient } from "../lib/api.js";
import { getMockNotifications } from "../lib/mock.js";

/* -------------------------------------------------------------------------- */
/* Small helpers                                                              */
/* -------------------------------------------------------------------------- */

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/analytics", label: "Analytics", icon: TrendingUp },
      { to: "/insights", label: "Insights", icon: Sparkles, badge: "New" },
    ],
  },
  {
    label: "Manage",
    items: [
      { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
      { to: "/budgets", label: "Budgets", icon: PiggyBank },
      { to: "/goals", label: "Goals", icon: Target },
      { to: "/recurring", label: "Recurring", icon: Repeat },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/categories", label: "Categories", icon: Tags },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const NOTIF_DOTS = {
  amber: "bg-amber-500",
  brand: "bg-brand-500",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
};

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/budgets": "Budgets",
  "/goals": "Goals",
  "/categories": "Categories",
  "/recurring": "Recurring payments",
  "/analytics": "Analytics",
  "/insights": "Insights",
  "/settings": "Settings",
};

function useClickOutside(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

/* -------------------------------------------------------------------------- */
/* Sidebar (desktop, collapsible)                                             */
/* -------------------------------------------------------------------------- */

import { useAuth } from "../context/AuthContext.jsx";

function SidebarContent({ collapsed, onNavigate }) {
  const { user } = useAuth();
  const displayName = user?.name || "User";
  const userInitials = displayName.split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn("flex h-16 items-center gap-2.5 border-b border-slate-200 px-4 dark:border-white/[0.06]", collapsed && "justify-center px-0")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Wallet size={16} strokeWidth={2.4} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[15px] leading-tight font-semibold tracking-tight text-slate-900 dark:text-white">
              Wallet Tracker
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                        collapsed && "justify-center px-0",
                        isActive
                          ? "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                      )
                    }
                  >
                    <item.icon size={17} strokeWidth={2} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="ml-auto rounded-full bg-blue-600 px-1.5 py-0.5 text-[9.5px] font-semibold text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User card */}
      {!collapsed && (
        <div className="border-t border-slate-200 p-3 dark:border-white/[0.06]">
          <div className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-white/[0.04] dark:bg-white/[0.03]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
              {userInitials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-slate-800 dark:text-slate-100">
                {displayName}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function Header({ onMenuClick, sidebarCollapsed, onToggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const notifRef = useClickOutside(() => setNotifOpen(false));
  const userRef = useClickOutside(() => setUserOpen(false));
  const searchInputRef = useRef(null);
  const [notifications, setNotifications] = useState(() => getMockNotifications());
  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((list) => list.map((n) => ({ ...n, read: true })));
  const markRead = (id) => setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const { user } = useAuth();
  const displayName = user?.name || "User";
  const userEmail = user?.email || "user@wallettracker.dev";
  const userInitials = displayName.split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";

  const title = PAGE_TITLES[location.pathname] || "Wallet Tracker";

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(false);
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white dark:border-white/[0.06] dark:bg-slate-900">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:hidden dark:hover:bg-white/5 dark:hover:text-white cursor-pointer"
        >
          <Menu size={19} />
        </button>

        {/* Sidebar collapse (desktop) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:flex dark:hover:bg-white/5 dark:hover:text-slate-200 cursor-pointer"
        >
          {sidebarCollapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
        </button>

        <h1 className="truncate text-[15px] font-semibold tracking-tight text-slate-900 sm:text-base dark:text-white">
          {title}
        </h1>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          {/* Search */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:flex md:hidden dark:hover:bg-white/5 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Search"
          >
            <Search size={17} />
          </button>
          <div className="relative hidden md:block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search transactions…"
              aria-label="Search transactions"
              className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50 pr-3 pl-9 text-[13px] text-slate-700 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:w-72 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15 focus:outline-none lg:w-64 lg:focus:w-80 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:focus:border-blue-500 dark:focus:bg-slate-900"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 lg:block dark:border-white/10 dark:bg-slate-800 dark:text-slate-500">
              ⌘K
            </kbd>
          </div>

          <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block dark:bg-white/10" />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200 cursor-pointer"
          >
            <Sun size={17} className={cn("absolute transition-all duration-300", theme === "dark" ? "translate-y-0 rotate-0 opacity-100" : "-translate-y-6 rotate-90 opacity-0")} />
            <Moon size={17} className={cn("absolute transition-all duration-300", theme === "light" ? "translate-y-0 rotate-0 opacity-100" : "translate-y-6 -rotate-90 opacity-0")} />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => { setNotifOpen((o) => !o); setUserOpen(false); }}
              aria-label={`Notifications (${unread} unread)`}
              aria-expanded={notifOpen}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200 cursor-pointer"
            >
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-popover dark:border-white/10 dark:bg-slate-900 dark:shadow-popover-dark animate-scale-in z-50">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/[0.06]">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">Notifications</p>
                  {unread > 0 && (
                    <button type="button" onClick={markAllRead} className="cursor-pointer text-[11.5px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      Mark all read
                    </button>
                  )}
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => !n.read && markRead(n.id)}
                      className={cn(
                        "flex gap-3 border-b border-slate-50 px-4 py-3 last:border-0",
                        !n.read ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03]" : "opacity-70 dark:hover:bg-white/[0.03]"
                      )}
                    >
                      <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-slate-300 dark:bg-slate-600" : NOTIF_DOTS[n.tone] || "bg-slate-400")} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{n.body}</p>
                        <p className="mt-1 text-[10.5px] text-slate-400 dark:text-slate-500">{n.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Avatar / user menu */}
          <div className="relative" ref={userRef}>
            <button
              type="button"
              onClick={() => { setUserOpen((o) => !o); setNotifOpen(false); }}
              aria-label="Account menu"
              aria-expanded={userOpen}
              className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white ring-2 ring-white dark:ring-slate-900 cursor-pointer"
            >
              {userInitials}
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-popover dark:border-white/10 dark:bg-slate-900 dark:shadow-popover-dark animate-scale-in z-50">
                <div className="border-b border-slate-100 px-4 py-2.5 dark:border-white/[0.06]">
                  <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">{displayName}</p>
                  <p className="truncate text-[11.5px] text-slate-400 dark:text-slate-500">{userEmail}</p>
                </div>
                {[
                  { icon: UserRound, label: "Profile", action: () => navigate("/settings") },
                  { icon: Settings, label: "Settings", action: () => navigate("/settings") },
                  { icon: LifeBuoy, label: "Help & support", action: () => navigate("/help") },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    <item.icon size={15} /> {item.label}
                  </button>
                ))}
                <div className="my-1 h-px bg-slate-100 dark:bg-white/[0.06]" />
                <button
                  type="button"
                  onClick={() => apiClient.auth.logout()}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search modal (mobile) */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-0 z-50 border-b border-slate-200 bg-white p-3 shadow-popover md:hidden dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input autoFocus type="search" placeholder="Search transactions…" aria-label="Search transactions"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pr-3 pl-9 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:outline-none dark:border-white/10 dark:bg-white/5" />
            </div>
            <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
              <X size={17} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden border-r border-slate-200 bg-white lg:block dark:border-white/[0.06] dark:bg-slate-900",
          sidebarCollapsed ? "w-[76px]" : "w-64"
        )}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-slate-950/45 animate-fade-in dark:bg-slate-950/60"
            />
            <div
              className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white shadow-popover animate-slide-up dark:bg-slate-900"
            >
              <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Wallet size={15} strokeWidth={2.4} />
                  </div>
                  <p className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">Wallet Tracker</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation menu"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <X size={17} />
                </button>
              </div>
              <div className="h-[calc(100%-4rem)] overflow-y-auto">
                <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          </div>
        )}

      {/* Main column */}
      <div className={cn("flex min-h-dvh flex-col", sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        <Header
          onMenuClick={() => setMobileOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>

        <footer className="px-4 pb-6 text-center text-xs text-slate-400 sm:px-6 lg:px-8 dark:text-slate-600">
          © {new Date().getFullYear()} Wallet Tracker
        </footer>
      </div>
    </div>
  );
}
