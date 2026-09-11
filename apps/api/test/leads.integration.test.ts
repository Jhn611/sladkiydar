import { randomUUID } from 'node:crypto';
import { sql, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import pino from 'pino';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { readEnvironment } from '../src/config/env.js';
import { leads, notificationOutbox } from '../src/db/schema.js';
import { createOutboxRepository } from '../src/modules/notifications/outbox.repository.js';
import { processNextJob } from '../src/modules/notifications/process-job.js';
import { NotificationDeliveryError } from '../src/modules/notifications/delivery-error.js';
import { createTestDatabase } from './database.js';

const payload = () => ({
  name: '  Анна Иванова  ',
  phone: '8 (999) 123-45-67',
  message: 'Нужны подарки',
  pageUrl: 'https://example.com/',
  source: 'hero',
  utmCampaign: 'autumn',
  clientRequestId: randomUUID(),
  consent: true,
});
const logger = pino({ level: 'silent' });
let database: Awaited<ReturnType<typeof createTestDatabase>>;
let app: FastifyInstance;

beforeAll(async () => {
  database = await createTestDatabase();
  app = await buildApp({
    db: database.db,
    env: readEnvironment({
      NODE_ENV: 'test',
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgresql://test:test@localhost/test',
      RATE_LIMIT_MAX: '1000',
    }),
    logger: false,
  });
}, 60000);

beforeEach(async () => {
  await database.db.execute(sql`TRUNCATE notification_outbox, leads CASCADE`);
});

afterAll(async () => {
  await app?.close();
  await database?.close();
});

describe('lead acceptance and transactional outbox', () => {
  it('saves a normalized lead and notification in one successful POST', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/leads', payload: payload() });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ accepted: true, id: expect.any(String) });
    const [lead] = await database.db.select().from(leads);
    const [job] = await database.db.select().from(notificationOutbox);
    expect(lead).toMatchObject({
      id: response.json().id,
      name: 'Анна Иванова',
      phone: '+79991234567',
      message: 'Нужны подарки',
    });
    expect(job).toMatchObject({ leadId: lead?.id, status: 'pending', attempts: 0 });
  });

  it.each([undefined, '', '   '])(
    'accepts and persists an empty optional comment: %j',
    async (message) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/leads',
        payload: { ...payload(), message },
      });
      expect(response.statusCode).toBe(201);
      const [lead] = await database.db.select().from(leads);
      expect(lead).toMatchObject({ name: 'Анна Иванова', phone: '+79991234567', message: null });
      expect(lead).not.toHaveProperty('email');
      expect(lead).not.toHaveProperty('company');
      const [job] = await database.db.select().from(notificationOutbox);
      expect(job).toMatchObject({ leadId: lead?.id, status: 'pending' });
    },
  );

  it.each([
    { name: undefined },
    { name: '' },
    { name: '   ' },
    { phone: undefined },
    { phone: '' },
    { consent: false },
    { consent: undefined },
    { email: 'anna@example.com' },
    { company: 'Студия' },
    { email: '', company: '' },
  ])('rejects absent required values and removed fields: %j', async (invalid) => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/leads',
      payload: { ...payload(), ...invalid },
    });
    expect(response.statusCode).toBe(400);
    expect(await database.db.select().from(leads)).toHaveLength(0);
    expect(await database.db.select().from(notificationOutbox)).toHaveLength(0);
  });
  it('rolls back the lead when inserting the outbox fails', async () => {
    await database.db.execute(
      sql`CREATE OR REPLACE FUNCTION reject_test_outbox() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected outbox failure'; END; $$`,
    );
    await database.db.execute(
      sql`CREATE TRIGGER reject_test_outbox BEFORE INSERT ON notification_outbox FOR EACH ROW EXECUTE FUNCTION reject_test_outbox()`,
    );
    try {
      const response = await app.inject({ method: 'POST', url: '/api/leads', payload: payload() });
      expect(response.statusCode).toBe(503);
      expect(response.json().accepted).toBeUndefined();
      expect(await database.db.select().from(leads)).toHaveLength(0);
      expect(await database.db.select().from(notificationOutbox)).toHaveLength(0);
    } finally {
      await database.db.execute(sql`DROP TRIGGER reject_test_outbox ON notification_outbox`);
      await database.db.execute(sql`DROP FUNCTION reject_test_outbox()`);
    }
  });

  it('returns the same ID for an idempotent retry', async () => {
    const body = payload();
    const first = await app.inject({ method: 'POST', url: '/api/leads', payload: body });
    const second = await app.inject({ method: 'POST', url: '/api/leads', payload: body });
    expect(second.statusCode).toBe(200);
    expect(second.json().id).toBe(first.json().id);
    expect(await database.db.select().from(leads)).toHaveLength(1);
    expect(await database.db.select().from(notificationOutbox)).toHaveLength(1);
  });

  it.runIf(Boolean(process.env.TEST_DATABASE_URL))(
    'deduplicates simultaneous requests across PostgreSQL connections',
    async () => {
      const body = payload();
      const responses = await Promise.all(
        Array.from({ length: 12 }, () =>
          app.inject({ method: 'POST', url: '/api/leads', payload: body }),
        ),
      );
      expect(responses.filter((response) => response.statusCode === 201)).toHaveLength(1);
      expect(
        responses.every((response) => response.statusCode === 200 || response.statusCode === 201),
      ).toBe(true);
      expect(new Set(responses.map((response) => response.json().id)).size).toBe(1);
      expect(await database.db.select().from(notificationOutbox)).toHaveLength(1);
    },
  );

  it('keeps the accepted lead and schedules retry after a temporary VK failure', async () => {
    expect(
      (await app.inject({ method: 'POST', url: '/api/leads', payload: payload() })).statusCode,
    ).toBe(201);
    const started = Date.now();
    await processNextJob({
      repository: createOutboxRepository(database.db),
      send: async () => {
        throw new NotificationDeliveryError('vk_http_503');
      },
      workerId: 'test',
      logger,
    });
    const [job] = await database.db.select().from(notificationOutbox);
    expect(job).toMatchObject({
      status: 'pending',
      attempts: 1,
      lockedAt: null,
      lockedBy: null,
      lastError: 'vk_http_503',
    });
    expect(job?.nextAttemptAt.getTime()).toBeGreaterThan(started);
    expect(await database.db.select().from(leads)).toHaveLength(1);
  });

  it('marks successful delivery sent and records sent_at', async () => {
    await app.inject({ method: 'POST', url: '/api/leads', payload: payload() });
    await processNextJob({
      repository: createOutboxRepository(database.db),
      send: async () => undefined,
      workerId: 'test',
      logger,
    });
    const [job] = await database.db.select().from(notificationOutbox);
    expect(job).toMatchObject({ status: 'sent', attempts: 0, lockedAt: null, lockedBy: null });
    expect(job?.sentAt).toBeInstanceOf(Date);
  });

  it('honors VK retry_after without losing the notification', async () => {
    await app.inject({ method: 'POST', url: '/api/leads', payload: payload() });
    const started = Date.now();
    await processNextJob({
      repository: createOutboxRepository(database.db),
      send: async () => {
        throw new NotificationDeliveryError('vk_http_429', 600);
      },
      workerId: 'test',
      logger,
    });
    const [job] = await database.db.select().from(notificationOutbox);
    expect(job?.nextAttemptAt.getTime()).toBeGreaterThanOrEqual(started + 600_000);
    expect(job?.status).toBe('pending');
  });

  it('recovers a stale processing lock and fences off the previous owner', async () => {
    await app.inject({ method: 'POST', url: '/api/leads', payload: payload() });
    const repository = createOutboxRepository(database.db);
    const previous = await repository.claim('previous');
    expect(previous).toBeDefined();
    await database.db
      .update(notificationOutbox)
      .set({ lockedAt: new Date(Date.now() - 300_000) })
      .where(eq(notificationOutbox.id, previous!.id));
    expect(await repository.recoverStale(120_000)).toBe(1);
    const current = await repository.claim('current');
    expect(current?.id).toBe(previous?.id);
    expect(await repository.sent(previous!)).toBe(false);
    expect(await repository.sent(current!)).toBe(true);
  });

  it('does not steal an active processing lock', async () => {
    await app.inject({ method: 'POST', url: '/api/leads', payload: payload() });
    const repository = createOutboxRepository(database.db);
    expect(await repository.claim('first')).toBeDefined();
    expect(await repository.recoverStale(120_000)).toBe(0);
    expect(await repository.claim('second')).toBeUndefined();
  });

  it.runIf(Boolean(process.env.TEST_DATABASE_URL))(
    'lets only one competing worker claim each job',
    async () => {
      await app.inject({ method: 'POST', url: '/api/leads', payload: payload() });
      const repository = createOutboxRepository(database.db);
      const claims = await Promise.all(
        Array.from({ length: 8 }, (_, i) => repository.claim(`worker-${i}`)),
      );
      expect(claims.filter(Boolean)).toHaveLength(1);
    },
  );

  it('reuses the persisted random_id after a delivery timeout and gives distinct leads distinct IDs', async () => {
    await app.inject({ method: 'POST', url: '/api/leads', payload: payload() });
    const repository = createOutboxRepository(database.db);
    const send = vi
      .fn<(lead: unknown, randomId: number) => Promise<void>>()
      .mockRejectedValueOnce(new NotificationDeliveryError('vk_network_error'))
      .mockResolvedValue(undefined);
    await processNextJob({ repository, send, workerId: 'test', logger });
    const [firstJob] = await database.db.select().from(notificationOutbox);
    expect(firstJob?.randomId).toBeGreaterThan(0);
    await database.db
      .update(notificationOutbox)
      .set({ nextAttemptAt: new Date(0) })
      .where(eq(notificationOutbox.id, firstJob!.id));
    await processNextJob({ repository, send, workerId: 'test', logger });
    expect(send.mock.calls.map((call) => call[1])).toEqual([
      firstJob!.randomId,
      firstJob!.randomId,
    ]);
    await app.inject({ method: 'POST', url: '/api/leads', payload: payload() });
    const jobs = await database.db.select().from(notificationOutbox);
    expect(new Set(jobs.map((job) => job.randomId)).size).toBe(2);
  });

  it('does not claim notifications belonging to other channels', async () => {
    await app.inject({ method: 'POST', url: '/api/leads', payload: payload() });
    await database.db.update(notificationOutbox).set({ type: 'archived.lead.created' });
    expect(await createOutboxRepository(database.db).claim('test')).toBeUndefined();
  });
  it('provides liveness and database readiness', async () => {
    expect((await app.inject('/api/health/live')).statusCode).toBe(200);
    expect((await app.inject('/api/health/ready')).json()).toEqual({ status: 'ready' });
  });

  it('does not echo private query values in missing-route responses or log messages', async () => {
    const log = vi.spyOn(app.log, 'info');
    try {
      const secret = 'private-address@example.com';
      const response = await app.inject(`/api/unknown?email=${secret}`);
      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({ error: 'not_found', message: 'Маршрут не найден.' });
      const messages = log.mock.calls
        .flatMap((args) => args.filter((value) => typeof value === 'string'))
        .join('\n');
      expect(messages).not.toContain(secret);
      expect(response.body).not.toContain(secret);
    } finally {
      log.mockRestore();
    }
  });

  it('rejects invalid fields, honeypots and cross-origin submissions without inserting', async () => {
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/leads',
          payload: { ...payload(), phone: '12' },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/leads',
          payload: { ...payload(), website: 'spam.invalid' },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/leads',
          payload: payload(),
          headers: { origin: 'https://attacker.example' },
        })
      ).statusCode,
    ).toBe(403);
    expect(await database.db.select().from(leads)).toHaveLength(0);
  });

  it('limits oversized request bodies', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/leads',
      payload: { ...payload(), message: 'x'.repeat(20000) },
    });
    expect(response.statusCode).toBe(413);
  });

  it('rate limits repeated submissions', async () => {
    const limited = await buildApp({
      db: database.db,
      env: readEnvironment({
        DATABASE_URL: 'postgresql://test:test@localhost/test',
        RATE_LIMIT_MAX: '1',
      }),
      logger: false,
    });
    try {
      const body = payload();
      expect(
        (await limited.inject({ method: 'POST', url: '/api/leads', payload: body })).statusCode,
      ).toBe(201);
      expect(
        (await limited.inject({ method: 'POST', url: '/api/leads', payload: body })).statusCode,
      ).toBe(429);
    } finally {
      await limited.close();
    }
  });
});
