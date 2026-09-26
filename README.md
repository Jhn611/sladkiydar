# Доверху — оптовые подарочные наборы с продукцией Kinder

Корпоративный сайт на React 18 и TypeScript: длинная главная, каталог наборов, кейсы, детальная страница проекта, контакты и общая форма заявки. Fastify сохраняет заявку и VK outbox в одной PostgreSQL transaction. Отдельный worker доставляет уведомление и повторяет попытки при недоступности VK.

«Доверху» — сервис оптовой продажи подарочных наборов с продукцией Kinder. Красно-белая палитра и предметная композиция опираются на изображение пользователя; кейсы, изображения и коммерческие формулировки — демонстрационное наполнение. Реквизиты оператора и политика конфиденциальности обновлены по документу от 26.09.2026. Коммерческие утверждения и примеры проектов требуют подтверждения владельцем. Сторонние логотипы, фотографии и тексты референса не копируются. Композиционные наблюдения — в [reference audit](docs/reference-audit.md), технические решения — в [архитектуре](docs/architecture.md).

## Единая форма заявки

Все кнопки обращения к менеджеру открывают общую форму. Имя и телефон обязательны; комментарий необязателен и может оставаться пустым. Заголовок: «Пришлём прайс-лист и подберём набор под ваш бюджет», кнопка: «Получить прайс-лист». Для отправки требуется согласие на обработку персональных данных.

`POST /api/leads` принимает `name` (2–100 символов после trim), `phone` (10–15 цифр в допустимом формате) и необязательный `message` (до 2000 символов). `email` и `company` исключены из shared contract, формы, API, нормализации, VK и текущей схемы БД. Strict-валидация возвращает 400 при передаче этих старых полей, включая пустые строки. Пустой или пробельный комментарий хранится в PostgreSQL как `NULL` и не включается в VK-сообщение.

Технические поля `pageUrl`, `source`, `referrer`, UTM, `clientRequestId`, honeypot и обязательное `consent: true` сохраняются. Для новых заявок `consent_version = 2026-09-26` соответствует опубликованной редакции политики; версии ранее полученных согласий сохраняются. Оформление сайта не изменяет согласия задним числом.

## Структура

```text
apps/
  web/
    src/
      app/                     # Router, providers, design tokens
      pages/                   # Главная, каталог, кейсы, контакты и служебные страницы
      widgets/                 # Header, hero, секции, footer
      features/
        lead-form/             # RHF + Zod, отправка и состояния
        open-lead-modal/       # Общее действие открытия формы
      entities/case/           # Typed content, repository, карточка
      shared/                  # UI kit, API, SEO, assets, utilities
    public/                    # Статические файлы
    Dockerfile
  api/
    src/
      config/                  # Строгая ENV configuration
      db/                      # PostgreSQL, Drizzle schema, migrations entry
      modules/                 # Leads, outbox, VK
      api.ts                   # HTTP process
      worker.ts                # Фоновые уведомления
    drizzle/                   # SQL migrations и журнал
    test/                      # Integration / unit tests
    Dockerfile
packages/contracts/            # Общие Zod request/response schemas
infra/caddy/Caddyfile           # Единственная публичная точка входа
infra/web/default.conf          # Статика и SPA fallback
compose.yml                    # Production stack
compose.dev.yml                # Только локальная PostgreSQL
.env.example
```

## Локальный запуск

Нужны Node.js 22+, pnpm 10.15.1 и Docker с Compose v2. На Windows запустите Docker Desktop с Linux containers.

```sh
corepack enable
corepack prepare pnpm@10.15.1 --activate
pnpm install --frozen-lockfile
```

Скопируйте `.env.example` в `.env` (`cp .env.example .env`, PowerShell: `Copy-Item .env.example .env`). Для native development измените:

```dotenv
PUBLIC_ORIGIN=http://localhost:5173
VITE_SITE_URL=http://localhost:5173
```

