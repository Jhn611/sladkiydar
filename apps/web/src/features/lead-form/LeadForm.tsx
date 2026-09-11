import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateLeadRequestSchema, type CreateLeadRequest } from '@gift/contracts';
import { Link } from 'react-router-dom';
import { createLead, LeadApiError } from '../../shared/api/leads';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Textarea } from '../../shared/ui/Textarea';
import { Checkbox } from '../../shared/ui/Checkbox';
import { Icon } from '../../shared/ui/Icon';
import { collectLeadMetadata, createRequestId, LeadFieldsSchema, type LeadFields } from './model';
import styles from './LeadForm.module.css';

interface LeadFormProps {
  source: string;
  onSuccess?: () => void;
}

export function LeadForm({ source, onSuccess }: LeadFormProps) {
  const formId = useId();
  const successHeading = useRef<HTMLHeadingElement>(null);
  const [success, setSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [retryLocked, setRetryLocked] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const requestId = useRef<string | null>(null);
  const pendingPayload = useRef<CreateLeadRequest | null>(null);
  const metadata = useRef<ReturnType<typeof collectLeadMetadata> | null>(null);
  const submitting = useRef(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFields>({
    resolver: zodResolver(LeadFieldsSchema),
    defaultValues: { name: '', phone: '', message: '', website: '' },
  });

  const busy = isSubmitting || isSending;

  useEffect(() => {
    if (success) successHeading.current?.focus();
  }, [success]);

  useEffect(() => {
    if (errors.message) setCommentOpen(true);
  }, [errors.message]);

  async function submit(fields: LeadFields) {
    if (submitting.current) return;
    submitting.current = true;
    setIsSending(true);
    setErrorMessage('');
    try {
      // Keep identity and attribution across uncertain network responses and retries.
      requestId.current ??= createRequestId();
      metadata.current ??= collectLeadMetadata(source);
      pendingPayload.current ??= CreateLeadRequestSchema.parse({
        ...fields,
        ...metadata.current,
        clientRequestId: requestId.current,
      });
      await createLead(pendingPayload.current);
      reset();
      requestId.current = null;
      metadata.current = null;
      pendingPayload.current = null;
      setRetryLocked(false);
      setCommentOpen(false);
      setSuccess(true);
      onSuccess?.();
    } catch (error) {
      const rejected = error instanceof LeadApiError && [400, 403, 429].includes(error.status ?? 0);
      if (rejected || !pendingPayload.current) {
        requestId.current = null;
        metadata.current = null;
        pendingPayload.current = null;
        setRetryLocked(false);
      } else {
        setRetryLocked(true);
      }
      setErrorMessage(
        error instanceof LeadApiError
          ? error.message
          : 'Не удалось отправить заявку. Проверьте данные и попробуйте ещё раз.',
      );
    } finally {
      submitting.current = false;
      setIsSending(false);
    }
  }

  if (success) {
    return (
      <div className={styles.success} role="status">
        <span className={styles.successIcon}>
          <Icon name="check" />
        </span>
        <h3 ref={successHeading} tabIndex={-1}>
          Хорошее начало!
        </h3>
        <p>
          Заявка принята. Перезвоним в течение 15 минут, пришлём прайс-лист и поможем выбрать набор
          под ваш бюджет.
        </p>
        <Button variant="outline" onClick={() => setSuccess(false)}>
          Отправить ещё одну
        </Button>
      </div>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(submit)}
      noValidate
      aria-label="Заявка на наборы Kinder оптом"
      aria-busy={busy}
    >
      <fieldset className={styles.fields} disabled={busy || retryLocked}>
        <legend className={styles.srOnly}>Ваши контакты и пожелания</legend>
        <div className={styles.grid}>
          <Input
            id={`${formId}-name`}
            label="Имя *"
            placeholder="Как к вам обращаться?"
            autoComplete="name"
            required
            maxLength={100}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            id={`${formId}-phone`}
            label="Телефон *"
            placeholder="+7 (999) 123-45-67"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            maxLength={40}
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
        <div className={styles.comment}>
          <button
            className={styles.commentToggle}
            type="button"
            aria-expanded={commentOpen}
            aria-controls={`${formId}-comment`}
            onClick={() => setCommentOpen((open) => !open)}
          >
            <Icon name={commentOpen ? 'minus' : 'plus'} size={16} />
            {commentOpen ? 'Скрыть комментарий' : 'Добавить комментарий'}
          </button>
          <div id={`${formId}-comment`} hidden={!commentOpen}>
            <Textarea
              id={`${formId}-message`}
              label="Комментарий (необязательно)"
              placeholder="Повод, количество наборов или ваш вопрос — можно оставить пустым"
              rows={3}
              maxLength={2000}
              error={errors.message?.message}
              {...register('message')}
            />
          </div>
        </div>
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor={`${formId}-website`}>Ваш сайт — оставьте это поле пустым</label>
          <input
            id={`${formId}-website`}
            tabIndex={-1}
            autoComplete="off"
            {...register('website')}
          />
        </div>
        <Checkbox
          required
          id={`${formId}-consent`}
          label={
            <>
              Я согласен на обработку персональных данных в соответствии с{' '}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer">
                политикой конфиденциальности
              </Link>
              .
            </>
          }
          error={errors.consent?.message}
          {...register('consent')}
        />
      </fieldset>
      {errorMessage && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}
      {retryLocked && (
        <p className={styles.retryNote}>
          При повторе отправим те же данные, чтобы не создать вторую заявку.
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" disabled={busy}>
          {busy ? 'Отправляем…' : errorMessage ? 'Повторить отправку' : 'Получить прайс-лист'}
          <Icon name="arrow-up-right" />
        </Button>
      </div>
      <p className={styles.promise}>
        Перезвоним в течение 15 минут. Никакого спама — только прайс и ответы на ваши вопросы
      </p>
    </form>
  );
}
