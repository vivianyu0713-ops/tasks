import {
  WORK_ITEM_CATEGORIES,
  PROCESS_PATHS,
  WORK_ITEM_STATUSES,
  REQUIREMENT_PRIORITIES,
  REQUIREMENT_STAGES,
  REJECT_REASONS,
  BUSINESS_AREAS,
  type PostLaunchActionId,
} from "@/lib/option-config";

export const workItemCategories = WORK_ITEM_CATEGORIES;
export const processPaths = PROCESS_PATHS;
export const workItemStatuses = WORK_ITEM_STATUSES;
export const requirementPriorities = REQUIREMENT_PRIORITIES;
export const requirementStages = REQUIREMENT_STAGES;
export const rejectReasons = REJECT_REASONS;
export const businessAreas = BUSINESS_AREAS;

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
  // 已上线需求：用户标记还有哪些“上线后动作”未完成。
  // 数组为空或不存在 → 沉淀归档；有任意一项 → 持续跟进。
  postLaunchActions?: PostLaunchActionId[] | null;
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
  postLaunchActions: PostLaunchActionId[];
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
  postLaunchActions?: PostLaunchActionId[] | null;
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
    postLaunchActions: meta.postLaunchActions ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
