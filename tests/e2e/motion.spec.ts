import { test, expect, type Page } from '@playwright/test';

const promptKey = 'sladkiy-dar:lead-prompt:v1';
const title = 'Пришлём прайс-лист и подберём набор под ваш бюджет';

async function startClock(page: Page) {
  const start = new Date('2026-09-11T12:00:00Z');
  await page.clock.install({ time: start });
  await page.clock.pauseAt(new Date(start.getTime() + 1000));
}

async function scrollToCustom(page: Page) {
  await page
    .locator('#custom')
    .evaluate((element) => element.scrollIntoView({ behavior: 'instant', block: 'start' }));
}

async function suppressPrompt(page: Page) {
  await page.addInitScript(
    (key) => sessionStorage.setItem(key, JSON.stringify({ consumed: true, elapsedMs: 0 })),
    promptKey,
  );
}

test('timer prompt appears once and scrolling or reloading cannot reopen it', async ({ page }) => {
  await startClock(page);
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: title });
  await page.clock.runFor(51_000);
  await expect(dialog).not.toBeVisible();
  await page.clock.runFor(1000);
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Имя *', { exact: true }).fill('Анна');
  await page.clock.runFor(5000);
  await expect(dialog.getByLabel('Имя *', { exact: true })).toHaveValue('Анна');
  await dialog.getByRole('button', { name: 'Закрыть окно' }).click();
  await scrollToCustom(page);
  await page.clock.runFor(5000);
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await scrollToCustom(page);
  await page.clock.runFor(65_000);
  await expect(dialog).not.toBeVisible();
  await page
    .locator('#custom')
    .getByRole('button', { name: 'Обсудить индивидуальный набор' })
    .click();
  await expect(dialog).toBeVisible();
});

test('scroll prompt wins the timer race and keeps the correct attribution on submit', async ({
  page,
}) => {
  let source: string | undefined;
  await page.route('**/api/leads', async (route) => {
    source = route.request().postDataJSON().source;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ accepted: true, id: '8437d29d-e8b9-4d23-a4b8-12d005d2471a' }),
    });
  });
  await startClock(page);
  await page.goto('/');
  await page.clock.runFor(47_000);
  await scrollToCustom(page);
  const dialog = page.getByRole('dialog', { name: title });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Имя *', { exact: true }).fill('Мария');
  await page.clock.runFor(10_000);
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  await expect(dialog.getByLabel('Имя *', { exact: true })).toHaveValue('Мария');
  await dialog.getByLabel('Телефон *', { exact: true }).fill('+7 999 123-45-67');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Получить прайс-лист', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Заявка принята');
  expect(source).toBe('auto-scroll-custom');
  await dialog.getByRole('button', { name: 'Закрыть окно' }).click();
  await page.clock.runFor(65_000);
  await expect(dialog).not.toBeVisible();
});

test('manual opening consumes both automatic triggers without disabling manual buttons', async ({
  page,
}) => {
  await startClock(page);
  await page.goto('/');
  const button = page
    .getByRole('banner')
    .getByRole('button', { name: 'Получить прайс', exact: true });
  await button.click();
  const dialog = page.getByRole('dialog', { name: title });
  await dialog.getByRole('button', { name: 'Закрыть окно' }).click();
  await page.clock.runFor(65_000);
  await scrollToCustom(page);
  await expect(dialog).not.toBeVisible();
  await page.getByRole('banner').getByRole('link', { name: 'Каталог', exact: true }).click();
  await page.getByRole('banner').getByRole('link', { name: 'Главная', exact: true }).click();
  await page.clock.runFor(65_000);
  await expect(dialog).not.toBeVisible();
  await button.click();
  await expect(dialog).toBeVisible();
});

test('timer does not interrupt the mobile menu or steal its form handoff', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let source: string | undefined;
  await page.route('**/api/leads', async (route) => {
    source = route.request().postDataJSON().source;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ accepted: true, id: '8437d29d-e8b9-4d23-a4b8-12d005d2471a' }),
    });
  });
  await startClock(page);
  await page.goto('/');
  await page.clock.runFor(47_000);
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  const menu = page.getByRole('dialog', { name: 'Меню', exact: true });
  await page.clock.runFor(6000);
  await expect(menu).toBeVisible();
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  await menu.getByRole('button', { name: 'Получить прайс-лист', exact: true }).click();
  await page.clock.runFor(1000);
  const dialog = page.getByRole('dialog', { name: title });
  await expect(dialog).toBeVisible();
  await expect(menu).not.toBeVisible();
  await dialog.getByLabel('Имя *', { exact: true }).fill('Ирина');
  await dialog.getByLabel('Телефон *', { exact: true }).fill('+7 999 123-45-67');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Получить прайс-лист', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Заявка принята');
  expect(source).toBe('mobile-menu');
});

