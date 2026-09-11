import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { caseRepository } from '../../entities/case/api/caseRepository';
import type { Case } from '../../entities/case/model/cases';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import { Seo } from '../../shared/lib/Seo';
import { Button } from '../../shared/ui/Button';
import { Container } from '../../shared/ui/Container';
import { Icon } from '../../shared/ui/Icon';
import styles from './CaseDetailsPage.module.css';

export default function CaseDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<Case | undefined>();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { openLeadModal } = useLeadModal();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    caseRepository
      .findBySlug(slug ?? '')
      .then((data) => {
        if (active) setItem(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading)
    return (
      <Container>
        <p className={styles.loading} role="status">
          Загружаем историю…
        </p>
      </Container>
    );
  if (failed || !item) {
    return (
      <section className={styles.page}>
        <Seo
          title="Проект не найден — Сладкий Дар"
          description="Посмотрите другие идеи подарочных наборов с Kinder в подборке «Сладкий Дар»."
          path="/cases"
        />
        <Container>
          <h1>{failed ? 'Не удалось загрузить проект' : 'Эта история пока не написана'}</h1>
          <p>
            {failed
              ? 'Попробуйте открыть страницу ещё раз.'
              : 'Зато у нас есть другие идеи для вашего повода.'}
          </p>
          <Link className={styles.back} to="/cases">
            Ко всем проектам <Icon name="arrow-right" />
          </Link>
        </Container>
      </section>
    );
  }

  return (
    <>
      <Seo
        title={`${item.title} — Сладкий Дар`}
        description={item.description}
        path={`/cases/${item.slug}`}
      />
      <article className={styles.page}>
        <Container>
          <Link className={styles.back} to="/cases">
            <span aria-hidden="true">←</span> Все проекты
          </Link>
          <div className={styles.tags}>
            <span>{item.category}</span>
            <span>{item.occasion}</span>
            <span>Демонстрационный концепт</span>
          </div>
          <h1>{item.title}</h1>
          <p className={styles.intro}>{item.description}</p>
          <img
            className={styles.hero}
            src={item.image}
            srcSet={`${item.image.replace('.webp', '-768.webp')} 768w, ${item.image} 1536w`}
            sizes="(max-width: 768px) 100vw, 90vw"
            alt={item.imageAlt}
            width={1536}
            height={1024}
          />
          <div className={styles.story}>
            <aside className={styles.facts} aria-label="О проекте">
              <p className={styles.eyebrow}>Детали концепции</p>
              <dl>
                {item.details.map((detail) => (
                  <div key={detail.label}>
                    <dt>{detail.label}</dt>
                    <dd>{detail.value}</dd>
                  </div>
                ))}
              </dl>
              <p className={styles.note}>
                Авторская демонстрация подхода. Изображения иллюстрируют идею; состав и оформление
                согласуются для каждого проекта.
              </p>
            </aside>
            <div className={styles.text}>
              <section>
                <p className={styles.number}>01 / Задача</p>
                <h2>Начать с человека</h2>
                <p>{item.challenge}</p>
              </section>
              <section>
                <p className={styles.number}>02 / Решение</p>
                <h2>Собрать смысл в деталях</h2>
                <p>{item.approach}</p>
              </section>
              <section>
                <p className={styles.number}>03 / Наполнение</p>
                <h2>Что может быть внутри</h2>
                <ul>
                  {item.contents.map((content) => (
                    <li key={content}>
                      <Icon name="check" />
                      {content}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
          <div className={styles.cta}>
            <p className={styles.eyebrow}>Вдохновились этой идеей?</p>
            <h2>
              Сделаем её
              <br />
              <span>по-вашему.</span>
            </h2>
            <p>Подберём состав, палитру и упаковку под вашу задачу.</p>
            <Button onClick={() => openLeadModal(`case-${item.slug}`)}>
              Хочу похожий подарок <Icon name="arrow-up-right" />
            </Button>
          </div>
        </Container>
      </article>
    </>
  );
}
