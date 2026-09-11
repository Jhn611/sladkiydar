import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).optional();
const webUrl = z
  .string()
  .trim()
  .max(2048)
  .url('Укажите корректный адрес страницы')
  .refine((value) => /^https?:\/\//i.test(value), 'Разрешены только HTTP и HTTPS');

/** Shared input validation. Normalization for persistence happens in the application layer. */
export const CreateLeadRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Введите имя — минимум 2 символа')
      .max(100, 'Не более 100 символов'),
    phone: z
      .string()
      .trim()
      .min(1, 'Введите телефон')
      .max(40, 'Проверьте номер телефона')
      .regex(/^[+\d\s().-]+$/, 'Проверьте номер телефона')
      .refine((value) => {
        const digits = value.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 15;
      }, 'Введите номер от 10 до 15 цифр'),
    message: optionalText(2000),
    pageUrl: webUrl,
    source: z.string().trim().min(1).max(100),
    referrer: z.union([webUrl, z.literal('')]).optional(),
    utmSource: optionalText(200),
    utmMedium: optionalText(200),
    utmCampaign: optionalText(200),
    utmContent: optionalText(200),
    utmTerm: optionalText(200),
    clientRequestId: z.string().uuid('Некорректный идентификатор запроса'),
    website: z.string().max(200).default(''),
    consent: z.literal(true, {
      errorMap: () => ({ message: 'Необходимо согласие на обработку данных' }),
    }),
  })
  .strict();

export const CreateLeadResponseSchema = z.object({
  accepted: z.literal(true),
  id: z.string().uuid(),
});
export type CreateLeadRequest = z.infer<typeof CreateLeadRequestSchema>;
export type CreateLeadResponse = z.infer<typeof CreateLeadResponseSchema>;
