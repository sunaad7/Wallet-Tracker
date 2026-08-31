import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./pages/AuthLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Landing from "./pages/Landing.jsx";
import { Wallet } from "lucide-react";

// Code-splitting: each page loads only when first visited.
// The shell (Layout) stays eager so first paint is instant.
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Transactions = lazy(() => import("./pages/Transactions.jsx"));
const Budgets = lazy(() => import("./pages/Budgets.jsx"));
const Goals = lazy(() => import("./pages/Goals.jsx"));
const Categories = lazy(() => import("./pages/Categories.jsx"));
const Recurring = lazy(() => import("./pages/Recurring.jsx"));
const Analytics = lazy(() => import("./pages/Analytics.jsx"));
const Insights = lazy(() => import("./pages/Insights.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Help = lazy(() => import("./pages/Help.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));

/** Branded fallback shown while a lazy page chunk downloads. */
function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading page">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-11 w-11 animate-pulse items-center justify-center rounded-xl bg-blue-600 text-white">
          <Wallet size={19} strokeWidth={2.4} />
        </div>
        <p className="text-xs font-medium tracking-widest text-slate-400 uppercase dark:text-slate-500">
          Loading…
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public landing */}
        <Route path="/" element={<Landing />} />

        {/* Signed-in shell (redirects to /login when logged out) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
        </Route>

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
