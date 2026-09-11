import { Container } from '../../shared/ui/Container';
import { Section } from '../../shared/ui/Section';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Authenticity.module.css';
export function Authenticity() {
  const { openLeadModal } = useLeadModal();
  return (
    <Section id="documents" className={s.section}>
      <Container>
        <div className={s.layout}>
          <div className={s.copy}>
            <span className="eyebrow">Спокойствие в каждой коробке</span>
            <h2>
              Kinder с завода Ferrero Russia.
              <br />
              <span>Регулярные официальные поставки.</span>
            </h2>
            <p>
              С документами и маркировкой. Каждая партия сопровождается документами — вы всегда
              можете запросить их на конкретную продукцию.
            </p>
            <p>
              Мы не подделываем продукцию и не меняем заводскую упаковку сладостей. Бережно собираем
              их в подарочные наборы.
            </p>
            <Button onClick={() => openLeadModal('documents')}>
              Запросить документы <Icon name="arrow-up-right" size={19} />
            </Button>
          </div>
          <div className={s.documents}>
            <div className={s.seal}>
              <Icon name="shield" size={36} />
              <span>
                Оригинальная
                <br />
                продукция
              </span>
            </div>
            <article>
              <Icon name="check" size={22} />
              <div>
                <h3>Сертификаты на продукцию</h3>
                <p>Пришлём документы, подтверждающие качество и происхождение сладостей.</p>
              </div>
            </article>
            <article>
              <Icon name="box" size={22} />
              <div>
                <h3>Документы на вашу партию</h3>
                <p>Покажем сопроводительные документы и информацию о маркировке.</p>
              </div>
            </article>
            <p className={s.note}>Документы предоставит менеджер по запросу.</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
