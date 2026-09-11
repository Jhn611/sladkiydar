import { useContext, useEffect } from 'react';
import {
  AutomaticLeadPromptContext,
  isAutomaticLeadPromptBlocked,
  type AutomaticLeadPromptSource,
} from './automaticLeadPromptContext';
import { AUTOMATIC_LEAD_PROMPT_DELAY_MS } from './automaticLeadPromptSession';

const RETRY_DELAY_MS = 1_000;

/** Mounted only on the homepage; both triggers claim the same tab-session guard. */
export function AutomaticLeadPrompt() {
  const context = useContext(AutomaticLeadPromptContext);
  if (!context) throw new Error('AutomaticLeadPrompt must be used within LeadModalProvider');
  const { session, consumed, tryOpen } = context;

  useEffect(() => {
    if (consumed || session.isConsumed()) return;
    let activeSince: number | null =
      document.visibilityState === 'hidden' ? null : performance.now();
    let deadline: ReturnType<typeof setTimeout> | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let pendingSource: AutomaticLeadPromptSource | null = null;
    let disposed = false;
    let wasBlocked = false;
    let clearSince: number | null = null;
    let lastInteraction = -Infinity;

    function saveActiveTime() {
      if (activeSince === null) return;
      const now = performance.now();
      session.addElapsedMs(Math.max(0, now - activeSince));
      activeSince = now;
    }

    function attemptPending() {
      retry = undefined;
      if (disposed || !pendingSource || session.isConsumed()) return;
      if (document.visibilityState === 'hidden') return;
      if (isAutomaticLeadPromptBlocked()) {
        wasBlocked = true;
        clearSince = null;
      } else {
        if (wasBlocked) clearSince ??= performance.now();
        const idleFor = Math.min(
          performance.now() - lastInteraction,
          clearSince === null ? Infinity : performance.now() - clearSince,
        );
        if (idleFor >= RETRY_DELAY_MS && tryOpen(pendingSource)) return;
      }
      // Wait until another dialog/menu or an actively edited field is released.
      retry = setTimeout(attemptPending, RETRY_DELAY_MS);
    }

    function markDue(source: AutomaticLeadPromptSource) {
      if (disposed || session.isConsumed()) return;
      pendingSource ??= source;
      clearTimeout(retry);
      attemptPending();
    }

    function scheduleDeadline() {
      clearTimeout(deadline);
      if (activeSince === null || pendingSource || session.isConsumed()) return;
      deadline = setTimeout(
        () => {
          saveActiveTime();
          markDue('auto-timer');
        },
        Math.max(0, AUTOMATIC_LEAD_PROMPT_DELAY_MS - session.getElapsedMs()),
      );
    }

    function handleVisibility() {
      saveActiveTime();
      clearTimeout(deadline);
      clearTimeout(retry);
      activeSince = document.visibilityState === 'hidden' ? null : performance.now();
      if (activeSince === null) return;
      scheduleDeadline();
      // Give the returning visitor a moment before showing an already due prompt.
      if (pendingSource) retry = setTimeout(attemptPending, RETRY_DELAY_MS);
    }

    function handleInteraction() {
      lastInteraction = performance.now();
    }

    function handlePageHide() {
      saveActiveTime();
      activeSince = null;
      clearTimeout(deadline);
      clearTimeout(retry);
    }

    function handlePageShow() {
      // The initial pageshow follows resource loading; only resume a paused clock.
      if (activeSince !== null) return;
      if (document.visibilityState !== 'hidden') {
        activeSince = performance.now();
        scheduleDeadline();
        if (pendingSource) retry = setTimeout(attemptPending, RETRY_DELAY_MS);
      }
    }

    const target = document.getElementById('custom');
    let observer: IntersectionObserver | undefined;
    let scrollFallback: (() => void) | undefined;
    if (target && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) markDue('auto-scroll-custom');
        },
        { rootMargin: '0px 0px -25% 0px', threshold: 0.01 },
      );
      observer.observe(target);
    } else if (target) {
      scrollFallback = () => {
        const rect = target.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.75 && rect.bottom > 0) {
          markDue('auto-scroll-custom');
        }
      };
      window.addEventListener('scroll', scrollFallback, { passive: true });
      scrollFallback();
    }

    scheduleDeadline();
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('pointerdown', handleInteraction, true);
    document.addEventListener('keydown', handleInteraction, true);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      disposed = true;
      saveActiveTime();
      clearTimeout(deadline);
      clearTimeout(retry);
      observer?.disconnect();
      if (scrollFallback) window.removeEventListener('scroll', scrollFallback);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('pointerdown', handleInteraction, true);
      document.removeEventListener('keydown', handleInteraction, true);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [consumed, session, tryOpen]);

  return null;
}
