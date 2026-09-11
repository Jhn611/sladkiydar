import type { CreateLeadRequest } from '@gift/contracts';
import type { LeadRepository } from '../infrastructure/lead.repository.js';

const nullable = (value: string | undefined): string | null => value?.trim() || null;

export function normalizeLead(input: CreateLeadRequest) {
  let digits = input.phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  return {
    clientRequestId: input.clientRequestId,
    name: input.name.trim().replace(/\s+/g, ' '),
    phone: `+${digits}`,
    message: nullable(input.message),
    pageUrl: input.pageUrl,
    source: input.source,
    referrer: nullable(input.referrer),
    utmSource: nullable(input.utmSource),
    utmMedium: nullable(input.utmMedium),
    utmCampaign: nullable(input.utmCampaign),
    utmContent: nullable(input.utmContent),
    utmTerm: nullable(input.utmTerm),
  };
}

export async function createLead(input: CreateLeadRequest, repository: LeadRepository) {
  return repository.create(normalizeLead(input));
}