test('legal pages never open a timed lead prompt', async ({ page }) => {
  await startClock(page);
  await page.goto('/privacy');
  await page.clock.runFor(70_000);
  await expect(page.getByRole('dialog', { name: title })).not.toBeVisible();
});

test('hero automatically changes photos under the mouse and keeps running despite OS reduced motion', async ({
  page,
}) => {
  await suppressPrompt(page);
  await startClock(page);
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Готовые подарочные наборы', exact: true });
  const image = hero.locator('img').first();
  const first = await image.getAttribute('src');
  await page.mouse.move(0, 0);
  await page.clock.runFor(6500);
  await expect(image).not.toHaveAttribute('src', first!);
  await hero.hover();
  const hovered = await image.getAttribute('src');
  await page.clock.runFor(14_000);
  await expect(image).not.toHaveAttribute('src', hovered!);
  await page.mouse.move(0, 0);
  const beforeLeaving = await image.getAttribute('src');
  await page.clock.runFor(6500);
  await expect(image).not.toHaveAttribute('src', beforeLeaving!);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = await image.getAttribute('src');
  await page.clock.runFor(6000);
  await expect(image).not.toHaveAttribute('src', reduced!);
});

test('showcase autoplay changes the composition without scrolling the page vertically', async ({
  page,
}) => {
  await suppressPrompt(page);
  await startClock(page);
  await page.goto('/');
  const gallery = page.getByRole('region', { name: 'Примеры подарочных наборов', exact: true });
  await gallery.evaluate((element) =>
    element.scrollIntoView({ behavior: 'instant', block: 'center' }),
  );
  await page.mouse.move(0, 0);
  const selected = gallery.locator('button[aria-pressed="true"]');
  const first = await selected.getAttribute('aria-label');
  const scrollY = await page.evaluate(() => window.scrollY);
  await page.clock.runFor(7500);
  await expect(selected).not.toHaveAttribute('aria-label', first!);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
  await page.locator('#showcase-details').hover();
  const paused = await selected.getAttribute('aria-label');
  await page.clock.runFor(15_000);
  await expect(selected).toHaveAttribute('aria-label', paused!);
});

