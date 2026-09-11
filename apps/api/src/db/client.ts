import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

export function createDatabase(connectionString: string) {
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
  });
  // A dropped idle connection must not become an unhandled EventEmitter error.
  pool.on('error', () =>
    process.stderr.write('{"level":"error","event":"postgres_idle_connection_error"}\n'),
  );
  return { db: drizzle(pool, { schema }), pool };
}

export type Database = ReturnType<typeof createDatabase>['db'];
