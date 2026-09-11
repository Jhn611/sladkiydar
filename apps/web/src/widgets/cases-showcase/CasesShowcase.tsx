import { Link } from 'react-router-dom';
import { Container } from '../../shared/ui/Container';
import { Section } from '../../shared/ui/Section';
import { Icon } from '../../shared/ui/Icon';
import { cases } from '../../entities/case/model/cases';
import { CaseCard } from '../../entities/case/ui/CaseCard';
import s from './CasesShowcase.module.css';
export function CasesShowcase() {
  return (
    <Section>
      <Container>
        <div className="section-intro">
          <div>
            <span className="eyebrow">Вдохновение для вашего заказа</span>
            <h2>
              Разные поводы.
              <br />
              Одинаково много радости.
            </h2>
          </div>
          <Link className="text-link" to="/cases">
            Все идеи <Icon name="arrow-up-right" size={20} />
          </Link>
        </div>
        <div className={s.grid}>
          {cases.map((item) => (
            <CaseCard key={item.slug} item={item} />
          ))}
        </div>
        <p className={s.note}>
          Примеры оформления — демонстрационные концепты. Состав и упаковку согласуем для вашего
          заказа.
        </p>
      </Container>
    </Section>
  );
}
