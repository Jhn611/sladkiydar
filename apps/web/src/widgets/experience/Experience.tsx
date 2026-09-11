import { Container } from '../../shared/ui/Container';
import { Section } from '../../shared/ui/Section';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Experience.module.css';
export function Experience() {
  const { openLeadModal } = useLeadModal();
  return (
    <Section id="about">
      <Container>
        <div className={s.heading}>
          <span className="eyebrow">Наш опыт — ваши улыбки</span>
          <h2>
            Более 100 000 наборов уже собрано
            <br />
            <span>и передано получателям</span>
          </h2>
        </div>
        <div className={s.number}>
          100 000<span>+</span>
          <Icon name="heart" size={65} />
        </div>
        <div className={s.bottom}>
          <p>
            За время работы мы реализовали огромное количество подарочных наборов с Kinder — для
            компаний, семей и частных заказчиков. Каждый повод для нас особенный.
          </p>
          <div className={s.audiences}>
            {[
              { icon: 'users', text: 'Компании' },
              { icon: 'gift', text: 'Сады и школы' },
              { icon: 'heart', text: 'Родители' },
              { icon: 'box', text: 'Перекупщики' },
              { icon: 'calendar', text: 'Мероприятия' },
            ].map((a) => (
              <span key={a.text}>
                <Icon name={a.icon as 'users' | 'gift' | 'heart' | 'box' | 'calendar'} size={20} />
                {a.text}
              </span>
            ))}
          </div>
        </div>
        <Button onClick={() => openLeadModal('experience')}>
          Хочу так же — оставить заявку <Icon name="arrow-up-right" size={19} />
        </Button>
      </Container>
    </Section>
  );
}
