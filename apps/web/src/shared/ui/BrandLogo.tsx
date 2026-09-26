import s from './BrandLogo.module.css';

/** Our own box-and-heart mark: a gift filled with joy to the brim. */
export function BrandLogo() {
  return (
    <span className={s.brand} aria-hidden="true">
      <svg className={s.mark} width="52" height="52" viewBox="0 0 64 64" fill="none">
        <path
          d="M32 26.5 20.3 15.7C13.6 9.5 23.7.5 32 10.2 40.3.5 50.4 9.5 43.7 15.7L32 26.5Z"
          fill="currentColor"
        />
        <path
          d="M10 28h44a3 3 0 0 1 3 3v4H7v-4a3 3 0 0 1 3-3Zm0 11h19v18H18a8 8 0 0 1-8-8V39Zm25 0h19v10a8 8 0 0 1-8 8H35V39Z"
          fill="currentColor"
        />
        <path
          d="m53 12 1.5 4.5L59 18l-4.5 1.5L53 24l-1.5-4.5L47 18l4.5-1.5L53 12Z"
          fill="currentColor"
        />
      </svg>
      <span className={s.type}>
        <span className={s.name}>Доверху</span>
        <span className={s.descriptor}>сладкие подарки оптом</span>
      </span>
    </span>
  );
}