test('hearts orbit the tilted final gift, stop offscreen and run despite OS reduced motion on mobile', async ({
  page,
}) => {
  await suppressPrompt(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const circle = page.locator('#request [data-motion-active]');
  const heart = circle.locator('svg[data-icon="heart"]').first();
  await circle.scrollIntoViewIfNeeded();
  await expect(circle).toHaveAttribute('data-motion-active', 'true');
  const before = await heart.boundingBox();
  await expect
    .poll(async () => {
      const after = await heart.boundingBox();
      return Math.hypot(after!.x - before!.x, after!.y - before!.y);
    })
    .toBeGreaterThan(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(circle).toHaveAttribute('data-motion-active', 'false');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await circle.scrollIntoViewIfNeeded();
  await expect(circle).toHaveAttribute('data-motion-active', 'true');
  const movingAnimations = await circle.evaluate(
    (element) =>
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.playState === 'running').length,
  );
  expect(movingAnimations).toBeGreaterThan(0);
  const angle = await circle.locator('svg[data-icon="gift"]').evaluate((icon) => {
    const matrix = new DOMMatrix(getComputedStyle(icon.parentElement!).transform);
    return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
  });
  expect(angle).toBeCloseTo(7, 1);
});

test('hero mouse dragging changes one photo and leaves its controls usable', async ({ page }) => {
  await suppressPrompt(page);
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Готовые подарочные наборы', exact: true });
  await hero.getByRole('button', { name: 'Приостановить смену фото' }).click();
  const image = hero.locator('img');
  const first = await image.getAttribute('src');
  const box = (await image.boundingBox())!;
  const start = { x: box.x + box.width * 0.75, y: box.y + box.height * 0.4 };
  const end = { x: box.x + box.width * 0.25, y: start.y };
  const beforeY = await page.evaluate(() => window.scrollY);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await expect(hero).toHaveAttribute('data-dragging', 'true');
  await expect(image).toHaveAttribute('src', first!);
  await page.mouse.up();
  await expect(hero).not.toHaveAttribute('data-dragging', 'true');
  await expect(image).not.toHaveAttribute('src', first!);
  expect(await page.evaluate(() => window.scrollY)).toBe(beforeY);
  await page.mouse.move(end.x, end.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y, { steps: 8 });
  await page.mouse.up();
  await expect(image).toHaveAttribute('src', first!);
  await hero.getByRole('button', { name: 'Следующий набор', exact: true }).click();
  await expect(image).not.toHaveAttribute('src', first!);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('hero decorations loop even when the operating system reduces motion and photos are paused', async ({
  page,
}) => {
  await suppressPrompt(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Готовые подарочные наборы', exact: true });
  await hero.getByRole('button', { name: 'Приостановить смену фото' }).click();
  await hero.hover();
  const heart = hero.locator('svg[data-icon="heart"]').locator('..');
  await expect
    .poll(() => heart.evaluate((element) => getComputedStyle(element).animationPlayState))
    .toBe('running');
  expect(await heart.evaluate((element) => getComputedStyle(element).animationIterationCount)).toBe(
    'infinite',
  );
  const before = (await heart.boundingBox())!;
  await expect
    .poll(async () => {
      const after = (await heart.boundingBox())!;
      return Math.hypot(after.x - before.x, after.y - before.y);
    })
    .toBeGreaterThan(4);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );
  const image = hero.locator('img');
  const first = await image.getAttribute('src');
  await hero.getByRole('button', { name: 'Следующий набор', exact: true }).click();
  await expect(image).not.toHaveAttribute('src', first!);
  await expect
    .poll(() => heart.evaluate((element) => getComputedStyle(element).animationPlayState))
    .toBe('running');
});

test('hero native touch swipes both ways and preserves vertical page scrolling', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  try {
    const page = await context.newPage();
    await suppressPrompt(page);
    await page.goto(process.env.E2E_BASE_URL || 'http://127.0.0.1:5173');
    const hero = page.getByRole('region', { name: 'Готовые подарочные наборы', exact: true });
    await hero.evaluate((element) =>
      element.scrollIntoView({ block: 'center', behavior: 'instant' }),
    );
    await hero.getByRole('button', { name: 'Приостановить смену фото' }).click();
    const image = hero.locator('img');
    const first = await image.getAttribute('src');
    const cdp = await context.newCDPSession(page);
    async function swipe(from: { x: number; y: number }, to: { x: number; y: number }) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
      for (let step = 1; step <= 10; step++) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [
            {
              x: from.x + ((to.x - from.x) * step) / 10,
              y: from.y + ((to.y - from.y) * step) / 10,
            },
          ],
        });
        await page.waitForTimeout(30);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    const box = (await image.boundingBox())!;
    const left = { x: box.x + box.width * 0.18, y: box.y + box.height * 0.4 };
    const right = { x: box.x + box.width * 0.82, y: left.y };
    const beforeY = await page.evaluate(() => window.scrollY);
    await swipe(right, left);
    await expect(image).not.toHaveAttribute('src', first!);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - beforeY)).toBeLessThan(5);
    await swipe(left, right);
    await expect(image).toHaveAttribute('src', first!);
    const nextBox = (await image.boundingBox())!;
    const x = nextBox.x + nextBox.width / 2;
    await swipe(
      { x, y: nextBox.y + nextBox.height * 0.75 },
      { x, y: nextBox.y + nextBox.height * 0.15 },
    );
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(beforeY + 60);
    await expect(image).toHaveAttribute('src', first!);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  } finally {
    await context.close();
  }
});

test('hero resumes autoplay after mouse arrows and play without requiring a focus change', async ({
  page,
}) => {
  await suppressPrompt(page);
  await startClock(page);
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Готовые подарочные наборы', exact: true });
  const image = hero.locator('img');
  const next = hero.getByRole('button', { name: 'Следующий набор', exact: true });
  await next.click();
  await expect(next).toBeFocused();
  await expect(hero).toHaveAttribute('data-playing', 'true');
  const manual = await image.getAttribute('src');
  await page.clock.runFor(5999);
  await expect(image).toHaveAttribute('src', manual!);
  await page.clock.runFor(1);
  await expect(image).not.toHaveAttribute('src', manual!);
  await hero.getByRole('button', { name: 'Приостановить смену фото' }).click();
  const paused = await image.getAttribute('src');
  await page.clock.runFor(20_000);
  await expect(image).toHaveAttribute('src', paused!);
  const play = hero.getByRole('button', { name: 'Включить смену фото' });
  await play.click();
  await expect(hero).toHaveAttribute('data-playing', 'true');
  await page.clock.runFor(6000);
  await expect(image).not.toHaveAttribute('src', paused!);
  await page.keyboard.press('Tab');
  const keyboard = await image.getAttribute('src');
  await expect(hero).toHaveAttribute('data-playing', 'false');
  await page.clock.runFor(12_000);
  await expect(image).toHaveAttribute('src', keyboard!);
  await image.click({ position: { x: 150, y: 150 } });
  await expect(hero).toHaveAttribute('data-playing', 'true');
  await page.clock.runFor(6000);
  await expect(image).not.toHaveAttribute('src', keyboard!);
});
