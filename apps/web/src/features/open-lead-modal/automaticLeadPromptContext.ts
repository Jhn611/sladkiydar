import { createContext } from 'react';
import type { AutomaticLeadPromptSession } from './automaticLeadPromptSession';

export type AutomaticLeadPromptSource = 'auto-timer' | 'auto-scroll-custom';

export const AutomaticLeadPromptContext = createContext<{
  session: AutomaticLeadPromptSession;
  consumed: boolean;
  tryOpen: (source: AutomaticLeadPromptSource) => boolean;
} | null>(null);

export function isAutomaticLeadPromptBlocked(): boolean {
  if (document.visibilityState === 'hidden') return true;
  if (
    document.querySelector(
      'dialog[open], [role="dialog"][aria-modal="true"]:not([hidden]):not([aria-hidden="true"])',
    )
  ) {
    return true;
  }
  const active = document.activeElement;
  return (
    active instanceof HTMLElement &&
    Boolean(
      active.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
      ),
    )
  );
}
