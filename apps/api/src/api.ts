import { buildApp } from './app.js';
import { readEnvironment } from './config/env.js';
import { createDatabase } from './db/client.js';

const env = readEnvironment();
const { db, pool } = createDatabase(env.DATABASE_URL);
const app = await buildApp({ db, env });
app.addHook('onClose', async () => {
  await pool.end();
});

let closing = false;
const shutdown = async () => {
  if (closing) return;
  closing = true;
  app.log.info({ event: 'api_shutdown' }, 'stopping API');
  await app.close();
};
process.on('SIGTERM', () => {
  void shutdown();
});
process.on('SIGINT', () => {
  void shutdown();
});

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch {
  app.log.fatal({ event: 'api_start_failed' }, 'API could not start');
  await app.close();
  process.exitCode = 1;
}
