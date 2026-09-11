import { Container } from '../../shared/ui/Container';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Consultation.module.css';
export function Consultation() {
  const { openLeadModal } = useLeadModal();
  return (
    <section id="request" className={s.section}>
      <Container>
        <div className={s.layout}>
          <div>
            <span className="eyebrow">Сделайте первый маленький шаг</span>
            <h2>
              Остались вопросы?
              <br />
              Оставьте заявку —<br />
              <span>ответим за 15 минут</span>
            </h2>
            <p>
              Пришлём фото наборов, актуальный прайс и подберём вариант под ваш бюджет — бесплатно и
              без обязательств.
            </p>
            <Button variant="secondary" onClick={() => openLeadModal('final-price')}>
              Получить прайс-лист <Icon name="arrow-up-right" size={22} />
            </Button>
            <small>Имя и телефон — и мы уже можем помочь</small>
          </div>
          <div className={s.gift} aria-hidden="true">
            <Icon name="gift" size={180} />
            <span>
              Пусть поводов
              <br />
              для радости
              <br />
              будет больше.
            </span>
            <Icon name="heart" size={40} />
          </div>
        </div>
      </Container>
    </section>
  );
}
