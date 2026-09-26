import { Helmet } from 'react-helmet-async';
import { site } from '../config/site';
const origin = import.meta.env.VITE_SITE_URL || window.location.origin;
export function Seo({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  const canonical = new URL(path, origin).href;
  const pageTitle = title.includes(site.name) ? title : `${title} — ${site.name}`;
  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta
        property="og:image"
        content={new URL('/images/hero-team-people-20260922.webp', origin).href}
      />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