`DATABASE_URL` подключает native API от имени `povod_api`, `WORKER_DATABASE_URL` — worker от имени `povod_worker`, `MIGRATION_DATABASE_URL` — миграции от имени администратора. Задайте три разных случайных пароля в `POSTGRES_PASSWORD`, `DB_API_PASSWORD`, `DB_WORKER_PASSWORD` и синхронно обновите соответствующие URL. Если порт 5432 занят, задайте `POSTGRES_PORT=15432` и замените порт во всех трёх URL и тестовом URL. Перед первым запуском API/worker обязательно выполните миграции: они создадут схему и отдельные рабочие роли. Подробности — в [инструкции по доступу к БД](docs/database-access.md).

```sh
docker compose -f compose.dev.yml up -d --wait
pnpm db:migrate
pnpm dev
```

Откройте `http://localhost:5173`. Vite перенаправляет `/api` на `127.0.0.1:3001`; запросы браузера остаются same-origin. В отдельном терминале запустите worker:

```sh
pnpm --filter @gift/api dev:worker
```

Без VK credentials форму можно проверять: заявка останется в PostgreSQL, а worker будет периодически повторять доставку. API успех означает сохранение заявки; ожидания VK в HTTP request нет.

## Переменные окружения

| Переменная                                          | Назначение                                                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `DOMAIN`                                            | Адрес Caddy: `http://localhost` локально или `gifts.example.com` для автоматического HTTPS                              |
| `PUBLIC_ORIGIN`                                     | Разрешённый origin формы без завершающего `/`: локально `http://localhost:5173`, production `https://gifts.example.com` |
| `VITE_SITE_URL`                                     | Публичный URL для canonical, OpenGraph и sitemap; задаётся **до сборки**                                                |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | База и административная роль: создание PostgreSQL и миграции                                                            |
| `POSTGRES_PORT`                                     | Порт только локального Compose PostgreSQL, по умолчанию `5432`                                                          |
| `DATABASE_URL`                                      | Native API с ограниченной ролью; каждый Compose-процесс получает свой URL с hostname `postgres`                         |
| `DB_API_USER`, `DB_API_PASSWORD`                    | Отдельная роль API (`povod_api` по умолчанию); пароль обязателен в Compose                                              |
| `DB_WORKER_USER`, `DB_WORKER_PASSWORD`              | Отдельная роль worker (`povod_worker` по умолчанию); пароль обязателен в Compose                                        |
| `WORKER_DATABASE_URL`                               | Native worker: URL со своей ограниченной ролью; в Compose используется персональный `DATABASE_URL`                      |
| `MIGRATION_DATABASE_URL`                            | Native миграции: URL администратора; в Compose административный `DATABASE_URL` получает только `migrate`                |
| `VK_GROUP_TOKEN`, `VK_GROUP_ID`, `VK_PEER_ID`       | Токен сообщества, его ID и ID получателя; доступны только worker                                                        |
| `NODE_ENV`                                          | `development`, `test` или `production`; Compose принудительно задаёт production                                         |
| `HOST`, `PORT`                                      | Bind API, по умолчанию `0.0.0.0:3001`                                                                                   |
| `TRUST_PROXY_HOPS`                                  | `0` локально; Compose задаёт `1`, поскольку перед API находится Caddy                                                   |
| `LOG_LEVEL`                                         | Уровень структурированных логов, по умолчанию `info`                                                                    |
| `RATE_LIMIT_MAX`                                    | Лимит POST-заявок с одного IP в окно rate limiter; по умолчанию `8`                                                     |
| `WORKER_POLL_MS`                                    | Пауза обхода очереди, по умолчанию `3000` мс                                                                            |
| `WORKER_LOCK_MS`                                    | Время до восстановления зависшей задачи, по умолчанию `120000` мс                                                       |
| `VK_TIMEOUT_MS`                                     | Таймаут VK HTTP, по умолчанию `15000` мс                                                                                |
| `MIGRATIONS_DIR`                                    | Путь к SQL migrations; внутри API package и контейнера `./drizzle`                                                      |
| `TEST_DATABASE_URL`                                 | Необязательная отдельная тестовая PostgreSQL; её таблицы очищаются тестами                                              |

`.env` игнорируется Git и исключён из Docker build context. Реальные secrets нельзя помещать в `VITE_*`: эти значения доступны браузеру. Используйте три разных случайных URL-safe пароля, например по 64 hex-символа: Compose включает их в connection strings. В native URL пароль должен соответствовать своей роли; специальные URL-символы требуют percent-encoding. В production API и worker получают только свой `DATABASE_URL`, без административного пароля и без пароля другого сервиса. Настройка ролей выполняется отдельным процессом `migrate`.

