export const AUTOMATIC_LEAD_PROMPT_STORAGE_KEY = 'sladkiy-dar:lead-prompt:v1';
export const AUTOMATIC_LEAD_PROMPT_DELAY_MS = 52_000;

interface PromptState {
  consumed: boolean;
  elapsedMs: number;
}

type PromptStorage = Pick<Storage, 'getItem' | 'setItem'>;

export interface AutomaticLeadPromptSession {
  isConsumed: () => boolean;
  getElapsedMs: () => number;
  addElapsedMs: (elapsedMs: number) => void;
  consume: () => boolean;
}

/**
 * Storage survives reloads in this tab. The in-memory snapshot keeps suppression
 * working during SPA navigation even when the browser refuses sessionStorage.
 * Only engagement state is stored here; no form values or personal data.
 */
export function createAutomaticLeadPromptSession(
  getStorage: () => PromptStorage = () => window.sessionStorage,
): AutomaticLeadPromptSession {
  let snapshot: PromptState = { consumed: false, elapsedMs: 0 };

  function read() {
    try {
      const serialized = getStorage().getItem(AUTOMATIC_LEAD_PROMPT_STORAGE_KEY);
      if (serialized) {
        const value: unknown = JSON.parse(serialized);
        if (
          value &&
          typeof value === 'object' &&
          'consumed' in value &&
          typeof value.consumed === 'boolean' &&
          'elapsedMs' in value &&
          typeof value.elapsedMs === 'number' &&
          Number.isFinite(value.elapsedMs) &&
          value.elapsedMs >= 0
        ) {
          snapshot = {
            consumed: snapshot.consumed || value.consumed,
            elapsedMs: Math.min(
              AUTOMATIC_LEAD_PROMPT_DELAY_MS,
              Math.max(snapshot.elapsedMs, value.elapsedMs),
            ),
          };
        }
      }
    } catch {
      // Private browsing or a full storage quota must not break the form.
    }
    return snapshot;
  }

  function save() {
    try {
      getStorage().setItem(AUTOMATIC_LEAD_PROMPT_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // The current tab's in-memory snapshot is still authoritative.
    }
  }

  return {
    isConsumed: () => read().consumed,
    getElapsedMs: () => read().elapsedMs,
    addElapsedMs: (elapsedMs) => {
      if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return;
      snapshot = {
        ...read(),
        elapsedMs: Math.min(AUTOMATIC_LEAD_PROMPT_DELAY_MS, snapshot.elapsedMs + elapsedMs),
      };
      save();
    },
    consume: () => {
      if (read().consumed) return false;
      snapshot = { ...snapshot, consumed: true };
      save();
      return true;
    },
  };
}

export const automaticLeadPromptSession = createAutomaticLeadPromptSession();
