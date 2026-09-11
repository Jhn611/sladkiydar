import { useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { getProductCount, products } from '../../entities/product/model/products';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import { Container } from '../../shared/ui/Container';
import { Section } from '../../shared/ui/Section';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { IconButton } from '../../shared/ui/IconButton';
import s from './CatalogShowcase.module.css';

const dragThreshold = 8;
type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  dragging: boolean;
};

export function CatalogShowcase() {
  const { openLeadModal } = useLeadModal();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const track = useRef<HTMLUListElement>(null);
  const selectors = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<DragState | null>(null);
  const suppressPointerClick = useRef(false);
  const selected = products[selectedIndex]!;

  function selectProduct(index: number, focus = false) {
    const next = Math.max(0, Math.min(products.length - 1, index));
    setSelectedIndex(next);
    const button = selectors.current[next];
    const gallery = track.current;
    if (button && gallery) {
      const offset = button.getBoundingClientRect().left - gallery.getBoundingClientRect().left;
      gallery.scrollTo?.({
        left: gallery.scrollLeft + offset - 6,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
      if (focus) button.focus({ preventScroll: true });
    }
  }

  function handleKeys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === 'ArrowRight'
        ? index + 1
        : event.key === 'ArrowLeft'
          ? index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? products.length - 1
              : undefined;
    if (next !== undefined) {
      event.preventDefault();
      selectProduct(next, true);
    }
  }

  function startDrag(event: PointerEvent<HTMLUListElement>) {
    // Touch and pen retain the browser's native horizontal scrolling and vertical page gestures.
    suppressPointerClick.current = false;
    if (event.pointerType !== 'mouse' || event.button !== 0 || !event.isPrimary) return;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: event.currentTarget.scrollLeft,
      dragging: false,
    };
  }

  function finishDrag(event: PointerEvent<HTMLUListElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    drag.current = null;
    setIsDragging(false);
    event.currentTarget.style.removeProperty('scroll-snap-type');
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function moveDrag(event: PointerEvent<HTMLUListElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (event.buttons !== 1) {
      finishDrag(event);
      return;
    }
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (!gesture.dragging) {
      if (Math.abs(deltaX) < dragThreshold || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      gesture.dragging = true;
      suppressPointerClick.current = true;
      // Capture only after intent is clear so a normal button click keeps its original target.
      event.currentTarget.setPointerCapture?.(event.pointerId);
      event.currentTarget.style.scrollSnapType = 'none';
      setIsDragging(true);
    }
    event.preventDefault();
    event.currentTarget.scrollLeft = gesture.startScrollLeft - deltaX;
  }

  function preventDraggedClick(event: MouseEvent<HTMLUListElement>) {
    // detail=0 is keyboard/assistive activation and must remain available after a drag.
    if (suppressPointerClick.current && event.detail !== 0) {
      suppressPointerClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    }
  }

  return (
    <Section id="catalog" className={s.section} aria-labelledby="showcase-title">
      <Container>
        <div className={s.intro}>
          <div>
            <span className="eyebrow">Сначала посмотрите. Потом выбирайте.</span>
            <h2 id="showcase-title">
              Посмотрите, что мы уже собираем — <span>примеры наших наборов</span>
            </h2>
            <p>Листайте галерею и нажимайте на набор, чтобы увидеть его состав подробнее.</p>
          </div>
          <Link className="text-link" to="/catalog">
            Весь каталог <Icon name="arrow-up-right" size={19} />
          </Link>
        </div>
        <div
          role="region"
          aria-roledescription="карусель"
          aria-label="Примеры подарочных наборов"
          className={s.gallery}
        >
          <div className={s.controls}>
            <span className={s.dragHint}>Потяните в сторону или выберите набор</span>
            <div className={s.arrows}>
              <span aria-live="polite" aria-atomic="true">
                {selectedIndex + 1} / {products.length}
              </span>
              <IconButton
                label="Предыдущий набор"
                name="arrow-left"
                disabled={selectedIndex === 0}
                onClick={() => selectProduct(selectedIndex - 1)}
              />
              <IconButton
                label="Следующий набор"
                name="arrow-right"
                disabled={selectedIndex === products.length - 1}
                onClick={() => selectProduct(selectedIndex + 1)}
              />
            </div>
          </div>
          <ul
            ref={track}
            className={s.track}
            aria-label="Выберите набор"
            data-dragging={isDragging || undefined}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onLostPointerCapture={finishDrag}
            onPointerLeave={(event) => {
              if (!drag.current?.dragging) finishDrag(event);
            }}
            onClickCapture={preventDraggedClick}
            onDragStart={(event) => event.preventDefault()}
          >
            {products.map((product, index) => (
              <li key={product.id}>
                <button
                  ref={(element) => {
                    selectors.current[index] = element;
                  }}
                  type="button"
                  className={`${s.product} ${selectedIndex === index ? s.selected : ''}`}
                  aria-label={`Посмотреть состав набора «${product.name}»`}
                  aria-pressed={selectedIndex === index}
                  aria-controls="showcase-details"
                  onClick={() => selectProduct(index)}
                  onKeyDown={(event) => handleKeys(event, index)}
                >
                  <span className={s.image}>
                    <img
                      src={product.image}
                      srcSet={`${product.image.replace('.webp', '-768.webp')} 768w, ${product.image} 1536w`}
                      sizes="(max-width: 600px) 80vw, (max-width: 1000px) 48vw, 32vw"
                      alt={product.imageAlt}
                      width={1536}
                      height={1024}
                      loading="lazy"
                      draggable={false}
                    />
                    <span className={s.badge}>{product.occasions[0]}</span>
                    <span className={s.zoom}>
                      <Icon name={selectedIndex === index ? 'check' : 'plus'} size={22} />
                    </span>
                  </span>
                  <span className={s.cardCopy}>
                    <span className={s.productName}>{product.name}</span>
                    <span>
                      Посмотреть состав <Icon name="arrow-up-right" size={17} />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div id="showcase-details" className={s.details} aria-live="polite" aria-atomic="true">
          <div className={s.detailIntro}>
            <span className={s.detailLabel}>Внутри — любимый Kinder</span>
            <h3>{selected.name}</h3>
            <p>{selected.description}</p>
            <span className={s.count}>Около {getProductCount(selected)} изделий в наборе</span>
          </div>
          <div className={s.composition}>
            <h4>Пример состава</h4>
            <ul>
              {selected.contents.map((item) => (
                <li key={item.name}>
                  <Icon name="check" size={16} />
                  <span>{item.name}</span>
                  <b>{item.quantity} шт.</b>
                </li>
              ))}
            </ul>
            <p>{selected.packaging}. Финальное наполнение согласуем с вами.</p>
          </div>
          <div className={s.request}>
            <span className={s.detailLabel}>Подойдёт для повода</span>
            <p>{selected.occasions.join(' · ')}</p>
            <Button onClick={() => openLeadModal('showcase-product:' + selected.id)}>
              Узнать цену этого набора <Icon name="arrow-up-right" size={18} />
            </Button>
            <span className={s.documents}>
              <Icon name="shield" size={16} /> Оригинальная продукция с документами
            </span>
          </div>
        </div>
        <p className={s.disclosure}>
          Фото иллюстрируют оформление. Актуальный каталог пришлём по запросу.
        </p>
      </Container>
    </Section>
  );
}
