import { z } from "zod";
import {
  businessAreas,
  joinDescriptionAndMeta,
  processPaths,
  requirementPriorities,
  requirementStages,
  rejectReasons,
  splitDescriptionAndMeta,
  workItemCategories,
  workItemFromRow,
  workItemStatuses,
  type CreateWorkItemInput,
  type UpdateWorkItemInput,
  type WorkItem,
  type WorkItemRow,
} from "@/lib/work-item-types";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const optionalString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (value === undefined) return undefined;
    return value && value.length > 0 ? value : null;
  });

const optionalDateTime = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (!value) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  });

const optionalBoolean = z
  .union([z.boolean(), z.string()])
  .optional()
  .nullable()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value === "") {
      return null;
    }

    if (typeof value === "boolean") {
      return value;
    }

    return value === "true";
  });

export const createWorkItemSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(120, "标题不能超过 120 个字"),
  category: z.enum(workItemCategories).default("任务"),
  processPath: z.enum(processPaths).optional().nullable(),
  requester: optionalString,
  description: z.string().trim().min(1, "问题描述不能为空").max(2000, "问题描述不能超过 2000 个字"),
  owner: optionalString,
  reportedAt: optionalDateTime,
  expectedDoneAt: optionalDateTime,
  status: z.enum(workItemStatuses).default("已记录"),
  conclusion: optionalString,
  rejectReason: z.enum(rejectReasons).optional().nullable(),
  businessArea: z.enum(businessAreas).optional().nullable(),
  nextAction: optionalString,
  requirementDocUrl: optionalString,
  rdOwner: optionalString,
  testerOwner: optionalString,
  requirementPriority: z.enum(requirementPriorities).optional().nullable(),
  requirementStage: z.enum(requirementStages).optional().nullable(),
  plannedLaunchAt: optionalDateTime,
  actualLaunchAt: optionalDateTime,
  riskNote: optionalString,
  impactScope: optionalString,
  occurredAt: optionalDateTime,
  investigationResult: optionalString,
  convertedRequirement: optionalBoolean,
  relatedRule: optionalString,
  answerSummary: optionalString,
  needDoc: optionalBoolean,
});

export const updateWorkItemSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(120, "标题不能超过 120 个字").optional(),
  category: z.enum(workItemCategories).optional(),
  processPath: z.enum(processPaths).optional().nullable(),
  requester: optionalString,
  description: z.string().trim().min(1, "问题描述不能为空").max(2000, "问题描述不能超过 2000 个字").optional(),
  owner: optionalString,
  reportedAt: optionalDateTime,
  expectedDoneAt: optionalDateTime,
  status: z.enum(workItemStatuses).optional(),
  conclusion: optionalString,
  rejectReason: z.enum(rejectReasons).optional().nullable(),
  businessArea: z.enum(businessAreas).optional().nullable(),
  nextAction: optionalString,
  requirementDocUrl: optionalString,
  rdOwner: optionalString,
  testerOwner: optionalString,
  requirementPriority: z.enum(requirementPriorities).optional().nullable(),
  requirementStage: z.enum(requirementStages).optional().nullable(),
  plannedLaunchAt: optionalDateTime,
  actualLaunchAt: optionalDateTime,
  riskNote: optionalString,
  impactScope: optionalString,
  occurredAt: optionalDateTime,
  investigationResult: optionalString,
  convertedRequirement: optionalBoolean,
  relatedRule: optionalString,
  answerSummary: optionalString,
  needDoc: optionalBoolean,
});

function toInsert(input: CreateWorkItemInput) {
  const description = joinDescriptionAndMeta(input.description, {
    nextAction: input.nextAction,
    requirementDocUrl: input.requirementDocUrl,
    rdOwner: input.rdOwner,
    testerOwner: input.testerOwner,
    requirementPriority: input.requirementPriority,
    requirementStage: input.requirementStage,
    plannedLaunchAt: input.plannedLaunchAt,
    actualLaunchAt: input.actualLaunchAt,
    riskNote: input.riskNote,
    impactScope: input.impactScope,
    occurredAt: input.occurredAt,
    investigationResult: input.investigationResult,
    convertedRequirement: input.convertedRequirement,
    relatedRule: input.relatedRule,
    answerSummary: input.answerSummary,
    needDoc: input.needDoc,
  });

  return {
    title: input.title,
    category: input.category,
    process_path: input.processPath ?? null,
    requester: input.requester ?? null,
    description,
    owner: input.owner ?? null,
    reported_at: input.reportedAt ?? new Date().toISOString(),
    expected_done_at: input.expectedDoneAt ?? null,
    status: input.status ?? "已记录",
    conclusion: input.conclusion ?? null,
    reject_reason: input.rejectReason ?? null,
    business_area: input.businessArea ?? null,
  };
}

