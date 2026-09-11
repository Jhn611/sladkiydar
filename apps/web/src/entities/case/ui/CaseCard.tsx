import { Link } from 'react-router-dom';
import type { Case } from '../model/cases';
import { Icon } from '../../../shared/ui/Icon';
import styles from './CaseCard.module.css';

export function CaseCard({ item, priority = false }: { item: Case; priority?: boolean }) {
  return (
    <Link className={styles.card} to={`/cases/${item.slug}`}>
      <div className={styles.imageWrap} style={{ backgroundColor: item.color }}>
        <img
          src={item.image}
          srcSet={`${item.image.replace('.webp', '-768.webp')} 768w, ${item.image} 1536w`}
          sizes="(max-width: 600px) 100vw, 50vw"
          alt={item.imageAlt}
          width={1536}
          height={1024}
          loading={priority ? 'eager' : 'lazy'}
        />
        <span className={styles.badge}>Концепт</span>
        <span className={styles.arrow} aria-hidden="true">
          <Icon name="arrow-up-right" />
        </span>
      </div>
      <div className={styles.content}>
        <div className={styles.meta}>
          <span>{item.category}</span>
          <span>{item.occasion}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.subtitle}</p>
      </div>
    </Link>
  );
}
