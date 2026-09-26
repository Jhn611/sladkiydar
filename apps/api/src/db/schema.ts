import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const outboxStatus = pgEnum('outbox_status', ['pending', 'processing', 'sent']);

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey(),
  clientRequestId: uuid('client_request_id').notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  message: text('message'),
  pageUrl: text('page_url').notNull(),
  source: varchar('source', { length: 100 }).notNull(),
  referrer: text('referrer'),
  utmSource: varchar('utm_source', { length: 200 }),
  utmMedium: varchar('utm_medium', { length: 200 }),
  utmCampaign: varchar('utm_campaign', { length: 200 }),
  utmContent: varchar('utm_content', { length: 200 }),
  utmTerm: varchar('utm_term', { length: 200 }),
  consentVersion: varchar('consent_version', { length: 50 }).notNull().default('2026-09-24'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notificationOutbox = pgTable(
  'notification_outbox',
  {
    id: uuid('id').primaryKey(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),
    type: varchar('type', { length: 50 }).notNull().default('vk.lead.created'),
    randomId: integer('random_id').notNull().generatedAlwaysAsIdentity().unique(),
    status: outboxStatus('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    lockedBy: varchar('locked_by', { length: 150 }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('outbox_lead_type_unique').on(table.leadId, table.type),
    index('outbox_pending_due_idx')
      .on(table.nextAttemptAt)
      .where(sql`${table.status} = 'pending'`),
    index('outbox_processing_lock_idx')
      .on(table.lockedAt)
      .where(sql`${table.status} = 'processing'`),
    check('outbox_attempts_nonnegative', sql`${table.attempts} >= 0`),
  ],
);

export type Lead = typeof leads.$inferSelect;
export type OutboxItem = typeof notificationOutbox.$inferSelect;
