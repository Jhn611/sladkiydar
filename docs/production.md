# Production: «Сладкий Дар»

Сайт: **https://sladkiydar.ivanjhn.ru**. Сервер: `77.91.115.126`, Ubuntu 24.04, hostname `vm-v3-nano` (в панели — `ru-vmv3-nano`), 2 vCPU, 4 ГБ RAM, 60 ГБ диска и активированный swap 1 ГБ. При настройке установлено ядро `6.8.0-139`, Docker `29.8` и Compose `5.5`.

## Размещение и доступ

Исходники: [Jhn611/sladkiydar](https://github.com/Jhn611/sladkiydar), ветка `master`. Релизы принадлежат `root` и находятся в `/opt/sladkiy-dar/releases/<commit>`; `/opt/sladkiy-dar/current` — ссылка на рабочий релиз. `.env` внутри релиза — **обычный файл**, владелец `root`, права `0600`; не заменяйте его ссылкой. Начальный релиз основан на коммите `384db…` с исправлением Dockerfile `COPY --chmod=0644` для чтения конфигурации непривилегированным nginx.

На настроенном Windows-компьютере:

```sh
ssh sladkiy-dar
```

Это вход пользователем `admin`; административные команды требуют `sudo` и пароль. Зашифрованный ключ находится в `C:/Users/Administrator/.ssh/sladkiy-dar/admin_ed25519`. Приватный `access.private.json` рядом с ключами содержит данные доступа: его нельзя добавлять в репозиторий, пересылать вместе с документацией или выводить в логи.

Для обслуживания создан отдельный ключ и SSH-псевдоним `sladkiy-dar-maintenance`. Разрешённые команды `sudo` — только `/usr/local/sbin/sladkiy-dar-status` и `/usr/local/sbin/sladkiy-dar-health`, обе без аргументов. Этот доступ не предназначен для чтения секретов, Docker socket или изменения сервера. Права `admin` для обслуживания через `sudo` сохранены.

Ключ `/root/.ssh/sladkiy-dar_github` зарегистрирован в GitHub как deploy key **только для чтения**; доступ проверен чтением HEAD репозитория. SSH-конфигурация `/root/.ssh/sladkiy-dar_github_config` содержит псевдоним `github-sladkiy-dar` и доверенные ключи хоста, полученные из официального GitHub Meta API. Origin релиза: `git@github-sladkiy-dar:Jhn611/sladkiydar.git`; `core.sshCommand` использует `ssh -F /root/.ssh/sladkiy-dar_github_config`. Такая настройка сохраняет доступ и при последующем переводе репозитория в приватный режим.

## Сервисы и данные

Compose-проект называется `povod`; это имя определяет существующие volumes. Caddy — единственная публичная точка входа, обслуживает HTTPS и направляет запросы к статическому web и API. Внутренний nginx отдаёт файлы. PostgreSQL, API и worker не публикуют порты на хосте. Используется только `compose.yml`, без `compose.dev.yml`.

У API и worker отдельные ограниченные роли БД, административное подключение получает `migrate`. Токен VK передаётся только worker. При переносе 11 сентября 2026 сохранены четыре заявки, четыре записи outbox и identity sequence; сохранность данных проверена контрольными суммами. Локальные API и worker остановлены, чтобы два независимых экземпляра не отправляли уведомления от одного сообщества.

Для проверок после входа `admin`:

```sh
sudo -i
cd /opt/sladkiy-dar/current
docker compose ps
docker compose logs --tail=50 api worker migrate
curl --fail --silent --show-error https://sladkiydar.ivanjhn.ru/api/health/ready
```

Не публикуйте полный вывод `docker compose config`, `docker inspect` или содержимое `.env`. Перезапуск процессов без изменения окружения: `docker compose restart api worker`. После изменения `.env` требуется пересоздание контейнеров, а после изменения DB-паролей — предварительный запуск `migrate`; порядок описан в [database-access.md](database-access.md).

## Защита хоста

UFW разрешает SSH TCP 22, HTTP TCP 80, HTTPS TCP 443 и HTTP/3 UDP 443. Правила forwarding Docker оставлены штатными: при добавлении новых опубликованных портов проверяйте доступ снаружи отдельно от UFW. Сейчас Compose публикует только Caddy.

Fail2ban включён. Вход SSH под `root` и вход по паролю пока сохранены до подтверждения доступа через консоль провайдера; отключать их следует после проверки резервного способа входа. Обновления безопасности устанавливаются ежедневно, автоматическая перезагрузка выключена: необходимость перезагрузки нужно проверять и выполнять в окно обслуживания.

Логи Docker ограничены ротацией `10 МБ × 3` (драйвер хоста `local`, у явно настроенных Compose-сервисов `json-file`); лимит journald — 200 МБ.

## Резервные копии и состояние

Службы и таймеры из `infra/server` установлены и включены:

| Задача                     | Расписание и результат                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `sladkiy-dar-backup.timer` | Каждый день в 03:30 МСК; `/var/backups/sladkiy-dar`, последние 14 успешно завершённых копий |
| `sladkiy-dar-health.timer` | Каждые пять минут; проверка контейнеров и healthchecks, результат в journal                 |

Первые запуски backup и проверки состояния завершились с `Result=success`. Backup создаёт custom-format dump и SHA-256 и проверяет чтение архива. Полное восстановление также проверено на сервере в отдельном PostgreSQL-контейнере без сети (`--network none`) и с данными в tmpfs: контрольные суммы четырёх заявок и четырёх записей outbox совпали. Проверку восстановления нужно повторять периодически. Проверка состояния не отправляет внешние уведомления и не перезапускает сервисы автоматически.

Проверка расписания и ручной запуск:

```sh
systemctl list-timers 'sladkiy-dar-*' --all
systemctl start sladkiy-dar-backup.service
journalctl -u sladkiy-dar-backup.service -n 20 --no-pager
systemctl start sladkiy-dar-health.service
journalctl -u sladkiy-dar-health.service -n 20 --no-pager
```

Автоматическое копирование **за пределы сервера не настроено**. Новый серверный backup ещё не скачан; перенос этой копии за пределы сервера ожидает отдельного подтверждения владельца. Защищённая копия перед переносом хранится на Windows: `C:/Users/Administrator/.ssh/sladkiy-dar/backups/before-server-cutover-20260911.dump`. Серверные backups переживают пересоздание контейнеров, но не потерю диска; требуется отдельное внешнее хранение и периодическая проверка восстановления.

## Обновление приложения

Команды выполняются от `root`. Выберите проверенный полный SHA коммита; новые файлы сначала готовятся в отдельном релизе. Перед обновлением убедитесь, что исправление `COPY --chmod=0644` уже присутствует в выбранном Dockerfile. Сохраните старые образы для отката, затем соберите новые последовательно, чтобы снизить пиковое потребление памяти.

```sh
release_commit='<полный SHA проверенного коммита>'
[[ "$release_commit" =~ ^[0-9a-f]{40}$ ]] || exit 1
release_dir="/opt/sladkiy-dar/releases/$release_commit"
test ! -e "$release_dir" || exit 1
previous_release=$(readlink -f /opt/sladkiy-dar/current)
rollback_stamp=$(date -u +%Y%m%dT%H%M%SZ)
docker image tag povod-api:local "povod-api:rollback-$rollback_stamp"
docker image tag povod-web:local "povod-web:rollback-$rollback_stamp"
umask 022
GIT_SSH_COMMAND='ssh -F /root/.ssh/sladkiy-dar_github_config' git clone git@github-sladkiy-dar:Jhn611/sladkiydar.git "$release_dir"
git -C "$release_dir" config core.sshCommand 'ssh -F /root/.ssh/sladkiy-dar_github_config'
git -C "$release_dir" checkout --detach "$release_commit"
install -o root -g root -m 0600 "$previous_release/.env" "$release_dir/.env"
cd "$release_dir"
docker compose config --quiet
docker compose build api
docker compose build web
```

Проверьте новые обязательные переменные и изменения схемы до остановки рабочего приложения. Зафиксируйте `previous_release` и `rollback_stamp` в журнале обновления без секретов. Затем выполните короткое переключение:

```sh
docker compose stop api worker
systemctl start sladkiy-dar-backup.service
docker compose run --rm migrate
ln -sfn "$release_dir" /opt/sladkiy-dar/current
docker compose up -d --no-build --wait
systemctl start sladkiy-dar-health.service
curl --fail --silent --show-error https://sladkiydar.ivanjhn.ru/api/health/ready
```

Переходите к следующей команде только после успеха предыдущей; при ошибке backup или миграций остановитесь и устраните причину. Сверьте страницу, готовность API и состояние worker. Проверка HTTP готовности не подтверждает доставку VK; контрольное уведомление согласовывайте отдельно. Не запускайте локальный worker с копией production-базы параллельно серверному.

При смене домена синхронно измените `DOMAIN`, `PUBLIC_ORIGIN`, `VITE_SITE_URL`; web обязательно пересобрать, поскольку canonical и sitemap создаются при сборке.

## Откат и восстановление

Если схема совместима со старой версией, остановите API/worker, верните теги `povod-api:local` и `povod-web:local` на сохранённые `rollback-<метка>`, восстановите ссылку `current` на прежний релиз и запустите его через `docker compose up -d --no-build --wait`. Проверьте актуальность `.env` и DB-паролей старого релиза. Смена ссылки сама по себе не заменяет уже работающие контейнеры.

Возврат кода **не откатывает БД**. При несовместимой миграции нужен отдельный план восстановления из проверенного backup при остановленных API/worker; заявки после момента копии требуют отдельного сохранения. Для другой базы в том же кластере создаются новые рабочие роли: старые связаны с OID исходной базы. Полная инструкция — [восстановление PostgreSQL](database-access.md#резервная-копия-и-восстановление).

Не используйте `docker compose down -v`. Не удаляйте старые релизы, rollback-образы и резервную копию до проверки нового релиза.
