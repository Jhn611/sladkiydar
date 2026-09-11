import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeadModalContext } from '../../features/open-lead-modal/useLeadModal';
import { CatalogShowcase } from './CatalogShowcase';
import { products } from '../../entities/product/model/products';

function mountShowcase() {
  const openLeadModal = vi.fn();
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LeadModalContext.Provider value={{ openLeadModal, closeLeadModal: vi.fn() }}>
        <CatalogShowcase />
      </LeadModalContext.Provider>
    </MemoryRouter>,
  );
  return { user: userEvent.setup(), openLeadModal };
}

function pointer(target: Element, type: string, values: Partial<PointerEvent> = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    clientX: 300,
    clientY: 40,
    ...values,
  });
  fireEvent(target, event);
  return event;
}

function mockCapture(track: HTMLElement) {
  const pointers = new Set<number>();
  const capture = vi.fn((id: number) => pointers.add(id));
  const release = vi.fn((id: number) => pointers.delete(id));
  Object.assign(track, {
    setPointerCapture: capture,
    hasPointerCapture: (id: number) => pointers.has(id),
    releasePointerCapture: release,
  });
  return { capture, release };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('showcase navigation', () => {
  it('changes composition and inquiry source using next controls and keyboard selection', async () => {
    const { user, openLeadModal } = mountShowcase();
    const gallery = screen.getByRole('region', { name: 'Примеры подарочных наборов' });
    expect(within(gallery).getByRole('button', { name: 'Предыдущий набор' })).toBeDisabled();
    await user.click(within(gallery).getByRole('button', { name: 'Следующий набор' }));
    expect(screen.getByRole('heading', { name: 'Спасибо, команда!' })).toBeVisible();
    expect(screen.getByText('Около 10 изделий в наборе')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Узнать цену этого набора' }));
    expect(openLeadModal).toHaveBeenLastCalledWith('showcase-product:team-thanks');

    const second = screen.getByRole('button', {
      name: 'Посмотреть состав набора «Спасибо, команда!»',
    });
    act(() => second.focus());
    await user.keyboard('{End}');
    expect(
      screen.getByRole('button', { name: 'Посмотреть состав набора «Большой повод»' }),
    ).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'Большой повод' })).toBeVisible();
    expect(within(gallery).getByRole('button', { name: 'Следующий набор' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Узнать цену этого набора' }));
    expect(openLeadModal).toHaveBeenLastCalledWith('showcase-product:big-occasion');
  });

  it('scrolls by a mouse drag without selecting a product on release, then accepts a deliberate click', () => {
    mountShowcase();
    const track = screen.getByRole('list', { name: 'Выберите набор' });
    const { capture, release } = mockCapture(track);
    const second = screen.getByRole('button', {
      name: 'Посмотреть состав набора «Спасибо, команда!»',
    });
    pointer(second, 'pointerdown');
    pointer(track, 'pointermove', { clientX: 296 });
    expect(capture).not.toHaveBeenCalled();
    expect(track.scrollLeft).toBe(0);

    const move = pointer(track, 'pointermove', { clientX: 170 });
    expect(move.defaultPrevented).toBe(true);
    expect(track.scrollLeft).toBe(130);
    expect(capture).toHaveBeenCalledWith(1);
    expect(track).toHaveAttribute('data-dragging', 'true');
    pointer(track, 'pointerup', { clientX: 170 });
    fireEvent.click(second, { detail: 1 });
    expect(screen.getByRole('heading', { name: 'Маленькая радость' })).toBeVisible();
    expect(second).toHaveAttribute('aria-pressed', 'false');
    expect(release).toHaveBeenCalledWith(1);
    expect(track).not.toHaveAttribute('data-dragging');

    pointer(second, 'pointerdown', { clientX: 170 });
    pointer(second, 'pointerup', { clientX: 173 });
    fireEvent.click(second, { detail: 1 });
    expect(screen.getByRole('heading', { name: 'Спасибо, команда!' })).toBeVisible();
  });

  it.each(['pointercancel', 'lostpointercapture'])(
    'recovers from %s and preserves keyboard activation',
    async (eventType) => {
      const { user, openLeadModal } = mountShowcase();
      const track = screen.getByRole('list', { name: 'Выберите набор' });
      mockCapture(track);
      const second = screen.getByRole('button', {
        name: 'Посмотреть состав набора «Спасибо, команда!»',
      });
      pointer(second, 'pointerdown');
      pointer(track, 'pointermove', { clientX: 150 });
      pointer(track, eventType, { clientX: 150 });
      expect(track).not.toHaveAttribute('data-dragging');
      expect(track.style.scrollSnapType).toBe('');
      // Keyboard-generated clicks have detail=0 and must not be suppressed by a prior drag.
      act(() => second.focus());
      await user.keyboard('{Enter}');
      expect(screen.getByRole('heading', { name: 'Спасибо, команда!' })).toBeVisible();
      await user.click(screen.getByRole('button', { name: 'Узнать цену этого набора' }));
      expect(openLeadModal).toHaveBeenLastCalledWith('showcase-product:team-thanks');
    },
  );

  it('leaves touch movement to the browser and disables native image dragging', () => {
    mountShowcase();
    const track = screen.getByRole('list', { name: 'Выберите набор' });
    const { capture } = mockCapture(track);
    const image = within(track).getAllByRole('img')[0]!;
    expect(image).toHaveAttribute('draggable', 'false');
    pointer(image, 'pointerdown', { pointerType: 'touch' });
    const move = pointer(track, 'pointermove', { pointerType: 'touch', clientX: 100 });
    expect(move.defaultPrevented).toBe(false);
    expect(capture).not.toHaveBeenCalled();
    expect(track.scrollLeft).toBe(0);
    expect(track).not.toHaveAttribute('data-dragging');
  });

  it('keeps smooth scrolling and keyboard focus even when the OS reduces motion', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true }) as MediaQueryList),
    );
    const { user } = mountShowcase();
    const track = screen.getByRole('list', { name: 'Выберите набор' });
    const scrollTo = vi.fn();
    Object.assign(track, { scrollTo });
    act(() =>
      screen.getByRole('button', { name: 'Посмотреть состав набора «Маленькая радость»' }).focus(),
    );
    await user.keyboard('{ArrowRight}');
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'smooth' }));
    expect(
      screen.getByRole('button', { name: 'Посмотреть состав набора «Спасибо, команда!»' }),
    ).toHaveFocus();
  });
});

