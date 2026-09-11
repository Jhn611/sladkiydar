import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { readEnvironment } from '../config/env.js';
import { createDatabase } from './client.js';
import { provisionRuntimeRoles, readRuntimeRoleCredentials } from './runtime-roles.js';

const env = readEnvironment(process.env, 'migrate');
const { db, pool } = createDatabase(env.DATABASE_URL);

try {
  // Fail closed before changing the schema if runtime credentials are incomplete.
  const credentials = readRuntimeRoleCredentials();
  await migrate(db, { migrationsFolder: env.MIGRATIONS_DIR });
  if (credentials) {
    await provisionRuntimeRoles(pool, credentials);
    process.stdout.write('Runtime database roles configured.\n');
  }
  process.stdout.write('Database migrations completed.\n');
} catch {
  process.stderr.write(
    'Database setup failed; check administrator access, migration files and dedicated runtime credentials.\n',
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
