import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeadModalContext } from '../../features/open-lead-modal/useLeadModal';
import { Hero } from './Hero';

function mount() {
  render(
    <LeadModalContext.Provider value={{ openLeadModal: vi.fn(), closeLeadModal: vi.fn() }}>
      <Hero />
    </LeadModalContext.Provider>,
  );
  return screen.getByRole('region', { name: 'Готовые подарочные наборы' });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('hero autoplay', () => {
  it('changes photos every six seconds, wraps, and supports explicit pause', () => {
    vi.useFakeTimers();
    const hero = mount();
    act(() => vi.advanceTimersByTime(6_000));
    expect(within(hero).getByText('Спасибо от всего сердца')).toBeVisible();
    act(() => vi.advanceTimersByTime(6_000));
    expect(within(hero).getByText('Немного новогоднего чуда')).toBeVisible();
    act(() => vi.advanceTimersByTime(6_000));
    expect(within(hero).getByText('Большой повод для радости')).toBeVisible();
    fireEvent.click(within(hero).getByRole('button', { name: 'Приостановить смену фото' }));
    act(() => vi.advanceTimersByTime(18_000));
    expect(within(hero).getByText('Большой повод для радости')).toBeVisible();
    expect(within(hero).getByRole('button', { name: 'Включить смену фото' })).toBeVisible();
    fireEvent.click(within(hero).getByRole('button', { name: 'Следующий набор' }));
    expect(within(hero).getByText('Спасибо от всего сердца')).toBeVisible();
  });

  it('keeps autoplay enabled with a system reduced-motion preference and supports manual pause', () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    const hero = mount();
    act(() => vi.advanceTimersByTime(6_000));
    expect(within(hero).getByText('Спасибо от всего сердца')).toBeVisible();
    fireEvent.click(within(hero).getByRole('button', { name: 'Приостановить смену фото' }));
    act(() => vi.advanceTimersByTime(18_000));
    expect(within(hero).getByText('Спасибо от всего сердца')).toBeVisible();
    fireEvent.click(within(hero).getByRole('button', { name: 'Следующий набор' }));
    expect(within(hero).getByText('Немного новогоднего чуда')).toBeVisible();
  });
});

function pointer(target: Element | Window, type: string, values: Partial<PointerEvent> = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    clientX: 300,
    clientY: 100,
    ...values,
  });
  fireEvent(target, event);
  return event;
}

function mockCapture(hero: HTMLElement) {
  const captured = new Set<number>();
  const capture = vi.fn((id: number) => captured.add(id));
  const release = vi.fn((id: number) => captured.delete(id));
  Object.assign(hero, {
    setPointerCapture: capture,
    hasPointerCapture: (id: number) => captured.has(id),
    releasePointerCapture: release,
  });
  return { capture, release };
}

