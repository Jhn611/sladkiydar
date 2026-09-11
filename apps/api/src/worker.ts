import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import pino from 'pino';
import { readEnvironment } from './config/env.js';
import { createDatabase } from './db/client.js';
import { createOutboxRepository } from './modules/notifications/outbox.repository.js';
import { processNextJob } from './modules/notifications/process-job.js';
import { createVkSender } from './modules/notifications/vk.js';

const env = readEnvironment(process.env, 'worker');
const logger = pino({ level: env.LOG_LEVEL, base: { service: 'notification-worker' } });
const { db, pool } = createDatabase(env.DATABASE_URL);
const repository = createOutboxRepository(db);
const workerId = `${hostname().slice(0, 40)}:${randomUUID()}`;
const send = createVkSender({
  token: env.VK_GROUP_TOKEN,
  groupId: env.VK_GROUP_ID,
  peerId: env.VK_PEER_ID,
  apiVersion: env.VK_API_VERSION,
  timeoutMs: env.VK_TIMEOUT_MS,
});
const shutdown = new AbortController();
process.on('SIGTERM', () => shutdown.abort());
process.on('SIGINT', () => shutdown.abort());

logger.info({ workerId, result: 'started' }, 'worker started');
try {
  while (!shutdown.signal.aborted) {
    try {
      const recovered = await repository.recoverStale(env.WORKER_LOCK_MS);
      if (recovered) logger.warn({ count: recovered, result: 'recovered' }, 'stale job recovered');
      const processed = await processNextJob({ repository, send, workerId, logger });
      if (processed) continue;
    } catch {
      // No raw pg/fetch error objects: they can contain personal data and secrets.
      logger.error({ result: 'iteration_failed' }, 'worker iteration failed; will retry');
    }
    await delay(env.WORKER_POLL_MS, undefined, { signal: shutdown.signal }).catch(() => undefined);
  }
} finally {
  await pool.end();
  logger.info({ result: 'stopped' }, 'worker stopped');
}
