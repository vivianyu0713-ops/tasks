import type {
  LocalTaskPriority,
  LocalTaskStatus,
  LocalTaskType,
} from "@/lib/local-task-types";

export const taskTypeLabels: Record<LocalTaskType, string> = {
  TASK: "任务",
  REQUIREMENT: "需求",
  PROJECT: "项目",
  DAILY_WORK: "日常工作",
  INCIDENT: "线上问题",
};

export const taskStatusLabels: Record<LocalTaskStatus, string> = {
  INBOX: "收集箱",
  TODO: "待开始",
  DOING: "进行中",
  WAITING: "待外部反馈",
  BLOCKED: "阻塞中",
  REVIEW: "待验证",
  DONE: "已完成",
  CANCELLED: "已取消",
  ARCHIVED: "已归档",
};

export const taskPriorityLabels: Record<LocalTaskPriority, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};

export const activeStatuses: LocalTaskStatus[] = [
  "INBOX",
  "TODO",
  "DOING",
  "WAITING",
  "BLOCKED",
  "REVIEW",
];

export const priorityWeight: Record<LocalTaskPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};
