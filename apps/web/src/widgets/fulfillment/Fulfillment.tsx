import { Container } from '../../shared/ui/Container';
import { Section } from '../../shared/ui/Section';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Fulfillment.module.css';
export function LeadTimes() {
  const { openLeadModal } = useLeadModal();
  return (
    <Section id="timelines">
      <Container>
        <div className={s.timeline}>
          <div>
            <span className="eyebrow">Всё начинается с вашей даты</span>
            <h2>
              Собираем быстро —<br />
              <span>обычно от 2 до 10 дней</span>
            </h2>
            <p>
              Точный срок назовём, когда узнаем повод, объём и состав набора. Готовим партию
              максимально быстро, чтобы вы успели к празднику.
            </p>
            <Button variant="outline" onClick={() => openLeadModal('lead-time')}>
              Уточнить срок под мой заказ <Icon name="arrow-up-right" size={19} />
            </Button>
          </div>
          <aside className={s.season}>
            <div className={s.calendar}>
              <Icon name="calendar" size={38} />
              <span>
                В вашем
                <br />
                календаре
              </span>
            </div>
            <h3>
              У праздника есть дата.
              <br />
              Давайте успеем к ней.
            </h3>
            <p>
              Ближе к Новому году и другим праздникам заявок больше — позвоните нам, чтобы точно
              успеть.
            </p>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
export function Warehouse() {
  const { openLeadModal } = useLeadModal();
  return (
    <Section id="warehouse" className={s.warehouse}>
      <Container>
        <div className={s.storage}>
          <figure>
            <img
              src="/images/warehouse.webp"
              alt="Иллюстрация зоны сборки и хранения подарочных наборов"
              width="1200"
              height="800"
              loading="lazy"
              decoding="async"
            />
            <figcaption>Иллюстрация. Фото нашего склада появятся здесь позже.</figcaption>
          </figure>
          <div>
            <span className="eyebrow">От сборки до отгрузки — в одних руках</span>
            <h2>
              Собираем и храним партии
              <br />
              <span>на своём складе в Москве</span>
            </h2>
            <p>
              Готовые наборы хранятся у нас до момента отгрузки — вы получаете партию свежей и в
              полном объёме, без промежуточных перевалок.
            </p>
            <ul>
              <li>
                <Icon name="check" size={19} /> Собственная зона сборки
              </li>
              <li>
                <Icon name="check" size={19} /> Бережное хранение готовой партии
              </li>
              <li>
                <Icon name="check" size={19} /> Проверка комплектации перед отправкой
              </li>
            </ul>
            <Button onClick={() => openLeadModal('warehouse')}>
              Уточнить детали хранения и доставки <Icon name="arrow-up-right" size={18} />
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
