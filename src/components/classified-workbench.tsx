"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  FileText,
  Inbox,
  Kanban,
  LayoutDashboard,
  ListTodo,
  Plus,
  Radio,
  RotateCw,
  Sparkles,
  Table2,
  Zap,
} from "lucide-react";
import {
  processPaths,
  requirementPriorities,
  requirementStages,
  workItemCategories,
  workItemStatuses,
  type WorkItem,
  type WorkItemCategory,
} from "@/lib/work-item-types";

type WorkItemPatch = Partial<Omit<WorkItem, "reportedAt">> & {
  reportedAt?: string | null;
};
type QuickSave = (id: string, input: WorkItemPatch) => Promise<void>;

const navItems = [
  { id: "dashboard", label: "工作台", icon: LayoutDashboard },
  { id: "inbox", label: "收集箱", icon: Inbox },
  { id: "任务", label: "待归类", icon: ListTodo },
  { id: "需求", label: "需求", icon: FileText },
  { id: "线上问题", label: "线上问题", icon: AlertTriangle },
  { id: "逻辑答疑", label: "逻辑答疑", icon: Kanban },
] as const;

type ViewId = (typeof navItems)[number]["id"];
type ViewMode = "table" | "kanban";
type RequirementKanbanBy = "stage" | "priority" | "owner" | "risk";
type SaveStatus = "idle" | "saving" | "saved" | "error";
type DashboardFilter = "active" | "waiting" | "overdue" | "unclassified";
type RoutableCategory = Extract<WorkItemCategory, "任务" | "需求" | "线上问题" | "逻辑答疑">;
const routableCategories: RoutableCategory[] = ["任务", "需求", "线上问题", "逻辑答疑"];

function isRoutableCategory(category: WorkItemCategory): category is RoutableCategory {
  return routableCategories.includes(category as RoutableCategory);
}

const categoryTone: Record<WorkItemCategory, string> = {
  任务: "bg-slate-100 text-slate-700 ring-slate-200",
  需求: "bg-sky-100 text-sky-800 ring-sky-200",
  线上问题: "bg-orange-100 text-orange-800 ring-orange-200",
  逻辑答疑: "bg-violet-100 text-violet-800 ring-violet-200",
  日常待办: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  不承接: "bg-zinc-200 text-zinc-700 ring-zinc-300",
};

const categoryDisplay: Record<WorkItemCategory, string> = {
  任务: "待归类",
  需求: "需求",
  线上问题: "线上问题",
  逻辑答疑: "逻辑答疑",
  日常待办: "日常待办",
  不承接: "低价值",
};

const statusTone: Record<WorkItem["status"], string> = {
  已记录: "bg-slate-100 text-slate-700 ring-slate-200",
  处理中: "bg-blue-100 text-blue-800 ring-blue-200",
  待反馈: "bg-amber-100 text-amber-800 ring-amber-200",
  待验证: "bg-cyan-100 text-cyan-800 ring-cyan-200",
  已完成: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  暂不处理: "bg-zinc-200 text-zinc-700 ring-zinc-300",
};

const priorityTone: Record<string, string> = {
  "P0 - 重要紧急": "bg-rose-100 text-rose-800 ring-rose-200",
  "P1 - 高优项目": "bg-amber-100 text-amber-800 ring-amber-200",
  "P2 - 常规项目": "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

const stageTone: Record<string, string> = {
  待澄清: "bg-slate-100 text-slate-700 ring-slate-200",
  待评审: "bg-violet-100 text-violet-800 ring-violet-200",
  待开发: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  开发中: "bg-blue-100 text-blue-800 ring-blue-200",
  测试中: "bg-cyan-100 text-cyan-800 ring-cyan-200",
  待上线: "bg-amber-100 text-amber-800 ring-amber-200",
  已上线: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  业务交付: "bg-teal-100 text-teal-800 ring-teal-200",
  暂缓: "bg-zinc-200 text-zinc-700 ring-zinc-300",
};

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function isActive(item: WorkItem) {
  return !["已完成", "暂不处理"].includes(item.status);
}

function isOverdue(item: WorkItem) {
  return Boolean(item.expectedDoneAt && isActive(item) && new Date(item.expectedDoneAt).getTime() < Date.now());
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  accent = "sky",
  active = false,
  onClick,
}: {
  title: string;
  value: number;
  hint: string;
  icon: typeof LayoutDashboard;
  accent?: "sky" | "amber" | "slate" | "emerald" | "rose";
  active?: boolean;
  onClick?: () => void;
}) {
  const accentClass = {
    sky: "from-sky-100 to-cyan-50 text-sky-700 ring-sky-100",
    amber: "from-amber-100 to-orange-50 text-amber-700 ring-amber-100",
    slate: "from-slate-100 to-slate-50 text-slate-700 ring-slate-100",
    emerald: "from-emerald-100 to-teal-50 text-emerald-700 ring-emerald-100",
    rose: "from-rose-100 to-orange-50 text-rose-700 ring-rose-100",
  }[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[28px] border p-4 text-left shadow-xl shadow-slate-200/60 ring-1 transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-2xl hover:shadow-sky-100/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${
        active ? "border-sky-300 bg-white ring-sky-200" : "border-white/80 bg-white/80 ring-slate-200/70"
      }`}
    >
      <div className={`absolute -right-12 -top-12 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl ${accentClass}`} />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <span className={`rounded-2xl bg-gradient-to-br p-2 ring-1 ${accentClass}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
        <span className={`h-1.5 flex-1 rounded-full bg-gradient-to-r ${active ? "from-sky-400 to-cyan-300" : "from-slate-200 to-slate-100"}`} />
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
    </button>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tone ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      {children}
    </span>
  );
}

