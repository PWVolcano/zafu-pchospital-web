import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { permissionsForRoles } from "../../src/lib/auth/permissions";
import { disconnectDb, getDb } from "../../src/lib/db/client";
import { AppError } from "../../src/lib/api/errors";
import {
  classifyHistoryRows,
  type HistoryInputRow,
} from "../../src/features/repairs/repair-history-import";
import { applyHistoryImport } from "../../src/features/repairs/repair-history-import-service";
import type { AuthorizedActor } from "../../src/types/contracts";
import { integrationTestsEnabled } from "./db-guard";

/* 集成测试的统一闸门：指向非测试库时**在加载阶段就抛错**。 */
const enabled = integrationTestsEnabled();
const dbTest = enabled ? test : test.skip;

/**
 * 历史修机数据导入的落库通道集成测试（issue #72，PR #73 评审 4）。
 *
 * 单测只覆盖 `classifyHistoryRows` 纯逻辑；「直接落 APPROVED」「三条 history_import
 * timeline」「审计行」「行指纹重复导入跳过」必须打到真库才测得出来。
 *
 * 独立 UUID 段 `e7200000-…` 与姓名前缀 "H72 "，清理只按这两者限定。
 */
const ADMIN_USER_ID = "e7200000-0000-4000-8000-000000000001";
const MEMBER_PROFILE_ID = "e7200000-0000-4000-8000-000000000002";
const CATEGORY_ID = "e7200000-0000-4000-8000-000000000003";
const MEMBER_USER_ID = "e7200000-0000-4000-8000-000000000004";

function adminActor(): AuthorizedActor {
  return {
    actorType: "USER",
    userId: ADMIN_USER_ID,
    userStatus: "ACTIVE",
    permissions: permissionsForRoles(["ADMIN"]),
    requestId: "req_h72_admin",
  };
}

async function cleanupFixtures(): Promise<void> {
  const db = getDb();
  const records = await db.repairRecord.findMany({
    where: { memberProfileId: MEMBER_PROFILE_ID },
    select: { id: true },
  });
  const recordIds = records.map((row) => row.id);
  if (recordIds.length > 0) {
    await db.repairTimelineEvent.deleteMany({ where: { repairRecordId: { in: recordIds } } });
    await db.auditLog.deleteMany({
      where: { targetType: "RepairRecord", targetId: { in: recordIds } },
    });
    await db.repairRecord.deleteMany({ where: { id: { in: recordIds } } });
  }
  await db.auditLog.deleteMany({ where: { actorUserId: ADMIN_USER_ID } });
  await db.memberProfile.deleteMany({ where: { id: MEMBER_PROFILE_ID } });
  await db.user.deleteMany({ where: { id: { in: [ADMIN_USER_ID, MEMBER_USER_ID] } } });
  await db.repairCategory.deleteMany({ where: { id: CATEGORY_ID } });
}

async function prepareFixtures(): Promise<void> {
  await cleanupFixtures();
  const db = getDb();
  const now = new Date();
  await db.user.create({
    data: {
      id: ADMIN_USER_ID,
      status: "ACTIVE",
      displayName: "H72 导入管理员",
      createdAt: now,
      updatedAt: now,
    },
  });
  await db.user.create({
    data: {
      id: MEMBER_USER_ID,
      status: "ACTIVE",
      displayName: "H72 导入成员",
      createdAt: now,
      updatedAt: now,
    },
  });
  await db.memberProfile.create({
    data: {
      id: MEMBER_PROFILE_ID,
      userId: MEMBER_USER_ID,
      realName: "H72 张三",
      status: "ACTIVE",
      joinedAt: now,
      createdAt: now,
    },
  });
  await db.repairCategory.create({
    data: {
      id: CATEGORY_ID,
      code: "H72_TEST",
      name: "H72 测试分类",
      sortOrder: 99,
      createdAt: now,
    },
  });
}

function inputRows(): HistoryInputRow[] {
  return [
    {
      lineNo: 2,
      raw: {
        name: "H72 张三",
        repairDate: "2025-06-01",
        durationMinutes: "45",
        categoryName: "H72 测试分类",
        content: "清理灰尘并更换硅脂。",
      },
    },
    {
      lineNo: 3,
      raw: {
        name: "查无此人",
        repairDate: "2025-06-02",
        durationMinutes: "30",
        categoryName: "H72 测试分类",
        content: "重装系统。",
      },
    },
  ];
}

