import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { loadEnv } from 'vite';
const env = loadEnv('production', '../..', 'VITE_');
const origin = new URL(process.env.VITE_SITE_URL || env.VITE_SITE_URL || 'http://localhost');
if (!['http:', 'https:'].includes(origin.protocol))
  throw new Error('VITE_SITE_URL must use http or https');
const routes = [
  [
    '/agreement',
    'Пользовательское соглашение — Доверху',
    'Условия использования сайта и запроса информации о подарочных наборах.',
  ],
  [
    '/',
    'Киндер наборы оптом — подарки с продукцией Kinder',
    'Наборы с продукцией Kinder оптом для магазинов, компаний и праздников. Подбор состава и оформления.',
  ],
  [
    '/catalog',
    'Каталог наборов Kinder оптом',
    'Выберите сладкий набор Kinder для магазина, команды или праздника. Запросите предложение под вашу партию.',
  ],
  [
    '/cases',
    'Идеи подарков с Kinder',
    'Примеры оформления сладких наборов с продукцией Kinder для разных поводов.',
  ],
  [
    '/cases/team-gifts',
    'Для команды — набор с Kinder',
    'Идея шоколадного подарка для сотрудников с продукцией Kinder.',
  ],
  [
    '/cases/sweet-thanks',
    'Сладкое спасибо — набор с Kinder',
    'Идея сладкой благодарности с продукцией Kinder.',
  ],
  [
    '/cases/new-year',
    'Новогоднее настроение — набор с Kinder',
    'Идея праздничного набора с шоколадом Kinder.',
  ],
  ['/contacts', 'Контакты — Доверху', 'Обсудите оптовый заказ наборов с продукцией Kinder.'],
  [
    '/privacy',
    'Конфиденциальность — Доверху',
    'Информация об обработке данных при отправке заявки.',
  ],
];
const escape = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
const template = await readFile('dist/index.html', 'utf8');
// These fonts are used on every route. Start them before CSS/JS discovery to avoid layout shifts.
const fontPreloads = (await readdir('dist/assets'))
  .filter((file) => /^manrope-(?:cyrillic|latin)-wght-normal-.+\.woff2$/.test(file))
  .map(
    (file) =>
      '<link rel="preload" href="/assets/' + file + '" as="font" type="font/woff2" crossorigin/>',
  )
  .join('');
// Match Hero.tsx sizes so the browser reuses this request, including mobile DPR 2.
const heroPreload =
  '<link rel="preload" as="image" href="/images/hero-team-people-20260922.webp" imagesrcset="/images/hero-team-people-20260922-768.webp 768w, /images/hero-team-people-20260922.webp 1440w" imagesizes="(max-width: 500px) calc(100vw - 40px), (max-width: 950px) 92vw, (max-width: 1435px) 44vw, 634px" fetchpriority="high"/>';
for (const [path, pageTitle, description] of routes) {
  const title = pageTitle.includes('Доверху') ? pageTitle : pageTitle + ' — Доверху';
  const canonical = new URL(path, origin).href;
  const meta =
    '<link data-rh="true" rel="canonical" href="' +
    escape(canonical) +
    '"/><meta data-rh="true" property="og:site_name" content="Доверху"/><meta data-rh="true" property="og:type" content="website"/><meta data-rh="true" property="og:locale" content="ru_RU"/><meta data-rh="true" property="og:title" content="' +
    escape(title) +
    '"/><meta data-rh="true" property="og:description" content="' +
    escape(description) +
    '"/><meta data-rh="true" property="og:url" content="' +
    escape(canonical) +
    '"/><meta data-rh="true" property="og:image" content="' +
    escape(new URL('/images/hero-team-people-20260922.webp', origin).href) +
    '"/><meta data-rh="true" name="twitter:card" content="summary_large_image"/>';
  const html = template
    .replace(/<title>.*?<\/title>/, '<title>' + escape(title) + '</title>')
    .replace(
      /<meta name="description"[^>]*>/,
      '<meta name="description" data-rh="true" content="' + escape(description) + '"/>',
    )
    .replace('</head>', fontPreloads + (path === '/' ? heroPreload : '') + meta + '</head>');
  const dir = path === '/' ? 'dist' : 'dist' + path;
  await mkdir(dir, { recursive: true });
  await writeFile(dir + '/index.html', html);
}
await writeFile(
  'dist/sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    routes
      .filter(([path]) => !['/privacy', '/agreement'].includes(path))
      .map(([path]) => '<url><loc>' + escape(new URL(path, origin).href) + '</loc></url>')
      .join('') +
    '</urlset>',
);
await writeFile(
  'dist/robots.txt',
  'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ' +
    new URL('/sitemap.xml', origin).href +
    '\n',
);
console.log('SEO metadata, robots and sitemap generated for ' + routes.length + ' routes.');
