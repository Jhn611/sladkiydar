import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePGlite } from 'drizzle-orm/pglite';
import { migrate as migratePGlite } from 'drizzle-orm/pglite/migrator';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { resolve } from 'node:path';
import { createDatabase, type Database } from '../src/db/client.js';
import * as schema from '../src/db/schema.js';

export async function createTestDatabase(): Promise<{ db: Database; close: () => Promise<void> }> {
  const migrationsFolder = resolve(import.meta.dirname, '../drizzle');
  if (process.env.TEST_DATABASE_URL) {
    // An explicit, isolated test database is required: tests truncate their own tables.
    const url = new URL(process.env.TEST_DATABASE_URL);
    if (!url.pathname.toLowerCase().includes('test'))
      throw new Error('TEST_DATABASE_URL database name must contain "test"');
    const { db, pool } = createDatabase(process.env.TEST_DATABASE_URL);
    await migrate(db, { migrationsFolder });
    return { db, close: () => pool.end() };
  }
  // Embedded PostgreSQL executes the production migration/transactions without Docker.
  // Lock-contention tests below additionally require TEST_DATABASE_URL and separate pg connections.
  const client = new PGlite();
  const db = drizzlePGlite(client, { schema });
  await migratePGlite(db, { migrationsFolder });
  return { db: db as unknown as Database, close: () => client.close() };
}
