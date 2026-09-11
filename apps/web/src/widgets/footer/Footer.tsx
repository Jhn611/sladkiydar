import { Link } from 'react-router-dom';
import { Container } from '../../shared/ui/Container';
import { Icon } from '../../shared/ui/Icon';
import { Button } from '../../shared/ui/Button';
import { site } from '../../shared/config/site';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Footer.module.css';
export function Footer() {
  const { openLeadModal } = useLeadModal();
  return (
    <footer className={s.footer}>
      <Container>
        <div className={s.top}>
          <div>
            <Link to="/" className={s.logo}>
              <Icon name="gift" size={32} />
              <span>Сладкий Дар</span>
            </Link>
            <p>
              Маленькие сладости.
              <br />
              Большие поводы для радости.
            </p>
          </div>
          <nav aria-label="Навигация в подвале">
            <Link to="/">Главная</Link>
            <Link to="/catalog">Каталог наборов</Link>
            <Link to="/#wholesale">Опт</Link>
            <Link to="/#about">О нас</Link>
            <Link to="/contacts">Контакты</Link>
          </nav>
          <div className={s.contact}>
            <a href={site.phoneHref}>{site.phone}</a>
            <span>{site.workingHours}</span>
            <a className={s.email} href={'mailto:' + site.email}>
              {site.email}
            </a>
            <Button onClick={() => openLeadModal('footer-price')}>
              Получить прайс-лист <Icon name="arrow-up-right" size={18} />
            </Button>
          </div>
        </div>
        <div className={s.requisites}>
          <strong>{site.operator}</strong>
          <span>
            ИНН {site.inn} · ОГРНИП {site.ogrnip}
          </span>
          <span>Юридический адрес: {site.address}</span>
          {site.isDemoContacts && <small>Контакты и реквизиты временные, для макета.</small>}
        </div>
        <div className={s.bottom}>
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
          <Link to="/privacy">Политика обработки персональных данных</Link>
          <Link to="/agreement">Пользовательское соглашение</Link>
        </div>
        <p className={s.legal}>
          Изображения показывают идеи оформления. Фото готовых наборов, точный состав, документы и
          актуальный прайс предоставит менеджер. Kinder упоминается для описания продукции; графика
          бренда на сайте не используется.
        </p>
      </Container>
    </footer>
  );
}
