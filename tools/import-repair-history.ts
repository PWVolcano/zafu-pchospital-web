import { readFile } from "node:fs/promises";
import { authorizeUser } from "../src/lib/auth/authorize";
import { disconnectDb, getDb } from "../src/lib/db/client";
import { shanghaiToday } from "../src/lib/shanghai-date";
import {
  classifyHistoryRows,
  mapHistoryHeader,
  parseDelimitedRows,
  HISTORY_OPTIONAL_COLUMNS,
  HISTORY_COLUMNS,
  type HistoryInputRow,
} from "../src/features/repairs/repair-history-import";
import { applyHistoryImport } from "../src/features/repairs/repair-history-import-service";

/**
 * 历史修机数据导入（issue #72）。
 *
 * 用法：
 *   corepack pnpm import:repair-history <文件.csv|.xlsx> [--actor=<userId>] [--apply]
 *
 * - 缺省是 dry-run：只做表头识别、姓名/分类匹配与逐行校验，报告问题行，不写库；
 * - 确认报告没问题后加 `--apply` 真正导入；`--actor` 必须是拥有 `repair:review`
 *   权限的管理员用户 ID（写审计用）；
 * - 行指纹幂等：同一行重复执行只会跳过，不会重复入库；
 * - 列名按常见叫法匹配（见 repair-history-import.ts 的别名表），与腾讯文档实际
 *   导出表头对不上时先改导出的表头或补充名，脚本不会猜列。
 */

async function readRows(file: string, text: string): Promise<string[][]> {
  if (file.endsWith(".csv")) return parseDelimitedRows(text);
  if (file.endsWith(".xlsx")) {
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await readFile(file)) as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("xlsx 里没有工作表");
    const rows: string[][] = [];
    sheet.eachRow((row) => {
      rows.push(
        Array.from({ length: row.cellCount }, (_, index) => {
          const value = row.getCell(index + 1).value;
          return formatCell(value);
        }),
      );
    });
    return rows.filter((row) => row.some((cell) => cell.trim() !== ""));
  }
  throw new Error("只支持 .csv 或 .xlsx 文件");
}

function formatCell(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  if (typeof value === "object") {
    const cell = value as { text?: string; result?: unknown };
    if (typeof cell.text === "string") return cell.text;
    if (cell.result != null) return String(cell.result);
  }
  return String(value);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const file = args.find((arg) => !arg.startsWith("--"));
  const apply = args.includes("--apply");
  const actorArg = args.find((arg) => arg.startsWith("--actor="))?.slice("--actor=".length);
  if (!file) {
    console.error("用法：pnpm import:repair-history <文件.csv|.xlsx> [--actor=<userId>] [--apply]");
    process.exitCode = 1;
    return;
  }
  if (apply && !actorArg) {
    console.error("--apply 必须同时提供 --actor=<管理员用户 ID>（需要 repair:review 权限）。");
    process.exitCode = 1;
    return;
  }

  const text = await readFile(file, "utf8");
  const rows = await readRows(file, text);
  if (rows.length < 2) {
    console.error("文件里只有表头或为空，没有可导入的数据行。");
    process.exitCode = 1;
    return;
  }
  const { fields, missing } = mapHistoryHeader(rows[0]);
  if (missing.length) {
    console.error(`表头缺少必需列：${missing.join("、")}`);
    console.error(`识别到的表头：${rows[0].join(" | ")}`);
    console.error(
      `必需列别名：${HISTORY_COLUMNS.map((c) => `${c}=${HEADER_ALIAS_TEXT[c]}`).join("；")}`,
    );
    process.exitCode = 1;
    return;
  }
  const optional = HISTORY_OPTIONAL_COLUMNS.filter((column) => fields[column] === undefined);
  if (optional.length) console.log(`选填列缺失（按默认值处理）：${optional.join("、")}`);

  const inputs: HistoryInputRow[] = [];
  for (let index = 1; index < rows.length; index += 1) {
    const cells = rows[index];
    const raw = {} as HistoryInputRow["raw"];
    for (const [field, column] of Object.entries(fields)) {
      raw[field as keyof typeof raw] = (cells[column as number] ?? "").trim();
    }
    inputs.push({ lineNo: index + 1, raw });
  }

  const db = getDb();
  const [memberRows, categories] = await Promise.all([
    db.memberProfile.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, realName: true },
    }),
    db.repairCategory.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, isActive: true },
    }),
  ]);
  const members = memberRows.map((member) => ({ profileId: member.id, realName: member.realName }));
  const plan = classifyHistoryRows(inputs, { members, categories, today: shanghaiToday() });

  console.log(`总行数 ${inputs.length}：可导入 ${plan.valid.length}，拒收 ${plan.rejected.length}`);
  for (const row of plan.rejected) console.log(`  第 ${row.lineNo} 行：${row.reason}`);
  if (!plan.valid.length) {
    console.log("没有可导入的行。");
    await disconnectDb();
    return;
  }
  if (!apply) {
    console.log("dry-run 完成，未写库。确认无误后加 --apply 执行导入。");
    await disconnectDb();
    return;
  }
  const actor = await authorizeUser(actorArg, { requestId: `history-import-${Date.now()}` });
  const result = await applyHistoryImport(plan.valid, actor);
  console.log(`导入完成：新增 ${result.inserted} 条，重复跳过 ${result.skipped} 条。`);
  await disconnectDb();
}

const HEADER_ALIAS_TEXT: Record<(typeof HISTORY_COLUMNS)[number], string> = {
  name: "姓名/维修人/维修成员/name",
  repairDate: "维修日期/日期/date",
  durationMinutes: "维修时长（分钟）/时长/分钟/duration",
  categoryName: "故障分类/分类/category",
  content: "维修内容/内容/故障描述/content",
};

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  await disconnectDb();
  process.exitCode = 1;
});
