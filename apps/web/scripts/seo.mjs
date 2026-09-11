import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { loadEnv } from 'vite';
const env = loadEnv('production', '../..', 'VITE_');
const origin = new URL(process.env.VITE_SITE_URL || env.VITE_SITE_URL || 'http://localhost');
if (!['http:', 'https:'].includes(origin.protocol))
  throw new Error('VITE_SITE_URL must use http or https');
const routes = [
  [
    '/agreement',
    'Пользовательское соглашение — Сладкий Дар',
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
  ['/contacts', 'Контакты — Сладкий Дар', 'Обсудите оптовый заказ наборов с продукцией Kinder.'],
  [
    '/privacy',
    'Конфиденциальность — Сладкий Дар',
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
for (const [path, pageTitle, description] of routes) {
  const title = pageTitle.includes('Сладкий Дар') ? pageTitle : pageTitle + ' — Сладкий Дар';
  const canonical = new URL(path, origin).href;
  const meta =
    '<link data-rh="true" rel="canonical" href="' +
    escape(canonical) +
    '"/><meta data-rh="true" property="og:type" content="website"/><meta data-rh="true" property="og:locale" content="ru_RU"/><meta data-rh="true" property="og:title" content="' +
    escape(title) +
    '"/><meta data-rh="true" property="og:description" content="' +
    escape(description) +
    '"/><meta data-rh="true" property="og:url" content="' +
    escape(canonical) +
    '"/><meta data-rh="true" property="og:image" content="' +
    escape(new URL('/images/hero-gifts.webp', origin).href) +
    '"/><meta data-rh="true" name="twitter:card" content="summary_large_image"/>';
  const html = template
    .replace(/<title>.*?<\/title>/, '<title>' + escape(title) + '</title>')
    .replace(
      /<meta name="description"[^>]*>/,
      '<meta name="description" data-rh="true" content="' + escape(description) + '"/>',
    )
    .replace('</head>', meta + '</head>');
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
