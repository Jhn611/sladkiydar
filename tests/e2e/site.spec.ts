import { test, expect, type Locator } from '@playwright/test';

// These regression checks exercise manual flows; automatic prompts have dedicated browser tests.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'sladkiy-dar:lead-prompt:v1',
      JSON.stringify({ consumed: true, elapsedMs: 0 }),
    );
  });
});
const widths = [375, 430, 768, 1024, 1280, 1440, 1920];
const paths = ['/', '/catalog', '/contacts', '/privacy', '/agreement'];
const modalTitle = 'Пришлём прайс-лист и подберём набор под ваш бюджет';

async function expectCurrentLeadFields(dialog: Locator) {
  await expect(dialog.getByLabel('Имя *', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Имя *', { exact: true })).toHaveAttribute('required', '');
  await expect(dialog.getByLabel('Телефон *', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Телефон *', { exact: true })).toHaveAttribute('required', '');
  await expect(dialog.getByRole('checkbox')).not.toBeChecked();
  await expect(dialog.getByRole('button', { name: 'Добавить комментарий' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await expect(dialog.getByLabel(/email|компания/i)).toHaveCount(0);
  await expect(
    dialog.getByText(
      'Перезвоним в течение 15 минут. Никакого спама — только прайс и ответы на ваши вопросы',
    ),
  ).toBeVisible();
}

for (const width of widths) {
  test('Pages fit ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const path of paths) {
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page).toHaveTitle(/Доверху/);
      await expect(page.locator('meta[name=description]')).toHaveCount(1);
      await expect(page.locator('link[rel=canonical]')).toHaveCount(1);
      await page.evaluate(() => document.fonts.ready);
      if (path === '/') {
        const heroCarousel = page.getByRole('region', {
          name: 'Готовые подарочные наборы',
          exact: true,
        });
        await expect(heroCarousel).toBeVisible();
        const bounds = await heroCarousel.boundingBox();
        expect(bounds, 'Hero carousel must have visible bounds').not.toBeNull();
        expect(bounds!.width, 'Hero carousel must have a usable width').toBeGreaterThan(0);
        expect(
          bounds!.x,
          'Hero carousel must stay inside the left viewport edge',
        ).toBeGreaterThanOrEqual(0);
        expect(
          bounds!.x + bounds!.width,
          'Hero carousel must stay inside the right viewport edge',
        ).toBeLessThanOrEqual(width);
      }

      const overflow = await page.evaluate(() => ({
        viewport: innerWidth,
        document: document.documentElement.scrollWidth,
        brokenImages: [...document.images]
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.src),
      }));
      expect(overflow.document, path).toBeLessThanOrEqual(overflow.viewport);
      expect(overflow.brokenImages, path).toEqual([]);
      await expect(page.locator('main')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}

test('catalog combines audience and occasion filters and opens the common request form', async ({
  page,
}) => {
  await page.goto('/catalog');
  await page.getByRole('button', { name: 'Детским садам и школам', exact: true }).click();
  await page.getByLabel('Повод', { exact: true }).selectOption('Новый год');
  await expect(page.getByText('Найдено: 1', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Новогоднее чудо' })).toBeVisible();
  await page.getByRole('button', { name: 'Запросить прайс на набор «Новогоднее чудо»' }).click();
  const dialog = page.getByRole('dialog', { name: modalTitle });
  await expect(dialog).toBeVisible();
  await expectCurrentLeadFields(dialog);
  await page.keyboard.press('Escape');
  await page.getByLabel('Повод', { exact: true }).selectOption('Корпоратив');
  await expect(page.getByRole('heading', { name: 'Спасибо, команда!' })).toBeVisible();
  await expect(page.locator('main').getByRole('article')).toHaveCount(1);
  await page.getByLabel('Повод', { exact: true }).selectOption('Для перепродажи');
  await expect(
    page.getByRole('heading', { name: 'Для вашего повода — особый набор' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Показать все наборы' }).click();
  await expect(page.locator('main').getByRole('article')).toHaveCount(4);
});

test('modal focus, keyboard trap, escape and restoration', async ({ page }) => {
  await page.goto('/');
  const trigger = page
    .getByRole('banner')
    .getByRole('button', { name: 'Получить прайс', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: modalTitle });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() =>
        document.querySelector('dialog[open]')?.contains(document.activeElement),
      ),
    ).toBeTruthy();
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('mobile navigation routes and hands off to the common lead modal', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  const menu = page.getByRole('dialog', { name: 'Меню', exact: true });
  await expect(menu).toBeVisible();
  await menu.getByRole('link', { name: 'Каталог', exact: true }).click();
  await expect(page).toHaveURL(/\/catalog$/);
  await expect(menu).not.toBeVisible();

  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await menu.getByRole('button', { name: 'Получить прайс-лист', exact: true }).click();
  await expect(menu).not.toBeVisible();
  const dialog = page.getByRole('dialog', { name: modalTitle });
  await expect(dialog).toBeVisible();
  await expectCurrentLeadFields(dialog);
  await expect(page.locator('dialog[open]')).toHaveCount(1);
});

test('lead form requires name, phone and consent, and accepts an empty comment', async ({
  page,
}) => {
  let payload: Record<string, unknown> | undefined;
  await page.route('**/api/leads', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ accepted: true, id: '2f34c831-67e3-4515-b86c-9159dd913b34' }),
    });
  });
  await page.goto('/?utm_source=smoke&utm_campaign=kinder');
  await page
    .locator('main')
    .getByRole('button', { name: 'Получить прайс-лист', exact: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: modalTitle });
  await expectCurrentLeadFields(dialog);
  await dialog.getByRole('button', { name: 'Получить прайс-лист', exact: true }).click();
  await expect(dialog.getByText('Введите имя — минимум 2 символа')).toBeVisible();
  await expect(dialog.getByText('Введите телефон', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Необходимо согласие на обработку данных')).toBeVisible();
  expect(payload).toBeUndefined();
  await dialog.getByLabel('Имя *', { exact: true }).fill('Тестовый покупатель');
  await dialog.getByLabel('Телефон *', { exact: true }).fill('+7 999 123-45-67');
  await dialog.getByRole('button', { name: 'Получить прайс-лист', exact: true }).click();
  await expect(dialog.getByText('Необходимо согласие на обработку данных')).toBeVisible();
  expect(payload).toBeUndefined();
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Получить прайс-лист', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Хорошее начало!' })).toBeVisible();
  expect(payload?.source).toBe('hero-price');
  expect(payload?.utmSource).toBe('smoke');
  expect(payload?.utmCampaign).toBe('kinder');
  expect(payload?.clientRequestId).toMatch(/^[0-9a-f-]{36}$/);
  expect(payload?.message).toBe('');
  expect(payload).not.toHaveProperty('email');
  expect(payload).not.toHaveProperty('company');
});

test('failed request retains the comment and retries the same immutable payload', async ({
  page,
}) => {
  const payloads: Record<string, unknown>[] = [];
  await page.route('**/api/leads', async (route) => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'temporarily_unavailable' }),
    });
  });
  await page.goto('/contacts');
  await page
    .locator('main')
    .getByRole('button', { name: 'Получить прайс-лист', exact: true })
    .click();
  const form = page.getByRole('form', { name: 'Заявка на наборы Kinder оптом' });
  await form.getByLabel('Имя *', { exact: true }).fill('Тестовый покупатель');
  await form.getByLabel('Телефон *', { exact: true }).fill('+7 999 123-45-67');
  await form.getByRole('button', { name: 'Добавить комментарий' }).click();
  const comment = form.getByLabel('Комментарий (необязательно)', { exact: true });
  await comment.fill('30 одинаковых наборов на выпускной');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Получить прайс-лист', exact: true }).click();
  await expect(form.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Хорошее начало!' })).toHaveCount(0);
  await expect(comment).toHaveValue('30 одинаковых наборов на выпускной');
  await expect(comment).toBeDisabled();
  await expect(form.getByLabel('Телефон *', { exact: true })).toBeDisabled();
  await form.getByRole('button', { name: 'Повторить отправку', exact: true }).click();
  await expect.poll(() => payloads.length).toBe(2);
  expect(payloads[1]).toEqual(payloads[0]);
  expect(payloads[0]?.source).toBe('contacts-price');
  expect(payloads[0]?.message).toBe('30 одинаковых наборов на выпускной');
  expect(payloads[0]).not.toHaveProperty('email');
  expect(payloads[0]).not.toHaveProperty('company');
});

test('every main conversion block opens the same short request form', async ({ page }) => {
  await page.goto('/');
  const ctas = [
    '8 марта',
    'Подобрать набор для меня',
    'Посмотреть и заказать: Новый год',
    'Посмотреть и заказать: Индивидуальный набор',
    'Узнать цену этого набора',
    'Запросить документы',
    'Обсудить индивидуальный набор',
    'Получить прайс-лист под мой объём',
    'Уточнить срок под мой заказ',
    'Уточнить детали хранения и доставки',
    'Уточнить доставку в мой город',
    'Написать менеджеру',
    'Хочу так же — оставить заявку',
  ];
  for (const name of ctas) {
    await test.step(name, async () => {
      const trigger = page.locator('main').getByRole('button', { name, exact: true });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: modalTitle });
      await expect(dialog).toBeVisible();
      await expectCurrentLeadFields(dialog);
      await dialog.getByRole('button', { name: 'Закрыть окно' }).click();
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
    });
  }
  const finalCta = page
    .locator('main')
    .getByRole('button', { name: 'Получить прайс-лист', exact: true })
    .last();
  await finalCta.click();
  await expect(page.getByRole('dialog', { name: modalTitle })).toBeVisible();
});

