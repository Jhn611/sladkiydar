import { Container } from '../../shared/ui/Container';
import { Section } from '../../shared/ui/Section';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import { occasions } from './data';
import s from './HolidayCalendar.module.css';

export function HolidayCalendar() {
  const { openLeadModal } = useLeadModal();
  return (
    <Section id="occasions" className={s.section} aria-labelledby="occasions-title">
      <Container>
        <div className={s.intro}>
          <span className="eyebrow">У каждого праздника — свой подарок</span>
          <h2 id="occasions-title">
            Готовые наборы под любой повод — <span>фото, состав и цена сразу</span>
          </h2>
          <p>
            У нас уже есть проверенные наборы с фото и составом. Выбирайте готовый вариант или
            закажите его в вашем объёме.
          </p>
        </div>
        <div className={s.grid}>
          {occasions.map((occasion) => (
            <article key={occasion.id} className={s.card}>
              <div className={s.image}>
                <img
                  src={`/images/${occasion.image}.webp`}
                  srcSet={`/images/${occasion.image}-768.webp 768w, /images/${occasion.image}.webp 1536w`}
                  sizes="(max-width: 520px) 100vw, (max-width: 1100px) 50vw, 33vw"
                  alt={occasion.alt}
                  width={1536}
                  height={1024}
                  loading="lazy"
                />
                <span className={s.icon}>
                  <Icon name={occasion.icon} size={19} />
                </span>
              </div>
              <div className={s.content}>
                <h3>{occasion.label}</h3>
                <p>{occasion.description}</p>
                <Button
                  variant="outline"
                  onClick={() => openLeadModal('occasion:' + occasion.id)}
                  aria-label={`Посмотреть и заказать: ${occasion.label}`}
                >
                  Посмотреть и заказать <Icon name="arrow-up-right" size={17} />
                </Button>
              </div>
            </article>
          ))}
        </div>
        <div className={s.bottom}>
          <span>
            <Icon name="shield" size={18} /> Настоящий Kinder · документы на каждую партию
          </span>
          <p>На фото — иллюстрации оформления. Актуальные фото и составы пришлёт менеджер.</p>
        </div>
      </Container>
    </Section>
  );
}