describe('hero photo gestures', () => {
  it.each(['mouse', 'touch'])(
    'swipes the photo in both directions with %s and changes once per gesture',
    (pointerType) => {
      const hero = mount();
      const { capture, release } = mockCapture(hero);
      const photo = within(hero).getByRole('img');
      expect(photo).toHaveAttribute('draggable', 'false');
      pointer(photo, 'pointerdown', { pointerType });
      pointer(hero, 'pointermove', { pointerType, clientX: 296 });
      expect(capture).not.toHaveBeenCalled();
      const move = pointer(hero, 'pointermove', { pointerType, clientX: 170 });
      expect(move.defaultPrevented).toBe(true);
      expect(hero).toHaveAttribute('data-dragging', 'true');
      expect(hero.style.getPropertyValue('--hero-drag-x')).toBe('-39px');
      pointer(hero, 'pointerup', { pointerType, clientX: 170 });
      expect(within(hero).getByText('Спасибо от всего сердца')).toBeVisible();
      expect(release).toHaveBeenCalledOnce();
      expect(hero).not.toHaveAttribute('data-dragging');
      expect(hero.style.getPropertyValue('--hero-drag-x')).toBe('');

      pointer(within(hero).getByRole('img'), 'pointerdown', { pointerType, clientX: 170 });
      pointer(hero, 'pointermove', { pointerType, clientX: 310 });
      pointer(hero, 'pointerup', { pointerType, clientX: 310 });
      expect(within(hero).getByText('Большой повод для радости')).toBeVisible();
    },
  );

  it('leaves vertical touch scrolling to the browser and ignores taps or short drags', () => {
    const hero = mount();
    const { capture } = mockCapture(hero);
    pointer(within(hero).getByRole('img'), 'pointerdown', { pointerType: 'touch' });
    const vertical = pointer(hero, 'pointermove', {
      pointerType: 'touch',
      clientX: 280,
      clientY: 220,
    });
    expect(vertical.defaultPrevented).toBe(false);
    pointer(hero, 'pointermove', { pointerType: 'touch', clientX: 100, clientY: 220 });
    pointer(hero, 'pointerup', { pointerType: 'touch', clientX: 100, clientY: 220 });
    expect(capture).not.toHaveBeenCalled();
    expect(within(hero).getByText('Большой повод для радости')).toBeVisible();
    pointer(within(hero).getByRole('img'), 'pointerdown');
    pointer(hero, 'pointerup');
    pointer(within(hero).getByRole('img'), 'pointerdown');
    pointer(hero, 'pointermove', { clientX: 280 });
    pointer(hero, 'pointerup', { clientX: 280 });
    expect(within(hero).getByText('Большой повод для радости')).toBeVisible();
  });

  it.each(['pointercancel', 'lostpointercapture', 'blur'])(
    'cancels a pending swipe on %s without switching the photo',
    (eventType) => {
      const hero = mount();
      mockCapture(hero);
      pointer(within(hero).getByRole('img'), 'pointerdown');
      pointer(hero, 'pointermove', { clientX: 100 });
      if (eventType === 'blur') fireEvent(window, new Event('blur'));
      else pointer(hero, eventType, { clientX: 100 });
      pointer(window, 'pointerup', { clientX: 100 });
      expect(hero).not.toHaveAttribute('data-dragging');
      expect(hero.style.getPropertyValue('--hero-drag-x')).toBe('');
      expect(within(hero).getByText('Большой повод для радости')).toBeVisible();
    },
  );

  it('finishes a mouse release outside the photo and suppresses its accidental control click', () => {
    const hero = mount();
    pointer(within(hero).getByRole('img'), 'pointerdown');
    pointer(hero, 'pointermove', { clientX: 100 });
    pointer(window, 'pointerup', { clientX: 100 });
    const next = within(hero).getByRole('button', { name: 'Следующий набор' });
    fireEvent.click(next, { detail: 1 });
    expect(within(hero).getByText('Спасибо от всего сердца')).toBeVisible();
    pointer(next, 'pointerdown');
    pointer(hero, 'pointermove', { clientX: 100 });
    pointer(next, 'pointerup', { clientX: 100 });
    expect(hero).not.toHaveAttribute('data-dragging');
    fireEvent.click(next, { detail: 1 });
    expect(within(hero).getByText('Немного новогоднего чуда')).toBeVisible();
  });

  it('pauses autoplay during a touch swipe and starts a new interval after release', () => {
    vi.useFakeTimers();
    const hero = mount();
    pointer(within(hero).getByRole('img'), 'pointerdown', { pointerType: 'touch' });
    pointer(hero, 'pointermove', { pointerType: 'touch', clientX: 100 });
    act(() => vi.advanceTimersByTime(12_000));
    expect(within(hero).getByText('Большой повод для радости')).toBeVisible();
    pointer(hero, 'pointerup', { pointerType: 'touch', clientX: 100 });
    expect(within(hero).getByText('Спасибо от всего сердца')).toBeVisible();
    expect(within(hero).getByText('Спасибо от всего сердца').parentElement).toHaveAttribute(
      'aria-live',
      'polite',
    );
    act(() => vi.advanceTimersByTime(5_999));
    expect(within(hero).getByText('Спасибо от всего сердца')).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(within(hero).getByText('Немного новогоднего чуда')).toBeVisible();
    expect(within(hero).getByText('Немного новогоднего чуда').parentElement).toHaveAttribute(
      'aria-live',
      'off',
    );
  });

  it('allows deliberate swipes and keyboard clicks with reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    const hero = mount();
    pointer(within(hero).getByRole('img'), 'pointerdown', { pointerType: 'touch' });
    pointer(hero, 'pointermove', { pointerType: 'touch', clientX: 100 });
    pointer(hero, 'pointerup', { pointerType: 'touch', clientX: 100 });
    expect(within(hero).getByText('Спасибо от всего сердца')).toBeVisible();
    fireEvent.click(within(hero).getByRole('button', { name: 'Следующий набор' }), { detail: 0 });
    expect(within(hero).getByText('Немного новогоднего чуда')).toBeVisible();
  });
});

