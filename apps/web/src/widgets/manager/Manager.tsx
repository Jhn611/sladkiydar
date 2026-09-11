import { Container } from '../../shared/ui/Container';
import { Section } from '../../shared/ui/Section';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { site } from '../../shared/config/site';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Manager.module.css';
export function Manager() {
  const { openLeadModal } = useLeadModal();
  return (
    <Section id="manager" className={s.section}>
      <Container>
        <div className={s.layout}>
          <figure>
            <img
              src="/images/manager.webp"
              alt="Иллюстрация менеджера — временный образ"
              width="900"
              height="1200"
              loading="lazy"
              decoding="async"
            />
            <figcaption>Заменить на реальное фото и имя менеджера перед публикацией.</figcaption>
          </figure>
          <div className={s.copy}>
            <span className="eyebrow">Человек, который поможет с выбором</span>
            <h2>
              {site.manager.name}
              <span>{site.manager.role}</span>
            </h2>
            <blockquote>
              «Пришлю фото всех наборов, подберу состав под ваш бюджет и повод — вы увидите итоговый
              вариант заранее»
            </blockquote>
            <div className={s.details}>
              <span>
                <Icon name="check" size={18} /> Фото и актуальный прайс
              </span>
              <span>
                <Icon name="check" size={18} /> Состав и оформление под ваш запрос
              </span>
              <span>
                <Icon name="check" size={18} /> Ответы на вопросы о документах и доставке
              </span>
            </div>
            <Button onClick={() => openLeadModal('manager')}>
              Написать менеджеру <Icon name="arrow-up-right" size={19} />
            </Button>
            <small>Консультация бесплатная и ни к чему не обязывает</small>
          </div>
        </div>
      </Container>
    </Section>
  );
}
