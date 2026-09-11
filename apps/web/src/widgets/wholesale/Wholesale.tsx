import { Container } from '../../shared/ui/Container';
import { Section } from '../../shared/ui/Section';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Wholesale.module.css';
const levels = [
  {
    title: 'Малый опт',
    icon: 'gift',
    text: 'Для небольших компаний, детских садов и школ, малого бизнеса и организаций мероприятий',
    detail: 'Одинаковые подарки на класс, группу или небольшую команду.',
  },
  {
    title: 'Средний опт',
    icon: 'box',
    text: 'Компании, предприниматели, подарки сотрудникам или клиентам',
    detail: 'Продуманная комплектация и единое оформление всей партии.',
  },
  {
    title: 'Крупный опт',
    icon: 'truck',
    text: 'Масштабные корпоративные поставки и не только',
    detail: 'Большие объёмы с согласованным графиком сборки и отгрузки.',
  },
] as const;
export function Wholesale() {
  const { openLeadModal } = useLeadModal();
  return (
    <Section id="wholesale" className={s.section}>
      <Container>
        <div className={s.heading}>
          <span className="eyebrow">Большая радость начинается с маленькой партии</span>
          <h2>
            Опт под любой бюджет —<br />
            от небольшой партии до крупной поставки
          </h2>
          <p>
            Работаем на разных уровнях опта. Точные условия и цены — в персональном прайс-листе,
            который пришлёт менеджер.
          </p>
        </div>
        <div className={s.grid}>
          {levels.map((level, i) => (
            <article key={level.title}>
              <div className={s.top}>
                <Icon name={level.icon} size={32} />
                <span>0{i + 1}</span>
              </div>
              <h3>{level.title}</h3>
              <p>{level.text}</p>
              <small>{level.detail}</small>
              <button onClick={() => openLeadModal('wholesale-' + (i + 1))}>
                Узнать условия <Icon name="arrow-up-right" size={18} />
              </button>
            </article>
          ))}
        </div>
        <div className={s.bottom}>
          <span>
            <Icon name="shield" size={19} /> Оригинальная продукция и документы при любом объёме
          </span>
          <Button variant="secondary" onClick={() => openLeadModal('wholesale-price')}>
            Получить прайс-лист под мой объём <Icon name="arrow-up-right" size={19} />
          </Button>
        </div>
      </Container>
    </Section>
  );
}
