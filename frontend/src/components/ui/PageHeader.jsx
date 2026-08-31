export default function PageHeader({ title, subtitle, description, breadcrumbs, action, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        {breadcrumbs?.length > 0 && <p className="mb-1 text-xs text-slate-400 dark:text-slate-500">{breadcrumbs.map((item) => item.label).join('  /  ')}</p>}
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">{title}</h1>
        {(subtitle || description) && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">{subtitle || description}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">{actions || action}</div>
    </div>
  );
}
