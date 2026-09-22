import { Container } from '../../shared/ui/Container';
import { Section } from '../../shared/ui/Section';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Benefits.module.css';
const benefits = [
  {
    label: 'Родителям и детским садам',
    title: 'Знакомая радость',
    text: 'Kinder узнают и любят — не нужно объяснять ценность подарка.',
  },
  {
    label: 'Для перепродажи',
    title: 'Больше возможностей для продаж',
    text: 'Узнаваемый бренд помогает повысить средний чек и маржу при перепродаже.',
  },
  {
    label: 'Компаниям и школам',
    title: 'Эмоции, которые запоминаются',
    text: 'Сотрудники и дети реагируют на Kinder эмоциональнее, чем на безымянные сладости.',
  },
  {
    label: 'Организаторам мероприятий',
    title: 'Подарок с вашим характером',
    text: 'Наборы можно оформить под ваш повод — от коробки до открытки.',
  },
];
export function Benefits() {
  const { openLeadModal } = useLeadModal();
  return (
    <Section id="benefits" className={s.section}>
      <Container>
        <div className={s.intro}>
          <span className="eyebrow">Почему с нами выгодно</span>
          <h2>
            Наборы с Kinder более желанные,
            <br />
            <span>чем обычные сладкие подарки</span>
          </h2>
        </div>
        <div className={s.layout}>
          <div className={s.cards}>
            {benefits.map((b) => (
              <article key={b.title}>
                <div className={s.cardTop}>
                  <small>{b.label}</small>
                  <Icon name="check" size={18} />
                </div>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </article>
            ))}
          </div>
          <figure className={s.visual}>
            <img
              sizes="(max-width: 767px) calc(100vw - clamp(2.5rem, 8vw, 8rem)), (max-width: 1000px) 40vw, (max-width: 1440px) 42vw, 590px"
              srcSet="/images/benefits-set-20260922-768.webp 768w, /images/benefits-set-20260922.webp 1440w"
              src="/images/benefits-set-20260922.webp"
              alt="Подарочный набор с Kinder Surprise, шоколадом, батончиками и розовым наполнителем"
              width="1440"
              height="1080"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              Любимые сладости.
              <br />
              По-настоящему личный подарок.
            </figcaption>
          </figure>
        </div>
        <div className={s.bottom}>
          <p>
            <Icon name="shield" size={18} /> Оригинальная продукция · документы на каждую партию
          </p>
          <Button onClick={() => openLeadModal('benefits')}>
            Подобрать набор для меня <Icon name="arrow-up-right" size={19} />
          </Button>
        </div>
      </Container>
    </Section>
  );
}