before(async () => {
  if (!enabled) return;
  await prepareFixtures();
});

after(async () => {
  if (!enabled) return;
  await cleanupFixtures();
  await disconnectDb();
});

dbTest("导入直接落 APPROVED，写齐 timeline 与审计；重名拒收行不落库", async () => {
  const db = getDb();
  const plan = classifyHistoryRows(inputRows(), {
    members: [{ profileId: MEMBER_PROFILE_ID, realName: "H72 张三" }],
    categories: [{ id: CATEGORY_ID, name: "H72 测试分类", isActive: true }],
    today: new Date().toISOString().slice(0, 10),
  });
  assert.equal(plan.valid.length, 1);
  assert.equal(plan.rejected[0]?.reason, "未找到在册成员：查无此人");

  const result = await applyHistoryImport(plan.valid, adminActor());
  assert.deepEqual(result, { inserted: 1, skipped: 0 });

  const record = await db.repairRecord.findUniqueOrThrow({
    where: { createRequestKey: plan.valid[0]!.idempotencyKey },
  });
  assert.equal(record.status, "APPROVED");
  assert.equal(record.memberProfileId, MEMBER_PROFILE_ID);
  assert.equal(record.categoryId, CATEGORY_ID);
  assert.equal(record.durationMinutes, 45);
  assert.equal(record.deletedAt, null);
  const events = await db.repairTimelineEvent.findMany({
    where: { repairRecordId: record.id },
    orderBy: { createdAt: "asc" },
  });
  assert.deepEqual(
    events.map((event) => event.eventType),
    ["CREATED", "SUBMITTED", "APPROVED"],
  );
  assert.ok(
    events.every((event) => (event.summary as { source?: string }).source === "history_import"),
  );
  const audit = await db.auditLog.findFirst({
    where: { action: "repair.history_imported", targetId: record.id },
  });
  assert.ok(audit, "导入应留下 repair.history_imported 审计");

  assert.equal(await db.repairRecord.count({ where: { content: "重装系统。" } }), 0);
});

dbTest("同一批行重复导入只跳过不重复入库；同指纹的两行去重", async () => {
  const db = getDb();
  const plan = classifyHistoryRows(inputRows(), {
    members: [{ profileId: MEMBER_PROFILE_ID, realName: "H72 张三" }],
    categories: [{ id: CATEGORY_ID, name: "H72 测试分类", isActive: true }],
    today: new Date().toISOString().slice(0, 10),
  });
  // 构造与第 2 行字段完全相同的重复行：指纹一致，同批内也按同一记录处理。
  const duplicated = { ...plan.valid[0]!, lineNo: 99 };
  assert.equal(duplicated.idempotencyKey, plan.valid[0]!.idempotencyKey);
  const rows = [...plan.valid, duplicated];

  const firstRun = await applyHistoryImport(rows, adminActor());
  assert.deepEqual(firstRun, { inserted: 1, skipped: 1 }, "同指纹第二行应跳过");
  const secondRun = await applyHistoryImport(rows, adminActor());
  assert.deepEqual(secondRun, { inserted: 0, skipped: 2 }, "重跑整批应全部跳过");
  assert.equal(
    await db.repairRecord.count({ where: { memberProfileId: MEMBER_PROFILE_ID } }),
    1,
    "落库记录不应重复",
  );
});

dbTest("无 repair:review 权限的调用被拒绝，不写任何行", async () => {
  const db = getDb();
  const plan = classifyHistoryRows(inputRows(), {
    members: [{ profileId: MEMBER_PROFILE_ID, realName: "H72 张三" }],
    categories: [{ id: CATEGORY_ID, name: "H72 测试分类", isActive: true }],
    today: new Date().toISOString().slice(0, 10),
  });
  const memberActor: AuthorizedActor = {
    ...adminActor(),
    userId: MEMBER_USER_ID,
    permissions: permissionsForRoles(["MEMBER"]),
  };
  await assert.rejects(
    () => applyHistoryImport(plan.valid, memberActor),
    (error) => error instanceof AppError && error.code === "FORBIDDEN",
  );
  assert.equal(
    await db.repairRecord.count({ where: { createRequestKey: plan.valid[0]!.idempotencyKey } }),
    0,
  );
});
