import { describe, expect, it, vi } from 'vitest';
import {
  AUTOMATIC_LEAD_PROMPT_STORAGE_KEY,
  AUTOMATIC_LEAD_PROMPT_DELAY_MS,
  createAutomaticLeadPromptSession,
} from './automaticLeadPromptSession';

describe('automatic lead prompt session', () => {
  it('lets only the first contender claim a shared browser tab session', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    };
    const timer = createAutomaticLeadPromptSession(() => storage);
    const scroll = createAutomaticLeadPromptSession(() => storage);
    expect(timer.consume()).toBe(true);
    expect(scroll.consume()).toBe(false);
    expect(scroll.isConsumed()).toBe(true);
    expect(values.has(AUTOMATIC_LEAD_PROMPT_STORAGE_KEY)).toBe(true);
  });

  it('tolerates corrupt/unsupported stored state and saves a valid record', () => {
    const storage = { getItem: () => '{broken', setItem: vi.fn() };
    const session = createAutomaticLeadPromptSession(() => storage);
    expect(session.getElapsedMs()).toBe(0);
    expect(session.consume()).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      AUTOMATIC_LEAD_PROMPT_STORAGE_KEY,
      JSON.stringify({ consumed: true, elapsedMs: 0 }),
    );
  });

  it('keeps elapsed time bounded and monotonically increasing despite storage failures', () => {
    const session = createAutomaticLeadPromptSession(() => {
      throw new Error('Storage is unavailable');
    });
    session.addElapsedMs(40_000);
    session.addElapsedMs(-10_000);
    session.addElapsedMs(Infinity);
    expect(session.getElapsedMs()).toBe(40_000);
    session.addElapsedMs(40_000);
    expect(session.getElapsedMs()).toBe(AUTOMATIC_LEAD_PROMPT_DELAY_MS);
    expect(session.consume()).toBe(true);
    expect(session.consume()).toBe(false);
  });

  it('never re-enables automatic prompts when storage is removed mid-visit', () => {
    const storage = { getItem: () => null, setItem: () => undefined };
    const session = createAutomaticLeadPromptSession(() => storage);
    session.consume();
    expect(session.isConsumed()).toBe(true);
    expect(session.consume()).toBe(false);
  });
});
