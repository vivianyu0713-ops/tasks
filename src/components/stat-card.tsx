import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: number;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{title}</span>
        <span className="rounded-2xl bg-slate-100 p-2 text-slate-600">
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
