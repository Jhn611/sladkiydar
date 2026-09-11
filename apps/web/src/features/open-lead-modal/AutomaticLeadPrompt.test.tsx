import { StrictMode, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AutomaticLeadPrompt } from './AutomaticLeadPrompt';
import {
  AUTOMATIC_LEAD_PROMPT_STORAGE_KEY,
  AUTOMATIC_LEAD_PROMPT_DELAY_MS,
  createAutomaticLeadPromptSession,
  type AutomaticLeadPromptSession,
} from './automaticLeadPromptSession';
import { LeadModalProvider } from './LeadModalProvider';
import { useLeadModal } from './useLeadModal';

vi.mock('../lead-form/LeadForm', () => ({
  LeadForm: ({ source }: { source: string }) => {
    const [success, setSuccess] = useState(false);
    return success ? (
      <p role="status">Request accepted</p>
    ) : (
      <form onSubmit={(event) => event.preventDefault()}>
        <output data-testid="source">{source}</output>
        <input aria-label="Draft name" />
        <button onClick={() => setSuccess(true)}>Complete request</button>
      </form>
    );
  },
}));

interface ObserverRecord {
  callback: IntersectionObserverCallback;
  observer: IntersectionObserver;
  target: Element | null;
  disconnected: boolean;
}
let observers: ObserverRecord[] = [];

function intersect() {
  for (const record of observers) {
    if (record.target && !record.disconnected) {
      record.callback(
        [{ target: record.target, isIntersecting: true } as IntersectionObserverEntry],
        record.observer,
      );
    }
  }
}

function advance(milliseconds: number) {
  act(() => vi.advanceTimersByTime(milliseconds));
}

function visibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value });
  fireEvent(document, new Event('visibilitychange'));
}

function Controls() {
  const { openLeadModal } = useLeadModal();
  return (
    <>
      <button onClick={() => openLeadModal('manual-test')}>Manual request</button>
      <button
        onClick={() => {
          document.querySelector<HTMLDialogElement>('#other-dialog')?.close();
          setTimeout(() => openLeadModal('mobile-menu'), 16);
        }}
      >
        Menu request
      </button>
      <textarea aria-label="Other message" />
      <button>Outside control</button>
    </>
  );
}

function mountPrompt({
  session = createAutomaticLeadPromptSession(),
  home = true,
  strict = false,
}: {
  session?: AutomaticLeadPromptSession;
  home?: boolean;
  strict?: boolean;
} = {}) {
  const tree = (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LeadModalProvider promptSession={session}>
        <Controls />
        {home ? (
          <>
            <AutomaticLeadPrompt />
            <section id="custom">Sixth section</section>
          </>
        ) : (
          <p>Legal page</p>
        )}
      </LeadModalProvider>
    </MemoryRouter>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

function closeLead() {
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть окно' }));
}

function showOtherDialog() {
  const dialog = document.createElement('dialog');
  dialog.id = 'other-dialog';
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}

beforeEach(() => {
  sessionStorage.clear();
  observers = [];
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      private record: ObserverRecord;
      constructor(callback: IntersectionObserverCallback) {
        this.record = {
          callback,
          observer: this as unknown as IntersectionObserver,
          target: null,
          disconnected: false,
        };
        observers.push(this.record);
      }
      observe(target: Element) {
        this.record.target = target;
      }
      disconnect() {
        this.record.disconnected = true;
      }
    },
  );
});