test('showcase mouse drag scrolls without selecting a card and the next click still works', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Примеры подарочных наборов' });
  const track = carousel.getByRole('list', { name: 'Выберите набор', exact: true });
  const first = track.getByRole('button', { name: 'Посмотреть состав набора «Спасибо, команда!»' });
  const second = track.getByRole('button', {
    name: 'Посмотреть состав набора «Новогоднее чудо»',
  });
  await track.scrollIntoViewIfNeeded();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(second).toHaveAttribute('aria-pressed', 'false');
  const beforeScroll = await track.evaluate((element) => element.scrollLeft);
  const card = await second.boundingBox();
  expect(card, 'The unselected card must be available for dragging').not.toBeNull();
  const startX = card!.x + card!.width / 2;
  const startY = card!.y + Math.min(90, card!.height / 3);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 180, startY, { steps: 12 });
  await page.mouse.up();
  await expect
    .poll(() => track.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(beforeScroll + 80);
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(second).toHaveAttribute('aria-pressed', 'false');
  await expect(
    page.locator('#showcase-details').getByRole('heading', { name: 'Спасибо, команда!' }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await second.click();
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await expect(first).toHaveAttribute('aria-pressed', 'false');
  await expect(
    page.locator('#showcase-details').getByRole('heading', { name: 'Новогоднее чудо' }),
  ).toBeVisible();
});

test('showcase changes composition with the keyboard and requests the selected set', async ({
  page,
}) => {
  let payload: Record<string, unknown> | undefined;
  await page.route('**/api/leads', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ accepted: true, id: 'ed6c5ff4-083b-4896-99ba-2d2a5c364277' }),
    });
  });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Примеры подарочных наборов' });
  const first = carousel.getByRole('button', {
    name: 'Посмотреть состав набора «Спасибо, команда!»',
  });
  await first.click();
  await first.press('End');
  const last = carousel.getByRole('button', { name: 'Посмотреть состав набора «Большой повод»' });
  await expect(last).toHaveAttribute('aria-pressed', 'true');
  await expect(last).toBeFocused();
  const details = page.locator('#showcase-details');
  await expect(details.getByRole('heading', { name: 'Большой повод' })).toBeVisible();
  await expect(details.getByText('Около 18 изделий в наборе')).toBeVisible();
  await details.getByRole('button', { name: 'Узнать цену этого набора', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: modalTitle });
  await dialog.getByLabel('Имя *', { exact: true }).fill('Мария');
  await dialog.getByLabel('Телефон *', { exact: true }).fill('+7 999 123-45-67');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Получить прайс-лист', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Заявка принята');
  expect(payload?.source).toBe('showcase-product:big-occasion');
});

