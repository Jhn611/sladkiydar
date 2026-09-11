import { randomUUID } from 'node:crypto';
import Fastify, { LogController, type FastifyError } from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { sql } from 'drizzle-orm';
import type { Environment } from './config/env.js';
import type { Database } from './db/client.js';
import { registerLeadRoutes } from './modules/leads/http/lead.routes.js';

export async function buildApp(options: { db: Database; env: Environment; logger?: boolean }) {
  const { db, env } = options;
  const app = Fastify({
    bodyLimit: 16 * 1024,
    requestTimeout: 15000,
    trustProxy:
      env.TRUST_PROXY_HOPS === 0
        ? false
        : (_address: string, hop: number) => hop < env.TRUST_PROXY_HOPS,
    requestIdHeader: false,
    logController: new LogController({ requestIdLogLabel: 'requestId' }),
    genReqId: () => randomUUID(),
    logger:
      options.logger === false
        ? false
        : {
            level: env.LOG_LEVEL,
            redact: ['req.headers.authorization', 'req.body', 'body', '*.token', '*.password'],
            serializers: {
              req: (req: { method: string; url: string; id: string }) => ({
                method: req.method,
                path: req.url.split('?')[0],
                requestId: req.id,
              }),
            },
          },
  });

  await app.register(helmet);
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'rate_limited',
      message: 'Слишком много попыток. Пожалуйста, попробуйте немного позже.',
    }),
  });

  app.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    reply.header('X-Request-Id', request.id);
    if (request.method !== 'POST') return;
    const origin = request.headers.origin;
    const site = request.headers['sec-fetch-site'];
    if ((origin && origin !== new URL(env.PUBLIC_ORIGIN).origin) || site === 'cross-site') {
      return reply
        .code(403)
        .send({ error: 'origin_forbidden', message: 'Отправьте форму со страницы сайта.' });
    }
  });

  app.setErrorHandler<FastifyError>((error, request, reply) => {
    const statusCode =
      typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500
        ? error.statusCode
        : 503;
    if (statusCode === 429) {
      return reply.code(429).send({
        error: 'rate_limited',
        message: 'Слишком много попыток. Пожалуйста, попробуйте немного позже.',
      });
    }
    // SQL/HTTP errors can contain submitted values or bot URLs. Log only a stable classification.
    request.log.error(
      {
        requestId: request.id,
        errorCode: error.code ?? 'request_failed',
        result: 'failed',
        statusCode,
      },
      'request failed',
    );
    return reply.code(statusCode).send({
      error: statusCode >= 500 ? 'temporarily_unavailable' : 'invalid_request',
      message:
        statusCode >= 500
          ? 'Сервис временно недоступен. Пожалуйста, повторите отправку.'
          : 'Проверьте данные запроса.',
    });
  });

  // The default 404 message/log echoes the complete URL, including private query values.
  app.setNotFoundHandler(async (_request, reply) =>
    reply.code(404).send({ error: 'not_found', message: 'Маршрут не найден.' }),
  );

  app.get('/api/health/live', async () => ({ status: 'ok' }));
  app.get('/api/health/ready', async (_request, reply) => {
    try {
      await db.execute(sql`select 1`);
      return { status: 'ready' };
    } catch {
      return reply.code(503).send({ status: 'unavailable' });
    }
  });

  registerLeadRoutes(app, db, env);
  return app;
}
