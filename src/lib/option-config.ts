/**
 * ────────────────────────────────────────────────────────
 *  所有下拉菜单选项集中配置
 * ────────────────────────────────────────────────────────
 *
 *  使用方式：
 *   - 想新增/修改某个下拉选项？直接在下面改对应的数组；
 *   - 想改某个选项的颜色/标签？改对应的 tone 对象；
 *   - 改完保存，`npm run dev` 自动热更新生效。
 *
 *  ⚠️  注意：新增选项时，需要同时在对应的 tone 对象里加一条颜色配置，
 *       否则该选项在 UI 上会显示成灰色/无色。
 */

// ──────────────────── 1. 事项分类 ────────────────────
// 对应：收集箱/工作台/待归类里的"分类"下拉。
export const WORK_ITEM_CATEGORIES = [
  "任务",
  "需求",
  "线上问题",
  "逻辑答疑",
  "日常待办",
  "不承接",
] as const;

export const CATEGORY_TONE: Record<string, string> = {
  任务: "bg-slate-100 text-slate-700 ring-slate-200",
  需求: "bg-sky-100 text-sky-800 ring-sky-200",
  线上问题: "bg-orange-100 text-orange-800 ring-orange-200",
  逻辑答疑: "bg-violet-100 text-violet-800 ring-violet-200",
  日常待办: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  不承接: "bg-zinc-200 text-zinc-700 ring-zinc-300",
};

// 对外展示时的别名（例如：分类是"任务"但在界面上叫"待归类"）。
export const CATEGORY_DISPLAY: Record<string, string> = {
  任务: "待归类",
  需求: "需求",
  线上问题: "线上问题",
  逻辑答疑: "逻辑答疑",
  日常待办: "日常待办",
  不承接: "低价值",
};

// ──────────────────── 2. 事项状态 ────────────────────
// 对应：每条事项的"状态"字段。
export const WORK_ITEM_STATUSES = [
  "已记录",
  "处理中",
  "待反馈",
  "待验证",
  "已完成",
  "暂不处理",
] as const;

export const STATUS_TONE: Record<string, string> = {
  已记录: "bg-slate-100 text-slate-700 ring-slate-200",
  处理中: "bg-blue-100 text-blue-800 ring-blue-200",
  待反馈: "bg-amber-100 text-amber-800 ring-amber-200",
  待验证: "bg-cyan-100 text-cyan-800 ring-cyan-200",
  已完成: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  暂不处理: "bg-zinc-200 text-zinc-700 ring-zinc-300",
};

// ──────────────────── 3. 处理路径 ────────────────────
// 对应：线上问题/任务 的"处理路径"下拉。
export const PROCESS_PATHS = [
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

// ──────────────────── 4. 需求优先级 ────────────────────
// 对应：需求管理的"优先级"列。
export const REQUIREMENT_PRIORITIES = [
  "P0 - 重要紧急",
  "P1 - 高优项目",
  "P2 - 常规项目",
] as const;

export const PRIORITY_TONE: Record<string, string> = {
  "P0 - 重要紧急": "bg-rose-100 text-rose-800 ring-rose-200",
  "P1 - 高优项目": "bg-amber-100 text-amber-800 ring-amber-200",
  "P2 - 常规项目": "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

// ──────────────────── 5. 需求推进阶段 ────────────────────
// 对应：需求管理的"推进阶段"列。
export const REQUIREMENT_STAGES = [
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

export const STAGE_TONE: Record<string, string> = {
  待澄清: "bg-slate-100 text-slate-700 ring-slate-200",
  待评审: "bg-violet-100 text-violet-800 ring-violet-200",
  待开发: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  开发中: "bg-blue-100 text-blue-800 ring-blue-200",
  测试中: "bg-cyan-100 text-cyan-800 ring-cyan-200",
  待上线: "bg-amber-100 text-amber-800 ring-amber-200",
  已上线: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  业务交付: "bg-teal-100 text-teal-800 ring-teal-200",
  暂缓: "bg-zinc-200 text-zinc-700 ring-zinc-300",
};

// ──────────────────── 6. 不承接原因 ────────────────────
export const REJECT_REASONS = [
  "职责边界外",
  "替别人做无效判断",
  "信息不完整",
  "无明确业务价值",
  "重复事项",
  "已有规则可自助解决",
] as const;

// ──────────────────── 7. 业务领域 ────────────────────
export const BUSINESS_AREAS = [
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

// ──────────────────── 8. 已上线需求的"持续跟进"动作项 ────────────────────
// 对应：需求聚焦视图里的 4 个 checkbox，勾上任意一个即归入"持续跟进"区。
export const POST_LAUNCH_ACTIONS = [
  { id: "report", label: "待周会汇报" },
  { id: "perf", label: "待录绩效" },
  { id: "doc", label: "待写文档" },
  { id: "observe", label: "待持续观察" },
] as const;

export type PostLaunchActionId = (typeof POST_LAUNCH_ACTIONS)[number]["id"];