function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (total <= pageSize) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-slate-100 bg-white/80 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>
        共 {total} 条，每页 {pageSize} 条，第 {page} / {pageCount} 页
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          上一页
        </button>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          下一页
        </button>
      </div>
    </div>
  );
}

function getPagedItems<T>(items: T[], page: number, pageSize: number) {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

function EditableText({
  value,
  placeholder,
  onSave,
}: {
  value?: string | null;
  placeholder?: string;
  onSave: (value: string | null) => void;
}) {
  return (
    <input
      defaultValue={value ?? ""}
      placeholder={placeholder}
      onClick={(event) => event.stopPropagation()}
      onBlur={(event) => {
        const nextValue = event.currentTarget.value.trim() || null;
        if (nextValue !== (value ?? null)) onSave(nextValue);
      }}
      className="w-full min-w-28 rounded-xl border border-transparent bg-transparent px-2 py-1 text-sm text-slate-700 outline-none transition hover:border-slate-200 hover:bg-white focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
    />
  );
}

function EditableDateTime({
  value,
  onSave,
}: {
  value?: string | null;
  onSave: (value: string | null) => void;
}) {
  return (
    <input
      type="datetime-local"
      defaultValue={toDateTimeLocal(value)}
      onClick={(event) => event.stopPropagation()}
      onBlur={(event) => {
        const nextValue = event.currentTarget.value || null;
        if (nextValue !== toDateTimeLocal(value)) onSave(nextValue);
      }}
      className="w-full min-w-36 rounded-xl border border-transparent bg-transparent px-2 py-1 text-sm text-slate-700 outline-none transition hover:border-slate-200 hover:bg-white focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
    />
  );
}

function EditableSelect<T extends string>({
  value,
  options,
  placeholder,
  onSave,
}: {
  value?: T | null;
  options: readonly T[];
  placeholder?: string;
  onSave: (value: T | null) => void;
}) {
  return (
    <div className="relative min-w-28">
      <select
        value={value ?? ""}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onSave((event.currentTarget.value || null) as T | null)}
        className={`w-full appearance-none rounded-xl border px-3 py-1.5 pr-8 text-sm outline-none transition hover:border-slate-300 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 ${
          value ? "border-slate-200 bg-white text-slate-700" : "border-slate-100 bg-slate-50 text-slate-400"
        }`}
      >
        <option value="">{placeholder ?? "未设置"}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</span>
    </div>
  );
}

