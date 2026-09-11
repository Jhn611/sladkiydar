import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCarouselAutoplay } from './useCarouselAutoplay';

let intersections: ((visible: boolean) => void)[];
let media: MediaQueryList;

type PauseOptions = { pauseOnHover?: boolean; pauseOnFocus?: 'all' | 'keyboard' };

function Harness({ onAdvance, ...options }: PauseOptions & { onAdvance: () => void }) {
  const autoplay = useCarouselAutoplay({ onAdvance, delay: 6_000, ...options });
  return (
    <div
      ref={autoplay.ref}
      {...autoplay.interactionProps}
      data-testid="carousel"
      data-playing={autoplay.isPlaying}
    >
      <button
        onClick={() => {
          autoplay.reset();
          onAdvance();
        }}
      >
        Ручной шаг
      </button>
      <button onClick={autoplay.toggle}>Пауза</button>
      <input aria-label="Вопрос о составе" />
    </div>
  );
}

function mount(options: PauseOptions = {}) {
  const advance = vi.fn();
  const rendered = render(
    <StrictMode>
      <Harness onAdvance={advance} {...options} />
    </StrictMode>,
  );
  act(() => intersections.forEach((notify) => notify(true)));
  return { ...rendered, advance, carousel: screen.getByTestId('carousel') };
}

function tick(ms = 6_000) {
  act(() => vi.advanceTimersByTime(ms));
}

function pointer(target: Element | Window, type: string, values: Partial<PointerEvent> = {}) {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, { pointerType: 'mouse', pointerId: 1, ...values });
  fireEvent(target, event);
}

beforeEach(() => {
  vi.useFakeTimers();
  intersections = [];
  media = Object.assign(new EventTarget(), {
    matches: false,
    media: '(prefers-reduced-motion: reduce)',
  }) as MediaQueryList;
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersections.push((visible) =>
          callback(
            [
              { isIntersecting: visible, intersectionRatio: visible ? 1 : 0 },
            ] as IntersectionObserverEntry[],
            this as unknown as IntersectionObserver,
          ),
        );
      }
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, 'visibilityState');
});

describe('carousel autoplay', () => {
  it('advances once per interval under StrictMode and clears the timer on unmount', () => {
    const { advance, unmount } = mount();
    tick(5_999);
    expect(advance).not.toHaveBeenCalled();
    tick(1);
    expect(advance).toHaveBeenCalledTimes(1);
    tick();
    expect(advance).toHaveBeenCalledTimes(2);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('gives a full interval after manual selection and after scrolling', () => {
    const { advance, carousel } = mount();
    tick(5_000);
    fireEvent.click(screen.getByText('Ручной шаг'));
    expect(advance).toHaveBeenCalledTimes(1);
    tick(5_999);
    expect(advance).toHaveBeenCalledTimes(1);
    fireEvent.scroll(carousel);
    tick(5_999);
    expect(advance).toHaveBeenCalledTimes(1);
    tick(1);
    expect(advance).toHaveBeenCalledTimes(2);
  });

  it('pauses on hover and while focus moves between controls or product details', () => {
    const { advance, carousel } = mount();
    pointer(carousel, 'pointerover');
    tick(12_000);
    expect(advance).not.toHaveBeenCalled();
    pointer(carousel, 'pointerout');
    fireEvent.focus(screen.getByText('Ручной шаг'));
    fireEvent.blur(screen.getByText('Ручной шаг'), {
      relatedTarget: screen.getByLabelText('Вопрос о составе'),
    });
    fireEvent.focus(screen.getByLabelText('Вопрос о составе'));
    tick(12_000);
    expect(advance).not.toHaveBeenCalled();
    fireEvent.blur(screen.getByLabelText('Вопрос о составе'), { relatedTarget: document.body });
    tick(5_999);
    expect(advance).not.toHaveBeenCalled();
    tick(1);
    expect(advance).toHaveBeenCalledOnce();
  });

  it.each(['mouse', 'touch'])(
    'pauses during a %s gesture even if it ends outside the carousel',
    (pointerType) => {
      const { advance, carousel } = mount();
      pointer(carousel, 'pointerdown', { pointerType });
      tick(12_000);
      expect(advance).not.toHaveBeenCalled();
      pointer(window, 'pointerup', { pointerType });
      tick();
      expect(advance).toHaveBeenCalledOnce();
    },
  );

  it('starts a fresh interval after returning onscreen or from a hidden tab', () => {
    const { advance } = mount();
    tick(5_000);
    act(() => intersections.forEach((notify) => notify(false)));
    tick(12_000);
    expect(advance).not.toHaveBeenCalled();
    act(() => intersections.forEach((notify) => notify(true)));
    tick(5_999);
    expect(advance).not.toHaveBeenCalled();
    tick(1);
    expect(advance).toHaveBeenCalledOnce();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    fireEvent(document, new Event('visibilitychange'));
    tick(12_000);
    expect(advance).toHaveBeenCalledOnce();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    fireEvent(document, new Event('visibilitychange'));
    tick();
    expect(advance).toHaveBeenCalledTimes(2);
  });

  it('pauses for an open dialog and waits a complete interval after it closes', async () => {
    const { advance } = mount();
    tick(5_000);
    const dialog = document.createElement('dialog');
    await act(async () => {
      document.body.append(dialog);
      dialog.setAttribute('open', '');
    });
    tick(12_000);
    expect(advance).not.toHaveBeenCalled();
    await act(async () => dialog.remove());
    tick(5_999);
    expect(advance).not.toHaveBeenCalled();
    tick(1);
    expect(advance).toHaveBeenCalledOnce();
  });

  it('ignores system reduced motion while preserving explicit pause and manual navigation', () => {
    Object.defineProperty(media, 'matches', { configurable: true, value: true });
    const { advance } = mount();
    tick();
    expect(advance).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByText('Пауза'));
    tick(12_000);
    expect(advance).toHaveBeenCalledOnce();
    Object.defineProperty(media, 'matches', { configurable: true, value: false });
    act(() => media.dispatchEvent(new Event('change')));
    tick(12_000);
    expect(advance).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByText('Пауза'));
    tick();
    expect(advance).toHaveBeenCalledTimes(2);
    Object.defineProperty(media, 'matches', { configurable: true, value: true });
    act(() => media.dispatchEvent(new Event('change')));
    tick();
    expect(advance).toHaveBeenCalledTimes(3);
    fireEvent.click(screen.getByText('Ручной шаг'));
    expect(advance).toHaveBeenCalledTimes(4);
  });
});

