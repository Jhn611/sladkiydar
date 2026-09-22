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
              sizes="(max-width: 540px) 92vw, (max-width: 850px) 44vw, 30vw"
              srcSet="/images/custom-boxes-20260922-768.webp 768w, /images/custom-boxes-20260922.webp 1200w"
              src="/images/custom-boxes-20260922.webp"
              alt="Белые подарочные коробки разных размеров с розовыми лентами"
              width="1200"
              height="675"
              loading="lazy"
              decoding="async"
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
              decoding="async"
            />
            <div>
              <span>02 / Наполнение</span>
              <h3>Цвет вашего праздника</h3>
              <p>Один тип бумажного наполнителя — на выбор разные цвета под ваш повод или бренд.</p>
            </div>
          </article>
          <article className={s.extras}>
            <img
              sizes="(max-width: 540px) 92vw, (max-width: 850px) 44vw, 30vw"
              srcSet="/images/custom-details-20260922-768.webp 768w, /images/custom-details-20260922.webp 1200w"
              src="/images/custom-details-20260922.webp"
              alt="Кружки с принтами, открытки и ленты для индивидуального оформления подарков"
              width="1200"
              height="675"
              loading="lazy"
              decoding="async"
            />
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
