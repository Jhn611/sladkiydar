import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import { useSectionVisibility } from '../../shared/hooks/useSectionVisibility';
import { useCarouselAutoplay } from '../../shared/lib/useCarouselAutoplay';
import { Container } from '../../shared/ui/Container';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { IconButton } from '../../shared/ui/IconButton';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Hero.module.css';
const audiences = [
  'Компаниям',
  'Детским садам',
  'Родителям',
  'Для перепродажи',
  'Новый год',
  '8 марта',
];
const slides = [
  {
    image: 'hero-team-v5-20260922',
    title: 'Большой повод для радости',
    alt: 'Коллеги в офисе с подарочными наборами Kinder в коробке и в форме сердца',
  },
  {
    image: 'hero-children-v5-20260922',
    title: 'Радость для самых любимых',
    alt: 'Девочка и мальчик с подарочными наборами Kinder',
  },
];
type SwipeGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  threshold: number;
  horizontal: boolean;
  vertical: boolean;
};

export function Hero() {
  const { ref: heroRef, motionActive } = useSectionVisibility<HTMLElement>();
  const [slide, setSlide] = useState(0);
  const [manualSlide, setManualSlide] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const gesture = useRef<SwipeGesture | null>(null);
  const suppressPointerClick = useRef(false);
  const { openLeadModal } = useLeadModal();
  const selected = slides[slide]!;
  const autoplay = useCarouselAutoplay({
    onAdvance: () => {
      setManualSlide(false);
      setSlide((index) => (index + 1) % slides.length);
    },
    delay: 6_000,
    pauseOnHover: false,
    pauseOnFocus: 'keyboard',
  });
  const resetAutoplay = autoplay.reset;
  const change = useCallback(
    (delta: number) => {
      resetAutoplay();
      setManualSlide(true);
      setSlide((index) => (index + delta + slides.length) % slides.length);
    },
    [resetAutoplay],
  );

  const clearGesture = useCallback(() => {
    const current = gesture.current;
    gesture.current = null;
    setIsDragging(false);
    const visual = autoplay.ref.current;
    visual?.style.removeProperty('--hero-drag-x');
    if (current && visual?.hasPointerCapture?.(current.pointerId)) {
      visual.releasePointerCapture(current.pointerId);
    }
  }, [autoplay.ref]);

  const finishGesture = useCallback(
    (event: { pointerId: number; clientX: number }, commit = true) => {
      const current = gesture.current;
      if (!current || current.pointerId !== event.pointerId) return;
      const delta = event.clientX - current.startX;
      if (commit && current.horizontal && Math.abs(delta) >= current.threshold) {
        change(delta < 0 ? 1 : -1);
      }
      clearGesture();
    },
    [change, clearGesture],
  );

  useEffect(() => {
    const cancel = (event: globalThis.PointerEvent) => finishGesture(event, false);
    const visibility = () => {
      if (document.visibilityState === 'hidden') clearGesture();
    };
    // Complete a mouse release outside the photo even if pointer capture was lost.
    window.addEventListener('pointerup', finishGesture);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', clearGesture);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('pointerup', finishGesture);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', clearGesture);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [clearGesture, finishGesture]);

  function startGesture(event: PointerEvent<HTMLDivElement>) {
    suppressPointerClick.current = false;
    if (!event.isPrimary || event.button !== 0) return;
    // Arrow and pause buttons retain ordinary click and keyboard behaviour.
    if (
      event.target instanceof Element &&
      event.target.closest('button, a, input, textarea, select')
    )
      return;
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      threshold: Math.max(40, Math.min(90, event.currentTarget.clientWidth * 0.1)),
      horizontal: false,
      vertical: false,
    };
  }

  function moveGesture(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId || current.vertical) return;
    if (event.pointerType === 'mouse' && event.buttons !== 1) {
      clearGesture();
      return;
    }
    const deltaX = event.clientX - current.startX;
    const deltaY = event.clientY - current.startY;
    if (!current.horizontal) {
      if (Math.abs(deltaY) >= 8 && Math.abs(deltaY) >= Math.abs(deltaX)) {
        current.vertical = true;
        return;
      }
      if (Math.abs(deltaX) < 8 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
      current.horizontal = true;
      suppressPointerClick.current = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setIsDragging(true);
    }
    event.preventDefault();
    event.currentTarget.style.setProperty(
      '--hero-drag-x',
      `${Math.max(-64, Math.min(64, deltaX * 0.3))}px`,
    );
  }

  function preventDraggedClick(event: MouseEvent<HTMLDivElement>) {
    if (suppressPointerClick.current && event.detail !== 0) {
      suppressPointerClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    }
  }
  return (
    <section ref={heroRef} className={s.hero} data-motion-active={motionActive}>
      <Container>
        <div className={s.grid}>
          <div className={s.copy}>
            <span className={s.eyebrow}>
              <Icon name="gift" size={17} /> Подарки, которым рады. Опт, который подходит.
            </span>
            <h1>
              Соберём для вас наборы
              <br />
              из настоящего <span>Kinder</span>
              <span className={s.subtitleLine}>
                от небольшой партии
                <br />
                до крупного опта
              </span>
            </h1>
            <p className={s.description}>
              Готовые наборы под любой повод — или соберём индивидуальный набор под ваш бюджет.
            </p>
            <div className={s.social}>
              <strong>
                100 000<span>+</span>
              </strong>
              <span>
                наборов уже нашли
                <br />
                своих получателей
              </span>
              <Icon name="heart" size={22} />
            </div>
            <div className={s.tags} aria-label="Выберите аудиторию или повод">
              {audiences.map((a) => (
                <button key={a} onClick={() => openLeadModal('hero:' + a)}>
                  {a}
                  <Icon name="arrow-up-right" size={12} />
                </button>
              ))}
            </div>
            <div className={s.cta}>
              <Button onClick={() => openLeadModal('hero-price')}>
                Получить прайс-лист <Icon name="arrow-up-right" size={20} />
              </Button>
              <span>
                Фото, цены и помощь
                <br />в выборе — бесплатно
              </span>
            </div>
          </div>
          <div
            ref={autoplay.ref}
            {...autoplay.interactionProps}
            className={s.visual}
            data-playing={autoplay.isPlaying}
            data-dragging={isDragging || undefined}
            onPointerDown={startGesture}
            onPointerMove={moveGesture}
            onPointerUp={(event) => finishGesture(event)}
            onPointerCancel={(event) => finishGesture(event, false)}
            onLostPointerCapture={(event) => {
              // Touch initially captures on the image. Its bubbling loss while capture
              // transfers to the carousel is not a cancellation of the carousel gesture.
              if (event.target === event.currentTarget) finishGesture(event, false);
            }}
            onClickCapture={preventDraggedClick}
            onDragStart={(event) => event.preventDefault()}
            role="region"
            aria-roledescription="карусель"
            aria-label="Готовые подарочные наборы"
          >
            <img
              key={selected.image}
              sizes="(max-width: 500px) calc(100vw - 40px), (max-width: 950px) 92vw, (max-width: 1435px) 44vw, 634px"
              srcSet={
                '/images/' +
                selected.image +
                '-768.webp 768w, /images/' +
                selected.image +
                '.webp 1440w'
              }
              src={'/images/' + selected.image + '.webp'}
              alt={selected.alt}
              width="1440"
              height="1080"
              draggable={false}
              fetchPriority={slide === 0 ? 'high' : 'auto'}
            />
            <div className={s.photoAccents} aria-hidden="true">
              <span className={s.floatingHeart}>
                <Icon name="heart" size={34} />
              </span>
              <Icon name="sparkles" size={24} className={s.floatingSparkle} />
            </div>
            <IconButton
              className={s.autoplay}
              name={autoplay.enabled ? 'pause' : 'play'}
              label={autoplay.enabled ? 'Приостановить смену фото' : 'Включить смену фото'}
              onClick={autoplay.toggle}
            />
            <div className={s.slideCaption}>
              <span aria-live={manualSlide ? 'polite' : 'off'}>
                <small>
                  Идея оформления · {slide + 1} / {slides.length}
                </small>
                <strong>{selected.title}</strong>
              </span>
              <div className={s.controls}>
                <IconButton name="arrow-left" label="Предыдущий набор" onClick={() => change(-1)} />
                <IconButton name="arrow-right" label="Следующий набор" onClick={() => change(1)} />
              </div>
            </div>
          </div>
        </div>
        <div className={s.steps}>
          {[
            { icon: 'gift', text: 'Бесплатно пришлём фото и прайс всех готовых наборов' },
            { icon: 'sparkles', text: 'Соберём набор под ваш бюджет и повод' },
            { icon: 'truck', text: 'Доставим оптовую партию в любой регион РФ' },
          ].map((item, i) => (
            <div key={item.text}>
              <span className={s.stepIcon}>
                <Icon name={item.icon as 'gift' | 'sparkles' | 'truck'} size={24} />
              </span>
              <p>{item.text}</p>
              <span className={s.stepNumber}>0{i + 1}</span>
            </div>
          ))}
        </div>
      </Container>
      <svg className={s.wave} viewBox="0 0 1440 52" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 22C100-20 150 62 260 30S430 6 550 30 750 0 870 24 1050 50 1170 24 1370 10 1440 25V52H0Z"
          fill="currentColor"
        />
      </svg>
    </section>
  );
}
