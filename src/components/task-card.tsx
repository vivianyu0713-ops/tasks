import { format } from "date-fns";
import { CalendarDays, CircleAlert, UserRound } from "lucide-react";
import type { DashboardTask } from "@/lib/tasks";
import {
  taskPriorityLabels,
  taskStatusLabels,
  taskTypeLabels,
} from "@/lib/task-options";

const priorityClassName: Record<string, string> = {
  HIGH: "bg-rose-50 text-rose-700 ring-rose-100",
  MEDIUM: "bg-sky-50 text-sky-700 ring-sky-100",
  LOW: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

const statusClassName: Record<string, string> = {
  INBOX: "bg-slate-100 text-slate-700",
  TODO: "bg-indigo-50 text-indigo-700",
  DOING: "bg-amber-50 text-amber-700",
  WAITING: "bg-violet-50 text-violet-700",
  BLOCKED: "bg-rose-50 text-rose-700",
  REVIEW: "bg-cyan-50 text-cyan-700",
  DONE: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
  ARCHIVED: "bg-slate-100 text-slate-500",
};

export function TaskCard({ task }: { task: DashboardTask }) {
  const dueDate = task.dueDate ? format(task.dueDate, "MM-dd") : null;
  const containerClassName =
    task.status === "BLOCKED"
      ? "border-rose-200 bg-rose-50/40"
      : "border-slate-200 bg-white";

  return (
    <article className={`rounded-2xl border p-4 shadow-sm shadow-slate-200/50 ${containerClassName}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {taskTypeLabels[task.type as keyof typeof taskTypeLabels] ?? task.type}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName[task.status]}`}>
              {taskStatusLabels[task.status as keyof typeof taskStatusLabels] ?? task.status}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-slate-950">
            {task.title}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
            priorityClassName[task.priority]
          }`}
        >
          {taskPriorityLabels[task.priority as keyof typeof taskPriorityLabels] ?? task.priority}
        </span>
      </div>

      {task.nextAction ? (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
          下一步：{task.nextAction}
        </p>
      ) : null}

      {task.blockedReason ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-rose-100/70 px-3 py-2 text-xs leading-5 text-rose-700">
          <CircleAlert className="mt-0.5 shrink-0" size={14} />
          {task.blockedReason}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {task.assignee ? (
          <span className="inline-flex items-center gap-1.5">
            <UserRound size={14} />
            {task.assignee.name}
          </span>
        ) : null}
        {dueDate ? (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} />
            {dueDate}
          </span>
        ) : null}
        {task.project ? <span>项目：{task.project.title}</span> : null}
        {task.requirement ? <span>需求：{task.requirement.title}</span> : null}
      </div>
    </article>
  );
}
