import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrations = resolve(import.meta.dirname, '../drizzle');

describe('lead form migration', () => {
  it('removes only obsolete fields while preserving accepted leads and queued notifications', async () => {
    const client = new PGlite();
    try {
      await client.exec(await readFile(resolve(migrations, '0000_leads_outbox.sql'), 'utf8'));
      await client.exec(`
        INSERT INTO leads (id, client_request_id, name, phone, email, company, message, page_url, source, utm_campaign)
        VALUES ('588c0119-f498-4716-b2f9-4e9a178a0bf9', '3d077bdb-f0d2-494a-a1e3-53b0b874b61a',
          'Тест миграции', '+79990000000', 'migration@example.com', 'Тестовая компания',
          'Сохранить комментарий', 'https://example.com/', 'migration-test', 'holiday');
        INSERT INTO notification_outbox (id, lead_id, attempts, last_error)
        VALUES ('85791d78-c1be-4e04-84de-700d10f9b954', '588c0119-f498-4716-b2f9-4e9a178a0bf9',
          2, 'previous_delivery_error');
      `);
      const beforeLead = await client.query<Record<string, unknown>>('SELECT * FROM leads');
      const beforeOutbox = await client.query('SELECT * FROM notification_outbox');

      await client.exec(
        await readFile(resolve(migrations, '0001_simplify_lead_fields.sql'), 'utf8'),
      );

      const afterLead = await client.query('SELECT * FROM leads');
      const expectedLead = { ...beforeLead.rows[0] };
      delete expectedLead.email;
      delete expectedLead.company;
      expect(afterLead.rows).toEqual([expectedLead]);
      expect((await client.query('SELECT * FROM notification_outbox')).rows).toEqual(
        beforeOutbox.rows,
      );
      const columns = await client.query<{ column_name: string; is_nullable: string }>(`
        SELECT column_name, is_nullable FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads'
      `);
      expect(columns.rows.map((column) => column.column_name)).not.toContain('email');
      expect(columns.rows.map((column) => column.column_name)).not.toContain('company');
      expect(columns.rows.find((column) => column.column_name === 'name')?.is_nullable).toBe('NO');
      expect(columns.rows.find((column) => column.column_name === 'phone')?.is_nullable).toBe('NO');
      expect(columns.rows.find((column) => column.column_name === 'message')?.is_nullable).toBe(
        'YES',
      );
    } finally {
      await client.close();
    }
  }, 30000);
});
