import { describe, expect, it, vi } from 'vitest';
import type { Lead } from '../src/db/schema.js';
import { retryDelayMs } from '../src/modules/notifications/retry.js';
import { createVkSender, formatLeadMessage } from '../src/modules/notifications/vk.js';
import { readEnvironment } from '../src/config/env.js';

const lead: Lead = {
  id: '54fabf11-7a9e-49b4-a1d6-5f2a3d351cae',
  clientRequestId: '803ce90d-8002-4940-88d4-9bbb715ab6db',
  name: '<Анна>',
  phone: '+79991234567',
  message: 'Иван & партнёры [id1|Привет]',
  pageUrl: 'https://example.com',
  source: 'hero',
  referrer: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
  consentVersion: '2026-09-10',
  createdAt: new Date('2026-09-10T12:00:00Z'),
  updatedAt: new Date('2026-09-10T12:00:00Z'),
};
const config = {
  token: 'vk1.SECRET',
  groupId: 123,
  peerId: 2000000001,
  apiVersion: '5.199',
  timeoutMs: 1000,
};
const jsonResponse = (body: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers });

describe('VK community delivery', () => {
  it('sends plain text with protected links/mentions and keeps token out of the URL', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ response: 42 }));
    await createVkSender(config, fetcher)(lead, 123456);
    const [url, options] = fetcher.mock.calls[0]!;
    expect(url).toBe('https://api.vk.com/method/messages.send');
    expect(options?.method).toBe('POST');
    const body = new URLSearchParams(String(options?.body));
    expect(Object.fromEntries(body)).toMatchObject({
      access_token: config.token,
      group_id: '123',
      peer_id: '2000000001',
      v: '5.199',
      random_id: '123456',
      disable_mentions: '1',
      dont_parse_links: '1',
    });
    expect(body.get('message')).toContain('Имя: <Анна>');
    expect(body.get('message')).toContain('Иван & партнёры');
    expect(body.get('message')).not.toContain('<b>');
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  it('keeps random_id and complete request identity stable across an uncertain retry', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('private upstream details'))
      .mockResolvedValue(jsonResponse({ response: 42 }));
    const send = createVkSender(config, fetcher);
    await expect(send(lead, 817)).rejects.toThrow('vk_network_error');
    await send(lead, 817);
    expect(fetcher.mock.calls[0]?.[1]?.body).toBe(fetcher.mock.calls[1]?.[1]?.body);
  });

  it.each([6, 9, 10, 29])('retries VK error %i even with HTTP 200', async (code) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        error: {
          error_code: code,
          error_msg: 'secret',
          request_params: [{ value: config.token }],
        },
      }),
    );
    await expect(createVkSender(config, fetcher)(lead, 1)).rejects.toMatchObject({
      code: `vk_api_${code}`,
      configurationError: false,
    });
  });

  it.each([5, 7, 14, 15, 27, 900, 901, 902, 912, 917, 922, 927, 932])(
    'backs off configuration/recipient failure %i without discarding the job',
    async (code) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({ error: { error_code: code } }));
      await expect(createVkSender(config, fetcher)(lead, 1)).rejects.toMatchObject({
        code: `vk_api_${code}`,
        configurationError: true,
      });
    },
  );

  it.each([undefined, {}, { response: '42' }, { error: { error_code: '6' } }])(
    'does not mistake malformed JSON for delivery: %j',
    async (payload) => {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(payload));
      await expect(createVkSender(config, fetcher)(lead, 1)).rejects.toThrow('vk_invalid_response');
    },
  );

  it('honors HTTP Retry-After and keeps network details out of errors', async () => {
    const rateLimited = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ error: 'hidden' }, 429, { 'retry-after': '180' }));
    await expect(createVkSender(config, rateLimited)(lead, 1)).rejects.toMatchObject({
      code: 'vk_http_429',
      retryAfterSeconds: 180,
      configurationError: false,
    });
    const unavailable = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, 503));
    await expect(createVkSender(config, unavailable)(lead, 1)).rejects.toMatchObject({
      code: 'vk_http_503',
      configurationError: false,
    });
    const failed = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error(`access_token=${config.token} ${lead.phone}`));
    await expect(createVkSender(config, failed)(lead, 1)).rejects.toThrow(/^vk_network_error$/);
  });

  it('aborts a stalled HTTP operation using the configured deadline', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      async (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => reject(new Error('timed out')), {
            once: true,
          });
        }),
    );
    await expect(createVkSender({ ...config, timeoutMs: 20 }, fetcher)(lead, 1)).rejects.toThrow(
      'vk_network_error',
    );
  });

  it('does not make external calls without configuration or a persisted request identifier', async () => {
    const fetcher = vi.fn<typeof fetch>();
    for (const missing of [{ token: undefined }, { groupId: undefined }, { peerId: undefined }]) {
      await expect(
        createVkSender({ ...config, ...missing }, fetcher)(lead, 1),
      ).rejects.toMatchObject({ code: 'vk_configuration_missing', configurationError: true });
    }
    for (const id of [0, -1, 1.5, 2147483648]) {
      await expect(createVkSender(config, fetcher)(lead, id)).rejects.toThrow(
        'vk_random_id_invalid',
      );
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('retains maximum comment length and keeps text bounded without broken Unicode', () => {
    const message = formatLeadMessage({
      ...lead,
      name: 'Я'.repeat(100),
      message: '🎁'.repeat(1000),
      pageUrl: 'https://example.com/' + '🎁'.repeat(1000),
      referrer: 'x'.repeat(2048),
      utmSource: 'x'.repeat(200),
      utmMedium: 'x'.repeat(200),
      utmCampaign: 'x'.repeat(200),
      utmContent: 'x'.repeat(200),
      utmTerm: 'x'.repeat(200),
    });
    expect(message).toContain('🎁'.repeat(1000));
    expect(message.length).toBeLessThan(4096);
    expect(message).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
    expect(formatLeadMessage({ ...lead, message: null })).not.toContain('Комментарий:');
  });
});

describe('retry policy', () => {
  it('uses exponential jitter, honors Retry-After and retains jobs without a maximum attempt cutoff', () => {
    expect(retryDelayMs(1, { random: () => 0 })).toBe(30000);
    expect(retryDelayMs(2, { random: () => 1 })).toBe(120000);
    expect(retryDelayMs(1000, { random: () => 1 })).toBe(86400000);
    expect(retryDelayMs(1, { retryAfterSeconds: 600, random: () => 0 })).toBe(600000);
    expect(retryDelayMs(1, { configurationError: true })).toBeGreaterThanOrEqual(3600000);
  });
});

describe('environment validation', () => {
  it('accepts an unconfigured bot and defaults the pinned API version', () => {
    expect(
      readEnvironment({
        DATABASE_URL: 'postgresql://test:test@localhost/test',
        VK_GROUP_TOKEN: '',
        VK_GROUP_ID: '',
        VK_PEER_ID: '',
      }),
    ).toMatchObject({
      VK_GROUP_TOKEN: undefined,
      VK_GROUP_ID: undefined,
      VK_PEER_ID: undefined,
      VK_API_VERSION: '5.199',
      VK_TIMEOUT_MS: 15000,
    });
  });
  it('reports only invalid variable names and never supplied secrets', () => {
    expect(() => readEnvironment({ DATABASE_URL: 'secret-password' })).toThrow(
      'Invalid environment variables: DATABASE_URL',
    );
    expect(() =>
      readEnvironment({
        DATABASE_URL: 'postgresql://test:test@localhost/test',
        VK_PEER_ID: 'secret-destination',
      }),
    ).toThrow('Invalid environment variables: VK_PEER_ID');
  });
});
