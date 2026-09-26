import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import { site } from '../../shared/config/site';
import { Seo } from '../../shared/lib/Seo';
import { Button } from '../../shared/ui/Button';
import { Container } from '../../shared/ui/Container';
import { Icon } from '../../shared/ui/Icon';
import styles from './ContactsPage.module.css';

export default function ContactsPage() {
  const { openLeadModal } = useLeadModal();

  return (
    <>
      <Seo
        title="Контакты — Доверху"
        description="Получите фото наборов, персональный прайс-лист и помощь менеджера. Наборы с настоящим Kinder для компаний, детских садов, семей и мероприятий."
        path="/contacts"
      />
      <section className={styles.page}>
        <Container>
          <p className={styles.eyebrow}>Рядом на каждом шаге</p>
          <h1>
            Ваш повод.
            <br />
            <span>Наши сладкие подарки.</span>
          </h1>
          <div className={styles.layout}>
            <div className={styles.info}>
              <div className={styles.message}>
                <span className={styles.sparkle} aria-hidden="true">
                  ✳
                </span>
                <h2>
                  Расскажите о задаче.
                  <br />
                  Остальное подберём.
                </h2>
                <p>
                  Для сотрудников, группы в детском саду, класса, гостей праздника или вашего
                  магазина — поможем выбрать готовые наборы и соберём индивидуальные.
                </p>
                <div className={styles.line} />
                <p className={styles.small}>
                  Только настоящая продукция Kinder.
                  <br />
                  Документы на каждую партию. Доставка по России.
                </p>
              </div>
              <div className={styles.contact}>
                <p className={styles.eyebrow}>Мы на связи</p>
                <a href={site.phoneHref}>
                  {site.phone} <Icon name="phone" />
                </a>
                <p className={styles.contactHours}>{site.workingHours}</p>
                {site.email && (
                  <a href={`mailto:${site.email}`}>
                    {site.email} <Icon name="arrow-up-right" />
                  </a>
                )}
                <p className={styles.placeholder}>Ответим и пришлём прайс за 15 минут.</p>
              </div>
            </div>
            <div className={styles.formCard}>
              <p className={styles.eyebrow}>Первый шаг — просто знакомство</p>
              <h2>Пришлём прайс-лист и подберём набор под ваш бюджет</h2>
              <p className={styles.formIntro}>
                Оставьте имя и телефон. Менеджер пришлёт фото готовых наборов, расскажет про три
                уровня опта и ответит на ваши вопросы.
              </p>
              <Button onClick={() => openLeadModal('contacts-price')}>
                Получить прайс-лист <Icon name="arrow-up-right" />
              </Button>
              <div className={styles.requisites}>
                <h3>Реквизиты</h3>
                <p>{site.operator}</p>
                <dl>
                  <div>
                    <dt>ИНН</dt>
                    <dd>{site.inn}</dd>
                  </div>
                  <div>
                    <dt>ОГРНИП</dt>
                    <dd>{site.ogrnip}</dd>
                  </div>
                  {site.address && (
                    <div>
                      <dt>Юридический адрес</dt>
                      <dd>{site.address}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
