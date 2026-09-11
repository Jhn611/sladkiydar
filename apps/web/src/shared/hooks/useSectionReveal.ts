import { useEffect, useRef, useState } from 'react';

/** Enhance visible content on first entry; no CSS or JavaScript path hides a section. */
export function useSectionReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const section = ref.current;
    if (!section || !('IntersectionObserver' in window)) return;

    let entered = section.getBoundingClientRect().top < window.innerHeight;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entered || !entries.some((entry) => entry.isIntersecting)) return;
        entered = true;
        if (!section.contains(document.activeElement)) setRevealed(true);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -32px 0px', threshold: 0 },
    );

    const finish = () => {
      entered = true;
      setRevealed(false);
      observer.disconnect();
    };

    if (!entered) observer.observe(section);
    section.addEventListener('focusin', finish);
    return () => {
      observer.disconnect();
      section.removeEventListener('focusin', finish);
    };
  }, []);

  return { ref, revealed };
}
