import { Container } from '../../shared/ui/Container';
import { Section } from '../../shared/ui/Section';
import { Icon } from '../../shared/ui/Icon';
import s from './Process.module.css';
const steps = [
  {
    title: 'Знакомимся с задачей',
    text: 'Кому дарим, какой повод, сколько наборов нужно и к какой дате.',
  },
  { title: 'Подбираем варианты', text: 'Предлагаем состав и упаковку. Рассчитываем вашу партию.' },
  { title: 'Согласуем детали', text: 'Фиксируем комплектацию, оформление, стоимость и сроки.' },
  { title: 'Собираем и отправляем', text: 'Проверяем наборы, упаковываем и согласуем доставку.' },
];
export function Process() {
  return (
    <Section id="process" className={s.section}>
      <Container>
        <div className="section-intro">
          <div>
            <span className="eyebrow">Просто на каждом этапе</span>
            <h2>
              От «нам нужны подарки»
              <br />
              до «как же здорово!»
            </h2>
          </div>
          <span className={s.sideNote}>
            Вы выбираете повод.
            <br />
            Мы помогаем с остальным.
          </span>
        </div>
        <ol className={s.steps}>
          {steps.map((step, i) => (
            <li key={step.title}>
              <div className={s.stepTop}>
                <span>0{i + 1}</span>
                <Icon name={i === 3 ? 'check' : 'arrow-right'} size={21} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
