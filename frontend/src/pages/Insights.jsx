import { useEffect, useState } from "react";
import { TriangleAlert, PiggyBank, Lightbulb, Rocket, ArrowRight, RefreshCw } from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Form.jsx";
import Badge from "../components/ui/Badge.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { apiClient } from "../lib/api.js";
import { cn } from "../lib/format.js";

const TYPE_META = {
  warning: { icon: TriangleAlert, label: "Needs attention", tone: "danger", chip: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" },
  savings: { icon: PiggyBank, label: "Savings found", tone: "success", chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
  opportunity: { icon: Rocket, label: "Opportunity", tone: "brand", chip: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
  tip: { icon: Lightbulb, label: "Tip", tone: "brand", chip: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" },
};

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const toast = useToast();

  useEffect(() => {
    apiClient.insights.list().then((list) => {
      setInsights(list);
      setLoading(false);
    });
  }, []);

  async function regenerate() {
    setRegenerating(true);
    try {
      const fresh = await apiClient.insights.regenerate();
      setInsights(fresh);
      toast.success?.("Insights refreshed");
    } finally {
      setRegenerating(false);
    }
  }

  const savings = insights.filter((i) => i.type === "savings").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insights"
        description="Anomalies, unused subscriptions, and savings opportunities detected from your spending."
        breadcrumbs={[{ label: "Overview" }, { label: "Insights" }]}
        actions={
          <Button variant="secondary" icon={RefreshCw} loading={regenerating} onClick={regenerate}>
            Analyze again
          </Button>
        }
      />

      {/* Summary strip */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              {insights.length} insights identified
            </p>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Including <span className="font-semibold text-emerald-600 dark:text-emerald-400">{savings} savings opportunities</span> this month.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={RefreshCw}
            loading={regenerating}
            onClick={regenerate}
          >
            Re-scan data
          </Button>
        </div>
      </Card>

      {/* Insight cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {insights.map((insight) => {
            const meta = TYPE_META[insight.type] || TYPE_META.tip;
            return (
              <Card key={insight.id} className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", meta.chip)}>
                        <meta.icon size={18} strokeWidth={2.2} />
                      </span>
                      <Badge tone={meta.tone} dot>{meta.label}</Badge>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 tabular-nums dark:bg-white/5 dark:text-slate-400">
                      {insight.metric}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                    {insight.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {insight.body}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => toast.success?.(`Applied: ${insight.title}`)}
                    className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    <span>{insight.action}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
