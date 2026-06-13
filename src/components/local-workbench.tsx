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
  Target,
  UserRound,
} from "lucide-react";
import type { LocalTask, LocalTaskPriority, LocalTaskStatus, LocalTaskType } from "@/lib/local-task-types";
import {
  activeStatuses,
  priorityWeight,
  taskPriorityLabels,
  taskStatusLabels,
  taskTypeLabels,
} from "@/lib/task-options";

const storageKey = "personal-workbench-tasks-v1";

const navItems = [
  { id: "dashboard", label: "工作台", icon: LayoutDashboard },
  { id: "tasks", label: "任务", icon: ListTodo },
  { id: "requirements", label: "需求", icon: Inbox },
  { id: "projects", label: "项目", icon: FolderKanban },
  { id: "review", label: "复盘", icon: BarChart3 },
];

type ViewId = (typeof navItems)[number]["id"];

const sampleTasks: LocalTask[] = [
  {
    id: "sample-1",
    title: "AI 招生需求原型确认",
    type: "REQUIREMENT",
    status: "DOING",
    priority: "HIGH",
    assigneeName: "林佳得",
    dueDate: new Date().toISOString().slice(0, 10),
    nextAction: "确认原型范围和验收口径",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-2",
    title: "流转任务逻辑梳理",
    type: "TASK",
    status: "WAITING",
    priority: "MEDIUM",
    assigneeName: "刘晓东",
    nextAction: "等业务侧补充边界场景",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-3",
    title: "勿扰库 leads 数据问题",
    type: "INCIDENT",
    status: "BLOCKED",
    priority: "HIGH",
    assigneeName: "林佳得",
    blockedReason: "需要确认生产数据口径",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function parseDate(date?: string) {
  return date ? new Date(`${date}T23:59:59`) : undefined;
}

function sortForFocus(tasks: LocalTask[]) {
  return [...tasks].sort((left, right) => {
    const priorityDiff = priorityWeight[right.priority] - priorityWeight[left.priority];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const leftDue = parseDate(left.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDue = parseDate(right.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    return leftDue - rightDue;
  });
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

function TaskCard({ task }: { task: LocalTask }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {taskTypeLabels[task.type]}
            </span>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
              {taskStatusLabels[task.status]}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-slate-950">
            {task.title}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
          {taskPriorityLabels[task.priority]}
        </span>
      </div>

      {task.nextAction ? (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
          下一步：{task.nextAction}
        </p>
      ) : null}

      {task.blockedReason ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
          阻塞：{task.blockedReason}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {task.assigneeName ? (
          <span className="inline-flex items-center gap-1.5">
            <UserRound size={14} />
            {task.assigneeName}
          </span>
        ) : null}
        {task.dueDate ? <span>截止：{task.dueDate}</span> : null}
      </div>
    </article>
  );
}

function Section({
  title,
  description,
  tasks,
  emptyText,
}: {
  title: string;
  description?: string;
  tasks: LocalTask[];
  emptyText: string;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/50">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {tasks.length > 0 ? (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
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

export function LocalWorkbench() {
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [tasks, setTasks] = useState<LocalTask[]>(() => {
    if (typeof window === "undefined") {
      return sampleTasks;
    }

    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored) as LocalTask[];
      } catch {
        return sampleTasks;
      }
    }

    return sampleTasks;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(tasks));
    }
  }, [tasks]);

  const dashboard = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const active = tasks.filter((task) => activeStatuses.includes(task.status));
    const waiting = active.filter((task) => task.status === "WAITING");
    const blocked = active.filter((task) => task.status === "BLOCKED");
    const overdue = active.filter((task) => {
      const due = parseDate(task.dueDate);
      return due ? due < today : false;
    });
    const todayFocus = sortForFocus(
      active.filter((task) => {
        const due = parseDate(task.dueDate);
        return task.priority === "HIGH" || task.status === "WAITING" || task.status === "BLOCKED" || Boolean(due && due <= new Date());
      }),
    ).slice(0, 8);
    const recentlyDone = tasks.filter((task) => task.status === "DONE").slice(0, 6);

    return {
      active,
      waiting,
      blocked,
      overdue,
      todayFocus,
      recentlyDone,
      doneThisWeek: tasks.filter((task) => task.status === "DONE").length,
    };
  }, [tasks]);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    if (!title) {
      return;
    }

    const now = new Date().toISOString();
    const task: LocalTask = {
      id: crypto.randomUUID(),
      title,
      type: String(formData.get("type") ?? "TASK") as LocalTaskType,
      status: String(formData.get("status") ?? "INBOX") as LocalTaskStatus,
      priority: String(formData.get("priority") ?? "MEDIUM") as LocalTaskPriority,
      assigneeName: String(formData.get("assigneeName") ?? "").trim() || undefined,
      dueDate: String(formData.get("dueDate") ?? "") || undefined,
      nextAction: String(formData.get("nextAction") ?? "").trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    setTasks((current) => [task, ...current]);
    form.reset();
  }

  const visibleTasks = useMemo(() => {
    if (activeView === "requirements") {
      return tasks.filter((task) => task.type === "REQUIREMENT");
    }

    if (activeView === "projects") {
      return tasks.filter((task) => task.type === "PROJECT");
    }

    if (activeView === "review") {
      return tasks.filter((task) => task.status === "DONE");
    }

    return tasks;
  }, [activeView, tasks]);

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
                key={item.label}
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
            <p className="text-sm font-semibold">交付演示版</p>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              当前先使用浏览器本地存储，避免数据库网络问题影响演示。后续可再切回 Supabase。
            </p>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-medium text-slate-500">今日聚焦</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                先处理最重要的工作
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                快速收集任务，优先关注高优、超期、阻塞和待反馈事项。当前版本可直接本地演示。
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
              无数据库演示版
            </div>
          </header>

          <form
            onSubmit={addTask}
            className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 lg:flex-row">
                <input
                  name="title"
                  placeholder="快速新增任务，例如：跟进 AI 招生需求原型确认"
                  className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  required
                />
                <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800">
                  <Plus size={18} />
                  添加任务
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                <select name="type" defaultValue="TASK" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="TASK">任务</option>
                  <option value="REQUIREMENT">需求</option>
                  <option value="PROJECT">项目</option>
                  <option value="DAILY_WORK">日常工作</option>
                  <option value="INCIDENT">线上问题</option>
                </select>
                <select name="priority" defaultValue="MEDIUM" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="HIGH">高优先级</option>
                  <option value="MEDIUM">中优先级</option>
                  <option value="LOW">低优先级</option>
                </select>
                <select name="status" defaultValue="INBOX" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="INBOX">收集箱</option>
                  <option value="TODO">待开始</option>
                  <option value="DOING">进行中</option>
                  <option value="WAITING">待反馈</option>
                  <option value="BLOCKED">阻塞中</option>
                  <option value="REVIEW">待验证</option>
                </select>
                <input name="assigneeName" placeholder="对接人" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <input name="dueDate" type="date" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              </div>
              <input name="nextAction" placeholder="下一步动作，可选" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            </div>
          </form>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard title="活跃任务" value={dashboard.active.length} hint="未完成且未归档" icon={Target} />
            <StatCard title="高优任务" value={dashboard.active.filter((task) => task.priority === "HIGH").length} hint="需要优先推进" icon={AlertTriangle} />
            <StatCard title="待反馈" value={dashboard.waiting.length} hint="卡在外部响应" icon={Clock3} />
            <StatCard title="阻塞中" value={dashboard.blocked.length} hint="需要先解除阻塞" icon={PauseCircle} />
            <StatCard title="已完成" value={dashboard.doneThisWeek} hint="用于周报复盘" icon={CheckCircle2} />
          </div>

          {activeView === "dashboard" ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.9fr)]">
              <Section
                title="今日最该处理"
                description="高优、今天到期、超期、阻塞和待反馈会优先出现在这里。"
                tasks={dashboard.todayFocus}
                emptyText="当前没有需要立即关注的任务，可以先从上方快速新增。"
              />
              <div className="grid gap-6">
                <Section title="超期任务" tasks={dashboard.overdue} emptyText="没有超期任务，节奏不错。" />
                <Section title="待外部反馈" tasks={dashboard.waiting} emptyText="暂无待反馈事项。" />
                <Section title="阻塞中" tasks={dashboard.blocked} emptyText="暂无阻塞事项。" />
                <Section title="最近完成" tasks={dashboard.recentlyDone} emptyText="完成任务后会在这里展示，方便复盘和周报。" />
              </div>
            </div>
          ) : (
            <Section
              title={navItems.find((item) => item.id === activeView)?.label ?? "任务"}
              description="点击左侧导航可切换不同视图。当前交付版先用筛选视图模拟完整页面。"
              tasks={visibleTasks}
              emptyText="当前视图暂无数据，可以先从上方快速新增。"
            />
          )}
        </main>
      </div>
    </div>
  );
}
