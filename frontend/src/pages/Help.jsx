import { useState } from "react";
import {
  LifeBuoy, ChevronDown, Wallet, ArrowLeftRight, PiggyBank, Target, Repeat,
  BarChart3, Sparkles, Bell, Mail, MessageSquareText,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Card, CardContent } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Form.jsx";
import { cn } from "../lib/format.js";

const GUIDE_STEPS = [
  {
    icon: Wallet,
    title: "Add income & expenses",
    body: "Head to Transactions and hit “Add transaction”. Pick a type, category, amount, and date. Everything updates instantly.",
  },
  {
    icon: PiggyBank,
    title: "Set monthly budgets",
    body: "Budgets let you cap spending per category. Cross 80% and you’ll get an alert; exceed it and you’ll know.",
  },
  {
    icon: Target,
    title: "Track financial goals",
    body: "Create a goal, set a target and deadline, then contribute funds over time to watch progress grow.",
  },
  {
    icon: Repeat,
    title: "Automate recurring payments",
    body: "Rent, subscriptions, salaries — schedule them once and Wallet Tracker posts the transaction on the due date.",
  },
  {
    icon: BarChart3,
    title: "Understand your spending",
    body: "Analytics gives you month-over-month trends and category breakdowns so you always know where money goes.",
  },
  {
    icon: Sparkles,
    title: "Read your insights",
    body: "AI-style insights flag overspending, surface subscriptions you can review, and suggest savings you can act on.",
  },
];

const FAQS = [
  {
    q: "How do I add my first transaction?",
    a: "Open the Transactions page, click “Add transaction”, choose expense or income, pick a category, enter the amount and date, then save. It appears on the dashboard immediately.",
  },
  {
    q: "How do budget alerts work?",
    a: "Budget alerts fire at 80% usage of a category budget and again when the budget is exceeded. Alerts appear as notifications in the bell icon in the top bar.",
  },
  {
    q: "Can recurring payments be paused?",
    a: "Yes. Open Recurring payments and toggle a payment off. It stays saved but won’t post new transactions until you turn it back on.",
  },
  {
    q: "How do insights get calculated?",
    a: "Insights are computed from your real transaction data — top spending categories, overspending compared to the previous month, subscription reviews, and goal pacing.",
  },
  {
    q: "How do I change my currency or name?",
    a: "Go to Settings → Profile & Preferences. Pick your operating currency and update your display name, then click “Save changes”.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Every transaction, budget, goal, and category is scoped to your account and protected by JWT authentication.",
  },
];

function FaqItem({ faq, open, onToggle }) {
  return (
    <div className="border-b border-slate-100 last:border-0 dark:border-white/[0.06]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
      >
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{faq.q}</span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div className={cn("grid transition-all duration-200", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{faq.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Help() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Help & support"
        description="Get the most out of Wallet Tracker — guides, answers, and a way to reach us."
        breadcrumbs={[{ label: "Account" }, { label: "Help & support" }]}
        actions={
          <Button variant="primary" size="md" icon={MessageSquareText} onClick={() => window.open("mailto:support@wallettracker.app?subject=Wallet%20Tracker%20support%20request")}>
            Contact support
          </Button>
        }
      />

      <Card>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <ArrowLeftRight size={18} strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Getting started</h2>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Six steps to making Wallet Tracker work for you.</p>
          </div>
        </div>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDE_STEPS.map((step, index) => (
              <div key={step.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <step.icon size={15} strokeWidth={2.4} />
                  </span>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Step {index + 1}</p>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{step.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <LifeBuoy size={18} strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Frequently asked questions</h2>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Quick answers to common questions.</p>
          </div>
        </div>
        <div>
          {FAQS.map((faq, index) => (
            <FaqItem key={faq.q} faq={faq} open={openIndex === index} onToggle={() => setOpenIndex(openIndex === index ? -1 : index)} />
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Bell size={18} strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Still need help?</h2>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Our team is happy to answer any question.</p>
          </div>
        </div>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400">
                <Mail size={17} />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">support@wallettracker.app</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">We usually reply within 24 hours.</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" icon={Mail} onClick={() => window.open("mailto:support@wallettracker.app?subject=Wallet%20Tracker%20support%20request")}>
              Send an email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
