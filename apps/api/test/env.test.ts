import { describe, expect, it } from 'vitest';
import { readEnvironment } from '../src/config/env.js';

const urls = {
  DATABASE_URL: 'postgresql://api:api-password@localhost/app',
  WORKER_DATABASE_URL: 'postgresql://worker:worker-password@localhost/app',
  MIGRATION_DATABASE_URL: 'postgresql://admin:admin-password@localhost/app',
};

describe('database credentials by process', () => {
  it('keeps the API on its limited URL even when native migration credentials are present', () => {
    expect(readEnvironment(urls).DATABASE_URL).toBe(urls.DATABASE_URL);
  });

  it('selects only the worker connection for native notification processing', () => {
    expect(readEnvironment(urls, 'worker').DATABASE_URL).toBe(urls.WORKER_DATABASE_URL);
  });

  it('selects the administrative connection only for native migrations', () => {
    expect(readEnvironment(urls, 'migrate').DATABASE_URL).toBe(urls.MIGRATION_DATABASE_URL);
  });

  it.each(['api', 'worker', 'migrate'] as const)(
    'accepts a single service-specific injected container URL for %s',
    (service) => {
      const DATABASE_URL = 'postgresql://container-role:password@postgres/app';
      expect(readEnvironment({ DATABASE_URL }, service).DATABASE_URL).toBe(DATABASE_URL);
    },
  );

  it('fails closed on an invalid worker override without disclosing either URL', () => {
    expect(() =>
      readEnvironment({ ...urls, WORKER_DATABASE_URL: 'private-invalid-url' }, 'worker'),
    ).toThrow('Invalid environment variables: DATABASE_URL');
  });

  it('does not fall back to runtime credentials for an explicitly empty migration override', () => {
    expect(() => readEnvironment({ ...urls, MIGRATION_DATABASE_URL: '' }, 'migrate')).toThrow(
      'Invalid environment variables: DATABASE_URL',
    );
  });
});
