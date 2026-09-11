import type { Logger } from 'pino';
import type { Lead } from '../../db/schema.js';
import type { OutboxRepository } from './outbox.repository.js';
import { NotificationDeliveryError } from './delivery-error.js';
import { retryDelayMs } from './retry.js';

export async function processNextJob(options: {
  repository: OutboxRepository;
  send: (lead: Lead, randomId: number) => Promise<void>;
  workerId: string;
  logger: Pick<Logger, 'info' | 'warn'>;
}): Promise<boolean> {
  const { repository, send, logger } = options;
  const job = await repository.claim(options.workerId);
  if (!job) return false;
  const context = { outboxId: job.id, leadId: job.leadId, attempt: job.attempts + 1 };
  logger.info({ ...context, result: 'claimed' }, 'job claimed');

  try {
    const lead = await repository.findLead(job.leadId);
    if (!lead) throw new NotificationDeliveryError('lead_missing', undefined, true);
    await send(lead, job.randomId);
  } catch (error) {
    const deliveryError =
      error instanceof NotificationDeliveryError
        ? error
        : new NotificationDeliveryError('notification_delivery_failed');
    const delayMs = retryDelayMs(job.attempts + 1, deliveryError);
    logger.warn(
      { ...context, errorCode: deliveryError.code, result: 'failed' },
      'VK delivery failed',
    );
    const rescheduled = await repository.retry(job, deliveryError.code, delayMs);
    logger.info(
      { ...context, delayMs, result: rescheduled ? 'retry_scheduled' : 'lock_lost' },
      'retry scheduled',
    );
    return true;
  }

  // If this database update fails, leave processing in place for stale recovery.
  // VK may already have accepted it: delivery is intentionally at least once.
  const saved = await repository.sent(job);
  logger.info({ ...context, result: saved ? 'sent' : 'lock_lost' }, 'VK delivery sent');
  return true;
}