function hasMetaUpdate(input: UpdateWorkItemInput) {
  return [
    "nextAction",
    "requirementDocUrl",
    "rdOwner",
    "testerOwner",
    "requirementPriority",
    "requirementStage",
    "plannedLaunchAt",
    "actualLaunchAt",
    "riskNote",
    "impactScope",
    "occurredAt",
    "investigationResult",
    "convertedRequirement",
    "relatedRule",
    "answerSummary",
    "needDoc",
  ].some((key) => key in input);
}

function buildDescriptionUpdate(input: UpdateWorkItemInput, existing?: WorkItemRow) {
  if (input.description === undefined && !hasMetaUpdate(input)) {
    return {};
  }

  const parsed = existing
    ? splitDescriptionAndMeta(existing.description)
    : { description: "", meta: {} };

  return {
    description: joinDescriptionAndMeta(input.description ?? parsed.description, {
      ...parsed.meta,
      ...(input.nextAction !== undefined ? { nextAction: input.nextAction } : {}),
      ...(input.requirementDocUrl !== undefined ? { requirementDocUrl: input.requirementDocUrl } : {}),
      ...(input.rdOwner !== undefined ? { rdOwner: input.rdOwner } : {}),
      ...(input.testerOwner !== undefined ? { testerOwner: input.testerOwner } : {}),
      ...(input.requirementPriority !== undefined ? { requirementPriority: input.requirementPriority } : {}),
      ...(input.requirementStage !== undefined ? { requirementStage: input.requirementStage } : {}),
      ...(input.plannedLaunchAt !== undefined ? { plannedLaunchAt: input.plannedLaunchAt } : {}),
      ...(input.actualLaunchAt !== undefined ? { actualLaunchAt: input.actualLaunchAt } : {}),
      ...(input.riskNote !== undefined ? { riskNote: input.riskNote } : {}),
      ...(input.impactScope !== undefined ? { impactScope: input.impactScope } : {}),
      ...(input.occurredAt !== undefined ? { occurredAt: input.occurredAt } : {}),
      ...(input.investigationResult !== undefined ? { investigationResult: input.investigationResult } : {}),
      ...(input.convertedRequirement !== undefined ? { convertedRequirement: input.convertedRequirement } : {}),
      ...(input.relatedRule !== undefined ? { relatedRule: input.relatedRule } : {}),
      ...(input.answerSummary !== undefined ? { answerSummary: input.answerSummary } : {}),
      ...(input.needDoc !== undefined ? { needDoc: input.needDoc } : {}),
    }),
  };
}

function toUpdate(input: UpdateWorkItemInput, existing?: WorkItemRow) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.processPath !== undefined ? { process_path: input.processPath } : {}),
    ...(input.requester !== undefined ? { requester: input.requester } : {}),
    ...buildDescriptionUpdate(input, existing),
    ...(input.owner !== undefined ? { owner: input.owner } : {}),
    ...(input.reportedAt !== undefined ? { reported_at: input.reportedAt } : {}),
    ...(input.expectedDoneAt !== undefined ? { expected_done_at: input.expectedDoneAt } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.conclusion !== undefined ? { conclusion: input.conclusion } : {}),
    ...(input.rejectReason !== undefined ? { reject_reason: input.rejectReason } : {}),
    ...(input.businessArea !== undefined ? { business_area: input.businessArea } : {}),
  };
}

export async function listWorkItems(): Promise<WorkItem[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("work_items")
    .select("*")
    .order("reported_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WorkItemRow[]).map(workItemFromRow);
}

export async function createWorkItem(input: CreateWorkItemInput): Promise<WorkItem> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("work_items")
    .insert(toInsert(input))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return workItemFromRow(data as WorkItemRow);
}

export async function updateWorkItem(id: string, input: UpdateWorkItemInput): Promise<WorkItem> {
  const supabase = getSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("work_items")
    .select("*")
    .eq("id", id)
    .single();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const { data, error } = await supabase
    .from("work_items")
    .update(toUpdate(input, existing as WorkItemRow))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return workItemFromRow(data as WorkItemRow);
}

export async function deleteWorkItem(id: string) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("work_items").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
