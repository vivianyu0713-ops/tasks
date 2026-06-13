export const workItemCategories = ["任务", "需求", "线上问题", "逻辑答疑", "日常待办", "不承接"] as const;
export const processPaths = [
  "研发排查",
  "转需求",
  "手动配置",
  "规则调整",
  "数据修复",
  "逻辑答复",
  "转他人",
  "不承接",
  "暂不处理",
  "已完成",
] as const;
export const workItemStatuses = ["已记录", "处理中", "待反馈", "待验证", "已完成", "暂不处理"] as const;
export const requirementPriorities = ["P0 - 重要紧急", "P1 - 高优项目", "P2 - 常规项目"] as const;
export const requirementStages = [
  "待澄清",
  "待评审",
  "待开发",
  "开发中",
  "测试中",
  "待上线",
  "已上线",
  "业务交付",
  "暂缓",
] as const;
export const rejectReasons = [
  "职责边界外",
  "替别人做无效判断",
  "信息不完整",
  "无明确业务价值",
  "重复事项",
  "已有规则可自助解决",
] as const;
export const businessAreas = [
  "线索获取",
  "线索分配",
  "触达转化",
  "试听预约",
  "试听履约",
  "成单转化",
  "销售效率",
  "数据治理",
  "AI 提效",
  "流程规范",
] as const;

export type WorkItemCategory = (typeof workItemCategories)[number];
export type ProcessPath = (typeof processPaths)[number];
export type WorkItemStatus = (typeof workItemStatuses)[number];
export type RequirementPriority = (typeof requirementPriorities)[number];
export type RequirementStage = (typeof requirementStages)[number];
export type RejectReason = (typeof rejectReasons)[number];
export type BusinessArea = (typeof businessAreas)[number];

export type WorkItemMeta = {
  nextAction?: string | null;
  requirementDocUrl?: string | null;
  rdOwner?: string | null;
  testerOwner?: string | null;
  requirementPriority?: RequirementPriority | null;
  requirementStage?: RequirementStage | null;
  plannedLaunchAt?: string | null;
  actualLaunchAt?: string | null;
  riskNote?: string | null;
  impactScope?: string | null;
  occurredAt?: string | null;
  investigationResult?: string | null;
  convertedRequirement?: boolean | null;
  relatedRule?: string | null;
  answerSummary?: string | null;
  needDoc?: boolean | null;
};

export type WorkItem = {
  id: string;
  title: string;
  category: WorkItemCategory;
  processPath: ProcessPath | null;
  requester: string | null;
  description: string;
  owner: string | null;
  reportedAt: string;
  expectedDoneAt: string | null;
  status: WorkItemStatus;
  conclusion: string | null;
  rejectReason: RejectReason | null;
  businessArea: BusinessArea | null;
  nextAction: string | null;
  requirementDocUrl: string | null;
  rdOwner: string | null;
  testerOwner: string | null;
  requirementPriority: RequirementPriority | null;
  requirementStage: RequirementStage | null;
  plannedLaunchAt: string | null;
  actualLaunchAt: string | null;
  riskNote: string | null;
  impactScope: string | null;
  occurredAt: string | null;
  investigationResult: string | null;
  convertedRequirement: boolean | null;
  relatedRule: string | null;
  answerSummary: string | null;
  needDoc: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkItemRow = {
  id: string;
  title: string;
  category: WorkItemCategory;
  process_path: ProcessPath | null;
  requester: string | null;
  description: string;
  owner: string | null;
  reported_at: string;
  expected_done_at: string | null;
  status: WorkItemStatus;
  conclusion: string | null;
  reject_reason: RejectReason | null;
  business_area: BusinessArea | null;
  created_at: string;
  updated_at: string;
};

export type CreateWorkItemInput = {
  title: string;
  category: WorkItemCategory;
  processPath?: ProcessPath | null;
  requester?: string | null;
  description: string;
  owner?: string | null;
  reportedAt?: string | null;
  expectedDoneAt?: string | null;
  status?: WorkItemStatus;
  conclusion?: string | null;
  rejectReason?: RejectReason | null;
  businessArea?: BusinessArea | null;
  nextAction?: string | null;
  requirementDocUrl?: string | null;
  rdOwner?: string | null;
  testerOwner?: string | null;
  requirementPriority?: RequirementPriority | null;
  requirementStage?: RequirementStage | null;
  plannedLaunchAt?: string | null;
  actualLaunchAt?: string | null;
  riskNote?: string | null;
  impactScope?: string | null;
  occurredAt?: string | null;
  investigationResult?: string | null;
  convertedRequirement?: boolean | null;
  relatedRule?: string | null;
  answerSummary?: string | null;
  needDoc?: boolean | null;
};

export type UpdateWorkItemInput = Partial<CreateWorkItemInput>;

const metaDelimiter = "\n\n---WORK_ITEM_META---\n";

export function splitDescriptionAndMeta(value: string): {
  description: string;
  meta: WorkItemMeta;
} {
  const [description, rawMeta] = value.split(metaDelimiter);

  if (!rawMeta) {
    return { description: value, meta: {} };
  }

  try {
    return {
      description,
      meta: JSON.parse(rawMeta) as WorkItemMeta,
    };
  } catch {
    return { description: value, meta: {} };
  }
}

export function joinDescriptionAndMeta(description: string, meta: WorkItemMeta) {
  const cleanedMeta = Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  ) as WorkItemMeta;

  if (Object.keys(cleanedMeta).length === 0) {
    return description;
  }

  return `${description}${metaDelimiter}${JSON.stringify(cleanedMeta)}`;
}

export function workItemFromRow(row: WorkItemRow): WorkItem {
  const { description, meta } = splitDescriptionAndMeta(row.description);

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    processPath: row.process_path,
    requester: row.requester,
    description,
    owner: row.owner,
    reportedAt: row.reported_at,
    expectedDoneAt: row.expected_done_at,
    status: row.status,
    conclusion: row.conclusion,
    rejectReason: row.reject_reason,
    businessArea: row.business_area,
    nextAction: meta.nextAction ?? null,
    requirementDocUrl: meta.requirementDocUrl ?? null,
    rdOwner: meta.rdOwner ?? null,
    testerOwner: meta.testerOwner ?? null,
    requirementPriority: meta.requirementPriority ?? null,
    requirementStage: meta.requirementStage ?? null,
    plannedLaunchAt: meta.plannedLaunchAt ?? null,
    actualLaunchAt: meta.actualLaunchAt ?? null,
    riskNote: meta.riskNote ?? null,
    impactScope: meta.impactScope ?? null,
    occurredAt: meta.occurredAt ?? null,
    investigationResult: meta.investigationResult ?? null,
    convertedRequirement: meta.convertedRequirement ?? null,
    relatedRule: meta.relatedRule ?? null,
    answerSummary: meta.answerSummary ?? null,
    needDoc: meta.needDoc ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
