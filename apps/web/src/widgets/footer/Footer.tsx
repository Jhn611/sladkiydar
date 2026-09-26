import { Link } from 'react-router-dom';
import { Container } from '../../shared/ui/Container';
import { Icon } from '../../shared/ui/Icon';
import { Button } from '../../shared/ui/Button';
import { BrandLogo } from '../../shared/ui/BrandLogo';
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
            <Link to="/" className={s.logo} aria-label="Доверху — на главную">
              <BrandLogo />
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
            {site.email && (
              <a className={s.email} href={'mailto:' + site.email}>
                {site.email}
              </a>
            )}
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
          {site.address && <span>Юридический адрес: {site.address}</span>}
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
          актуальный прайс предоставит менеджер. Kinder упоминается для описания продукции в
          наборах.
        </p>
      </Container>
    </footer>
  );
}
