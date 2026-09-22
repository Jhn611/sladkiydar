import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeadModalProvider } from '../../features/open-lead-modal/LeadModalProvider';
import CatalogPage from './CatalogPage';

function mountCatalog(entry = '/catalog') {
  render(
    <HelmetProvider>
      <MemoryRouter
        initialEntries={[entry]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <LeadModalProvider>
          <CatalogPage />
        </LeadModalProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
  return userEvent.setup();
}

afterEach(() => vi.unstubAllGlobals());

describe('catalog selection', () => {
  it('combines audience and occasion filters and offers a reset for an empty result', async () => {
    const user = mountCatalog();
    expect(screen.getAllByRole('article')).toHaveLength(4);
    await user.click(screen.getByRole('button', { name: 'Детским садам и школам' }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
    await user.selectOptions(screen.getByLabelText('Повод'), 'Новый год');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Новогоднее чудо' })).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Повод'), 'Корпоратив');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Спасибо, команда!' })).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Повод'), 'Для перепродажи');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Для вашего повода — особый набор' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Показать все наборы' }));
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });

  it('opens a filtered selection from hero links', () => {
    mountCatalog(
      '/catalog?audience=' +
        encodeURIComponent('Родителям') +
        '&occasion=' +
        encodeURIComponent('Новый год'),
    );
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Новогоднее чудо' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Родителям' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('attributes a price request to the selected product with only the current contact fields', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ accepted: true, id: '9452214d-daca-489f-8ce5-2804798d0efa' }),
          { status: 201 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    const user = mountCatalog();
    await user.click(
      screen.getByRole('button', { name: 'Запросить прайс на набор «Сладкое спасибо»' }),
    );
    const dialog = within(
      screen.getByRole('dialog', { name: 'Пришлём прайс-лист и подберём набор под ваш бюджет' }),
    );
    await user.type(dialog.getByLabelText('Имя *'), 'Анна');
    await user.type(dialog.getByLabelText('Телефон *'), '+7 999 123 45 67');
    await user.click(dialog.getByRole('checkbox'));
    await user.click(dialog.getByRole('button', { name: 'Получить прайс-лист' }));
    expect(await dialog.findByRole('status')).toHaveTextContent('Заявка принята');
    const payload = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    expect(payload.source).toBe('catalog-sweet-thank-you');
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('company');
    expect(payload.message).toBe('');
  });
});
