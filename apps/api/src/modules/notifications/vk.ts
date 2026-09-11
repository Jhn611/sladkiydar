import { z } from 'zod';
import type { Lead } from '../../db/schema.js';
import { NotificationDeliveryError } from './delivery-error.js';

// Keep each message comfortably below the API limit, including all attribution fields.
const truncate = (value: string, length: number) =>
  value.length > length ? `${value.slice(0, length - 1).replace(/[\uD800-\uDBFF]$/, '')}…` : value;

const leadDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatLeadMessage(lead: Lead) {
  const lines = [
    'Новая заявка · Сладкий Дар',
    `Заявка #${lead.id}`,
    `Дата: ${leadDateFormatter.format(lead.createdAt)} (МСК)`,
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
  ];
  const field = (label: string, value: string | null, limit: number) => {
    if (value) lines.push(`${label}: ${truncate(value, limit)}`);
  };
  field('Комментарий', lead.message, 2000);
  field('Источник', lead.source, 100);
  field('Страница', lead.pageUrl, 450);
  field('Реферер', lead.referrer, 200);
  const utm = [
    ['source', lead.utmSource],
    ['medium', lead.utmMedium],
    ['campaign', lead.utmCampaign],
    ['content', lead.utmContent],
    ['term', lead.utmTerm],
  ]
    .filter((entry) => entry[1])
    .map(([key, value]) => `${key}=${truncate(value ?? '', 100)}`)
    .join(' · ');
  if (utm) lines.push(`UTM: ${utm}`);
  return lines.join('\n');
}

const vkErrorSchema = z.object({ error: z.object({ error_code: z.number().int() }) });
const vkSuccessSchema = z.object({ response: z.number().int().nonnegative() });
// Authorization, permissions, required validation and unavailable destinations need operator action.
const configurationErrors = new Set([
  5, 7, 14, 15, 18, 27, 28, 100, 113, 900, 901, 902, 912, 917, 922, 927, 932,
]);

const retryAfterSeconds = (header: string | null): number | undefined => {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  const date = Date.parse(header);
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - Date.now()) / 1000)) : undefined;
};

export function createVkSender(
  config: {
    token?: string;
    groupId?: number;
    peerId?: number;
    apiVersion: string;
    timeoutMs: number;
  },
  fetcher: typeof fetch = fetch,
) {
  return async (lead: Lead, randomId: number): Promise<void> => {
    if (!config.token || !config.groupId || !config.peerId) {
      throw new NotificationDeliveryError('vk_configuration_missing', undefined, true);
    }
    if (!Number.isInteger(randomId) || randomId < 1 || randomId > 2147483647) {
      throw new NotificationDeliveryError('vk_random_id_invalid', undefined, true);
    }
    let response: Response;
    try {
      response = await fetcher('https://api.vk.com/method/messages.send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          access_token: config.token,
          v: config.apiVersion,
          group_id: String(config.groupId),
          peer_id: String(config.peerId),
          random_id: String(randomId),
          message: formatLeadMessage(lead),
          dont_parse_links: '1',
          disable_mentions: '1',
        }).toString(),
        signal: AbortSignal.timeout(config.timeoutMs),
      });
    } catch {
      // Never expose request bodies or raw fetch errors: they may contain tokens or lead data.
      throw new NotificationDeliveryError('vk_network_error');
    }
    const retryAfter = retryAfterSeconds(response.headers.get('retry-after'));
    if (!response.ok) {
      throw new NotificationDeliveryError(
        `vk_http_${response.status}`,
        retryAfter,
        response.status >= 400 &&
          response.status < 500 &&
          ![408, 425, 429].includes(response.status),
      );
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new NotificationDeliveryError('vk_invalid_response', retryAfter);
    }
    // VK returns application failures with HTTP 200; HTTP success alone is not delivery.
    const error = vkErrorSchema.safeParse(payload);
    if (error.success) {
      const code = error.data.error.error_code;
      throw new NotificationDeliveryError(
        `vk_api_${code}`,
        retryAfter,
        configurationErrors.has(code),
      );
    }
    if (!vkSuccessSchema.safeParse(payload).success) {
      throw new NotificationDeliveryError('vk_invalid_response', retryAfter);
    }
  };
}
