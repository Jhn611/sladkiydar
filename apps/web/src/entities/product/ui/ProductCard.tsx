import { Button } from '../../../shared/ui/Button';
import { Icon } from '../../../shared/ui/Icon';
import { getProductCount, type Product } from '../model/products';
import styles from './ProductCard.module.css';

export function ProductCard({ product, onRequest }: { product: Product; onRequest: () => void }) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <img
          sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"
          srcSet={`${product.image.replace('.webp', '-768.webp')} 768w, ${product.image} ${product.imageWidth}w`}
          src={product.image}
          alt={product.imageAlt}
          width={product.imageWidth}
          height={product.imageHeight}
          loading="lazy"
          decoding="async"
        />
        <span className={styles.badge}>{product.occasions[0]}</span>
        <span className={styles.concept}>Иллюстрация набора</span>
      </div>
      <div className={styles.content}>
        <p className={styles.label}>{product.label}</p>
        <h3>{product.name}</h3>
        <p className={styles.description}>{product.description}</p>
        <details className={styles.details}>
          <summary>Пример состава · около {getProductCount(product)} изделий</summary>
          <ul>
            {product.contents.map((item) => (
              <li key={item.name}>
                {item.name} — {item.quantity} шт.
              </li>
            ))}
          </ul>
          <p>{product.packaging}. Точный состав согласуем с вами.</p>
        </details>
        <div className={styles.bottom}>
          <span>
            Оригинальная продукция
            <br />
            Документы на каждую партию
          </span>
          <Button
            variant="outline"
            onClick={onRequest}
            aria-label={`Запросить прайс на набор «${product.name}»`}
          >
            Узнать цену <Icon name="arrow-up-right" size={18} />
          </Button>
        </div>
      </div>
    </article>
  );
}
