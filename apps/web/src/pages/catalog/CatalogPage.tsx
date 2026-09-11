import { useSearchParams } from 'react-router-dom';
import {
  products,
  productAudiences,
  productOccasions,
} from '../../entities/product/model/products';
import { ProductCard } from '../../entities/product/ui/ProductCard';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import { Seo } from '../../shared/lib/Seo';
import { Container } from '../../shared/ui/Container';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import styles from './CatalogPage.module.css';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const audience =
    productAudiences.find((item) => item === searchParams.get('audience')) ?? 'Все наборы';
  const occasion =
    productOccasions.find((item) => item === searchParams.get('occasion')) ?? 'Любой повод';
  const { openLeadModal } = useLeadModal();
  const visible = products.filter(
    (product) =>
      (audience === 'Все наборы' || product.audiences.includes(audience)) &&
      (occasion === 'Любой повод' || product.occasions.includes(occasion)),
  );

  function changeFilter(key: 'audience' | 'occasion', value: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === 'Все наборы' || value === 'Любой повод') next.delete(key);
        else next.set(key, value);
        return next;
      },
      { preventScrollReset: true },
    );
  }

  function resetFilters() {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('audience');
        next.delete('occasion');
        return next;
      },
      { preventScrollReset: true },
    );
  }

  return (
    <>
      <Seo
        title="Каталог наборов с Kinder оптом"
        description="Наборы с настоящим Kinder для компаний, детских садов, школ, родителей, перепродажи и мероприятий. Выбирайте повод и получите персональный прайс."
        path="/catalog"
      />
      <section className={styles.page}>
        <Container>
          <p className={styles.eyebrow}>Каталог сладких подарков</p>
          <div className={styles.heading}>
            <h1>
              Ваш повод.
              <br />
              <span>Ваш сладкий подарок.</span>
            </h1>
            <p>
              Выбирайте наборы с настоящим Kinder по составу и оформлению. Менеджер пришлёт
              актуальные фото и прайс под ваш объём.
            </p>
          </div>
          <div className={styles.trust}>
            <span>
              <Icon name="shield" size={18} /> Только оригинальная продукция
            </span>
            <span>
              <Icon name="check" size={18} /> Все документы на партию
            </span>
            <span>
              <Icon name="gift" size={18} /> Индивидуальный состав
            </span>
            <Button onClick={() => openLeadModal('catalog-top')}>
              Получить прайс-лист <Icon name="arrow-up-right" size={18} />
            </Button>
          </div>
          <div className={styles.filterBar}>
            <div className={styles.audiences} role="group" aria-label="Для кого набор">
              {['Все наборы', ...productAudiences].map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={audience === item}
                  className={audience === item ? styles.active : ''}
                  onClick={() => changeFilter('audience', item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className={styles.select}>
              <label htmlFor="catalog-occasion">Повод</label>
              <select
                id="catalog-occasion"
                value={occasion}
                onChange={(event) => changeFilter('occasion', event.target.value)}
              >
                {['Любой повод', ...productOccasions].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.catalogMeta}>
            <p>
              Фото иллюстрируют оформление, составы приведены для примера. Актуальные варианты
              подтвердит менеджер.
            </p>
            <span aria-live="polite">Найдено: {visible.length}</span>
          </div>
          <div className={styles.grid}>
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onRequest={() => openLeadModal(`catalog-${product.id}`)}
              />
            ))}
          </div>
          {visible.length === 0 && (
            <div className={styles.empty}>
              <span aria-hidden="true">✳</span>
              <h2>Для вашего повода — особый набор</h2>
              <p>
                В этой подборке пока нет такого сочетания. Посмотрите все идеи или оставьте запрос
                на индивидуальный подбор.
              </p>
              <div className={styles.emptyActions}>
                <Button variant="outline" onClick={resetFilters}>
                  Показать все наборы
                </Button>
                <Button onClick={() => openLeadModal('catalog-empty')}>
                  Подобрать набор для меня
                </Button>
              </div>
            </div>
          )}
          <div className={styles.cta}>
            <div>
              <p className={styles.eyebrow}>От небольшого заказа до большой партии</p>
              <h2>
                Набор под ваш бюджет.
                <br />
                Именно для вашего повода.
              </h2>
              <p>
                Подберём упаковку, состав и объём. Фото, консультация и персональный прайс —
                бесплатно.
              </p>
            </div>
            <Button onClick={() => openLeadModal('catalog-custom')}>
              Обсудить индивидуальный набор <Icon name="arrow-up-right" />
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
