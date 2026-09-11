import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateLeadRequestSchema } from '@gift/contracts';
import { LeadForm } from './LeadForm';

const fetchMock = vi.fn<typeof fetch>();
const acceptedResponse = () =>
  new Response(JSON.stringify({ accepted: true, id: '59a83cdd-2326-41e4-a521-c83c3f640a94' }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });

function mountForm() {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LeadForm source="test-cta" />
    </MemoryRouter>,
  );
  return userEvent.setup();
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Имя *'), 'Анна');
  await user.type(screen.getByLabelText('Телефон *'), '+7 (999) 123-45-67');
  await user.click(screen.getByRole('checkbox'));
}

describe('lead form', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    window.history.replaceState(
      {},
      '',
      '/?utm_source=newsletter&utm_medium=email&utm_campaign=autumn',
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('validates required contacts and explicit consent before requesting the API', async () => {
    const user = mountForm();
    await user.click(screen.getByRole('button', { name: 'Получить прайс-лист' }));
    expect(await screen.findByText('Введите имя — минимум 2 символа')).toBeVisible();
    expect(screen.getByText('Введите телефон')).toBeVisible();
    expect(screen.getByText('Необходимо согласие на обработку данных')).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits the shared contract with attribution and clears the form after acceptance', async () => {
    fetchMock.mockResolvedValueOnce(acceptedResponse());
    const user = mountForm();
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Добавить комментарий' }));
    await user.type(
      screen.getByLabelText('Комментарий (необязательно)'),
      '30 наборов на выпускной',
    );
    await user.click(screen.getByRole('button', { name: 'Получить прайс-лист' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Заявка принята');
    const [url, init] = fetchMock.mock.calls[0]!;
    const payload = CreateLeadRequestSchema.parse(JSON.parse(init!.body as string));
    expect(url).toBe('/api/leads');
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin' });
    expect(payload).toMatchObject({
      name: 'Анна',
      message: '30 наборов на выпускной',
      source: 'test-cta',
      consent: true,
      website: '',
      utmSource: 'newsletter',
      utmMedium: 'email',
      utmCampaign: 'autumn',
    });
    expect(payload.pageUrl).toContain('utm_source=newsletter');
    expect(JSON.parse(init!.body as string)).not.toHaveProperty('email');
    expect(JSON.parse(init!.body as string)).not.toHaveProperty('company');
    await user.click(screen.getByRole('button', { name: 'Отправить ещё одну' }));
    expect(screen.getByLabelText('Имя *')).toHaveValue('');
    expect(screen.getByLabelText('Телефон *')).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('accepts an empty optional comment and never renders company or email inputs', async () => {
    fetchMock.mockResolvedValueOnce(acceptedResponse());
    const user = mountForm();
    expect(screen.queryByLabelText(/email|компания/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добавить комментарий' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Получить прайс-лист' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Заявка принята');
    const payload = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    expect(payload.message).toBe('');
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('company');
  });

  it('retains data and request identity when retrying a failed network request', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(acceptedResponse());
    const user = mountForm();
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Получить прайс-лист' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось связаться с сервером');
    expect(screen.queryByText('Заявка принята')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Имя *')).toHaveValue('Анна');
    expect(screen.getByLabelText('Имя *')).toBeDisabled();
    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(
      screen.getByText('При повторе отправим те же данные, чтобы не создать вторую заявку.'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Повторить отправку' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Заявка принята');
    const first = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    const retry = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);
    expect(retry.clientRequestId).toBe(first.clientRequestId);
    expect(retry).toEqual(first);
  });

  it('allows correction and a fresh request after a definite server rejection', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('{}', { status: 400 }))
      .mockResolvedValueOnce(acceptedResponse());
    const user = mountForm();
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Получить прайс-лист' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось принять данные');
    expect(screen.getByLabelText('Имя *')).toBeEnabled();
    await user.clear(screen.getByLabelText('Имя *'));
    await user.type(screen.getByLabelText('Имя *'), 'Мария');
    await user.click(screen.getByRole('button', { name: 'Повторить отправку' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Заявка принята');
    const first = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    const corrected = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);
    expect(corrected.name).toBe('Мария');
    expect(corrected.clientRequestId).not.toBe(first.clientRequestId);
  });
  it('never shows success without a valid server acceptance', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ accepted: false }), { status: 200 }),
    );
    const user = mountForm();
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Получить прайс-лист' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Не получили подтверждение');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Телефон *')).toHaveValue('+7 (999) 123-45-67');
  });

  it('prevents concurrent requests while a submission is pending', async () => {
    let resolveRequest: (value: Response) => void = () => undefined;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const user = mountForm();
    await fillRequired(user);
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Отправляем…' })).toBeDisabled();
    resolveRequest(acceptedResponse());
    expect(await screen.findByRole('status')).toHaveTextContent('Заявка принята');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