function RadarPanel({
  active,
  overdue,
  waiting,
  unclassified,
}: {
  active: number;
  overdue: number;
  waiting: number;
  unclassified: number;
}) {
  const signals = [
    { label: "待反馈", value: waiting, className: "left-[18%] top-[28%] bg-amber-300" },
    { label: "超期", value: overdue, className: "right-[20%] top-[36%] bg-orange-400" },
    { label: "待分流", value: unclassified, className: "bottom-[24%] left-[34%] bg-sky-300" },
  ];

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-slate-900/10 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-300/80">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_50%,rgba(56,189,248,0.24),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.1),rgba(2,6,23,0.92))]" />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-200">
            <Radio size={14} />
            工作雷达
          </div>
          <h3 className="mt-4 text-xl font-semibold tracking-tight">今日信号扫描</h3>
          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
            把私聊、需求、线上问题和待分流事项压缩成一张态势图，先判断信号，再决定是否投入精力。
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-right backdrop-blur">
          <p className="text-xs text-slate-400">活跃信号</p>
          <p className="mt-1 text-3xl font-semibold text-sky-200">{active}</p>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-6 h-64 max-w-sm">
        <div className="absolute inset-8 rounded-full border border-sky-200/10" />
        <div className="absolute inset-16 rounded-full border border-sky-200/10" />
        <div className="absolute inset-24 rounded-full border border-sky-200/10" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-sky-100/10" />
        <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-sky-100/10" />
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_20deg,transparent_0deg,rgba(56,189,248,0.28)_48deg,transparent_86deg)]" />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-200 shadow-[0_0_30px_rgba(56,189,248,0.9)]" />
        {signals.map((signal) => (
          <div key={signal.label} className={`absolute ${signal.className} h-3 w-3 rounded-full shadow-[0_0_22px_currentColor]`}>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-slate-950/80 px-2 py-1 text-[11px] text-slate-200 backdrop-blur">
              {signal.label} {signal.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FocusTable({
  items,
  onNavigate,
  pageSize = 5,
}: {
  items: WorkItem[];
  onNavigate: (category: WorkItemCategory) => void;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedItems = getPagedItems(items, safePage, pageSize);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold text-slate-500">
            <tr>
              {["标题", "所属事项", "提出人", "对接人", "下一步", "状态"].map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>暂无需要聚焦的事项</td>
              </tr>
            ) : (
              pagedItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onNavigate(item.category)}
                  className="cursor-pointer transition duration-200 hover:bg-sky-50/80"
                >
                  <td className="max-w-60 truncate px-4 py-4 font-semibold text-slate-950">{item.title}</td>
                  <td className="px-4 py-3"><Badge tone={categoryTone[item.category]}>{categoryDisplay[item.category]}</Badge></td>
                  <td className="px-4 py-3 text-slate-600">{item.requester || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.rdOwner || item.owner || "-"}</td>
                  <td className="max-w-44 truncate px-4 py-3 text-slate-600">{item.nextAction || "-"}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone[item.status]}>{item.status}</Badge></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={safePage} pageCount={pageCount} total={items.length} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
}

function Dashboard({
  items,
  onNavigate,
}: {
  items: WorkItem[];
  onNavigate: (category: WorkItemCategory) => void;
}) {
  const [filter, setFilter] = useState<DashboardFilter>("active");
  const active = items.filter(isActive);
  const overdue = active.filter(isOverdue);
  const waiting = active.filter((item) => item.status === "待反馈");
  const unclassified = items.filter((item) => item.category === "任务" && item.status === "已记录");
  const focusSource = {
    active,
    waiting,
    overdue,
    unclassified,
  }[filter];
  const focus = [...focusSource].sort((left, right) => {
    if (isOverdue(left) !== isOverdue(right)) return isOverdue(left) ? -1 : 1;
    return new Date(right.reportedAt).getTime() - new Date(left.reportedAt).getTime();
  });
  const filterMeta: Record<DashboardFilter, { title: string; hint: string }> = {
    active: { title: "待处理事项", hint: "未完成、未暂不处理的所有事项。" },
    waiting: { title: "待反馈事项", hint: "需要等业务、研发或其他对接人反馈的事项。" },
    overdue: { title: "已超期事项", hint: "超过预期时间但还没有结束的事项。" },
    unclassified: { title: "待分流事项", hint: "仍在待归类池，需要判断归属和下一步。" },
  };

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-[36px] border border-white/80 bg-white/75 p-5 shadow-2xl shadow-slate-200/70 ring-1 ring-slate-200/70 backdrop-blur">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-sky-200">
              <Zap size={14} />
              今日调度
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">先看风险，再决定投入顺序</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              首页只回答三个问题：现在有多少事、哪类最消耗精力、下一步先处理什么。
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500 shadow-lg shadow-slate-200/50">
            当前筛选：<span className="font-semibold text-slate-950">{filterMeta[filter].title}</span>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="待处理" value={active.length} hint="需要继续推进" icon={LayoutDashboard} accent="sky" active={filter === "active"} onClick={() => setFilter("active")} />
          <StatCard title="待反馈" value={waiting.length} hint="等待对接人反馈" icon={Clock3} accent="amber" active={filter === "waiting"} onClick={() => setFilter("waiting")} />
          <StatCard title="已超期" value={overdue.length} hint="超过预期时间" icon={AlertTriangle} accent="rose" active={filter === "overdue"} onClick={() => setFilter("overdue")} />
          <StatCard title="待分流" value={unclassified.length} hint="仍属于待归类池" icon={Inbox} accent="slate" active={filter === "unclassified"} onClick={() => setFilter("unclassified")} />
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_420px]">
        <section className="overflow-hidden rounded-[36px] border border-white/70 bg-white/90 p-5 shadow-2xl shadow-slate-200/70 ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
                <Zap size={14} />
                工作聚焦队列
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{filterMeta[filter].title}</h2>
              <p className="mt-1 text-sm text-slate-500">{filterMeta[filter].hint}</p>
            </div>
            <Badge tone="bg-sky-100 text-sky-800 ring-sky-200">{String(focus.length)} 条</Badge>
          </div>
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200/80">
            <FocusTable items={focus} onNavigate={onNavigate} />
          </div>
        </section>
        <RadarPanel
          active={active.length}
          overdue={overdue.length}
          waiting={waiting.length}
          unclassified={unclassified.length}
        />
      </div>
    </div>
  );
}

function InboxForm({
  saving,
  onSubmit,
}: {
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [draft, setDraft] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<WorkItemCategory>("任务");
  const [categoryTouched, setCategoryTouched] = useState(false);

  const recommendation = useMemo(() => {
    const text = draft.toLowerCase();
    if (/订单|异常|报错|数据不对|线上|bug|失败/.test(text)) {
      return {
        category: "线上问题" as WorkItemCategory,
        path: "研发排查",
        hint: "建议补充影响范围、发生时间和排查负责人。",
        tone: "bg-orange-100 text-orange-800 ring-orange-200",
      };
    }
    if (/需求|功能|上线|原型|开发|迭代/.test(text)) {
      return {
        category: "需求" as WorkItemCategory,
        path: "转需求",
        hint: "建议补充需求文档、对接研发、预计上线时间和业务节点。",
        tone: "bg-sky-100 text-sky-800 ring-sky-200",
      };
    }
    if (/规则|逻辑|为什么|口径|流程|答疑/.test(text)) {
      return {
        category: "逻辑答疑" as WorkItemCategory,
        path: "逻辑答复",
        hint: "建议补充涉及规则、答复结论和是否需要沉淀文档。",
        tone: "bg-violet-100 text-violet-800 ring-violet-200",
      };
    }
    return {
      category: "任务" as WorkItemCategory,
      path: "暂不处理",
      hint: "先进入待归类池，后续可直接在表格里改成需求、问题或答疑。",
      tone: "bg-slate-100 text-slate-700 ring-slate-200",
    };
  }, [draft]);

  const effectiveCategory = categoryTouched && isRoutableCategory(selectedCategory) ? selectedCategory : recommendation.category;

  return (
    <form onSubmit={onSubmit} className="relative mx-auto max-w-[760px] overflow-hidden rounded-[36px] border border-white/80 bg-white p-8 shadow-2xl shadow-slate-200/80 ring-1 ring-slate-200/80">
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="absolute -bottom-28 left-10 h-56 w-56 rounded-full bg-orange-200/30 blur-3xl" />
      <div className="relative grid gap-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-sky-200">
              <Sparkles size={14} />
              智能收集台
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">把刚收到的事情丢进来</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            像登录页一样只聚焦一个动作：先记录信号，再让系统帮你推荐归属和补充字段。
          </p>
        </div>

        <textarea
          name="description"
          required
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="例如：林佳得反馈 AI 公海分配规则不对，影响线索流转，明天前需要确认是否转需求..."
          className="min-h-36 rounded-[28px] border border-slate-200 bg-slate-50/80 px-5 py-4 text-base leading-7 text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />

        <div className={`rounded-[24px] px-5 py-4 text-sm ring-1 ${recommendation.tone}`}>
          <p className="font-semibold">推荐：{categoryDisplay[recommendation.category]} · {recommendation.path}</p>
          <p className="mt-1 text-xs opacity-80">{recommendation.hint}</p>
        </div>

        <input type="hidden" name="category" value={effectiveCategory} />

        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="选择事项分类">
          {routableCategories.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={effectiveCategory === option}
              onClick={() => {
                setCategoryTouched(true);
                setSelectedCategory(option);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${
                effectiveCategory === option ? "bg-slate-950 text-white ring-slate-950 shadow-lg shadow-slate-200" : categoryTone[option]
              }`}
            >
              {categoryDisplay[option]}
            </button>
          ))}
        </div>

        <div className="grid gap-3 rounded-[28px] border border-slate-200/80 bg-slate-50/70 p-4 md:grid-cols-2">
          <input name="requester" placeholder="提出人，可不填" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <input name="nextAction" placeholder="下一步动作，可不填" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
        </div>

        <button disabled={saving} className="mx-auto inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:bg-slate-400">
          <Plus size={18} />
          {saving ? "保存中" : "加入收集箱"}
        </button>
      </div>
    </form>
  );
}

function ItemTable({
  items,
  variant,
  onQuickSave,
  pageSize = 8,
}: {
  items: WorkItem[];
  variant: "task" | "requirement" | "incident" | "qa" | "generic";
  onQuickSave: QuickSave;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedItems = getPagedItems(items, safePage, pageSize);

  const headers =
    variant === "requirement"
      ? ["需求名称", "优先级", "推进阶段", "业务对接", "研发", "测试", "预期上线", "下一步", "风险"]
      : variant === "incident"
        ? ["问题现象", "影响范围", "处理路径", "排查结论", "状态", "操作"]
        : variant === "qa"
          ? ["问题", "提问人", "涉及规则", "答复结论", "需沉淀", "状态"]
          : ["标题", "所属事项", "提出人", "对接人", "预期解决", "下一步", "状态"];

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
            <tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={headers.length}>暂无数据</td>
              </tr>
            ) : (
              pagedItems.map((item) => (
                <tr key={item.id} className="transition duration-200 hover:bg-sky-50/70">
                {variant === "requirement" ? (
                  <>
                    <td className="px-4 py-3 font-medium text-slate-950"><EditableText value={item.title} placeholder="需求名称" onSave={(value) => value ? void onQuickSave(item.id, { title: value }) : undefined} /></td>
                    <td className="px-4 py-3">
                      <EditableSelect
                        value={item.requirementPriority}
                        options={requirementPriorities}
                        placeholder="优先级"
                        onSave={(value) => void onQuickSave(item.id, { requirementPriority: value })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EditableSelect
                        value={item.requirementStage}
                        options={requirementStages}
                        placeholder="阶段"
                        onSave={(value) => void onQuickSave(item.id, { requirementStage: value })}
                      />
                    </td>
                    <td className="px-4 py-3"><EditableText value={item.requester} placeholder="业务" onSave={(value) => void onQuickSave(item.id, { requester: value })} /></td>
                    <td className="px-4 py-3"><EditableText value={item.rdOwner || item.owner} placeholder="研发" onSave={(value) => void onQuickSave(item.id, { rdOwner: value })} /></td>
                    <td className="px-4 py-3"><EditableText value={item.testerOwner} placeholder="测试" onSave={(value) => void onQuickSave(item.id, { testerOwner: value })} /></td>
                    <td className="px-4 py-3"><EditableDateTime value={item.plannedLaunchAt} onSave={(value) => void onQuickSave(item.id, { plannedLaunchAt: value })} /></td>
                    <td className="px-4 py-3"><EditableText value={item.nextAction} placeholder="下一步" onSave={(value) => void onQuickSave(item.id, { nextAction: value })} /></td>
                    <td className="px-4 py-3"><EditableText value={item.riskNote} placeholder="风险" onSave={(value) => void onQuickSave(item.id, { riskNote: value })} /></td>
                  </>
                ) : variant === "incident" ? (
                  <>
                    <td className="px-4 py-3 font-medium text-slate-950"><EditableText value={item.title} placeholder="问题现象" onSave={(value) => value ? void onQuickSave(item.id, { title: value }) : undefined} /></td>
                    <td className="px-4 py-3"><EditableText value={item.impactScope} placeholder="影响范围" onSave={(value) => void onQuickSave(item.id, { impactScope: value })} /></td>
                    <td className="px-4 py-3">
                      <EditableSelect
                        value={item.processPath}
                        options={processPaths}
                        placeholder="处理路径"
                        onSave={(value) => void onQuickSave(item.id, { processPath: value })}
                      />
                    </td>
                    <td className="px-4 py-3"><EditableText value={item.investigationResult || item.conclusion} placeholder="排查结论" onSave={(value) => void onQuickSave(item.id, { investigationResult: value })} /></td>
                    <td className="px-4 py-3">
                      <EditableSelect
                        value={item.status}
                        options={workItemStatuses}
                        placeholder="状态"
                        onSave={(value) => value ? void onQuickSave(item.id, { status: value }) : undefined}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void onQuickSave(item.id, {
                            convertedRequirement: true,
                            category: "需求",
                            processPath: "转需求",
                            requirementStage: "待澄清",
                          });
                        }}
                        onMouseDown={(event) => event.stopPropagation()}
                        onMouseUp={(event) => event.stopPropagation()}
                        onFocus={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-100 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                      >
                        转为需求
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </>
                ) : variant === "qa" ? (
                  <>
                    <td className="px-4 py-3 font-medium text-slate-950"><EditableText value={item.title} placeholder="问题" onSave={(value) => value ? void onQuickSave(item.id, { title: value }) : undefined} /></td>
                    <td className="px-4 py-3"><EditableText value={item.requester} placeholder="提问人" onSave={(value) => void onQuickSave(item.id, { requester: value })} /></td>
                    <td className="px-4 py-3"><EditableText value={item.relatedRule} placeholder="规则/流程" onSave={(value) => void onQuickSave(item.id, { relatedRule: value })} /></td>
                    <td className="px-4 py-3"><EditableText value={item.answerSummary || item.conclusion} placeholder="答复结论" onSave={(value) => void onQuickSave(item.id, { answerSummary: value })} /></td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={Boolean(item.needDoc)}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => void onQuickSave(item.id, { needDoc: event.currentTarget.checked })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EditableSelect
                        value={item.status}
                        options={workItemStatuses}
                        placeholder="状态"
                        onSave={(value) => value ? void onQuickSave(item.id, { status: value }) : undefined}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-slate-950"><EditableText value={item.title} placeholder="标题" onSave={(value) => value ? void onQuickSave(item.id, { title: value }) : undefined} /></td>
                    <td className="px-4 py-3">
                      <EditableSelect
                        value={item.category}
                        options={workItemCategories}
                        placeholder="分类"
                        onSave={(value) => value ? void onQuickSave(item.id, { category: value }) : undefined}
                      />
                    </td>
                    <td className="px-4 py-3"><EditableText value={item.requester} placeholder="提出人" onSave={(value) => void onQuickSave(item.id, { requester: value })} /></td>
                    <td className="px-4 py-3"><EditableText value={item.owner} placeholder="对接人" onSave={(value) => void onQuickSave(item.id, { owner: value })} /></td>
                    <td className={isOverdue(item) ? "px-4 py-3 font-medium text-rose-600" : "px-4 py-3 text-slate-600"}>
                      <EditableDateTime value={item.expectedDoneAt} onSave={(value) => void onQuickSave(item.id, { expectedDoneAt: value })} />
                    </td>
                    <td className="px-4 py-3"><EditableText value={item.nextAction} placeholder="下一步" onSave={(value) => void onQuickSave(item.id, { nextAction: value })} /></td>
                    <td className="px-4 py-3">
                      <EditableSelect
                        value={item.status}
                        options={workItemStatuses}
                        placeholder="状态"
                        onSave={(value) => value ? void onQuickSave(item.id, { status: value }) : undefined}
                      />
                    </td>
                  </>
                )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={safePage} pageCount={pageCount} total={items.length} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
}

function getRequirementKanbanGroups(items: WorkItem[], groupBy: RequirementKanbanBy) {
  if (groupBy === "priority") {
    return ["未设置优先级", ...requirementPriorities].map((label) => ({
      label,
      tone: label === "未设置优先级" ? "bg-slate-100 text-slate-700 ring-slate-200" : priorityTone[label],
      items: items.filter((item) => (item.requirementPriority ?? "未设置优先级") === label),
    }));
  }

  if (groupBy === "owner") {
    const owners = Array.from(new Set(items.map((item) => item.rdOwner || item.owner || "未设置负责人")));
    return owners.map((label) => ({
      label,
      tone: "bg-indigo-100 text-indigo-800 ring-indigo-200",
      items: items.filter((item) => (item.rdOwner || item.owner || "未设置负责人") === label),
    }));
  }

  if (groupBy === "risk") {
    return ["有风险/阻塞", "无风险记录"].map((label) => ({
      label,
      tone: label === "有风险/阻塞" ? "bg-orange-100 text-orange-800 ring-orange-200" : "bg-emerald-100 text-emerald-800 ring-emerald-200",
      items: items.filter((item) => (item.riskNote ? "有风险/阻塞" : "无风险记录") === label),
    }));
  }

  return ["未设置阶段", ...requirementStages].map((label) => ({
    label,
    tone: label === "未设置阶段" ? "bg-slate-100 text-slate-700 ring-slate-200" : stageTone[label],
    items: items.filter((item) => (item.requirementStage ?? "未设置阶段") === label),
  }));
}

function KanbanView({ items, groupBy }: { items: WorkItem[]; groupBy: RequirementKanbanBy }) {
  const groups = getRequirementKanbanGroups(items, groupBy);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {groups.map((group) => (
        <section key={group.label} className="rounded-[30px] border border-white/70 bg-white/85 p-4 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-950">{group.label}</h3>
            <Badge tone={group.tone}>{String(group.items.length)}</Badge>
          </div>
          <div className="grid gap-3">
            {group.items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">暂无</p>
            ) : (
              group.items.map((item) => (
                <div key={item.id} className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100">
                  <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-2 text-xs text-slate-500">研发：{item.rdOwner || item.owner || "-"} · 测试：{item.testerOwner || "-"} · 业务节点：{item.businessArea || "-"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.requirementPriority ? <Badge tone={priorityTone[item.requirementPriority]}>{item.requirementPriority}</Badge> : null}
                    {item.riskNote ? <Badge tone="bg-orange-100 text-orange-800 ring-orange-200">有风险</Badge> : null}
                  </div>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition group-hover:w-3/4" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function QaKnowledgeView({
  items,
  query,
  onQueryChange,
  onQuickSave,
}: {
  items: WorkItem[];
  query: string;
  onQueryChange: (value: string) => void;
  onQuickSave: QuickSave;
}) {
  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      [
        item.title,
        item.description,
        item.requester,
        item.relatedRule,
        item.answerSummary,
        item.conclusion,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [items, query]);

  const knowledgeCards = filteredItems.filter((item) => item.answerSummary || item.conclusion);
  const [cardPage, setCardPage] = useState(1);
  const cardPageSize = 6;
  const cardPageCount = Math.max(1, Math.ceil(knowledgeCards.length / cardPageSize));
  const safeCardPage = Math.min(cardPage, cardPageCount);
  const pagedKnowledgeCards = getPagedItems(knowledgeCards, safeCardPage, cardPageSize);

  return (
    <div className="grid gap-4">
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200/70 backdrop-blur">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-950">逻辑答疑知识库</p>
            <p className="mt-1 text-xs text-slate-500">先可搜索、可复用，不做复杂智能匹配。</p>
          </div>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            placeholder="搜索问题、规则、结论..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 md:max-w-sm"
          />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {knowledgeCards.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
            暂无可复用结论。先在表格里补“答复结论”，这里会自动沉淀成卡片。
          </div>
        ) : (
          pagedKnowledgeCards.map((item) => (
            <article
              key={item.id}
              className="rounded-[28px] border border-violet-100 bg-white/90 p-4 text-left shadow-lg shadow-slate-200/60"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                {item.needDoc ? <Badge tone="bg-violet-100 text-violet-800 ring-violet-200">可沉淀</Badge> : null}
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.answerSummary || item.conclusion}</p>
              <p className="mt-3 text-xs text-slate-400">规则：{item.relatedRule || "-"}</p>
            </article>
          ))
        )}
      </section>
      <Pagination page={safeCardPage} pageCount={cardPageCount} total={knowledgeCards.length} pageSize={cardPageSize} onPageChange={setCardPage} />

      <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-2xl shadow-slate-200/70 ring-1 ring-slate-200/70 backdrop-blur">
        <ItemTable items={filteredItems} variant="qa" onQuickSave={onQuickSave} />
      </section>
    </div>
  );
}

export function ClassifiedWorkbench() {
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [requirementMode, setRequirementMode] = useState<ViewMode>("table");
  const [requirementKanbanBy, setRequirementKanbanBy] = useState<RequirementKanbanBy>("stage");
  const [items, setItems] = useState<WorkItem[]>([]);
  const [qaSearch, setQaSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const saveTimerRef = useRef<number | null>(null);

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/work-items", { cache: "no-store" });
      const result = (await response.json()) as { items?: WorkItem[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "加载事项失败");
      setItems(result.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载事项失败");
    } finally {
      setLoading(false);
    }
  }

  function showSaveFeedback(status: SaveStatus, message: string) {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    setSaveStatus(status);
    setSaveMessage(message);
    if (status === "saved") {
      saveTimerRef.current = window.setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 1600);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadItems(), 0);
    return () => {
      window.clearTimeout(timer);
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  const visibleItems = useMemo(() => {
    if (!workItemCategories.includes(activeView as WorkItemCategory)) return items;
    return items.filter((item) => item.category === activeView);
  }, [activeView, items]);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const description = String(formData.get("description") ?? "").trim();
    const explicitTitle = String(formData.get("title") ?? "").trim();
    if (!description && !explicitTitle) {
      setError("请至少填写标题或问题描述");
      return;
    }

    setSaving(true);
    setError("");
    showSaveFeedback("saving", "正在保存新事项...");
    try {
      const payload = {
        title: explicitTitle || description.slice(0, 40),
        category: String(formData.get("category") ?? "任务"),
        processPath: null,
        requester: String(formData.get("requester") ?? "").trim() || null,
        description: description || explicitTitle,
        owner: null,
        reportedAt: new Date().toISOString(),
        expectedDoneAt: null,
        status: "已记录",
        businessArea: null,
        nextAction: String(formData.get("nextAction") ?? "").trim() || null,
      };

      const response = await fetch("/api/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { item?: WorkItem; error?: string };
      if (!response.ok || !result.item) throw new Error(result.error ?? "新增事项失败");
      setItems((current) => [result.item as WorkItem, ...current]);
      form.reset();
      showSaveFeedback("saved", "已保存");
      setActiveView(isRoutableCategory(result.item.category) ? result.item.category : "dashboard");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "新增事项失败";
      setError(message);
      showSaveFeedback("error", message);
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(id: string, input: WorkItemPatch) {
    const previousItems = items;
    setError("");
    showSaveFeedback("saving", "正在保存修改...");
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...input } as WorkItem : item)));

    try {
      const response = await fetch(`/api/work-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = (await response.json()) as { item?: WorkItem; error?: string };
      if (!response.ok || !result.item) throw new Error(result.error ?? "更新事项失败");
      setItems((current) => current.map((item) => (item.id === id ? result.item as WorkItem : item)));
      showSaveFeedback("saved", "已保存");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "更新事项失败";
      setItems(previousItems);
      setError(message);
      showSaveFeedback("error", message);
    }
  }

  function viewTitle() {
    return navItems.find((item) => item.id === activeView)?.label ?? "工作台";
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),linear-gradient(135deg,#e0f2fe_0%,#f8fafc_38%,#eef2ff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1480px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950 px-5 py-6 text-white shadow-2xl shadow-slate-950/30 lg:block">
          <div className="mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-300 text-slate-950 shadow-lg shadow-sky-500/30">
              <Radio size={22} />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-400">个人工作雷达</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Signal Desk</h1>
            <p className="mt-2 text-xs leading-5 text-slate-500">收集信号、判断归属、保护精力。</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button key={item.id} type="button" onClick={() => setActiveView(item.id)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${activeView === item.id ? "bg-sky-300 text-slate-950 shadow-lg shadow-sky-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-sky-200">设计原则</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              收集只做进件，表格负责推进，答疑结论自动沉淀。
            </p>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-medium text-sky-700">{viewTitle()}</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                {activeView === "dashboard" ? "工作总览，而不是录入页" : activeView === "inbox" ? "快速收集，后续分流" : `${viewTitle()}管理`}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                高频字段直接在表格里改；需求看板支持多维度查看。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {saveStatus !== "idle" ? (
                <span
                  className={`rounded-full px-3 py-2 text-xs font-semibold shadow-lg ${
                    saveStatus === "saving"
                      ? "bg-sky-100 text-sky-800 shadow-sky-100"
                      : saveStatus === "saved"
                        ? "bg-emerald-100 text-emerald-800 shadow-emerald-100"
                        : "bg-rose-100 text-rose-800 shadow-rose-100"
                  }`}
                >
                  {saveMessage}
                </span>
              ) : null}
              <button type="button" onClick={loadItems} className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg shadow-slate-200/60 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
                <RotateCw size={16} />
                刷新数据
              </button>
            </div>
          </header>

          {error ? <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">正在加载数据库事项...</div>
          ) : activeView === "dashboard" ? (
            <Dashboard items={items} onNavigate={(category) => setActiveView(isRoutableCategory(category) ? category : "dashboard")} />
          ) : activeView === "inbox" ? (
            <InboxForm saving={saving} onSubmit={addItem} />
          ) : activeView === "需求" ? (
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 rounded-[28px] border border-white/70 bg-white/80 p-3 shadow-xl shadow-slate-200/60 backdrop-blur md:flex-row md:items-center">
                <div className="px-2">
                  <p className="text-sm font-semibold text-slate-950">需求视图</p>
                  <p className="mt-1 text-xs text-slate-500">表格用于直接维护字段；看板可按阶段、优先级、负责人和风险查看。</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setRequirementMode("table")} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${requirementMode === "table" ? "bg-slate-950 text-white shadow-lg shadow-slate-300" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                    <Table2 size={16} />
                    表格视图
                  </button>
                  <button type="button" onClick={() => setRequirementMode("kanban")} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${requirementMode === "kanban" ? "bg-slate-950 text-white shadow-lg shadow-slate-300" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                    <Kanban size={16} />
                    看板视图
                  </button>
                </div>
              </div>
              {requirementMode === "kanban" ? (
                <div className="flex flex-wrap gap-2 rounded-[24px] border border-white/70 bg-white/70 p-2 shadow-lg shadow-slate-200/50">
                  {[
                    ["stage", "按推进阶段"],
                    ["priority", "按优先级"],
                    ["owner", "按负责人"],
                    ["risk", "按风险"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRequirementKanbanBy(value as RequirementKanbanBy)}
                      className={`rounded-2xl px-3 py-1.5 text-xs font-semibold transition ${
                        requirementKanbanBy === value ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
              {requirementMode === "table" ? (
                <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-2xl shadow-slate-200/70 ring-1 ring-slate-200/70 backdrop-blur">
                  <ItemTable items={visibleItems} variant="requirement" onQuickSave={updateItem} />
                </section>
              ) : (
                <KanbanView items={visibleItems} groupBy={requirementKanbanBy} />
              )}
            </div>
          ) : activeView === "线上问题" ? (
            <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-2xl shadow-slate-200/70 ring-1 ring-slate-200/70 backdrop-blur">
              <ItemTable items={visibleItems} variant="incident" onQuickSave={updateItem} />
            </section>
          ) : activeView === "逻辑答疑" ? (
            <QaKnowledgeView
              items={visibleItems}
              query={qaSearch}
              onQueryChange={setQaSearch}
              onQuickSave={updateItem}
            />
          ) : (
            <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-2xl shadow-slate-200/70 ring-1 ring-slate-200/70 backdrop-blur">
              <ItemTable items={visibleItems} variant="task" onQuickSave={updateItem} />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
