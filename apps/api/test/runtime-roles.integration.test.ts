import { randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { readEnvironment } from '../src/config/env.js';
import { createDatabase } from '../src/db/client.js';
import { provisionRuntimeRoles } from '../src/db/runtime-roles.js';
import { NotificationDeliveryError } from '../src/modules/notifications/delivery-error.js';
import { createOutboxRepository } from '../src/modules/notifications/outbox.repository.js';
import { processNextJob } from '../src/modules/notifications/process-job.js';

// Real authentication and role grants cannot be verified by injecting a superuser
// connection or by PGlite. This suite creates and removes ONLY its own random DB/roles.
describe.skipIf(!process.env.TEST_DATABASE_URL)('PostgreSQL runtime role isolation', () => {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 16);
  const databaseName = `roles_test_${suffix}`;
  const credentials = {
    api: {
      name: `roles_test_api_${suffix}";`,
      password: `api ' \\ ; ${randomBytes(24).toString('base64url')} `,
    },
    worker: {
      name: `roles_test_worker_${suffix}";`,
      password: `worker ' \\ ; ${randomBytes(24).toString('base64url')} `,
    },
  };
  const identifier = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const logger = pino({ level: 'silent' });
  const rolesCreated = new Set<string>();
  let control: pg.Pool | undefined;
  let admin: ReturnType<typeof createDatabase> | undefined;
  let api: ReturnType<typeof createDatabase> | undefined;
  let worker: ReturnType<typeof createDatabase> | undefined;
  let app: FastifyInstance | undefined;
  let createdDatabase = false;
  let adminName: string;
  let adminFlags: Record<string, unknown>;
  let apiUrl: string;

  const payload = () => ({
    name: 'Проверка прав',
    phone: '+79990000000',
    message: 'Заявка в одноразовой тестовой базе',
    pageUrl: 'https://example.com/',
    source: 'runtime-role-test',
    clientRequestId: randomUUID(),
    consent: true,
  });

  async function denied(pool: pg.Pool, query: string) {
    await expect(pool.query(query)).rejects.toMatchObject({ code: '42501' });
  }

  async function snapshot() {
    return {
      leads: (await admin!.pool.query('SELECT * FROM public.leads ORDER BY id')).rows,
      jobs: (await admin!.pool.query('SELECT * FROM public.notification_outbox ORDER BY id')).rows,
    };
  }

  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (!url.pathname.toLowerCase().includes('test')) {
      throw new Error(
        'Role tests require an explicit isolated TEST_DATABASE_URL containing "test"',
      );
    }
    control = new pg.Pool({ connectionString: url.toString(), max: 1 });
    const existingRoles = await control.query(
      'SELECT rolname FROM pg_roles WHERE rolname = ANY($1::text[])',
      [[credentials.api.name, credentials.worker.name]],
    );
    if (existingRoles.rowCount)
      throw new Error('Generated test roles already exist; refusing reuse');
    await control.query(`CREATE DATABASE ${identifier(databaseName)}`);
    createdDatabase = true;
    url.pathname = '/' + databaseName;
    admin = createDatabase(url.toString());
    const administrator = await admin.pool.query(
      'SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls FROM pg_roles WHERE rolname = current_user',
    );
    adminFlags = administrator.rows[0] as Record<string, unknown>;
    adminName = String(adminFlags.rolname);
    await migrate(admin.db, { migrationsFolder: resolve(import.meta.dirname, '../drizzle') });
    await provisionRuntimeRoles(admin.pool, credentials);
    rolesCreated.add(credentials.api.name);
    rolesCreated.add(credentials.worker.name);

    url.username = credentials.api.name;
    url.password = credentials.api.password;
    apiUrl = url.toString();
    api = createDatabase(apiUrl);
    url.username = credentials.worker.name;
    url.password = credentials.worker.password;
    worker = createDatabase(url.toString());
    // Open physical connections. SET ROLE on an administrator would not test login permissions.
    expect((await api.pool.query('SELECT current_user')).rows[0]?.current_user).toBe(
      credentials.api.name,
    );
    expect((await worker.pool.query('SELECT current_user')).rows[0]?.current_user).toBe(
      credentials.worker.name,
    );
    app = await buildApp({
      db: api.db,
      env: readEnvironment({
        NODE_ENV: 'test',
        DATABASE_URL: apiUrl,
        RATE_LIMIT_MAX: '1000',
      }),
      logger: false,
    });
  }, 60000);

  beforeEach(async () => {
    await admin!.pool.query('TRUNCATE public.notification_outbox, public.leads');
  });

  afterAll(async () => {
    await app?.close();
    await api?.pool.end();
    await worker?.pool.end();
    await admin?.pool.end();
    if (control) {
      if (createdDatabase) {
        if (!/^roles_test_[a-f0-9]{16}$/.test(databaseName)) {
          throw new Error('Refusing cleanup outside the generated role-test database');
        }
        await control.query(`DROP DATABASE ${identifier(databaseName)} WITH (FORCE)`);
      }
      for (const role of rolesCreated) {
        if (!role.startsWith('roles_test_') || !role.includes(suffix)) {
          throw new Error('Refusing cleanup of a role not owned by this test');
        }
        await control.query(`DROP ROLE ${identifier(role)}`);
      }
      await control.end();
    }
  }, 30000);

  it('authenticates separate roles without administrative flags, memberships or object ownership', async () => {
    for (const [pool, role] of [
      [api!.pool, credentials.api.name],
      [worker!.pool, credentials.worker.name],
    ] as const) {
      const flags = await pool.query(
        'SELECT rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls, rolcanlogin FROM pg_roles WHERE rolname = current_user',
      );
      expect(flags.rows[0]).toEqual({
        rolsuper: false,
        rolcreatedb: false,
        rolcreaterole: false,
        rolreplication: false,
        rolbypassrls: false,
        rolcanlogin: true,
      });
      expect(
        (
          await pool.query(
            'SELECT 1 FROM pg_auth_members WHERE member = (SELECT oid FROM pg_roles WHERE rolname = current_user)',
          )
        ).rows,
      ).toHaveLength(0);
      expect(
        (
          await pool.query(
            "SELECT has_database_privilege(current_user, current_database(), 'CREATE') AS create_database_object, has_database_privilege(current_user, current_database(), 'TEMP') AS create_temp, has_schema_privilege(current_user, 'public', 'CREATE') AS create_public_object",
          )
        ).rows[0],
      ).toEqual({
        create_database_object: false,
        create_temp: false,
        create_public_object: false,
      });
      expect(
        (
          await admin!.pool.query(
            "SELECT 1 FROM pg_class WHERE relnamespace IN (SELECT oid FROM pg_namespace WHERE nspname IN ('public', 'drizzle')) AND relowner = (SELECT oid FROM pg_roles WHERE rolname = $1)",
            [role],
          )
        ).rows,
      ).toHaveLength(0);
    }
    expect(
      (
        await admin!.pool.query(
          'SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls FROM pg_roles WHERE rolname = current_user',
        )
      ).rows[0],
    ).toEqual(adminFlags);
  });

  it('accepts a lead and identity-backed outbox transaction and deduplicates retries as the API role', async () => {
    const body = payload();
    const first = await app!.inject({ method: 'POST', url: '/api/leads', payload: body });
    const second = await app!.inject({ method: 'POST', url: '/api/leads', payload: body });
    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(200);
    expect(second.json().id).toBe(first.json().id);
    const stored = await snapshot();
    expect(stored.leads).toHaveLength(1);
    expect(stored.leads[0]).toMatchObject({
      id: first.json().id,
      name: body.name,
      phone: body.phone,
      message: body.message,
    });
    expect(stored.jobs).toHaveLength(1);
    expect(stored.jobs[0]).toMatchObject({
      lead_id: first.json().id,
      status: 'pending',
      random_id: expect.any(Number),
    });
    expect(stored.jobs[0].random_id).toBeGreaterThan(0);
    expect((await app!.inject('/api/health/ready')).statusCode).toBe(200);
  });

  it('runs worker claim, lead reading, retry and sent updates without elevated permissions', async () => {
    const body = payload();
    expect(
      (await app!.inject({ method: 'POST', url: '/api/leads', payload: body })).statusCode,
    ).toBe(201);
    const repository = createOutboxRepository(worker!.db);
    const send = vi
      .fn<Parameters<typeof processNextJob>[0]['send']>()
      .mockRejectedValueOnce(new NotificationDeliveryError('vk_network_error'))
      .mockResolvedValue(undefined);
    expect(await processNextJob({ repository, send, workerId: 'limited-worker', logger })).toBe(
      true,
    );
    const [failed] = (await snapshot()).jobs;
    expect(failed).toMatchObject({
      status: 'pending',
      attempts: 1,
      locked_at: null,
      locked_by: null,
      last_error: 'vk_network_error',
    });
    expect(failed.next_attempt_at.getTime()).toBeGreaterThan(Date.now());
    await admin!.pool.query(
      'UPDATE public.notification_outbox SET next_attempt_at = to_timestamp(0)',
    );
    expect(await processNextJob({ repository, send, workerId: 'limited-worker', logger })).toBe(
      true,
    );
    const [sent] = (await snapshot()).jobs;
    expect(sent).toMatchObject({ status: 'sent', attempts: 1, last_error: null });
    expect(sent.sent_at).toBeInstanceOf(Date);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      name: body.name,
      phone: body.phone,
      message: body.message,
    });
    expect(send.mock.calls.map((call) => call[1])).toEqual([failed.random_id, failed.random_id]);
    expect(await processNextJob({ repository, send, workerId: 'limited-worker', logger })).toBe(
      false,
    );
  });

  it('uses SKIP LOCKED, recovers a stale job and fences its old owner as the worker role', async () => {
    await app!.inject({ method: 'POST', url: '/api/leads', payload: payload() });
    const repository = createOutboxRepository(worker!.db);
    const claims = await Promise.all(
      Array.from({ length: 5 }, (_, index) => repository.claim(`limited-${index}`)),
    );
    const owned = claims.filter((job) => job !== undefined);
    expect(owned).toHaveLength(1);
    const previous = owned[0]!;
    expect(await repository.recoverStale(120000)).toBe(0);
    await admin!.pool.query(
      "UPDATE public.notification_outbox SET locked_at = now() - interval '5 minutes' WHERE id = $1",
      [previous.id],
    );
    expect(await repository.recoverStale(120000)).toBe(1);
    const current = await repository.claim('limited-recovered');
    expect(current?.id).toBe(previous.id);
    expect(await repository.sent(previous)).toBe(false);
    expect(await repository.sent(current!)).toBe(true);
  });

  it('prevents the API from reading personal data or modifying already accepted work', async () => {
    await app!.inject({ method: 'POST', url: '/api/leads', payload: payload() });
    for (const query of [
      'SELECT name, phone, message FROM public.leads',
      'SELECT * FROM public.leads',
      'SELECT * FROM public.notification_outbox',
      "UPDATE public.leads SET name = 'changed' WHERE false",
      "UPDATE public.notification_outbox SET status = 'sent' WHERE false",
      'DELETE FROM public.leads WHERE false',
      'DELETE FROM public.notification_outbox WHERE false',
      'TRUNCATE public.notification_outbox, public.leads',
    ])
      await denied(api!.pool, query);
    expect((await snapshot()).leads).toHaveLength(1);
  });

  it('limits the worker to reading leads and updating delivery state columns', async () => {
    for (const query of [
      'INSERT INTO public.leads DEFAULT VALUES',
      'INSERT INTO public.notification_outbox DEFAULT VALUES',
      "UPDATE public.leads SET name = 'changed' WHERE false",
      "UPDATE public.notification_outbox SET lead_id = '00000000-0000-0000-0000-000000000000' WHERE false",
      "UPDATE public.notification_outbox SET type = 'changed' WHERE false",
      'UPDATE public.notification_outbox SET random_id = DEFAULT WHERE false',
      'UPDATE public.notification_outbox SET created_at = now() WHERE false',
      'DELETE FROM public.leads WHERE false',
      'DELETE FROM public.notification_outbox WHERE false',
      'TRUNCATE public.notification_outbox, public.leads',
    ])
      await denied(worker!.pool, query);
  });

  it('denies schema changes, temporary objects, migration data and role escalation to both logins', async () => {
    for (const pool of [api!.pool, worker!.pool]) {
      for (const query of [
        'CREATE TABLE public.runtime_forbidden (id integer)',
        'CREATE SCHEMA runtime_forbidden',
        'CREATE TEMP TABLE runtime_forbidden (id integer)',
        'ALTER TABLE public.leads ADD COLUMN runtime_forbidden integer',
        'DROP TABLE public.leads',
        'SELECT * FROM drizzle.__drizzle_migrations',
        'DELETE FROM drizzle.__drizzle_migrations',
        'CREATE TABLE drizzle.runtime_forbidden (id integer)',
        `CREATE DATABASE ${identifier(`roles_test_denied_${suffix}`)}`,
        `CREATE ROLE ${identifier(`roles_test_denied_${suffix}`)}`,
        `SET ROLE ${identifier(adminName)}`,
        'SET ROLE pg_read_all_data',
        'SET ROLE pg_write_all_data',
        'SET ROLE pg_execute_server_program',
      ])
        await denied(pool, query);
    }
    await denied(api!.pool, `SET ROLE ${identifier(credentials.worker.name)}`);
    await denied(worker!.pool, `SET ROLE ${identifier(credentials.api.name)}`);
    await denied(api!.pool, `ALTER ROLE ${identifier(credentials.api.name)} SUPERUSER`);
    await denied(worker!.pool, `ALTER ROLE ${identifier(credentials.worker.name)} SUPERUSER`);
  });

  it('does not automatically grant runtime access to future migration objects or sequences', async () => {
    await admin!.pool.query('CREATE TABLE public.future_private_table (secret text)');
    await admin!.pool.query('CREATE SEQUENCE public.future_private_sequence');
    await admin!.pool.query(
      "CREATE FUNCTION public.future_private_function() RETURNS text LANGUAGE sql AS $$ SELECT 'private'::text $$",
    );
    try {
      for (const pool of [api!.pool, worker!.pool]) {
        await denied(pool, 'SELECT * FROM public.future_private_table');
        await denied(pool, "SELECT nextval('public.future_private_sequence')");
        await denied(pool, 'SELECT public.future_private_function()');
        await denied(pool, "SELECT setval('public.notification_outbox_random_id_seq', 1)");
      }
    } finally {
      await admin!.pool.query('DROP TABLE public.future_private_table');
      await admin!.pool.query('DROP SEQUENCE public.future_private_sequence');
      await admin!.pool.query('DROP FUNCTION public.future_private_function()');
    }
  });

  it('can reapply grants while preserving stored leads, notification state and working logins', async () => {
    await app!.inject({ method: 'POST', url: '/api/leads', payload: payload() });
    await processNextJob({
      repository: createOutboxRepository(worker!.db),
      send: async () => {
        throw new NotificationDeliveryError('vk_network_error');
      },
      workerId: 'before-reprovision',
      logger,
    });
    const before = await snapshot();
    // Earlier installations may have explicitly granted individual columns.
    await admin!.pool.query(
      `GRANT SELECT (phone) ON public.leads TO ${identifier(credentials.api.name)}`,
    );
    await admin!.pool.query(
      `GRANT UPDATE (name) ON public.leads TO ${identifier(credentials.worker.name)}`,
    );
    await api!.pool.query('SELECT phone FROM public.leads');
    await worker!.pool.query("UPDATE public.leads SET name = 'unchanged' WHERE false");
    await provisionRuntimeRoles(admin!.pool, credentials);
    await provisionRuntimeRoles(admin!.pool, credentials);
    expect(await snapshot()).toEqual(before);
    await denied(api!.pool, 'SELECT phone FROM public.leads');
    await denied(worker!.pool, "UPDATE public.leads SET name = 'forbidden' WHERE false");
    const freshApi = createDatabase(apiUrl);
    try {
      expect((await freshApi.pool.query('SELECT current_user')).rows[0]?.current_user).toBe(
        credentials.api.name,
      );
    } finally {
      await freshApi.pool.end();
    }
    expect(
      (await app!.inject({ method: 'POST', url: '/api/leads', payload: payload() })).statusCode,
    ).toBe(201);
    expect((await snapshot()).leads).toHaveLength(2);
  });

  it('refuses to adopt an unrelated existing role or privileged managed role', async () => {
    const unrelated = `roles_test_unrelated_${suffix}`;
    await admin!.pool.query(`CREATE ROLE ${identifier(unrelated)} NOLOGIN`);
    rolesCreated.add(unrelated);
    await expect(
      provisionRuntimeRoles(admin!.pool, {
        ...credentials,
        api: { name: unrelated, password: credentials.api.password },
      }),
    ).rejects.toThrow();
    expect(
      (await admin!.pool.query('SELECT rolcanlogin FROM pg_roles WHERE rolname = $1', [unrelated]))
        .rows[0],
    ).toEqual({ rolcanlogin: false });
    await admin!.pool.query(`ALTER ROLE ${identifier(credentials.api.name)} CREATEDB`);
    try {
      await expect(provisionRuntimeRoles(admin!.pool, credentials)).rejects.toThrow();
      expect(
        (
          await admin!.pool.query('SELECT rolcreatedb FROM pg_roles WHERE rolname = $1', [
            credentials.api.name,
          ])
        ).rows[0],
      ).toEqual({ rolcreatedb: true });
    } finally {
      await admin!.pool.query(`ALTER ROLE ${identifier(credentials.api.name)} NOCREATEDB`);
    }
  });
});
