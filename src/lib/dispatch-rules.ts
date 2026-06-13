import type { WorkItem, WorkItemCategory, WorkItemStatus, ProcessPath, RequirementStage } from "@/lib/work-item-types";

export type DispatchRule = {
  id: string;
  name: string;
  enabled: boolean;
  score: number;
  label: string;
  reason: string;
  action: string;
  tone: string;
  explanation: string;
  match: {
    overdue?: boolean;
    category?: WorkItemCategory;
    status?: WorkItemStatus;
    processPath?: ProcessPath;
    requirementStage?: RequirementStage;
    convertedRequirement?: boolean;
    needDoc?: boolean;
  };
};

export const dispatchRules: DispatchRule[] = [
  {
    id: "overdue",
    name: "超期事项优先",
    enabled: true,
    score: 100,
    label: "超期",
    reason: "已超过预期时间，需要先判断是否阻塞业务。",
    action: "先确认进展",
    tone: "bg-rose-100 text-rose-800 ring-rose-200",
    explanation: "只要事项还没完成，并且预期完成时间已经早于现在，就会排到最前面。",
    match: { overdue: true },
  },
  {
    id: "waiting",
    name: "待反馈事项优先",
    enabled: true,
    score: 90,
    label: "待反馈",
    reason: "有人在等反馈，适合先推进一次。",
    action: "催一下反馈",
    tone: "bg-amber-100 text-amber-800 ring-amber-200",
    explanation: "状态是「待反馈」的事项会优先推荐，避免别人一直等你回复。",
    match: { status: "待反馈" },
  },
  {
    id: "requirement_clarify",
    name: "待澄清需求优先",
    enabled: true,
    score: 86,
    label: "待澄清",
    reason: "需求还没澄清，容易卡住评审和排期。",
    action: "补清楚需求",
    tone: "bg-slate-100 text-slate-700 ring-slate-200",
    explanation: "分类是「需求」且阶段是「待澄清」时推荐，提醒你先补齐背景、范围和验收口径。",
    match: { category: "需求", requirementStage: "待澄清" },
  },
  {
    id: "requirement_review",
    name: "待评审需求优先",
    enabled: true,
    score: 84,
    label: "待评审",
    reason: "需求处于待评审，需要推动评审或确认排期。",
    action: "约评审",
    tone: "bg-violet-100 text-violet-800 ring-violet-200",
    explanation: "分类是「需求」且阶段是「待评审」时推荐，因为这是产品需要主动推进的节点。",
    match: { category: "需求", requirementStage: "待评审" },
  },
  {
    id: "requirement_launch",
    name: "待上线需求优先",
    enabled: true,
    score: 82,
    label: "待上线",
    reason: "需求接近交付，需要关注上线和业务同步。",
    action: "确认上线",
    tone: "bg-amber-100 text-amber-800 ring-amber-200",
    explanation: "分类是「需求」且阶段是「待上线」时推荐，避免临门一脚没人跟。",
    match: { category: "需求", requirementStage: "待上线" },
  },
  {
    id: "unclassified",
    name: "待分流事项优先",
    enabled: true,
    score: 80,
    label: "待分流",
    reason: "还没有判断归属，容易堆成脑内负担。",
    action: "先判断归属",
    tone: "bg-slate-100 text-slate-700 ring-slate-200",
    explanation: "分类是「待归类」且状态是「已记录」时推荐，提醒你先判断它到底属于需求、问题还是答疑。",
    match: { category: "任务", status: "已记录" },
  },
  {
    id: "incident_convert_requirement",
    name: "可能转需求的线上问题",
    enabled: true,
    score: 78,
    label: "可能转需求",
    reason: "已经有转需求迹象，需要进入正式提需链路。",
    action: "转为需求",
    tone: "bg-orange-100 text-orange-800 ring-orange-200",
    explanation: "线上问题的处理路径是「转需求」时推荐，提醒你不要只停留在问题记录里。",
    match: { category: "线上问题", processPath: "转需求" },
  },
  {
    id: "incident",
    name: "线上问题优先",
    enabled: true,
    score: 75,
    label: "线上问题",
    reason: "线上反馈通常会持续追问，需要尽快形成结论。",
    action: "补处理结论",
    tone: "bg-orange-100 text-orange-800 ring-orange-200",
    explanation: "分类是「线上问题」时推荐，因为这类事项通常更容易被业务追问。",
    match: { category: "线上问题" },
  },
  {
    id: "knowledge",
    name: "可沉淀事项",
    enabled: true,
    score: 65,
    label: "可沉淀",
    reason: "这类问题容易重复出现，处理完可以复用回复。",
    action: "沉淀结论",
    tone: "bg-violet-100 text-violet-800 ring-violet-200",
    explanation: "逻辑答疑或被标记为需沉淀的事项会推荐，提醒你把结论变成下次可复制的回复。",
    match: { needDoc: true },
  },
  {
    id: "qa",
    name: "逻辑答疑可沉淀",
    enabled: true,
    score: 64,
    label: "可沉淀",
    reason: "逻辑答疑容易重复出现，适合沉淀为知识。",
    action: "沉淀结论",
    tone: "bg-violet-100 text-violet-800 ring-violet-200",
    explanation: "分类是「逻辑答疑」时推荐，减少下次重复解释。",
    match: { category: "逻辑答疑" },
  },
];

export function dispatchRuleMatches(rule: DispatchRule, item: WorkItem, isOverdue: boolean) {
  const { match } = rule;
  if (!rule.enabled) return false;
  if (match.overdue !== undefined && match.overdue !== isOverdue) return false;
  if (match.category !== undefined && match.category !== item.category) return false;
  if (match.status !== undefined && match.status !== item.status) return false;
  if (match.processPath !== undefined && match.processPath !== item.processPath) return false;
  if (match.requirementStage !== undefined && match.requirementStage !== item.requirementStage) return false;
  if (match.convertedRequirement !== undefined && match.convertedRequirement !== Boolean(item.convertedRequirement)) return false;
  if (match.needDoc !== undefined && match.needDoc !== Boolean(item.needDoc)) return false;
  return true;
}
