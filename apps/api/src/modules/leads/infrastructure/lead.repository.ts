import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Database } from '../../../db/client.js';
import { leads, notificationOutbox } from '../../../db/schema.js';
import type { normalizeLead } from '../application/create-lead.js';

export function createLeadRepository(db: Database) {
  return {
    async create(
      input: ReturnType<typeof normalizeLead>,
    ): Promise<{ id: string; duplicate: boolean }> {
      return db.transaction(async (tx) => {
        const [created] = await tx
          .insert(leads)
          .values({ id: randomUUID(), ...input })
          .onConflictDoNothing({ target: leads.clientRequestId })
          .returning({ id: leads.id });

        if (!created) {
          // READ COMMITTED obtains a fresh snapshot after the conflicting insert has completed.
          const [existing] = await tx
            .select({ id: leads.id })
            .from(leads)
            .where(eq(leads.clientRequestId, input.clientRequestId));
          if (!existing) throw new Error('idempotency_lookup_failed');
          return { id: existing.id, duplicate: true };
        }

        await tx.insert(notificationOutbox).values({ id: randomUUID(), leadId: created.id });
        return { id: created.id, duplicate: false };
      });
    },
  };
}

export type LeadRepository = ReturnType<typeof createLeadRepository>;
