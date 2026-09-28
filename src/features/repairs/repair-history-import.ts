import { createHash } from "node:crypto";
import { repairFieldLimits } from "@/config/repairs";

/**
 * 历史修机数据导入（issue #72）——纯解析与匹配逻辑，不碰数据库。
 *
 * 数据来自腾讯在线文档表单（导出 CSV / xlsx 后交给 `tools/import-repair-history.ts`）。
 * 表头与真实数据列名以社团后续提供的导出为准：这里按常见叫法收了一组别名，
 * 对不上时脚本会报「缺少列」而不是猜。
 */

export type HistoryInputRow = {
  lineNo: number;
  raw: Partial<Record<HistoryField, string>>;
};

export const HISTORY_COLUMNS = [
  "name",
  "repairDate",
  "durationMinutes",
  "categoryName",
  "content",
] as const;
export const HISTORY_OPTIONAL_COLUMNS = ["result", "remark"] as const;
export type HistoryColumnName = (typeof HISTORY_COLUMNS)[number];
export type HistoryOptionalName = (typeof HISTORY_OPTIONAL_COLUMNS)[number];
export type HistoryField = HistoryColumnName | HistoryOptionalName;

const HEADER_ALIASES: Record<HistoryField, readonly string[]> = {
  name: ["姓名", "维修人", "维修成员", "成员", "name"],
  repairDate: ["维修日期", "日期", "date"],
  durationMinutes: [
    "维修时长（分钟）",
    "维修时长(分钟)",
    "维修时长",
    "时长（分钟）",
    "时长(分钟)",
    "时长",
    "分钟",
    "duration",
  ],
  categoryName: ["故障分类", "分类", "category"],
  content: ["维修内容", "内容", "故障描述", "content"],
  result: ["维修结果", "结果", "result"],
  remark: ["备注", "remark"],
};

function normalizeHeader(value: string): string {
  return value.trim().replace(/^\ufeff/, "");
}

/** 表头行 → 列名映射；缺任一必需列时报错并列出可识别的表头。 */
export function mapHistoryHeader(cells: string[]): {
  fields: Partial<Record<HistoryField, number>>;
  missing: HistoryColumnName[];
} {
  const fields: Partial<Record<HistoryField, number>> = {};
  cells.forEach((cell, index) => {
    const value = normalizeHeader(cell);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [HistoryField, string[]][]) {
      if (
        fields[field] === undefined &&
        aliases.some((alias) => alias.toLowerCase() === value.toLowerCase())
      ) {
        fields[field] = index;
      }
    }
  });
  const missing = HISTORY_COLUMNS.filter((column) => fields[column] === undefined);
  return { fields, missing };
}

/** 最小 CSV 解析：双引号包裹、转义引号、CRLF，够用且无新依赖。 */
export function parseDelimitedRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\ufeff/, "");
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i += 1;
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => normalizeHeader(value) !== ""));
}

export type HistoryMemberRef = { profileId: string; realName: string };
export type HistoryCategoryRef = { id: string; name: string; isActive: boolean };

export type ValidHistoryRow = {
  lineNo: number;
  memberProfileId: string;
  categoryId: string;
  repairDate: string;
  durationMinutes: number;
  content: string;
  result: "COMPLETED" | "NOT_COMPLETED";
  remark: string | null;
  idempotencyKey: string;
};

export type RejectedHistoryRow = { lineNo: number; reason: string };

export type HistoryPlan = {
  valid: ValidHistoryRow[];
  rejected: RejectedHistoryRow[];
};

function normalizeDate(value: string): string | null {
  const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  if (Number.isNaN(new Date(`${iso}T00:00:00.000Z`).valueOf())) return null;
  return iso;
}

function normalizeDuration(value: string): number | null {
  const numeric = value.trim().replace(/分钟$/, "");
  if (!/^\d+$/.test(numeric)) return null;
  const parsed = Number.parseInt(numeric, 10);
  if (
    !Number.isInteger(parsed) ||
    parsed < repairFieldLimits.durationMinutesMin ||
    parsed > repairFieldLimits.durationMinutesMax
  )
    return null;
  return parsed;
}

