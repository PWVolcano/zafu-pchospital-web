import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyHistoryRows,
  historyRowKey,
  mapHistoryHeader,
  parseDelimitedRows,
  type HistoryInputRow,
} from "../../src/features/repairs/repair-history-import";

const members = [
  { profileId: "p-zhang", realName: "张三" },
  { profileId: "p-li1", realName: "李四" },
  { profileId: "p-li2", realName: "李四" },
];
const categories = [
  { id: "c-soft", name: "软件系统", isActive: true },
  { id: "c-hw", name: "硬件维护", isActive: false },
];
const today = "2026-09-28";

function row(lineNo: number, values: Partial<HistoryInputRow["raw"]>): HistoryInputRow {
  return {
    lineNo,
    raw: {
      name: "张三",
      repairDate: "2026-09-01",
      durationMinutes: "90",
      categoryName: "软件系统",
      content: "重装系统并清理灰尘",
      ...values,
    },
  };
}

test("表头按别名识别，缺列时报出缺失项", () => {
  const { fields, missing } = mapHistoryHeader([
    "序号",
    "姓名",
    "维修日期",
    "时长(分钟)",
    "故障分类",
    "维修内容",
    "备注",
  ]);
  assert.deepEqual(missing, []);
  assert.equal(fields.name, 1);
  assert.equal(fields.repairDate, 2);
  assert.equal(fields.durationMinutes, 3);
  assert.equal(fields.categoryName, 4);
  assert.equal(fields.content, 5);
  assert.equal(fields.remark, 6);
  const short = mapHistoryHeader(["姓名", "日期"]);
  assert.deepEqual(short.missing, ["durationMinutes", "categoryName", "content"]);
});

test("CSV 解析支持引号、逗号、CRLF 与 BOM", () => {
  const rows = parseDelimitedRows('\ufeff姓名,内容\r\n张三,"换硅脂,清灰"\r\n李四,装系统\r\n');
  assert.deepEqual(rows, [
    ["姓名", "内容"],
    ["张三", "换硅脂,清灰"],
    ["李四", "装系统"],
  ]);
});

test("按姓名匹配成员：唯一命中通过，重名与查无整行拒收", () => {
  const plan = classifyHistoryRows(
    [row(2, {}), row(3, { name: "李四" }), row(4, { name: "王五" }), row(5, { name: "  " })],
    { members, categories, today },
  );
  assert.equal(plan.valid.length, 1);
  assert.equal(plan.valid[0].memberProfileId, "p-zhang");
  assert.deepEqual(
    plan.rejected.map((r) => [
      r.lineNo,
      r.reason.startsWith("姓名重名") ||
        r.reason.startsWith("未找到在册成员") ||
        r.reason === "缺少姓名",
    ]),
    [
      [3, true],
      [4, true],
      [5, true],
    ],
  );
});

test("日期、时长、分类与正文逐行校验", () => {
  const plan = classifyHistoryRows(
    [
      row(2, { repairDate: "2026/9/5" }),
      row(3, { repairDate: "2019-12-31" }),
      row(4, { repairDate: "2026-09-29" }),
      row(5, { durationMinutes: "0" }),
      row(6, { durationMinutes: "10081" }),
      row(7, { durationMinutes: "1.5" }),
      row(8, { durationMinutes: "45分钟" }),
      row(9, { categoryName: "硬件维护" }),
      row(10, { categoryName: "不存在" }),
      row(11, { content: "  " }),
    ],
    { members, categories, today },
  );
  // 斜杠日期规范化、分钟后缀容忍、停用分类拒收。
  assert.deepEqual(
    plan.valid.map((v) => [v.lineNo, v.repairDate, v.durationMinutes]),
    [
      [2, "2026-09-05", 90],
      [8, "2026-09-01", 45],
    ],
  );
  assert.deepEqual(
    plan.rejected.map((r) => r.lineNo),
    [3, 4, 5, 6, 7, 9, 10, 11],
  );
});

test("结果列只接受已完成/未完成，缺省为已完成", () => {
  const plan = classifyHistoryRows(
    [row(2, { result: "未完成" }), row(3, { result: "已完成" }), row(4, { result: "大概好了" })],
    { members, categories, today },
  );
  assert.equal(plan.valid[0].result, "NOT_COMPLETED");
  assert.equal(plan.valid[1].result, "COMPLETED");
  assert.equal(plan.rejected[0]?.lineNo, 4);
});

test("行指纹稳定且随字段变化", () => {
  const base = {
    memberProfileId: "p",
    categoryId: "c",
    repairDate: "2026-09-01",
    durationMinutes: 90,
    content: "x",
    result: "COMPLETED",
    remark: null,
  };
  assert.equal(historyRowKey(base), historyRowKey({ ...base }));
  assert.notEqual(historyRowKey(base), historyRowKey({ ...base, durationMinutes: 91 }));
  assert.ok(historyRowKey(base).startsWith("history-import:"));
  assert.ok(historyRowKey(base).length <= 128);
});