afterEach(() => {
  cleanup();
  document.querySelector('#other-dialog')?.remove();
  document.body.style.overflow = '';
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('automatic lead prompt coordination', () => {
  it('opens after 52 visible homepage seconds, then never repeats after closing', () => {
    mountPrompt();
    advance(51_999);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    advance(1);
    expect(screen.getByTestId('source')).toHaveTextContent('auto-timer');
    closeLead();
    advance(120_000);
    act(intersect);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('suppresses the timer when the sixth section was reached five seconds earlier', () => {
    mountPrompt();
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS - 5_000);
    act(intersect);
    expect(screen.getByTestId('source')).toHaveTextContent('auto-scroll-custom');
    closeLead();
    advance(5_000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('suppresses the scroll trigger when the timer fired five seconds earlier', () => {
    mountPrompt();
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS);
    closeLead();
    advance(5_000);
    act(intersect);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('claims simultaneous triggers synchronously and preserves the first source and draft', () => {
    mountPrompt();
    act(() => {
      vi.advanceTimersByTime(AUTOMATIC_LEAD_PROMPT_DELAY_MS);
      intersect();
    });
    expect(screen.getByTestId('source')).toHaveTextContent('auto-timer');
    fireEvent.change(screen.getByLabelText('Draft name'), { target: { value: 'Иван' } });
    act(intersect);
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS);
    expect(screen.getByLabelText('Draft name')).toHaveValue('Иван');
    expect(screen.getByTestId('source')).toHaveTextContent('auto-timer');
  });

  it('a manual opening suppresses both automatic triggers without replacing input', () => {
    mountPrompt();
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS - 5_000);
    fireEvent.click(screen.getByRole('button', { name: 'Manual request' }));
    fireEvent.change(screen.getByLabelText('Draft name'), { target: { value: 'Анна' } });
    advance(5_000);
    act(intersect);
    expect(screen.getByLabelText('Draft name')).toHaveValue('Анна');
    expect(screen.getByTestId('source')).toHaveTextContent('manual-test');
    closeLead();
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS);
    act(intersect);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Manual request' }));
    expect(screen.getByTestId('source')).toHaveTextContent('manual-test');
  });

  it('remembers consumption after provider remount and a new session instance (reload)', () => {
    const first = mountPrompt();
    act(intersect);
    closeLead();
    first.unmount();
    mountPrompt({ session: createAutomaticLeadPromptSession() });
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS);
    act(intersect);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem(AUTOMATIC_LEAD_PROMPT_STORAGE_KEY)!)).toMatchObject({
      consumed: true,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Manual request' }));
    expect(screen.getByTestId('source')).toHaveTextContent('manual-test');
  });

  it('preserves already spent homepage time across navigation/reload', () => {
    const first = mountPrompt();
    advance(40_000);
    first.unmount();
    mountPrompt({ session: createAutomaticLeadPromptSession() });
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS - 40_000 - 1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    advance(1);
    expect(screen.getByTestId('source')).toHaveTextContent('auto-timer');
  });

  it('pauses the timer in a hidden tab', () => {
    mountPrompt();
    advance(30_000);
    visibility('hidden');
    advance(120_000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    visibility('visible');
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS - 30_000 - 1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    advance(1);
    expect(screen.getByTestId('source')).toHaveTextContent('auto-timer');
  });

  it('defers a scroll trigger in a hidden tab until the visitor returns', () => {
    mountPrompt();
    visibility('hidden');
    act(intersect);
    advance(120_000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    visibility('visible');
    advance(1_000);
    expect(screen.getByTestId('source')).toHaveTextContent('auto-scroll-custom');
  });

  it('does not interrupt another dialog and waits for a quiet moment after closing it', () => {
    mountPrompt();
    const other = showOtherDialog();
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS);
    expect(screen.queryByTestId('source')).not.toBeInTheDocument();
    other.close();
    advance(1_000);
    expect(screen.queryByTestId('source')).not.toBeInTheDocument();
    advance(1_000);
    expect(screen.getByTestId('source')).toHaveTextContent('auto-timer');
  });

  it('lets the mobile menu CTA finish its deferred manual opening without source theft', () => {
    mountPrompt();
    showOtherDialog();
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS);
    fireEvent.click(screen.getByRole('button', { name: 'Menu request' }));
    advance(16);
    expect(screen.getByTestId('source')).toHaveTextContent('mobile-menu');
    advance(10_000);
    act(intersect);
    expect(screen.getByTestId('source')).toHaveTextContent('mobile-menu');
  });

  it('waits while the visitor edits another field, then opens after focus leaves it', () => {
    mountPrompt();
    screen.getByRole('textbox', { name: 'Other message' }).focus();
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Outside control' }).focus();
    advance(2_000);
    expect(screen.getByTestId('source')).toHaveTextContent('auto-timer');
  });

  it('gives a recent pointer interaction priority over the automatic timer', () => {
    mountPrompt();
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS - 100);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside control' }));
    advance(100);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    advance(1_000);
    expect(screen.getByTestId('source')).toHaveTextContent('auto-timer');
  });

  it.each([
    ['timer', 'auto-timer'],
    ['scroll', 'auto-scroll-custom'],
  ])('preserves the first pending source (%s) while another dialog is open', (first, source) => {
    mountPrompt();
    const other = showOtherDialog();
    if (first === 'scroll') act(intersect);
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS);
    if (first === 'timer') act(intersect);
    other.close();
    advance(2_000);
    expect(screen.getByTestId('source')).toHaveTextContent(source);
  });

  it('does not run on pages without the homepage trigger component', () => {
    mountPrompt({ home: false });
    advance(120_000);
    act(intersect);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(observers).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Manual request' }));
    expect(screen.getByTestId('source')).toHaveTextContent('manual-test');
  });

  it('keeps successful requests quiet after dismissal', () => {
    mountPrompt();
    act(intersect);
    fireEvent.click(screen.getByRole('button', { name: 'Complete request' }));
    expect(screen.getByRole('status')).toHaveTextContent('Request accepted');
    closeLead();
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS);
    act(intersect);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cleans observers and timers correctly under StrictMode and after consumption', () => {
    const session = createAutomaticLeadPromptSession();
    const consume = vi.spyOn(session, 'consume');
    const view = mountPrompt({ strict: true, session });
    expect(observers.filter((record) => !record.disconnected)).toHaveLength(1);
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS);
    expect(screen.getByTestId('source')).toHaveTextContent('auto-timer');
    expect(observers.every((record) => record.disconnected)).toBe(true);
    view.unmount();
    advance(120_000);
    expect(consume).toHaveBeenCalledTimes(1);
  });

  it('does not restart an already running timer when initial resources finish loading', () => {
    mountPrompt();
    advance(20_000);
    fireEvent(window, new Event('pageshow'));
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS - 20_000 - 1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    advance(1);
    expect(screen.getByTestId('source')).toHaveTextContent('auto-timer');
  });

  it('resumes the active timer after a browser back-forward cache pagehide/pageshow', () => {
    mountPrompt();
    advance(40_000);
    fireEvent(window, new Event('pagehide'));
    advance(120_000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent(window, new Event('pageshow'));
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS - 40_000);
    expect(screen.getByTestId('source')).toHaveTextContent('auto-timer');
  });

  it('retains in-memory suppression when browser storage is unavailable', () => {
    const session = createAutomaticLeadPromptSession(() => {
      throw new DOMException('Storage is disabled', 'SecurityError');
    });
    const view = mountPrompt({ session });
    act(intersect);
    closeLead();
    view.unmount();
    mountPrompt({ session });
    advance(AUTOMATIC_LEAD_PROMPT_DELAY_MS);
    act(intersect);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('falls back to a passive scroll check when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    mountPrompt();
    const target = document.getElementById('custom')!;
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 500,
    } as DOMRect);
    fireEvent.scroll(window);
    expect(screen.getByTestId('source')).toHaveTextContent('auto-scroll-custom');
  });
});
