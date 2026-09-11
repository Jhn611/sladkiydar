import {
  CreateLeadResponseSchema,
  type CreateLeadRequest,
  type CreateLeadResponse,
} from '@gift/contracts';

export class LeadApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'LeadApiError';
  }
}

/** Same-origin API; a success means the lead was committed, not that the manager notification was delivered. */
export async function createLead(payload: CreateLeadRequest): Promise<CreateLeadResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      signal: controller.signal,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      if (response.status === 429) {
        throw new LeadApiError(
          'Слишком много попыток. Подождите немного и повторите отправку.',
          429,
        );
      }
      if (response.status === 400) {
        throw new LeadApiError(
          'Не удалось принять данные. Проверьте поля и повторите отправку.',
          400,
        );
      }
      throw new LeadApiError(
        'Сервис временно недоступен. Ваши данные остались в форме — попробуйте ещё раз.',
        response.status,
      );
    }
    const result = CreateLeadResponseSchema.safeParse(await response.json());
    if (!result.success) {
      throw new LeadApiError(
        'Не получили подтверждение. Повторите отправку — повторная попытка не создаст дубль.',
      );
    }
    return result.data;
  } catch (error) {
    if (error instanceof LeadApiError) throw error;
    throw new LeadApiError(
      'Не удалось связаться с сервером. Проверьте подключение и повторите отправку.',
    );
  } finally {
    window.clearTimeout(timeout);
  }
}
