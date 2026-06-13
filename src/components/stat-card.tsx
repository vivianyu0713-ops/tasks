import type { LucideIcon, LucideProps } from "lucide-react";
import type { ReactNode, ForwardRefExoticComponent, RefAttributes } from "react";

type IconLike =
  | LucideIcon
  | ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone,
  active = false,
  onClick,
}: {
  title: string;
  value: number;
  hint: string;
  icon: IconLike;
  tone?: {
    ring?: string;
    bg?: string;
    text?: string;
    icon?: string;
  };
  active?: boolean;
  onClick?: () => void;
}) {
  const isClickable = typeof onClick === "function";
  const toneClass = tone
    ? `bg-gradient-to-br ${tone.bg} ${tone.text} ${tone.ring}`
    : "bg-white border-slate-200 text-slate-700 ring-slate-100";

  const className = `rounded-3xl border p-4 shadow-sm transition duration-300 ${toneClass} ${
    isClickable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg" : ""
  } ${active && tone ? "ring-2 ring-offset-2 ring-offset-white" : "shadow-slate-200/50"}`;

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-sm font-medium ${tone?.text ?? "text-slate-500"}`}>{title}</span>
        <span className={`rounded-2xl p-2 ${tone?.icon ?? "bg-slate-100 text-slate-600"}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className={`mt-4 text-3xl font-semibold tracking-tight ${tone?.text ?? "text-slate-950"}`}>
        {value}
      </div>
      <p className={`mt-1 text-xs ${tone?.text ?? "text-slate-500"} opacity-80`}>{hint}</p>
    </>
  );

  if (isClickable) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
}
