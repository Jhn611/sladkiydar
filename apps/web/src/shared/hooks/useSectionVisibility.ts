import { useEffect, useRef, useState } from 'react';

/** Decorative loops only run on screen and in an active tab. */
export function useSectionVisibility<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [motionActive, setMotionActive] = useState(false);

  useEffect(() => {
    const section = ref.current;
    if (!section || !('IntersectionObserver' in window)) return;

    let visible = false;
    const sync = () => setMotionActive(visible && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        sync();
      },
      { threshold: 0 },
    );

    observer.observe(section);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return { ref, motionActive };
}
