import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
} from 'react';

/** One timer per carousel, always restarted after a pause or deliberate interaction. */
export function useCarouselAutoplay({
  onAdvance,
  delay,
  pauseOnHover = true,
  pauseOnFocus = 'all',
}: {
  onAdvance: () => void;
  delay: number;
  pauseOnHover?: boolean;
  pauseOnFocus?: 'all' | 'keyboard';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pointerActive = useRef(false);
  const keyboardInput = useRef(true);
  const advance = useRef(onAdvance);
  advance.current = onAdvance;
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pointerDown, setPointerDown] = useState(false);
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');
  const [dialogOpen, setDialogOpen] = useState(() => !!document.querySelector('dialog[open]'));

  const observedDialogOpen = useRef(dialogOpen);
  const [revision, setRevision] = useState(0);
  const reset = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const updateVisibility = () => setVisible(document.visibilityState !== 'hidden');
    const releasePointer = () => {
      if (!pointerActive.current) return;
      pointerActive.current = false;
      setPointerDown(false);
      reset();
    };
    const leaveWindow = () => {
      setHovered(false);
      releasePointer();
    };
    document.addEventListener('visibilitychange', updateVisibility);
    window.addEventListener('pointerup', releasePointer);
    window.addEventListener('pointercancel', releasePointer);
    window.addEventListener('blur', leaveWindow);

    const observer = new MutationObserver(() => {
      const next = !!document.querySelector('dialog[open]');
      if (next === observedDialogOpen.current) return;
      observedDialogOpen.current = next;
      setDialogOpen(next);
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['open'],
      childList: true,
      subtree: true,
    });
    const node = ref.current;
    const intersection =
      typeof IntersectionObserver === 'undefined'
        ? undefined
        : new IntersectionObserver(
            ([entry]) => {
              if (entry) setInView(entry.isIntersecting && entry.intersectionRatio >= 0.2);
            },
            { threshold: [0, 0.2] },
          );
    if (node) intersection?.observe(node);
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      window.removeEventListener('pointerup', releasePointer);
      window.removeEventListener('pointercancel', releasePointer);
      window.removeEventListener('blur', leaveWindow);
      observer.disconnect();
      intersection?.disconnect();
    };
  }, [reset]);

  useEffect(() => {
    if (pauseOnFocus !== 'keyboard') return;
    const pointerInput = () => {
      keyboardInput.current = false;
      setFocused(false);
    };
    const keyInput = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        ['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)
      )
        return;
      keyboardInput.current = true;
      if (ref.current?.contains(document.activeElement)) setFocused(true);
    };
    // Focus alone does not reveal intent: mouse clicks also keep a button focused.
    document.addEventListener('pointerdown', pointerInput, true);
    document.addEventListener('keydown', keyInput, true);
    return () => {
      document.removeEventListener('pointerdown', pointerInput, true);
      document.removeEventListener('keydown', keyInput, true);
    };
  }, [pauseOnFocus]);

  const enabled = !userPaused;
  const isPlaying =
    enabled &&
    visible &&
    inView &&
    !dialogOpen &&
    (!pauseOnHover || !hovered) &&
    !focused &&
    !pointerDown;
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => {
      // A modal or hidden tab must also win a race with an already queued timer.
      if (document.visibilityState === 'hidden' || document.querySelector('dialog[open]')) return;
      advance.current();
      reset();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [delay, isPlaying, reset, revision]);

  function pointerEnter(event: PointerEvent<HTMLDivElement>) {
    if (pauseOnHover && (event.pointerType === 'mouse' || event.pointerType === 'pen'))
      setHovered(true);
  }
  function blur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocused(false);
      reset();
    }
  }

  return {
    ref,
    enabled,
    isPlaying,
    reset,
    toggle: () => {
      setUserPaused((value) => !value);
      reset();
    },
    interactionProps: {
      onPointerEnter: pointerEnter,
      onPointerLeave: () => {
        if (pauseOnHover) {
          setHovered(false);
          reset();
        }
      },
      onPointerDownCapture: () => {
        pointerActive.current = true;
        setPointerDown(true);
      },
      onFocusCapture: () => setFocused(pauseOnFocus === 'all' || keyboardInput.current),
      onBlurCapture: blur,
      onScrollCapture: reset,
      onWheelCapture: reset,
    },
  };
}