## Проверки

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Backend integration tests по умолчанию используют изолированную PGlite (PostgreSQL в WASM). Для проверки реального PostgreSQL и конкурентного claim создайте **отдельную** базу:

```sh
docker compose -f compose.dev.yml exec postgres createdb -U povod povod_test
```

Запустите API tests с `TEST_DATABASE_URL=postgresql://povod:replace-with-strong-password@localhost:5432/povod_test`. В Bash:

```sh
TEST_DATABASE_URL=postgresql://povod:replace-with-strong-password@localhost:5432/povod_test pnpm --filter @gift/api test
```

В PowerShell:

```powershell
$env:TEST_DATABASE_URL='postgresql://povod:replace-with-strong-password@localhost:5432/povod_test'
pnpm --filter @gift/api test
Remove-Item Env:TEST_DATABASE_URL
```

Для `TEST_DATABASE_URL` нужна административная роль отдельной тестовой базы: рабочие роли API/worker намеренно не могут очищать таблицы или применять миграции. Никогда не указывайте рабочую базу: integration tests очищают `leads` и `notification_outbox`. Тесты проверяют atomic transaction, idempotency, VK error/success, retry и stale locks. Frontend tests проверяют validation, submit success/error и modal. Playwright покрывает маршруты, CTA, клавиатурное управление и адаптивность; браузерные тесты не требуют реального VK token.

## Migrations

`apps/api/src/db/schema.ts` описывает схему Drizzle; SQL и журнал находятся в `apps/api/drizzle`. Локально применяйте `pnpm db:migrate`. При изменении схемы добавляйте следующую SQL migration и запись в `drizzle/meta/_journal.json`, проверяйте новую базу и обновление существующей. Уже применённые migrations не редактируйте.

В Compose `migrate` автоматически запускает `node dist/migrate.js` после healthy PostgreSQL. Процесс сначала применяет Drizzle migrations, затем создаёт/обновляет ограниченные роли API и worker и их явные разрешения. API и worker запускаются только после успешного завершения обоих шагов. Повторный запуск пропускает уже применённые SQL migrations и заново сверяет роли, пароли и права. Перед изменением production schema создайте backup и проверьте восстановление. Миграции хранятся в том же image, что и API/worker.

Миграция `0001_simplify_lead_fields.sql` удаляет только `email` и `company` из существующей `leads`. `name` и `phone` остаются `NOT NULL`, `message` остаётся nullable. ID, атрибуция, комментарии, версия согласия и связанные уведомления сохраняются. Исходная `0000_leads_outbox.sql` неизменна: упоминания удалённых полей в ней необходимы для воспроизводимой истории. Перед применением `0001` остановите старые API/worker, создайте и проверьте backup, примените миграцию из нового backend image и проверьте сохранность данных до запуска нового worker. Порядок обновления приведён в [инструкции миграции формы](docs/deploy-lead-fields.md).

## Production / Docker

На сервере должны быть Docker, Compose v2, открытые TCP 80/443 и при необходимости UDP 443. DNS домена должен указывать на сервер. Скопируйте `.env.example` в `.env`, задайте разные случайные `POSTGRES_PASSWORD`, `DB_API_PASSWORD`, `DB_WORKER_PASSWORD` и:

```dotenv
DOMAIN=gifts.example.com
PUBLIC_ORIGIN=https://gifts.example.com
VITE_SITE_URL=https://gifts.example.com
NODE_ENV=production
VK_GROUP_TOKEN=your-community-token
VK_GROUP_ID=your-community-id
VK_PEER_ID=your-recipient-peer-id
VK_API_VERSION=5.199
```

`gifts.example.com` — пример, замените своим доменом. Для локального запуска всего production stack оставьте `DOMAIN=http://localhost`, `PUBLIC_ORIGIN=http://localhost`, `VITE_SITE_URL=http://localhost` и откройте `http://localhost`.

```sh
docker compose config --quiet
docker compose up -d --build --wait
docker compose ps
docker compose logs --tail=100 api worker migrate
```