test('legal links open the supplied policy and verified operator details', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await footer.getByRole('link', { name: /политик/i }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Политика конфиденциальности');
  await expect(page.locator('main time')).toHaveText('26.09.2026 г.');
  await expect(page.locator('main article > section')).toHaveCount(15);
  await expect(page.locator('main')).toContainText('771771661209');
  await expect(page.locator('main')).toContainText('321774600775832');
  await expect(page.locator('main')).not.toContainText('Редакция для макета');
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Пользовательское соглашение' })
    .click();
  await expect(page).toHaveURL(/\/agreement$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Пользовательское соглашение' }),
  ).toBeVisible();
  await expect(page.locator('main')).toContainText('ИП Гуледани Гурам Шалвович');
});

test('public pages show current occasions and delivery terms without wholesale amounts or payment terms', async ({
  page,
}) => {
  for (const path of ['/', '/catalog', '/contacts']) {
    await page.goto(path);
    const text = await page.locator('body').innerText();
    expect(text, path).not.toMatch(/1 сентября|день рождения|выпускно/i);
    expect(text, path).not.toMatch(
      /предоплат|рассроч|оплата после|оплатить|корзин|[0-9]\s*(₽|руб\.|рублей)/i,
    );
  }
  await page.goto('/');
  const tags = page.locator('[aria-label="Выберите аудиторию или повод"]');
  await expect(tags.getByRole('button', { name: '8 марта', exact: true })).toBeVisible();
  await expect(tags.getByRole('button', { name: '1 сентября', exact: true })).toHaveCount(0);
  const hero = page.getByRole('region', { name: 'Готовые подарочные наборы', exact: true });
  await expect(hero.getByText('Только настоящий Kinder · есть все документы')).toHaveCount(0);
  await expect(
    page.getByRole('heading', {
      name: /Наборы с Kinder более желанные,\s*чем обычные сладкие подарки/,
    }),
  ).toBeVisible();
  const occasions = page.getByRole('region', {
    name: 'Готовые наборы под любой повод — фото, состав и цена сразу',
    exact: true,
  });
  await expect(occasions.getByRole('article')).toHaveCount(5);
  for (const removed of ['1 сентября', 'День рождения ребёнка', 'Выпускной']) {
    await expect(occasions.getByRole('heading', { name: removed, exact: true })).toHaveCount(0);
  }
  await expect(
    page.locator('#documents').getByRole('heading', {
      name: /Kinder с завода Ferrero Russia\.\s*Регулярные официальные поставки\./,
    }),
  ).toBeVisible();
  await expect(
    page.locator('#timelines').getByRole('heading', {
      name: /Собираем быстро —\s*обычно от 2 до 10 дней/,
    }),
  ).toBeVisible();
  const wholesale = page.locator('#wholesale');
  await expect(wholesale).toContainText('Работаем на разных уровнях опта.');
  await expect(wholesale).toContainText(
    'Компании, предприниматели, подарки сотрудникам или клиентам',
  );
  await expect(wholesale).toContainText('Масштабные корпоративные поставки и не только');
  for (const level of ['Малый опт', 'Средний опт', 'Крупный опт']) {
    await expect(page.getByRole('heading', { name: level, exact: true })).toBeVisible();
  }
});

test('missing route presents recovery', async ({ page }) => {
  await page.goto('/missing-page');
  await expect(page.getByRole('heading', { name: 'Кажется, здесь пусто' })).toBeVisible();
  await page.getByRole('link', { name: 'Перейти в каталог', exact: true }).click();
  await expect(page).toHaveURL(/\/catalog$/);
});
