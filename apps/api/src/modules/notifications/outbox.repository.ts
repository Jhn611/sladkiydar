import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import { leads, notificationOutbox } from '../../db/schema.js';

export type ClaimedJob = {
  id: string;
  leadId: string;
  attempts: number;
  randomId: number;
  lockedBy: string;
};

export function createOutboxRepository(db: Database) {
  return {
    async recoverStale(lockMs: number): Promise<number> {
      const result = await db.execute(sql`
        UPDATE notification_outbox
        SET status = 'pending', locked_at = NULL, locked_by = NULL,
            attempts = LEAST(attempts + 1, 2147483647),
            next_attempt_at = now(), updated_at = now(), last_error = 'worker_lock_expired'
        WHERE type = 'vk.lead.created' AND status = 'processing' AND locked_at < now() - (${lockMs} * interval '1 millisecond')
        RETURNING id
      `);
      return result.rows.length;
    },
    async claim(workerId: string): Promise<ClaimedJob | undefined> {
      const token = `${workerId}:${randomUUID()}`;
      // A single atomic statement owns the lock only while claiming, never during HTTP.
      const result = await db.execute<ClaimedJob>(sql`
        WITH candidate AS (
          SELECT id FROM notification_outbox
          WHERE type = 'vk.lead.created' AND status = 'pending' AND next_attempt_at <= now()
          ORDER BY next_attempt_at, created_at
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        UPDATE notification_outbox AS item
        SET status = 'processing', locked_at = now(), locked_by = ${token}, updated_at = now()
        FROM candidate WHERE item.id = candidate.id
        RETURNING item.id, item.lead_id AS "leadId", item.attempts, item.random_id AS "randomId", item.locked_by AS "lockedBy"
      `);
      return result.rows[0];
    },
    async findLead(leadId: string) {
      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
      return lead;
    },
    async sent(job: ClaimedJob): Promise<boolean> {
      const result = await db
        .update(notificationOutbox)
        .set({
          status: 'sent',
          sentAt: new Date(),
          updatedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          lastError: null,
        })
        .where(
          and(
            eq(notificationOutbox.id, job.id),
            eq(notificationOutbox.status, 'processing'),
            eq(notificationOutbox.lockedBy, job.lockedBy),
          ),
        )
        .returning({ id: notificationOutbox.id });
      return result.length === 1;
    },
    async retry(job: ClaimedJob, errorCode: string, delayMs: number): Promise<boolean> {
      const result = await db
        .update(notificationOutbox)
        .set({
          status: 'pending',
          attempts: sql`LEAST(${notificationOutbox.attempts} + 1, 2147483647)`,
          nextAttemptAt: new Date(Date.now() + delayMs),
          updatedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          lastError: errorCode.slice(0, 200),
        })
        .where(
          and(
            eq(notificationOutbox.id, job.id),
            eq(notificationOutbox.status, 'processing'),
            eq(notificationOutbox.lockedBy, job.lockedBy),
          ),
        )
        .returning({ id: notificationOutbox.id });
      return result.length === 1;
    },
  };
}

export type OutboxRepository = ReturnType<typeof createOutboxRepository>;
