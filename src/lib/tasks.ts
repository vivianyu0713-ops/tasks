import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { activeStatuses, priorityWeight } from "@/lib/task-options";

export type DashboardTask = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  level: string | null;
  dueDate: Date | null;
  nextAction: string | null;
  blockedReason: string | null;
  completedAt: Date | null;
  updatedAt: Date;
  assignee: { name: string } | null;
  requirement: { title: string } | null;
  project: { title: string } | null;
};

export type DashboardData = {
  dbReady: boolean;
  error?: string;
  tasks: DashboardTask[];
  todayFocus: DashboardTask[];
  overdue: DashboardTask[];
  waiting: DashboardTask[];
  blocked: DashboardTask[];
  recentlyDone: DashboardTask[];
  stats: {
    active: number;
    high: number;
    waiting: number;
    blocked: number;
    doneThisWeek: number;
  };
};

const taskInclude = {
  assignee: { select: { name: true } },
  requirement: { select: { title: true } },
  project: { select: { title: true } },
} as const;

function sortForFocus(tasks: DashboardTask[]) {
  const now = Date.now();

  return [...tasks].sort((left, right) => {
    const priorityDiff =
      priorityWeight[right.priority as keyof typeof priorityWeight] -
      priorityWeight[left.priority as keyof typeof priorityWeight];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const leftDue = left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDue = right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (leftDue !== rightDue) {
      return leftDue - rightDue;
    }

    return Math.abs(right.updatedAt.getTime() - now) - Math.abs(left.updatedAt.getTime() - now);
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const todayEnd = endOfDay(now);
  const todayStart = startOfDay(now);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  try {
    const [tasks, doneThisWeek] = await Promise.all([
      prisma.task.findMany({
        include: taskInclude,
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
        take: 80,
      }),
      prisma.task.count({
        where: {
          status: "DONE",
          completedAt: {
            gte: weekStart,
          },
        },
      }),
    ]);

    const active = tasks.filter((task) => activeStatuses.includes(task.status));
    const overdue = active.filter((task) => task.dueDate && task.dueDate < todayStart);
    const waiting = active.filter((task) => task.status === "WAITING");
    const blocked = active.filter((task) => task.status === "BLOCKED");
    const recentlyDone = tasks
      .filter((task) => task.status === "DONE")
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
      .slice(0, 6);

    const todayFocus = sortForFocus(
      active.filter((task) => {
        if (task.status === "BLOCKED" || task.status === "WAITING") {
          return true;
        }

        if (task.priority === "HIGH") {
          return true;
        }

        return Boolean(task.dueDate && task.dueDate <= todayEnd);
      }),
    ).slice(0, 8);

    return {
      dbReady: true,
      tasks,
      todayFocus,
      overdue: sortForFocus(overdue).slice(0, 6),
      waiting: sortForFocus(waiting).slice(0, 6),
      blocked: sortForFocus(blocked).slice(0, 6),
      recentlyDone,
      stats: {
        active: active.length,
        high: active.filter((task) => task.priority === "HIGH").length,
        waiting: waiting.length,
        blocked: blocked.length,
        doneThisWeek,
      },
    };
  } catch (error) {
    console.error("Failed to load dashboard data", error);

    return {
      dbReady: false,
      error: error instanceof Error ? error.message : "数据库暂时不可用",
      tasks: [],
      todayFocus: [],
      overdue: [],
      waiting: [],
      blocked: [],
      recentlyDone: [],
      stats: {
        active: 0,
        high: 0,
        waiting: 0,
        blocked: 0,
        doneThisWeek: 0,
      },
    };
  }
}
