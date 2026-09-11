import { describe, expect, it } from 'vitest';
import { CreateLeadRequestSchema } from './index';

const valid = {
  name: 'Анна',
  phone: '+7 (999) 123-45-67',
  pageUrl: 'https://example.com/',
  source: 'hero',
  clientRequestId: 'db3b8f8f-043d-402c-8fbd-b46d18d35990',
  consent: true,
};

describe('lead contract', () => {
  it('accepts a lead with the required name and phone and defaults the honeypot', () => {
    expect(CreateLeadRequestSchema.parse(valid).website).toBe('');
  });
  it.each([undefined, '', '   ', 'Нужны наборы к празднику'])(
    'accepts an optional comment: %j',
    (message) => {
      expect(CreateLeadRequestSchema.parse({ ...valid, message }).message).toBe(message?.trim());
    },
  );
  it.each([
    { phone: undefined },
    { phone: '' },
    { phone: '123' },
    { phone: 'call me tomorrow' },
    { consent: undefined },
    { consent: false },
    { name: undefined },
    { name: ' ' },
    { name: 'А' },
    { name: 'А'.repeat(101) },
    { message: 'А'.repeat(2001) },
    { pageUrl: 'javascript:alert(1)' },
    { clientRequestId: '123' },
    { unexpected: true },
  ])('rejects invalid input %j', (invalid) => {
    expect(CreateLeadRequestSchema.safeParse({ ...valid, ...invalid }).success).toBe(false);
  });
  it.each([{ email: 'anna@example.com' }, { company: 'Студия' }, { email: '', company: '' }])(
    'rejects removed fields even when empty: %j',
    (removedFields) => {
      expect(CreateLeadRequestSchema.safeParse({ ...valid, ...removedFields }).success).toBe(false);
    },
  );
});
