import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { api: 'src/api.ts', worker: 'src/worker.ts', migrate: 'src/db/migrate.ts' },
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  noExternal: ['@gift/contracts'],
});
