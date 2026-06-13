"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "任务标题不能为空").max(120, "任务标题不能超过 120 个字"),
  description: z.string().trim().optional(),
  type: z.enum(["TASK", "REQUIREMENT", "PROJECT", "DAILY_WORK", "INCIDENT"]),
  status: z.enum(["INBOX", "TODO", "DOING", "WAITING", "BLOCKED", "REVIEW"]).default("INBOX"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  assigneeName: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  nextAction: z.string().trim().optional(),
});

export type CreateTaskState = {
  ok: boolean;
  message: string;
};

function optionalText(value?: string) {
  return value && value.length > 0 ? value : undefined;
}

function parseDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T23:59:59`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function createTask(
  _previousState: CreateTaskState,
  formData: FormData,
): Promise<CreateTaskState> {
  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type") || "TASK",
    status: formData.get("status") || "INBOX",
    priority: formData.get("priority") || "MEDIUM",
    assigneeName: formData.get("assigneeName"),
    dueDate: formData.get("dueDate"),
    nextAction: formData.get("nextAction"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "任务信息不完整",
    };
  }

  const input = parsed.data;
  const assigneeName = optionalText(input.assigneeName);

  try {
    await prisma.task.create({
      data: {
        title: input.title,
        description: optionalText(input.description),
        type: input.type,
        status: input.status,
        priority: input.priority,
        dueDate: parseDate(input.dueDate),
        nextAction: optionalText(input.nextAction),
        assignee: assigneeName
          ? {
              connectOrCreate: {
                where: { name: assigneeName },
                create: { name: assigneeName },
              },
            }
          : undefined,
      },
    });

    revalidatePath("/");

    return {
      ok: true,
      message: "任务已加入工作台",
    };
  } catch (error) {
    console.error("Failed to create task", error);

    return {
      ok: false,
      message: "创建失败，请确认数据库连接和迁移已完成",
    };
  }
}
