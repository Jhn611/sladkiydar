import { useEffect, useState } from 'react';
import { caseRepository } from '../../entities/case/api/caseRepository';
import type { Case, CaseCategory } from '../../entities/case/model/cases';
import { CaseCard } from '../../entities/case/ui/CaseCard';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import { Seo } from '../../shared/lib/Seo';
import { Button } from '../../shared/ui/Button';
import { Container } from '../../shared/ui/Container';
import { Icon } from '../../shared/ui/Icon';
import styles from './CasesPage.module.css';

const filters = ['Все проекты', 'Команда', 'Партнёры'] as const;

export default function CasesPage() {
  const [items, setItems] = useState<readonly Case[]>([]);
  const [filter, setFilter] = useState<'Все проекты' | CaseCategory>('Все проекты');
  const [failed, setFailed] = useState(false);
  const { openLeadModal } = useLeadModal();

  useEffect(() => {
    let active = true;
    caseRepository
      .list()
      .then((data) => {
        if (active) setItems(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = items.filter((item) => filter === 'Все проекты' || item.category === filter);

  return (
    <>
      <Seo
        title="Идеи и проекты — Сладкий Дар"
        description="Концепции наборов Kinder: сладкие подарки, подарки партнёрам и новогодние коллекции. Найдите свой повод."
        path="/cases"
      />
      <section className={styles.page}>
        <Container>
          <p className={styles.eyebrow}>Идеи, которые обретают форму</p>
          <div className={styles.headingRow}>
            <h1>
              Каждый подарок —<br /> <span>своя история.</span>
            </h1>
            <p>
              Разные поводы. Разные задачи.
              <br /> Один подход: внимание к людям
              <br /> и к каждой детали.
            </p>
          </div>
          <div className={styles.filters} role="group" aria-label="Категория проекта">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                className={filter === item ? styles.active : ''}
                onClick={() => setFilter(item)}
              >
                {item}
                {item === 'Все проекты' && <span>{items.length.toString().padStart(2, '0')}</span>}
              </button>
            ))}
          </div>
          <p className={styles.disclosure}>
            Подборка авторских концептов. Показываем возможные решения — это не реализованные
            клиентские кейсы.
          </p>
          {failed && (
            <p role="alert">
              Не удалось загрузить проекты. Обновите страницу, чтобы попробовать ещё раз.
            </p>
          )}
          <div className={styles.grid} aria-live="polite">
            {visible.map((item, index) => (
              <CaseCard key={item.slug} item={item} priority={index === 0} />
            ))}
          </div>
          <div className={styles.cta}>
            <div>
              <p className={styles.eyebrow}>Следующая история — ваша</p>
              <h2>А какой у вас повод?</h2>
            </div>
            <Button onClick={() => openLeadModal('cases-bottom')}>
              Запросить прайс <Icon name="arrow-up-right" />
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
