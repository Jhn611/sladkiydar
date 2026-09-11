import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

// Workspace commands run from apps/api. Deployment injects environment variables directly.
config({
  path: [resolve(process.cwd(), '../../.env'), resolve(process.cwd(), '.env')],
  quiet: true,
});

const optionalSecret = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() || undefined : value),
  z.string().optional(),
);
const optionalId = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : value),
  z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
);
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => /^postgres(ql)?:\/\//.test(value)),
  PUBLIC_ORIGIN: z
    .string()
    .url()
    .refine((value) => /^https?:\/\//.test(value))
    .default('http://localhost:5173'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(2).default(0),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(8),
  VK_GROUP_TOKEN: optionalSecret,
  VK_GROUP_ID: optionalId,
  VK_PEER_ID: optionalId,
  VK_API_VERSION: z
    .string()
    .regex(/^5\.\d{1,3}$/)
    .default('5.199'),
  WORKER_POLL_MS: z.coerce.number().int().min(250).max(60000).default(3000),
  WORKER_LOCK_MS: z.coerce.number().int().min(60000).max(3600000).default(120000),
  VK_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(15000),
  MIGRATIONS_DIR: z.string().default('./drizzle'),
});

export type Environment = z.infer<typeof schema>;

export function readEnvironment(
  input: NodeJS.ProcessEnv = process.env,
  service: 'api' | 'worker' | 'migrate' = 'api',
): Environment {
  // Native commands share .env; containers receive only their own DATABASE_URL.
  const databaseUrl =
    service === 'worker'
      ? (input.WORKER_DATABASE_URL ?? input.DATABASE_URL)
      : service === 'migrate'
        ? (input.MIGRATION_DATABASE_URL ?? input.DATABASE_URL)
        : input.DATABASE_URL;
  const parsed = schema.safeParse({ ...input, DATABASE_URL: databaseUrl });
  if (!parsed.success) {
    // Never put supplied values (especially DATABASE_URL or bot token) in configuration errors.
    throw new Error(
      `Invalid environment variables: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
    );
  }
  return parsed.data;
}
