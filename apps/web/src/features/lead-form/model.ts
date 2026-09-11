import { CreateLeadRequestSchema } from '@gift/contracts';
import type { z } from 'zod';

export const LeadFieldsSchema = CreateLeadRequestSchema.pick({
  name: true,
  phone: true,
  message: true,
  website: true,
  consent: true,
});

export type LeadFields = z.infer<typeof LeadFieldsSchema>;

export function createRequestId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

export function collectLeadMetadata(source: string) {
  const params = new URLSearchParams(window.location.search);
  const utm = (key: string) => params.get(key)?.trim().slice(0, 200) || undefined;
  const referrer = /^https?:\/\//i.test(document.referrer) ? document.referrer.slice(0, 2048) : '';
  return {
    pageUrl: window.location.href.slice(0, 2048),
    source: source.trim().slice(0, 100) || 'website',
    referrer,
    utmSource: utm('utm_source'),
    utmMedium: utm('utm_medium'),
    utmCampaign: utm('utm_campaign'),
    utmContent: utm('utm_content'),
    utmTerm: utm('utm_term'),
  };
}
