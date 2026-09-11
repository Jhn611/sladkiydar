import { Container } from '../../shared/ui/Container';
import { Section } from '../../shared/ui/Section';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Delivery.module.css';
export function Delivery() {
  const { openLeadModal } = useLeadModal();
  return (
    <Section id="delivery">
      <Container>
        <div className={s.layout}>
          <div className={s.route} aria-hidden="true">
            <div>
              <Icon name="gift" size={32} />
              <span>Москва</span>
            </div>
            <span className={s.line} />
            <Icon name="truck" size={55} />
            <span className={s.line} />
            <div>
              <Icon name="pin" size={32} />
              <span>Ваш город</span>
            </div>
          </div>
          <div className={s.copy}>
            <span className="eyebrow">Любимые сладости без расстояний</span>
            <h2>
              Доставляем по всей России —<br />
              <span>от одной коробки до фуры</span>
            </h2>
            <p>
              Упаковываем партию так, чтобы она доехала в целости при любом объёме заказа. Менеджер
              поможет подобрать доставку в ваш город и согласует детали отправки.
            </p>
            <Button onClick={() => openLeadModal('delivery')}>
              Уточнить доставку в мой город <Icon name="arrow-up-right" size={19} />
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
