# Обновление формы и рабочей PostgreSQL

Эта инструкция относится к `0001_simplify_lead_fields.sql`: удаляются только `leads.email` и `leads.company`. Имя и телефон остаются обязательными, комментарий необязателен. Порядок рассчитан на текущий локальный Compose-проект `povod`; имя БД и пользователь — `povod`.

11 сентября создан и проверен восстановлением backup `.cache/backups/sladkiy-dar-before-lead-fields-20260911.dump`. Manifest `.cache/backups/before-lead-fields.json` содержит количество строк и хэши сохраняемых полей заявок и полного outbox. Миграция применена к рабочей БД 11 сентября в 11:17 МСК; сравнение данных до запуска worker прошло. Ниже сохранена последовательность выполненного обновления. Повторный запуск `Before` после миграции намеренно отклонит уже обновлённую схему.

Сначала соберите новые образы из окончательных frontend/backend исходников. Сборка не применяет миграции:

```powershell
$ErrorActionPreference = 'Stop'
docker compose config --quiet
if ($LASTEXITCODE -ne 0) { throw 'Invalid Compose configuration' }
docker compose build api web
if ($LASTEXITCODE -ne 0) { throw 'Image build failed' }
```

При проблеме Docker Desktop с кириллическим путём используйте ASCII junction из README. API, worker и migrate используют общий образ `povod-api:local`.

Затем начинается короткое окно обновления. Остановите публичный вход и процессы, которые работают со старой схемой; база должна оставаться healthy:

```powershell
docker compose stop --timeout 30 caddy api worker
if ($LASTEXITCODE -ne 0) { throw 'Failed to stop old processes' }
docker compose up -d --no-deps --wait postgres
if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL is not ready' }
```

Перед миграцией сравните текущие данные с проверенным backup. Подготовленный локальный помощник `.cache/verify-lead-fields-migration.ps1` выполняет только агрегатный SQL и не выводит персональные данные:

```powershell
& .cache/verify-lead-fields-migration.ps1 -Phase Before
```

Помощник проверяет количество заявок, количество outbox и следующие хэши:

```sql
SELECT
  (SELECT md5(string_agg((to_jsonb(l) - 'email' - 'company')::text, ',' ORDER BY id)) FROM leads l) AS retained_leads_hash,
  (SELECT md5(string_agg(to_jsonb(o)::text, ',' ORDER BY id)) FROM notification_outbox o) AS outbox_hash;
```

Если данные отличаются, остановите обновление: после backup были изменения. Создайте новый датированный `pg_dump`, проверьте восстановление и обновите manifest до продолжения. Backup и локальный помощник находятся в ignored `.cache` и не входят в приложение.

Примените миграцию из нового образа отдельным Compose service. Эта команда не запускает API, worker или frontend:

```powershell
docker compose up --no-deps --no-build --force-recreate --exit-code-from migrate migrate
if ($LASTEXITCODE -ne 0) { throw 'Migration failed; keep old processes stopped' }
& .cache/verify-lead-fields-migration.ps1 -Phase After
```

После `After` должны совпасть прежние количества строк и хэши. Журнал должен содержать две миграции, `email` и `company` отсутствовать, `name`/`phone` оставаться `NOT NULL`, `message` — nullable. Помощник сохраняет обезличенный результат в `.cache/backups/after-lead-fields.json`.

Только после этой проверки запускайте новые приложения:

```powershell
docker compose up -d --no-deps --no-build --wait api web
if ($LASTEXITCODE -ne 0) { throw 'API or web is not ready' }
docker compose up -d --no-deps --no-build --wait worker caddy
if ($LASTEXITCODE -ne 0) { throw 'Worker or Caddy failed to start' }
docker compose ps
```

Worker может сразу изменить `attempts`, `next_attempt_at` и состояние outbox. Поэтому сравнение полного outbox выполняется до его запуска. Финальный smoke проверяет новую форму через Caddy, `live`/`ready`, сохранение заявки и идемпотентный повтор. Старый API/worker после `0001` запускать нельзя: его запросы содержат удалённые колонки.

Историческая `0000` не редактируется. При необходимости отката используйте проверенный backup и старые образы как согласованную пару; простого запуска старого API поверх обновлённой БД недостаточно.
