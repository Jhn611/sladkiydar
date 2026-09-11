import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LeadModalProvider } from './LeadModalProvider';
import { useLeadModal } from './useLeadModal';

function Trigger() {
  const { openLeadModal } = useLeadModal();
  return <button onClick={() => openLeadModal('header-test')}>Подобрать набор</button>;
}

function mountModal() {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LeadModalProvider>
        <Trigger />
      </LeadModalProvider>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

describe('lead modal', () => {
  it('opens an accessible named dialog and closes using its close button', async () => {
    const user = mountModal();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Подобрать набор' });
    await user.click(trigger);
    expect(
      screen.getByRole('dialog', { name: 'Пришлём прайс-лист и подберём набор под ваш бюджет' }),
    ).toBeVisible();
    expect(screen.getByLabelText('Имя *')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Закрыть окно' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('handles the native Escape cancel event and restores scrolling', async () => {
    const user = mountModal();
    await user.click(screen.getByRole('button', { name: 'Подобрать набор' }));
    const dialog = screen.getByRole('dialog');
    expect(document.body.style.overflow).toBe('hidden');
    // Native dialog emits cancel for Escape; jsdom has no browser keyboard default action.
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe('');
  });
});
