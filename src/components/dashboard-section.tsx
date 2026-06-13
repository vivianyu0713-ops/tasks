import type { ReactNode } from "react";
import type { DashboardTask } from "@/lib/tasks";
import { TaskCard } from "@/components/task-card";

export function DashboardSection({
  title,
  description,
  tasks,
  emptyText,
  action,
}: {
  title: string;
  description?: string;
  tasks: DashboardTask[];
  emptyText: string;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/50">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {action}
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
