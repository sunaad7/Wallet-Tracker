export default function PageHeader({ title, subtitle, description, breadcrumbs, action, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs?.length > 0 && <p className="mb-1 text-xs text-slate-400 dark:text-slate-500">{breadcrumbs.map((item) => item.label).join('  /  ')}</p>}
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight sm:text-2xl">{title}</h1>
        {(subtitle || description) && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">{subtitle || description}</p>}
      </div>
      <div className="flex items-center gap-2.5 shrink-0 sm:gap-3">{actions || action}</div>
    </div>
  );
}
