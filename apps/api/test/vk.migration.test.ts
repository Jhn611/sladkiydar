import { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrations = resolve(import.meta.dirname, '../drizzle');

describe('VK outbox migration', () => {
  it('assigns unique stable identities to existing jobs, transfers unsent work and preserves sent history', async () => {
    const client = new PGlite();
    try {
      for (const file of ['0000_leads_outbox.sql', '0001_simplify_lead_fields.sql']) {
        await client.exec(await readFile(resolve(migrations, file), 'utf8'));
      }
      for (const status of ['pending', 'processing', 'sent']) {
        const leadId = randomUUID();
        await client.query(
          'INSERT INTO leads (id, client_request_id, name, phone, message, page_url, source) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            leadId,
            randomUUID(),
            'Проверка миграции',
            '+79990000000',
            'Сохранить текст',
            'https://example.com',
            'vk-migration-test',
          ],
        );
        await client.query(
          'INSERT INTO notification_outbox (id, lead_id, status, attempts, last_error) VALUES ($1, $2, $3, 3, $4)',
          [randomUUID(), leadId, status, 'previous_delivery_error'],
        );
      }
      const beforeLeads = await client.query('SELECT * FROM leads ORDER BY id');
      const beforeJobs = await client.query<Record<string, unknown>>(
        'SELECT * FROM notification_outbox ORDER BY id',
      );
      await client.exec(await readFile(resolve(migrations, '0002_vk_notifications.sql'), 'utf8'));
      expect((await client.query('SELECT * FROM leads ORDER BY id')).rows).toEqual(
        beforeLeads.rows,
      );
      const afterJobs = await client.query<Record<string, unknown>>(
        'SELECT * FROM notification_outbox ORDER BY id',
      );
      expect(new Set(afterJobs.rows.map((row) => row.random_id)).size).toBe(3);
      for (let i = 0; i < beforeJobs.rows.length; i++) {
        const before = beforeJobs.rows[i]!;
        const after = afterJobs.rows[i]!;
        expect(after.random_id).toBeGreaterThan(0);
        expect(after).toEqual({
          ...before,
          type: before.status === 'sent' ? before.type : 'vk.lead.created',
          random_id: after.random_id,
        });
      }
      const leadId = randomUUID();
      await client.query(
        'INSERT INTO leads (id, client_request_id, name, phone, page_url, source) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          leadId,
          randomUUID(),
          'Новая заявка',
          '+79990000000',
          'https://example.com',
          'vk-migration-test',
        ],
      );
      const inserted = await client.query<{ random_id: number; type: string }>(
        'INSERT INTO notification_outbox (id, lead_id) VALUES ($1, $2) RETURNING random_id, type',
        [randomUUID(), leadId],
      );
      expect(inserted.rows[0]?.type).toBe('vk.lead.created');
      expect(inserted.rows[0]?.random_id).toBeGreaterThan(
        Math.max(...afterJobs.rows.map((row) => Number(row.random_id))),
      );
    } finally {
      await client.close();
    }
  }, 30000);
});
