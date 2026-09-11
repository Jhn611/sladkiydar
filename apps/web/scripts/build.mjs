// The root .env configures Node API development. Production web must always
// exclude React development code, regardless of that server-side setting.
process.env.NODE_ENV = 'production';
const { build } = await import('vite');
await build();
await import('./seo.mjs');
