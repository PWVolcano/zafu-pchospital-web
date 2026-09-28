import { randomUUID } from "node:crypto";
import { appendAuditLog } from "@/lib/audit/audit-service";
import { requirePermission } from "@/lib/auth/permissions";
import { inSerializableTransaction } from "@/lib/db/transaction";
import type { AuthorizedActor } from "@/types/contracts";
import { timeline } from "./repair-service";
import type { ValidHistoryRow } from "./repair-history-import";

/**
 * 历史修机数据落库通道（issue #72，仅供 `tools/import-repair-history.ts` 调用）。
 *
 * 与活动接待一样属于「非成员手工流程」的例外：历史记录已实际完成、由管理员整批
 * 确认导入，直接写 `APPROVED`（无照片、不走 `repair_reviews`），以 timeline 与
 * 审计说明来源是 `history_import`。行指纹幂等：重复导入同一行会跳过。
 */
export async function applyHistoryImport(
  rows: ValidHistoryRow[],
  actor: AuthorizedActor,
): Promise<{ inserted: number; skipped: number }> {
  requirePermission(actor, "repair:review");
  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    await inSerializableTransaction(async (tx) => {
      const existing = await tx.repairRecord.findUnique({
        where: { createRequestKey: row.idempotencyKey },
      });
      if (existing) {
        skipped += 1;
        return;
      }
      const recordId = randomUUID();
      const now = new Date();
      await tx.repairRecord.create({
        data: {
          id: recordId,
          memberProfileId: row.memberProfileId,
          status: "APPROVED",
          createRequestKey: row.idempotencyKey,
          repairDate: new Date(`${row.repairDate}T00:00:00.000Z`),
          durationMinutes: row.durationMinutes,
          categoryId: row.categoryId,
          content: row.content,
          result: row.result,
          remark: row.remark,
          submittedAt: now,
          reviewedAt: now,
          createdAt: now,
        },
      });
      await timeline(
        tx,
        recordId,
        actor.userId,
        "CREATED",
        { status: "DRAFT", source: "history_import" },
        now,
      );
      await timeline(
        tx,
        recordId,
        actor.userId,
        "SUBMITTED",
        {
          from: "DRAFT",
          to: "PENDING",
          source: "history_import",
          idempotencyKey: row.idempotencyKey,
        },
        now,
      );
      await timeline(
        tx,
        recordId,
        actor.userId,
        "APPROVED",
        { from: "PENDING", to: "APPROVED", source: "history_import" },
        now,
      );
      await appendAuditLog(tx, {
        actor,
        actorType: "USER",
        actorUserId: actor.userId,
        action: "repair.history_imported",
        targetType: "RepairRecord",
        targetId: recordId,
        result: "SUCCESS",
        after: {
          source: "history_import",
          lineNo: row.lineNo,
          memberProfileId: row.memberProfileId,
          categoryId: row.categoryId,
          status: "APPROVED",
        },
      });
      inserted += 1;
    });
  }
  return { inserted, skipped };
}