/** 行指纹：规范化字段做哈希，同一行重复导入天然幂等。 */
export function historyRowKey(row: {
  memberProfileId: string;
  categoryId: string;
  repairDate: string;
  durationMinutes: number;
  content: string;
  result: string;
  remark: string | null;
}): string {
  const digest = createHash("sha256").update(JSON.stringify(row), "utf8").digest("hex");
  return `history-import:${digest}`;
}

/**
 * 按姓名匹配成员、按名称匹配分类，产出可导入行与逐行拒收原因。
 * 重名（同名多位在册成员）不猜归属，整组拒收转人工。
 */
export function classifyHistoryRows(
  inputs: HistoryInputRow[],
  refs: { members: HistoryMemberRef[]; categories: HistoryCategoryRef[]; today: string },
): HistoryPlan {
  const byName = new Map<string, HistoryMemberRef[]>();
  for (const member of refs.members) {
    const key = member.realName.trim();
    byName.set(key, [...(byName.get(key) ?? []), member]);
  }
  const categoryByName = new Map(
    refs.categories.map((category) => [category.name.trim(), category]),
  );

  const valid: ValidHistoryRow[] = [];
  const rejected: RejectedHistoryRow[] = [];

  for (const input of inputs) {
    const reject = (reason: string) => rejected.push({ lineNo: input.lineNo, reason });
    const name = (input.raw.name ?? "").trim();
    if (!name) {
      reject("缺少姓名");
      continue;
    }
    const candidates = byName.get(name) ?? [];
    if (candidates.length === 0) {
      reject(`未找到在册成员：${name}`);
      continue;
    }
    if (candidates.length > 1) {
      reject(`姓名重名，需人工确认归属：${name}`);
      continue;
    }
    const repairDate = normalizeDate(input.raw.repairDate ?? "");
    if (!repairDate) {
      reject(`维修日期无效：${input.raw.repairDate ?? "（空）"}`);
      continue;
    }
    if (repairDate < repairFieldLimits.repairDateMin || repairDate > refs.today) {
      reject(`维修日期超出范围：${repairDate}`);
      continue;
    }
    const durationMinutes = normalizeDuration(input.raw.durationMinutes ?? "");
    if (durationMinutes === null) {
      reject(
        `维修时长无效（须为 ${repairFieldLimits.durationMinutesMin}–${repairFieldLimits.durationMinutesMax} 的整数分钟）：${input.raw.durationMinutes ?? "（空）"}`,
      );
      continue;
    }
    const categoryName = (input.raw.categoryName ?? "").trim();
    const category = categoryByName.get(categoryName);
    if (!category) {
      reject(`未找到故障分类：${categoryName || "（空）"}`);
      continue;
    }
    if (!category.isActive) {
      reject(`故障分类已停用：${categoryName}`);
      continue;
    }
    const content = (input.raw.content ?? "").trim();
    if (!content) {
      reject("缺少维修内容");
      continue;
    }
    if (content.length > repairFieldLimits.contentMaxLength) {
      reject(`维修内容超过 ${repairFieldLimits.contentMaxLength} 字`);
      continue;
    }
    const remark = (input.raw.remark ?? "").trim() || null;
    if (remark && remark.length > repairFieldLimits.remarkMaxLength) {
      reject(`备注超过 ${repairFieldLimits.remarkMaxLength} 字`);
      continue;
    }
    const rawResult = (input.raw.result ?? "").trim();
    let result: ValidHistoryRow["result"] = "COMPLETED";
    if (rawResult) {
      if (rawResult === "已完成" || rawResult === "COMPLETED") result = "COMPLETED";
      else if (rawResult === "未完成" || rawResult === "NOT_COMPLETED") result = "NOT_COMPLETED";
      else {
        reject(`维修结果无效：${rawResult}`);
        continue;
      }
    }
    const memberProfileId = candidates[0].profileId;
    valid.push({
      lineNo: input.lineNo,
      memberProfileId,
      categoryId: category.id,
      repairDate,
      durationMinutes,
      content,
      result,
      remark,
      idempotencyKey: historyRowKey({
        memberProfileId,
        categoryId: category.id,
        repairDate,
        durationMinutes,
        content,
        result,
        remark,
      }),
    });
  }
  return { valid, rejected };
}
