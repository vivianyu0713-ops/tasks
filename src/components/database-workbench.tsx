"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  ListTodo,
  PauseCircle,
  Plus,
  RotateCw,
  Target,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  businessAreas,
  processPaths,
  rejectReasons,
  workItemCategories,
  workItemStatuses,
  type WorkItem,
} from "@/lib/work-item-types";

const navItems = [
  { id: "dashboard", label: "工作台", icon: LayoutDashboard },
  { id: "all", label: "全部事项", icon: ListTodo },
  { id: "需求", label: "需求池", icon: Inbox },
  { id: "线上问题", label: "问题池", icon: AlertTriangle },
  { id: "逻辑答疑", label: "答疑池", icon: FolderKanban },
  { id: "不承接", label: "不承接", icon: PauseCircle },
  { id: "review", label: "复盘", icon: BarChart3 },
] as const;

type ViewId = (typeof navItems)[number]["id"];

function toDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "未设置";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isActive(item: WorkItem) {
  return !["已完成", "暂不处理"].includes(item.status);
}

function isOverdue(item: WorkItem) {
  if (!item.expectedDoneAt || !isActive(item)) {
    return false;
  }

  return new Date(item.expectedDoneAt).getTime() < Date.now();
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: number;
  hint: string;
  icon: typeof Target;
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

function ItemCard({
  item,
  onUpdate,
  onDelete,
}: {
  item: WorkItem;
  onUpdate: (id: string, input: Partial<WorkItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [conclusion, setConclusion] = useState(item.conclusion ?? "");
  const [status, setStatus] = useState(item.status);

  async function saveConclusion() {
    await onUpdate(item.id, {
      conclusion,
      status,
    });
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {item.category}
            </span>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
              {item.status}
            </span>
            {item.processPath ? (
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                {item.processPath}
              </span>
            ) : null}
            {item.businessArea ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {item.businessArea}
              </span>
            ) : null}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-slate-950">
            {item.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          aria-label="删除事项"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
        {item.description}
      </p>

      <div className="mt-4 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
        <span className="inline-flex items-center gap-1.5">
          <UserRound size={14} />
          提出人：{item.requester || "未填写"}
        </span>
        <span>对接人：{item.owner || "未填写"}</span>
        <span>提出时间：{formatDateTime(item.reportedAt)}</span>
        <span className={isOverdue(item) ? "font-medium text-rose-600" : ""}>
          预期解决：{formatDateTime(item.expectedDoneAt)}
        </span>
        {item.rejectReason ? <span>不承接原因：{item.rejectReason}</span> : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[160px_minmax(0,1fr)_96px]">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as WorkItem["status"])}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {workItemStatuses.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          value={conclusion}
          onChange={(event) => setConclusion(event.target.value)}
          placeholder="补充结论，例如：已确认为规则问题，转需求评估"
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={saveConclusion}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          保存
        </button>
      </div>
    </article>
  );
}

function Section({
  title,
  description,
  items,
  emptyText,
  onUpdate,
  onDelete,
}: {
  title: string;
  description?: string;
  items: WorkItem[];
  emptyText: string;
  onUpdate: (id: string, input: Partial<WorkItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/50">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      )}
    </section>
  );
}

export function DatabaseWorkbench() {
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/work-items", { cache: "no-store" });
      const result = (await response.json()) as { items?: WorkItem[]; error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "加载事项失败");
      }

      setItems(result.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载事项失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const dashboard = useMemo(() => {
    const active = items.filter(isActive);
    const waiting = active.filter((item) => item.status === "待反馈");
    const overdue = active.filter(isOverdue);
    const rejected = items.filter((item) => item.category === "不承接" || item.processPath === "不承接");
    const done = items.filter((item) => item.status === "已完成");
    const todayFocus = [...active]
      .sort((left, right) => {
        if (isOverdue(left) !== isOverdue(right)) {
          return isOverdue(left) ? -1 : 1;
        }

        return new Date(right.reportedAt).getTime() - new Date(left.reportedAt).getTime();
      })
      .slice(0, 8);

    return {
      active,
      waiting,
      overdue,
      rejected,
      done,
      todayFocus,
    };
  }, [items]);

  const visibleItems = useMemo(() => {
    if (activeView === "all" || activeView === "dashboard" || activeView === "review") {
      return items;
    }

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

    try {
      const payload = {
        title: explicitTitle || description.slice(0, 40),
        category: String(formData.get("category") ?? "需求"),
        processPath: String(formData.get("processPath") ?? "") || null,
        requester: String(formData.get("requester") ?? "").trim() || null,
        description: description || explicitTitle,
        owner: String(formData.get("owner") ?? "").trim() || null,
        reportedAt: String(formData.get("reportedAt") ?? "") || null,
        expectedDoneAt: String(formData.get("expectedDoneAt") ?? "") || null,
        status: String(formData.get("status") ?? "已记录"),
        conclusion: String(formData.get("conclusion") ?? "").trim() || null,
        rejectReason: String(formData.get("rejectReason") ?? "") || null,
        businessArea: String(formData.get("businessArea") ?? "") || null,
      };

      const response = await fetch("/api/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { item?: WorkItem; error?: string };

      if (!response.ok || !result.item) {
        throw new Error(result.error ?? "新增事项失败");
      }

      setItems((current) => [result.item as WorkItem, ...current]);
      form.reset();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "新增事项失败");
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(id: string, input: Partial<WorkItem>) {
    const response = await fetch(`/api/work-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const result = (await response.json()) as { item?: WorkItem; error?: string };

    if (!response.ok || !result.item) {
      setError(result.error ?? "更新事项失败");
      return;
    }

    setItems((current) => current.map((item) => (item.id === id ? result.item as WorkItem : item)));
  }

  async function deleteItem(id: string) {
    const response = await fetch(`/api/work-items/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? "删除事项失败");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white/80 px-5 py-6 backdrop-blur lg:block">
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-500">个人工作台</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tasks</h1>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeView === item.id
                    ? "bg-slate-950 text-white shadow-sm shadow-slate-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-10 rounded-3xl bg-slate-950 p-4 text-white">
            <p className="text-sm font-semibold">真实数据库版</p>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              当前数据已写入 Supabase Postgres，刷新或换设备后仍可读取。
            </p>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-medium text-slate-500">统一收集箱</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                先记录，再判断是否承接
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                记录提出人、问题描述、对接人、预期时间和结论，按需求、线上问题、逻辑答疑和不承接事项自动分池。
              </p>
            </div>
            <button
              type="button"
              onClick={loadItems}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <RotateCw size={16} />
              刷新数据
            </button>
          </header>

          {error ? (
            <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <form
            onSubmit={addItem}
            className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60"
          >
            <div className="grid gap-3">
              <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
                <input
                  name="title"
                  placeholder="标题，可不填，默认取问题描述前 40 字"
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
                <select name="category" defaultValue="需求" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  {workItemCategories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select name="processPath" defaultValue="" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">处理路径</option>
                  {processPaths.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                name="description"
                placeholder="问题描述：这件事是什么、当前卡点是什么、需要我判断什么"
                className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                required
              />

              <div className="grid gap-3 md:grid-cols-3">
                <input name="requester" placeholder="提出人" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <input name="owner" placeholder="对接人" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <select name="status" defaultValue="已记录" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  {workItemStatuses.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  name="reportedAt"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(new Date().toISOString())}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <input name="expectedDoneAt" type="datetime-local" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <select name="businessArea" defaultValue="" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">业务环节</option>
                  {businessAreas.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_120px]">
                <select name="rejectReason" defaultValue="" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">不承接原因</option>
                  {rejectReasons.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input name="conclusion" placeholder="结论，可后续补充" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <button
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                >
                  <Plus size={18} />
                  {saving ? "保存中" : "记录"}
                </button>
              </div>
            </div>
          </form>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard title="待处理" value={dashboard.active.length} hint="未完成且未暂不处理" icon={Target} />
            <StatCard title="待反馈" value={dashboard.waiting.length} hint="等待外部反馈" icon={Clock3} />
            <StatCard title="已超期" value={dashboard.overdue.length} hint="超过预期解决时间" icon={AlertTriangle} />
            <StatCard title="不承接" value={dashboard.rejected.length} hint="低价值或边界外事项" icon={PauseCircle} />
            <StatCard title="已完成" value={dashboard.done.length} hint="已有结论并完成" icon={CheckCircle2} />
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              正在加载数据库事项...
            </div>
          ) : activeView === "dashboard" ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.9fr)]">
              <Section
                title="今日最该处理"
                description="未完成、待反馈、超期事项会优先展示。"
                items={dashboard.todayFocus}
                emptyText="当前没有待处理事项，可以从上方收集箱快速记录。"
                onUpdate={updateItem}
                onDelete={deleteItem}
              />
              <div className="grid gap-6">
                <Section title="超期事项" items={dashboard.overdue} emptyText="没有超期事项。" onUpdate={updateItem} onDelete={deleteItem} />
                <Section title="待反馈" items={dashboard.waiting} emptyText="暂无待反馈事项。" onUpdate={updateItem} onDelete={deleteItem} />
                <Section title="不承接事项" items={dashboard.rejected} emptyText="暂无不承接事项。" onUpdate={updateItem} onDelete={deleteItem} />
              </div>
            </div>
          ) : activeView === "review" ? (
            <Section
              title="复盘视图"
              description="先展示全部事项，后续可继续扩展业务环节分布和低价值事项统计。"
              items={items}
              emptyText="暂无复盘数据。"
              onUpdate={updateItem}
              onDelete={deleteItem}
            />
          ) : (
            <Section
              title={navItems.find((item) => item.id === activeView)?.label ?? "全部事项"}
              description="按分类自动进入对应池子，避免在多个表格之间切换。"
              items={visibleItems}
              emptyText="当前视图暂无数据。"
              onUpdate={updateItem}
              onDelete={deleteItem}
            />
          )}
        </main>
      </div>
    </div>
  );
}