Если Docker Desktop на Windows выдаёт `x-docker-expose-session-sharedkey ... non-printable ASCII characters` при сборке из каталога с кириллицей, создайте временную junction с ASCII-именем и запускайте Compose из неё. Файлы проекта и volumes остаются на месте:

```powershell
$buildLink = Join-Path $env:TEMP 'sladkiy-dar-workspace'
if (-not (Test-Path -LiteralPath $buildLink)) {
  New-Item -ItemType Junction -Path $buildLink -Target (Get-Location).Path
}
Set-Location -LiteralPath $buildLink
docker compose up -d --build --wait
```

Не публикуйте вывод полного `docker compose config`: он содержит подставленные secrets. Caddy автоматически получает и обновляет TLS-сертификат публичного домена. `/api/*` проксируется в Fastify; остальные запросы — в контейнер со статикой. SPA fallback позволяет открывать `/cases/:slug` напрямую. API, worker и PostgreSQL не имеют публичных ports. `compose.dev.yml` запускается отдельно и не добавляется к production command.

Сборки многостадийные, установка фиксируется `pnpm-lock.yaml`, frontend — `vite build`, API/worker — `tsup`. Worker и migrations используют тот же image, что API. API и web имеют healthchecks, PostgreSQL — `pg_isready`; readiness API проверяет соединение с базой. Worker диагностируется по событиям claim/send/failure/retry/recovery и process lifecycle.

Frontend build запускает Vite через `apps/web/scripts/build.mjs`, который устанавливает `NODE_ENV=production` до загрузки сборщика. Поэтому `NODE_ENV=development` в общем локальном `.env` не включает development-версию React в production bundle. `pnpm dev` запускает web и API; worker запускается отдельной командой, указанной выше.

