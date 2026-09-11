import type pg from 'pg';

export type RuntimeRoleCredentials = {
  api: { name: string; password: string };
  worker: { name: string; password: string };
};

const configurationError = () =>
  new Error(
    'Invalid runtime database credentials: configure distinct DB_API_USER/DB_WORKER_USER and both passwords.',
  );

function validateCredentials(credentials: RuntimeRoleCredentials): void {
  for (const role of [credentials.api, credentials.worker]) {
    if (
      !role.name ||
      Buffer.byteLength(role.name, 'utf8') > 63 ||
      Array.from(role.name).some(
        (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
      ) ||
      /^(pg_|public$)/i.test(role.name) ||
      !role.password.trim() ||
      role.password.includes('\0')
    ) {
      throw configurationError();
    }
  }
  if (
    credentials.api.name === credentials.worker.name ||
    credentials.api.password === credentials.worker.password
  ) {
    throw configurationError();
  }
}

export function readRuntimeRoleCredentials(
  input: NodeJS.ProcessEnv = process.env,
): RuntimeRoleCredentials | undefined {
  const keys = ['DB_API_USER', 'DB_API_PASSWORD', 'DB_WORKER_USER', 'DB_WORKER_PASSWORD'] as const;
  const configured = keys.some((key) => input[key] !== undefined && input[key] !== '');
  if (!configured && input.NODE_ENV !== 'production') return undefined;

  const credentials: RuntimeRoleCredentials = {
    api: { name: input.DB_API_USER || 'povod_api', password: input.DB_API_PASSWORD || '' },
    worker: {
      name: input.DB_WORKER_USER || 'povod_worker',
      password: input.DB_WORKER_PASSWORD || '',
    },
  };
  validateCredentials(credentials);
  return credentials;
}

function identifier(value: string): string {
  return '"' + value.replaceAll('"', '""') + '"';
}

// DDL does not accept bind parameters for identifiers/passwords. Always escape both
// quotes and backslashes explicitly; never interpolate a connection URL or raw input.
function literal(value: string): string {
  return "E'" + value.replaceAll('\\', '\\\\').replaceAll("'", "''") + "'";
}

type ExistingRole = {
  oid: number;
  elevated: boolean;
  owns_objects: boolean;
  has_memberships: boolean;
  marker: string | null;
};

/**
 * Run only using the administrator connection, after schema migrations.
 * Grants are deliberately tied to the current repositories, never future tables.
 */
export async function provisionRuntimeRoles(
  pool: pg.Pool,
  credentials: RuntimeRoleCredentials,
): Promise<void> {
  validateCredentials(credentials);
  let client: pg.PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const context = await client.query<{
      database_name: string;
      database_oid: number;
      administrator: string;
      session_administrator: string;
      is_superuser: boolean;
    }>(`
      SELECT current_database() AS database_name,
             (SELECT oid FROM pg_catalog.pg_database WHERE datname = current_database()) AS database_oid,
             current_user AS administrator, session_user AS session_administrator,
             (SELECT rolsuper FROM pg_catalog.pg_roles WHERE rolname = current_user) AS is_superuser
    `);
    const database = context.rows[0];
    if (
      !database?.is_superuser ||
      [credentials.api.name, credentials.worker.name].some(
        (name) => name === database.administrator || name === database.session_administrator,
      )
    ) {
      throw new Error('runtime_role_administrator_conflict');
    }

    // Suppress statement/error/slow-query logs while applying password DDL.
    await client.query("SET LOCAL log_statement = 'none'");
    await client.query("SET LOCAL log_min_error_statement = 'panic'");
    await client.query('SET LOCAL log_parameter_max_length_on_error = 0');
    await client.query('SET LOCAL log_min_duration_statement = -1');
    await client.query('SET LOCAL log_min_duration_sample = -1');
    await client.query('SET LOCAL log_transaction_sample_rate = 0');
    await client.query("SET LOCAL password_encryption = 'scram-sha-256'");
    await client.query(
      "SELECT pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('sladkiy-dar:runtime-roles'))",
    );

    const roles = [
      { ...credentials.api, service: 'api' },
      { ...credentials.worker, service: 'worker' },
    ];
    for (const role of roles) {
      const marker = `sladkiy-dar:runtime:${role.service}:${database.database_oid}`;
      const existing = await client.query<ExistingRole>(
        `
          SELECT r.oid,
                 (r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls) AS elevated,
                 EXISTS (
                   SELECT 1 FROM pg_catalog.pg_shdepend d
                   WHERE d.refclassid = 'pg_catalog.pg_authid'::regclass
                     AND d.refobjid = r.oid AND d.deptype = 'o'
                 ) AS owns_objects,
                 EXISTS (
                   SELECT 1 FROM pg_catalog.pg_auth_members m
                   WHERE m.member = r.oid OR m.roleid = r.oid
                 ) AS has_memberships,
                 pg_catalog.shobj_description(r.oid, 'pg_authid') AS marker
          FROM pg_catalog.pg_roles r WHERE r.rolname = $1
        `,
        [role.name],
      );
      const found = existing.rows[0];
      if (
        found &&
        (found.elevated || found.owns_objects || found.has_memberships || found.marker !== marker)
      ) {
        // Never adopt an unrelated account or silently downgrade a privileged role.
        throw new Error('runtime_role_name_conflict');
      }
      const name = identifier(role.name);
      await client.query(
        `${found ? 'ALTER' : 'CREATE'} ROLE ${name}
         LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS
         PASSWORD ${literal(role.password)}`,
      );
      await client.query(`COMMENT ON ROLE ${name} IS ${literal(marker)}`);
      await client.query(`ALTER ROLE ${name} RESET ALL`);
      await client.query(
        `ALTER ROLE ${name} IN DATABASE ${identifier(database.database_name)} RESET ALL`,
      );
      await client.query(
        `ALTER ROLE ${name} IN DATABASE ${identifier(database.database_name)} SET search_path = pg_catalog, public`,
      );
    }

    const api = identifier(credentials.api.name);
    const worker = identifier(credentials.worker.name);
    const recipients = `PUBLIC, ${api}, ${worker}`;
    const databaseName = identifier(database.database_name);
    await client.query(`REVOKE ALL PRIVILEGES ON DATABASE ${databaseName} FROM ${recipients}`);
    await client.query(`GRANT CONNECT ON DATABASE ${databaseName} TO ${api}, ${worker}`);

    for (const schema of ['public', 'drizzle']) {
      const schemaName = identifier(schema);
      await client.query(`REVOKE ALL PRIVILEGES ON SCHEMA ${schemaName} FROM ${recipients}`);
      await client.query(
        `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schemaName} FROM ${recipients}`,
      );
      await client.query(
        `REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schemaName} FROM ${recipients}`,
      );
      await client.query(
        `REVOKE ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA ${schemaName} FROM ${recipients}`,
      );

      // Clear earlier defaults if this dedicated installation was configured more broadly.
      for (const objectType of ['TABLES', 'SEQUENCES', 'FUNCTIONS', 'TYPES']) {
        await client.query(
          `ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaName} REVOKE ALL PRIVILEGES ON ${objectType} FROM ${recipients}`,
        );
      }
    }
    // Global defaults precede per-schema defaults; both must be cleared.
    for (const objectType of ['TABLES', 'SEQUENCES', 'FUNCTIONS', 'TYPES']) {
      await client.query(
        `ALTER DEFAULT PRIVILEGES REVOKE ALL PRIVILEGES ON ${objectType} FROM ${recipients}`,
      );
    }

    await client.query(`GRANT USAGE ON SCHEMA public TO ${api}, ${worker}`);
    await client.query(`REVOKE ALL PRIVILEGES ON TYPE public.outbox_status FROM ${recipients}`);
    await client.query(`GRANT USAGE ON TYPE public.outbox_status TO ${api}, ${worker}`);
    // Drizzle includes DEFAULT for omitted columns, requiring table INSERT.
    // Generated identity values do not require direct sequence privileges.
    await client.query(`GRANT INSERT ON TABLE public.leads, public.notification_outbox TO ${api}`);
    await client.query(`GRANT SELECT (id, client_request_id) ON TABLE public.leads TO ${api}`);
    await client.query(
      `GRANT SELECT ON TABLE public.leads, public.notification_outbox TO ${worker}`,
    );
    await client.query(
      `GRANT UPDATE (status, attempts, next_attempt_at, locked_at, locked_by, last_error, updated_at, sent_at)
       ON TABLE public.notification_outbox TO ${worker}`,
    );
    await client.query('COMMIT');
  } catch {
    if (client) await client.query('ROLLBACK').catch(() => undefined);
    // Do not expose PostgreSQL errors: they can contain password-bearing DDL.
    throw new Error(
      'Runtime database role provisioning failed; check administrator access and dedicated role names.',
    );
  } finally {
    client?.release();
  }
}
