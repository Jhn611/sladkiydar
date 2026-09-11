import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Container } from '../../shared/ui/Container';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { IconButton } from '../../shared/ui/IconButton';
import { Modal } from '../../shared/ui/Modal';
import { useBusinessStatus } from '../../shared/hooks/useBusinessStatus';
import { site } from '../../shared/config/site';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Header.module.css';
const links = [
  { to: '/', label: 'Главная' },
  { to: '/catalog', label: 'Каталог' },
  { to: '/#wholesale', label: 'Опт' },
  { to: '/#about', label: 'О нас' },
  { to: '/contacts', label: 'Контакты' },
];
export function Header() {
  const [menu, setMenu] = useState(false);
  const { openLeadModal } = useLeadModal();
  const location = useLocation();
  const open = useBusinessStatus();
  useEffect(() => {
    setMenu(false);
  }, [location.pathname, location.hash]);
  return (
    <header className={s.header}>
      <Container className={s.inner}>
        <Link to="/" className={s.logo} aria-label="Сладкий Дар — на главную">
          <span className={s.brandMark}>
            <Icon name="gift" size={29} />
          </span>
          <span>
            Сладкий<span className={s.brandSecond}>Дар</span>
          </span>
        </Link>
        <nav className={s.desktopNav} aria-label="Главная навигация">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => (isActive && !l.to.includes('#') ? s.active : '')}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className={s.contact}>
          <a href={site.phoneHref}>{site.phone}</a>
          <div className={s.status}>
            <span className={open ? s.online : s.offline} />
            {open ? 'Сейчас работаем' : 'Ответим в рабочее время'}
          </div>
          <small>{site.workingHours}</small>
        </div>
        <div className={s.action}>
          <Button onClick={() => openLeadModal('header')}>
            Получить прайс <Icon name="arrow-up-right" size={18} />
          </Button>
          <span>Ответим и пришлём прайс за 15 минут</span>
        </div>
        <IconButton
          label="Открыть меню"
          name="menu"
          className={s.menuButton}
          onClick={() => setMenu(true)}
          aria-expanded={menu}
        />
      </Container>
      <Modal open={menu} onClose={() => setMenu(false)} title="Меню">
        <nav className={s.mobileNav} aria-label="Мобильная навигация">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to}>
              {l.label}
              <Icon name="arrow-up-right" />
            </NavLink>
          ))}
          <a href={site.phoneHref}>
            {site.phone}
            <Icon name="phone" />
          </a>
          <p>{site.workingHours}</p>
          <Button
            onClick={() => {
              setMenu(false);
              requestAnimationFrame(() => openLeadModal('mobile-menu'));
            }}
          >
            Получить прайс-лист <Icon name="arrow-up-right" />
          </Button>
        </nav>
      </Modal>
    </header>
  );
}