it('automatically changes the selected composition and loops without vertical scrolling', () => {
  vi.useFakeTimers();
  mountShowcase();
  const track = screen.getByRole('list', { name: 'Выберите набор' });
  const scrollTo = vi.fn();
  Object.assign(track, { scrollTo });
  act(() => vi.advanceTimersByTime(7_000));
  expect(screen.getByRole('heading', { name: 'Спасибо, команда!' })).toBeVisible();
  expect(screen.getByText('Около 10 изделий в наборе')).toBeVisible();
  expect(document.getElementById('showcase-details')).toHaveAttribute('aria-live', 'off');
  expect(scrollTo).toHaveBeenLastCalledWith({ left: -6, behavior: 'smooth' });
  expect(window.scrollY).toBe(0);
  for (let i = 1; i < products.length; i++) act(() => vi.advanceTimersByTime(7_000));
  expect(screen.getByRole('heading', { name: 'Маленькая радость' })).toBeVisible();
});

it('keeps the selected product stable while its price request has focus', () => {
  vi.useFakeTimers();
  mountShowcase();
  const request = screen.getByRole('button', { name: 'Узнать цену этого набора' });
  act(() => request.focus());
  act(() => vi.advanceTimersByTime(21_000));
  expect(screen.getByRole('heading', { name: 'Маленькая радость' })).toBeVisible();
  expect(document.getElementById('showcase-details')).toHaveAttribute('aria-live', 'polite');
  act(() => request.blur());
  act(() => vi.advanceTimersByTime(7_000));
  expect(screen.getByRole('heading', { name: 'Спасибо, команда!' })).toBeVisible();
});
