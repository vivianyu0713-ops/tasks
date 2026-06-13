"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { createTask, type CreateTaskState } from "@/app/actions";

const initialState: CreateTaskState = {
  ok: false,
  message: "",
};

export function QuickAddTask() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createTask, initialState);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            name="title"
            placeholder="快速新增任务，例如：跟进 AI 招生需求原型确认"
            className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
            required
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Plus size={18} />
            {pending ? "添加中" : "添加任务"}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <select
            name="type"
            defaultValue="TASK"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          >
            <option value="TASK">任务</option>
            <option value="REQUIREMENT">需求</option>
            <option value="PROJECT">项目</option>
            <option value="DAILY_WORK">日常工作</option>
            <option value="INCIDENT">线上问题</option>
          </select>
          <select
            name="priority"
            defaultValue="MEDIUM"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          >
            <option value="HIGH">高优先级</option>
            <option value="MEDIUM">中优先级</option>
            <option value="LOW">低优先级</option>
          </select>
          <select
            name="status"
            defaultValue="INBOX"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          >
            <option value="INBOX">收集箱</option>
            <option value="TODO">待开始</option>
            <option value="DOING">进行中</option>
            <option value="WAITING">待反馈</option>
            <option value="BLOCKED">阻塞中</option>
            <option value="REVIEW">待验证</option>
          </select>
          <input
            name="assigneeName"
            placeholder="对接人"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          />
          <input
            name="dueDate"
            type="date"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <input
          name="nextAction"
          placeholder="下一步动作，可选"
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        />

        {state.message ? (
          <p className={state.ok ? "text-sm text-emerald-600" : "text-sm text-rose-600"}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