it('continues a touch swipe when implicit capture transfers from the image to the carousel', () => {
  const hero = mount();
  const { capture } = mockCapture(hero);
  const photo = within(hero).getByRole('img');
  pointer(photo, 'pointerdown', { pointerType: 'touch' });
  pointer(hero, 'pointermove', { pointerType: 'touch', clientX: 275 });
  expect(capture).toHaveBeenCalledWith(1);
  // Chrome emits this on the previous capture owner before subsequent root moves.
  pointer(photo, 'lostpointercapture', { pointerType: 'touch', clientX: 275 });
  expect(hero).toHaveAttribute('data-dragging', 'true');
  pointer(hero, 'pointermove', { pointerType: 'touch', clientX: 100 });
  pointer(hero, 'pointerup', { pointerType: 'touch', clientX: 100 });
  expect(within(hero).getByText('Спасибо от всего сердца')).toBeVisible();
  expect(hero).not.toHaveAttribute('data-dragging');
});

it('autoplays under a resting mouse and after clicking an arrow that keeps focus', () => {
  vi.useFakeTimers();
  const hero = mount();
  pointer(hero, 'pointerover');
  act(() => vi.advanceTimersByTime(6_000));
  expect(within(hero).getByText('Спасибо от всего сердца')).toBeVisible();
  const next = within(hero).getByRole('button', { name: 'Следующий набор' });
  pointer(next, 'pointerdown');
  act(() => next.focus());
  pointer(next, 'pointerup');
  fireEvent.click(next, { detail: 1 });
  expect(within(hero).getByText('Немного новогоднего чуда')).toBeVisible();
  act(() => vi.advanceTimersByTime(5_999));
  expect(within(hero).getByText('Немного новогоднего чуда')).toBeVisible();
  act(() => vi.advanceTimersByTime(1));
  expect(within(hero).getByText('Большой повод для радости')).toBeVisible();
  expect(next).toHaveFocus();
});

it('resumes after clicking play while keeping keyboard focus pause available', () => {
  vi.useFakeTimers();
  const hero = mount();
  function clickToggle(name: string) {
    const button = within(hero).getByRole('button', { name });
    pointer(button, 'pointerdown');
    act(() => button.focus());
    pointer(button, 'pointerup');
    fireEvent.click(button, { detail: 1 });
    return button;
  }
  clickToggle('Приостановить смену фото');
  act(() => vi.advanceTimersByTime(12_000));
  expect(within(hero).getByText('Большой повод для радости')).toBeVisible();
  const toggle = clickToggle('Включить смену фото');
  act(() => vi.advanceTimersByTime(6_000));
  expect(within(hero).getByText('Спасибо от всего сердца')).toBeVisible();
  expect(toggle).toHaveFocus();
  fireEvent.keyDown(toggle, { key: 'Tab' });
  const next = within(hero).getByRole('button', { name: 'Следующий набор' });
  act(() => next.focus());
  act(() => vi.advanceTimersByTime(12_000));
  expect(within(hero).getByText('Спасибо от всего сердца')).toBeVisible();
  act(() => next.blur());
  act(() => vi.advanceTimersByTime(6_000));
  expect(within(hero).getByText('Немного новогоднего чуда')).toBeVisible();
});