PostgreSQL healthcheck проверяет TCP, чтобы временный Unix-socket сервер во время `initdb` не считался готовым. На первый запуск и восстановление предусмотрен startup grace 10 минут; он не задерживает быстрый запуск. Для дисков с медленным fsync настроены `PGCTLTIMEOUT=300` и двухминутное корректное завершение контейнера. Значение [PGCTLTIMEOUT](https://www.postgresql.org/docs/17/app-pg-ctl.html) управляет ожиданием запуска/остановки в `pg_ctl`.

При смене домена обновите `DOMAIN`, `PUBLIC_ORIGIN`, `VITE_SITE_URL` и пересоберите web: SEO URL входит в build. Обновление приложения:

```sh
docker compose up -d --build --wait
```

`docker compose down` останавливает стек, сохраняя данные. Флаг `-v` удаляет volumes и заявки — не используйте его для обычного обновления. Изменение `POSTGRES_PASSWORD` в `.env` не меняет пароль уже созданной базы: сначала измените административную роль средствами PostgreSQL, затем обновите приложение. Пароли ограниченных ролей обновляются повторным запуском `migrate`; после этого пересоздайте API и worker с новой конфигурацией. При переходе существующей установки на отдельные роли используйте [порядок обновления с резервной копией](docs/database-access.md).

## Настройка VK

Уведомления отправляет бот сообщества через `messages.send`. Нужны включённые сообщения сообщества, ключ с правом `messages`, числовой ID сообщества и выбранного личного диалога/беседы. Подробная инструкция, получение `peer_id`, ошибки прав и порядок включения — в [docs/vk-setup.md](docs/vk-setup.md).

В `.env` задаются `VK_GROUP_TOKEN`, `VK_GROUP_ID`, `VK_PEER_ID`, `VK_API_VERSION=5.199` и `VK_TIMEOUT_MS=15000`. Токен хранится на сервере, доступен только worker и передаётся в теле HTTPS POST, не в URL. Не присылайте токен в чат. Пока настройки пусты, API продолжает сохранять заявки, а уведомления остаются в очереди. Входящие Callback API/Long Poll для этой односторонней доставки не нужны.

## Outbox, idempotency и диагностика

`POST /api/leads` валидирует и нормализует данные, а затем **одной transaction** сохраняет заявку и outbox. Возвращается `{ "accepted": true, "id": "uuid" }`. Уникальный `client_request_id` защищает от double click и network retry; повтор возвращает прежний ID. Ошибка API оставляет форму с понятным сообщением и возможностью повтора.

Worker атомарно claim-ит задачу, отпускает PostgreSQL transaction до HTTPS-запроса, после успеха помечает `sent`. После ошибки увеличивает `attempts`, сохраняет `last_error` и ставит `next_attempt_at` с exponential backoff + jitter. HTTP `429` учитывает `Retry-After`; VK errors `6`, `9`, `10`, `29` внутри HTTP 200 также вызывают повтор; при неверных credentials используются редкие повторные проверки. Попытки продолжаются, запись не удаляется. Зависшие `processing` jobs возвращаются в работу по истечении lock timeout.

Попытки доставки продолжаются до подтверждения. Каждая outbox-запись получает уникальный положительный `random_id` из PostgreSQL identity; повторные попытки используют тот же ID, позволяя VK распознавать повтор запроса. Область и срок внешней дедупликации не гарантируются приложением, поэтому exactly once не обещается. Недоступность VK не означает ошибку формы после подтверждённого commit. Имя, телефон, комментарий и атрибуция отправляются обычным текстом; разбор упоминаний и предпросмотр ссылок отключены.

```sh
docker compose logs -f --tail=100 api worker
docker compose exec postgres psql -U povod -d povod -c "SELECT status, count(*) FROM notification_outbox GROUP BY status;"
```

Замените `povod`, если изменяли username/database. Не включайте полные персональные данные в application logs. `live` показывает жизнь API process, `ready` — готовность PostgreSQL. Для production подключите внешний uptime check на `/api/health/ready` и оповещение о длительном росте pending/processing очереди.

## Backup и восстановление PostgreSQL

Именованный volume сохраняет данные при restart/recreate, но не защищает от потери диска. Сохраняйте резервные копии на отдельном носителе с ограниченным доступом: они содержат персональные данные. Следующий способ не перенаправляет бинарный dump через PowerShell и одинаково подходит Windows/Linux.

Создайте каталог `backups`, затем:

```sh
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/povod.dump'
docker compose cp postgres:/tmp/povod.dump ./backups/povod.dump
```

Используйте разные имена для датированных копий и настройте ежедневное выполнение на сервере. Периодически проверяйте восстановление в отдельную базу. Пример без перезаписи существующей рабочей базы:

```sh
docker compose cp ./backups/povod.dump postgres:/tmp/restore.dump
docker compose exec -T postgres sh -c 'createdb -U "$POSTGRES_USER" povod_restore'
docker compose exec -T postgres sh -c 'pg_restore --no-owner --no-privileges --exit-on-error -U "$POSTGRES_USER" -d povod_restore /tmp/restore.dump'
```

Проверьте восстановленные таблицы, количество заявок, очередь и identity sequence `random_id`. Дамп одной базы не содержит глобальные роли PostgreSQL; параметры `--no-owner --no-privileges` оставляют назначение владельцев и прав текущему администратору и команде настройки ролей.

Для переключения запланируйте короткое обслуживание: остановите `api` и `worker`, задайте `POSTGRES_DB=povod_restore`, **новые** `DB_API_USER`/`DB_WORKER_USER` и отдельные пароли в `.env`. Существующие роли привязаны к OID старой базы и намеренно не принимаются для другой базы того же кластера. При native запуске синхронно обновите все три URL. Выполните `docker compose run --rm migrate`, проверьте права и данные, затем `docker compose up -d --no-deps --force-recreate api worker`. Полный порядок и отличие восстановления в новый кластер — в [инструкции доступа к БД](docs/database-access.md#резервная-копия-и-восстановление).

Старая база и её роли остаются на месте. Новые заявки, появившиеся после backup, в копию не входят: для финального переноса сделайте актуальную копию при остановленных API/worker. Worker проверочной копии не подключайте к реальному VK-получателю, чтобы не отправить сохранённую очередь повторно.

## Как расширять

**Страница.** Добавьте компонент в `apps/web/src/pages/<page>`, подключите lazy route в `app/router`, задайте title/description/canonical через `shared/lib/Seo`, добавьте URL в sitemap и smoke test. Общие композиции размещайте в widgets, действие пользователя — в features.

**Кейс.** Добавьте запись типа `Case` в `entities/case/model/cases.ts`, собственные изображения с размерами, краткий и подробный текст. Уникальный slug становится `/cases/:slug`. Данные читаются через `entities/case/api/caseRepository.ts`; убедитесь, что новый URL появился в sitemap.

**CTA / форма.** Все CTA используют одно всплывающее окно. Для кнопки вызовите `useLeadModal().openLeadModal('hero-primary')` внутри `LeadModalProvider`. URL, source, UTM, referrer и idempotency key собираются общей feature. Для новых полей сначала измените Zod contract в `packages/contracts`, затем schema/migration, application mapping и форму. Не создавайте отдельную копию request interface.

**CMS.** Сначала замените реализацию `caseRepository.list/findBySlug` на запрос к API/CMS. Секционные повторяющиеся данные хранятся рядом с widgets и могут подключаться аналогично. Токены CMS держите на backend; публичные компоненты не должны знать провайдера. CMS/admin не реализованы заранее.

**Дизайн и контент.** Цвета, типографика, spacing, радиусы и анимации задаются CSS custom properties в app styles. Используйте CSS Modules и существующий UI kit. Крупные изображения получают width/height или aspect ratio; hero не lazy-load, ниже первого экрана — lazy. Проверяйте keyboard/focus/ESC, reduced motion и ширины 375, 430, 768, 1024, 1280, 1440, 1920 px.

## Проверка backend после упрощения формы — 11 сентября 2026

Contracts: 22 теста. API: 37 тестов на PostgreSQL 17, включая обязательные имя/телефон, пустой комментарий, отклонение удалённых полей и сохранность данных при обновлении схемы. Typecheck контрактов/API, API lint и API build прошли. Backup рабочей БД проверен восстановлением в отдельную базу и применением `0001` к копии: оставшиеся поля заявок и полный outbox совпали по хэшам. Подробности и отдельный статус runtime-обновления — в [QA report](docs/qa.md).

## Проверки и история обновлений

Форма с обязательными именем/телефоном и необязательным комментарием проверена через настоящий PostgreSQL и локальный production stack: новая заявка получает 201, идемпотентный повтор — 200, а уведомление создаётся ровно один раз. Сохранность данных при миграциях проверяется отдельно от доставки. Текущие результаты и явно отмеченная история предыдущих версий находятся в [QA report](docs/qa.md).

Локальный stack обновлён 11 сентября 2026 в 16:26 МСК: API, web и PostgreSQL healthy; новый VK worker работает; `0002` применена, журнал содержит 3 миграции. Проверенный backup и сравнение хэшей подтвердили сохранность двух исходных заявок и их outbox. Production smoke проверил новый `vk.lead.created` и положительный `random_id`, затем удалил только собственные тестовые записи. VK token/group/peer пока пусты, реальные сообщения не отправлялись. Отчёт: `.cache/production-vk-smoke.json`.

Интеграция VK проверяется с подменённым HTTP transport: реальные сообщения без настроенного получателя не отправляются. Для запуска нового worker требуется применить `0002_vk_notifications.sql` после backup и остановки прежнего worker. Миграция присваивает стабильные `random_id`, переводит неотправленную очередь на `vk.lead.created`, сохраняет заявки и уже отправленную историю. Перед включением доставки подтвердите получателя по [инструкции VK](docs/vk-setup.md).

## Границы текущей версии

Контент и юридическая информация требуют замены данными владельца бизнеса. Каталог реализован на локальных типизированных данных. Нет CMS/admin, корзины и онлайн-оплаты, файловых вложений, автоматического экспорта заявок или мониторингового сервиса: это точки дальнейшего развития. SPA использует клиентскую маршрутизацию; для сложного SEO большого каталога можно добавить prerendering при появлении такой задачи. Rate limiting рассчитан на один API instance. Резервные копии и production alerts нужно подключить к инфраструктуре владельца сервера.

Внутренние имена Compose-проекта, Docker images, баз и workspace пока сохраняют технический идентификатор `povod`. Пользовательское название — «Доверху»; смена названия сайта не переименовывает существующие volumes и не создаёт новую пустую базу.

Технические источники: [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), [pnpm deploy](https://pnpm.io/10.x/cli/deploy), [PostgreSQL pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html), [VK messages.send](https://dev.vk.com/ru/method/messages.send), [официальная схема VKCOM](https://github.com/VKCOM/vk-api-schema).
