import { Link } from 'react-router-dom';
import { site } from '../../shared/config/site';
import { Seo } from '../../shared/lib/Seo';
import { Container } from '../../shared/ui/Container';
import { privacyIntroduction, privacySections } from './privacyContent';
import styles from './PrivacyPage.module.css';

function PolicyText({ text }: { text: string }) {
  return text.split(/(https?:\/\/[^\s,;]+)/g).map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a href={part} key={index}>
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export default function PrivacyPage() {
  const operatorName = site.operator.replace(/^ИП /, 'Индивидуальный предприниматель ');

  return (
    <>
      <Seo
        title={`Политика конфиденциальности — ${site.name}`}
        description={`Политика конфиденциальности ${site.name}: порядок обработки и защиты персональных данных, права пользователей и реквизиты оператора.`}
        path="/privacy"
      />
      <section className={styles.page}>
        <Container>
          <article className={styles.content}>
            <Link className={styles.back} to="/">
              ← На главную
            </Link>
            <p className={styles.eyebrow}>О ваших данных</p>
            <h1>Политика конфиденциальности «{site.name}»</h1>
            <p className={styles.revision}>
              Редакция <time dateTime="2026-09-24">24.09.2026 г.</time>
            </p>
            <div className={styles.policyIntro}>
              <p>
                <strong>Оператор:</strong> {operatorName}
              </p>
              <p>{privacyIntroduction}</p>
            </div>
            <details className={styles.contents}>
              <summary>Содержание политики</summary>
              <nav aria-label="Разделы политики конфиденциальности">
                <ol>
                  {privacySections.map((section) => (
                    <li key={section.number}>
                      <a href={`#privacy-section-${section.number}`}>{section.title}</a>
                    </li>
                  ))}
                  <li>
                    <a href="#privacy-section-15">Реквизиты оператора</a>
                  </li>
                </ol>
              </nav>
            </details>
            {privacySections.map((section) => (
              <section id={`privacy-section-${section.number}`} key={section.number}>
                <h2>
                  {section.number}. {section.title}
                </h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p
                    className={paragraph.number ? styles.clause : undefined}
                    data-depth={paragraph.depth}
                    key={paragraph.number || index}
                  >
                    {paragraph.number && (
                      <span className={styles.clauseNumber}>{paragraph.number}</span>
                    )}
                    <span>
                      <PolicyText text={paragraph.text} />
                    </span>
                  </p>
                ))}
              </section>
            ))}
            <section id="privacy-section-15">
              <h2>15. Реквизиты оператора</h2>
              <p>{operatorName}</p>
              <dl className={styles.requisites}>
                {site.email && (
                  <div>
                    <dt>Электронная почта</dt>
                    <dd>
                      <a href={`mailto:${site.email}`}>{site.email}</a>
                    </dd>
                  </div>
                )}
                <div>
                  <dt>ОГРНИП</dt>
                  <dd>{site.ogrnip}</dd>
                </div>
                <div>
                  <dt>ИНН</dt>
                  <dd>{site.inn}</dd>
                </div>
                {site.address && (
                  <div>
                    <dt>Адрес</dt>
                    <dd>{site.address}</dd>
                  </div>
                )}
              </dl>
            </section>
          </article>
        </Container>
      </section>
    </>
  );
}
