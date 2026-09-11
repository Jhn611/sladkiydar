import { CreateLeadRequestSchema, CreateLeadResponseSchema } from '@gift/contracts';
import type { FastifyInstance } from 'fastify';
import type { Environment } from '../../../config/env.js';
import type { Database } from '../../../db/client.js';
import { createLead } from '../application/create-lead.js';
import { createLeadRepository } from '../infrastructure/lead.repository.js';

export function registerLeadRoutes(app: FastifyInstance, db: Database, env: Environment) {
  const repository = createLeadRepository(db);
  app.post(
    '/api/leads',
    {
      config: { rateLimit: { max: env.RATE_LIMIT_MAX, timeWindow: '15 minutes' } },
    },
    async (request, reply) => {
      const parsed = CreateLeadRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'validation_error',
          message: 'Проверьте поля формы.',
          fields: parsed.error.flatten().fieldErrors,
        });
      }
      if (parsed.data.website) {
        return reply
          .code(400)
          .send({ error: 'invalid_request', message: 'Не удалось отправить форму.' });
      }

      const result = await createLead(parsed.data, repository);
      request.log.info(
        {
          requestId: request.id,
          leadId: result.id,
          result: result.duplicate ? 'duplicate' : 'created',
        },
        'lead accepted',
      );
      return reply
        .code(result.duplicate ? 200 : 201)
        .send(CreateLeadResponseSchema.parse({ accepted: true, id: result.id }));
    },
  );
}
