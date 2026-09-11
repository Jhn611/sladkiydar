import { Container } from '../../shared/ui/Container';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { useSectionVisibility } from '../../shared/hooks/useSectionVisibility';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Consultation.module.css';

export function Consultation() {
  const { openLeadModal } = useLeadModal();
  const { ref, motionActive } = useSectionVisibility<HTMLDivElement>();

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
          <div ref={ref} className={s.gift} data-motion-active={motionActive} aria-hidden="true">
            <div className={s.giftContent}>
              <Icon name="gift" size={150} />
              <span>
                Пусть поводов
                <br />
                для радости
                <br />
                будет больше.
              </span>
            </div>
            <div className={s.orbitTrack}>
              <div className={s.orbit}>
                <div className={s.heart}>
                  <Icon name="heart" size={40} />
                </div>
              </div>
              <div className={`${s.orbit} ${s.orbitSecondary}`}>
                <div className={s.heart}>
                  <Icon name="heart" size={28} />
                </div>
              </div>
            </div>
            <Icon name="sparkles" size={22} className={s.sparkle} />
          </div>
        </div>
      </Container>
    </section>
  );
}