const heroOptions: PauseOptions = { pauseOnHover: false, pauseOnFocus: 'keyboard' };

function pointerClick(button: HTMLElement) {
  pointer(button, 'pointerdown');
  act(() => button.focus());
  pointer(button, 'pointerup');
  fireEvent.click(button, { detail: 1 });
}

describe('hero carousel interaction policy', () => {
  it('keeps its interval when the mouse enters, rests on, or leaves the photo', () => {
    const { advance, carousel } = mount(heroOptions);
    tick(5_000);
    pointer(carousel, 'pointerover');
    tick(1_000);
    expect(advance).toHaveBeenCalledOnce();
    tick(5_000);
    pointer(carousel, 'pointerout');
    tick(1_000);
    expect(advance).toHaveBeenCalledTimes(2);
  });

  it('restarts after a mouse selection while its button remains focused', () => {
    const { advance } = mount(heroOptions);
    const next = screen.getByText('Ручной шаг');
    tick(5_000);
    pointerClick(next);
    expect(next).toHaveFocus();
    expect(advance).toHaveBeenCalledOnce();
    tick(5_999);
    expect(advance).toHaveBeenCalledOnce();
    tick(1);
    expect(advance).toHaveBeenCalledTimes(2);
    expect(next).toHaveFocus();
  });

  it('resumes after clicking pause then play without requiring blur or pointer leave', () => {
    const { advance, carousel } = mount(heroOptions);
    const toggle = screen.getByText('Пауза');
    pointer(carousel, 'pointerover');
    pointerClick(toggle);
    tick(12_000);
    expect(advance).not.toHaveBeenCalled();
    pointerClick(toggle);
    expect(toggle).toHaveFocus();
    tick(5_999);
    expect(advance).not.toHaveBeenCalled();
    tick(1);
    expect(advance).toHaveBeenCalledOnce();
  });

  it('pauses when keyboard navigation begins on a previously mouse-focused control', () => {
    const { advance } = mount(heroOptions);
    const next = screen.getByText('Ручной шаг');
    pointerClick(next);
    expect(advance).toHaveBeenCalledOnce();
    fireEvent.keyDown(next, { key: 'ArrowRight' });
    tick(12_000);
    expect(advance).toHaveBeenCalledOnce();
    act(() => next.blur());
    tick();
    expect(advance).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: 'Tab' });
    act(() => next.focus());
    tick(12_000);
    expect(advance).toHaveBeenCalledTimes(2);
    pointerClick(next);
    expect(advance).toHaveBeenCalledTimes(3);
    tick();
    expect(advance).toHaveBeenCalledTimes(4);
  });

  it('still pauses offscreen, in a hidden tab, and while a dialog is open', async () => {
    const { advance } = mount(heroOptions);
    act(() => intersections.forEach((notify) => notify(false)));
    tick(12_000);
    expect(advance).not.toHaveBeenCalled();
    act(() => intersections.forEach((notify) => notify(true)));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    fireEvent(document, new Event('visibilitychange'));
    tick(12_000);
    expect(advance).not.toHaveBeenCalled();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    fireEvent(document, new Event('visibilitychange'));
    const dialog = document.createElement('dialog');
    await act(async () => {
      document.body.append(dialog);
      dialog.setAttribute('open', '');
    });
    tick(12_000);
    expect(advance).not.toHaveBeenCalled();
    await act(async () => dialog.remove());
    tick(5_999);
    expect(advance).not.toHaveBeenCalled();
    tick(1);
    expect(advance).toHaveBeenCalledOnce();
  });
});
