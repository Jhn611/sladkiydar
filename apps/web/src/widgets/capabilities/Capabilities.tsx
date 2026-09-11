import { Container } from '../../shared/ui/Container';
import { Section } from '../../shared/ui/Section';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Capabilities.module.css';
export function Capabilities() {
  const { openLeadModal } = useLeadModal();
  return (
    <Section id="custom">
      <Container>
        <div className={s.heading}>
          <span className="eyebrow">Сначала ваша идея. Потом — наш набор.</span>
          <h2>
            Нужен особенный набор?
            <br />
            <span>Соберём его под ваш бюджет</span>
          </h2>
          <p>
            Меняем размер коробки, цвет наполнителя и состав. По запросу добавим детали, которые
            сделают подарок вашим.
          </p>
        </div>
        <div className={s.grid}>
          <article>
            <img
              src="/images/box-sizes.webp"
              alt="Пять размеров картонных подарочных коробок — иллюстрация"
              width="1200"
              height="800"
              loading="lazy"
            />
            <div>
              <span>01 / Упаковка</span>
              <h3>Пять размеров. Один ваш.</h3>
              <p>
                5 размеров картонной коробки под любой бюджет и повод — от небольшой до крупной
                подарочной.
              </p>
            </div>
          </article>
          <article>
            <img
              src="/images/fillers.webp"
              alt="Бумажный наполнитель разных цветов — иллюстрация"
              width="1200"
              height="800"
              loading="lazy"
            />
            <div>
              <span>02 / Наполнение</span>
              <h3>Цвет вашего праздника</h3>
              <p>Один тип бумажного наполнителя — на выбор разные цвета под ваш повод или бренд.</p>
            </div>
          </article>
          <article className={s.extras}>
            <div className={s.extraArt} aria-hidden="true">
              <Icon name="mug" size={60} />
              <span>
                Для вас
                <Icon name="heart" size={32} />
              </span>
              <Icon name="gift" size={60} />
            </div>
            <div>
              <span>03 / Особенные детали</span>
              <h3>Маленькое, но личное</h3>
              <p>
                Кружка с индивидуальным принтом, открытка, подпись или лента. Обсудим дополнения для
                вашего заказа.
              </p>
            </div>
          </article>
        </div>
        <div className={s.bottom}>
          <p>Оригинальный Kinder внутри. Ваше настроение снаружи.</p>
          <Button onClick={() => openLeadModal('custom-set')}>
            Обсудить индивидуальный набор <Icon name="arrow-up-right" size={19} />
          </Button>
        </div>
      </Container>
    </Section>
  );
}
