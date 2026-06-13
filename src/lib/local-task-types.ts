export type LocalTaskType = "TASK" | "REQUIREMENT" | "PROJECT" | "DAILY_WORK" | "INCIDENT";

export type LocalTaskStatus =
  | "INBOX"
  | "TODO"
  | "DOING"
  | "WAITING"
  | "BLOCKED"
  | "REVIEW"
  | "DONE"
  | "CANCELLED"
  | "ARCHIVED";

export type LocalTaskPriority = "HIGH" | "MEDIUM" | "LOW";

export type LocalTask = {
  id: string;
  title: string;
  description?: string;
  type: LocalTaskType;
  status: LocalTaskStatus;
  priority: LocalTaskPriority;
  assigneeName?: string;
  dueDate?: string;
  nextAction?: string;
  blockedReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};
