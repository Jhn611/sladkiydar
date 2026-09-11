import { useState } from 'react';
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
    image: 'hero-gifts',
    title: 'Большой повод для радости',
    alt: 'Вариант оформления большого подарочного набора в красно-белой гамме',
  },
  {
    image: 'eco-gifts',
    title: 'Спасибо от всего сердца',
    alt: 'Вариант набора сладостей в белой коробке в форме сердца',
  },
  {
    image: 'winter-gifts',
    title: 'Немного новогоднего чуда',
    alt: 'Вариант праздничной коробки со сладостями и красной лентой',
  },
];
export function Hero() {
  const [slide, setSlide] = useState(0);
  const { openLeadModal } = useLeadModal();
  const selected = slides[slide]!;
  const change = (delta: number) =>
    setSlide((index) => (index + delta + slides.length) % slides.length);
  return (
    <section className={s.hero}>
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
            className={s.visual}
            role="region"
            aria-roledescription="карусель"
            aria-label="Готовые подарочные наборы"
          >
            <img
              key={selected.image}
              src={'/images/' + selected.image + '.webp'}
              srcSet={
                '/images/' +
                selected.image +
                '-768.webp 768w, /images/' +
                selected.image +
                '.webp 1536w'
              }
              sizes="(max-width: 950px) 100vw, 52vw"
              alt={selected.alt}
              width="1536"
              height="1024"
              fetchPriority={slide === 0 ? 'high' : 'auto'}
            />
            <div className={s.slideCaption}>
              <span aria-live="polite">
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
