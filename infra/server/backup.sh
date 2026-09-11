#!/usr/bin/env bash
# Install as /usr/local/sbin/sladkiy-dar-backup (root:root, 0750).
# This is a local database backup, not an off-server copy or a restore test.
set -Eeuo pipefail
umask 077
export PATH=/usr/sbin:/usr/bin:/sbin:/bin

readonly DEPLOY_DIR=/opt/sladkiy-dar/current
readonly BACKUP_DIR=/var/backups/sladkiy-dar
readonly KEEP_BACKUPS=14
stage=preflight
dump_tmp=
checksum_tmp=
published_dump=
published_checksum=
backup_complete=0

fail() {
  printf 'Database backup failed at %s.\n' "$stage" >&2
  exit 1
}

cleanup() {
  local path
  for path in "$dump_tmp" "$checksum_tmp"; do
    if [[ -n "$path" && "$path" == "$BACKUP_DIR"/.backup-* && -f "$path" && ! -L "$path" ]]; then
      rm -f -- "$path"
    fi
  done
  # A checksum is the completion marker. Never retain a half-published pair.
  if (( backup_complete == 0 )); then
    for path in "$published_dump" "$published_checksum"; do
      if [[ -n "$path" && "$path" == "$BACKUP_DIR"/sladkiy-dar-* && -f "$path" && ! -L "$path" ]]; then
        rm -f -- "$path"
      fi
    done
  fi
}
trap fail ERR
trap cleanup EXIT
trap 'exit 1' INT TERM HUP

[[ ${EUID} -eq 0 ]] || fail
for command in docker flock stat readlink mktemp sha256sum sort sync install; do
  command -v "$command" >/dev/null 2>&1 || fail
done

# Fail closed on redirected backup paths or writable deployment configuration.
[[ "$(readlink -m -- "$BACKUP_DIR")" == "$BACKUP_DIR" ]] || fail
if [[ -e "$BACKUP_DIR" ]]; then
  [[ -d "$BACKUP_DIR" && ! -L "$BACKUP_DIR" && "$(stat -c %u -- "$BACKUP_DIR")" == 0 ]] || fail
fi
install -d -o root -g root -m 0700 -- "$BACKUP_DIR"
[[ -d "$DEPLOY_DIR" && "$(stat -Lc %u -- "$DEPLOY_DIR")" == 0 ]] || fail
for path in "$DEPLOY_DIR" "$DEPLOY_DIR/compose.yml" "$DEPLOY_DIR/.env"; do
  mode="$(stat -Lc %a -- "$path" 2>/dev/null)" || fail
  [[ "$(stat -Lc %u -- "$path")" == 0 ]] || fail
  (( (8#$mode & 0022) == 0 )) || fail
done
[[ -f "$DEPLOY_DIR/compose.yml" && -f "$DEPLOY_DIR/.env" && ! -L "$DEPLOY_DIR/.env" ]] || fail
mode="$(stat -c %a -- "$DEPLOY_DIR/.env")"
(( (8#$mode & 0077) == 0 )) || fail

[[ ! -L "$BACKUP_DIR/.backup.lock" ]] || fail
exec 9>"$BACKUP_DIR/.backup.lock"
chmod 0600 "$BACKUP_DIR/.backup.lock"
if ! flock -n 9; then
  printf 'Database backup already running; skipped.\n'
  exit 0
fi

compose() {
  # Read the existing protected .env only through Compose. Do not source it,
  # print expanded configuration, or inherit a caller's remote Docker context.
  env -i PATH="$PATH" DOCKER_CONFIG=/etc/docker \
    /usr/bin/docker --host unix:///var/run/docker.sock compose \
    --project-directory "$DEPLOY_DIR" --env-file "$DEPLOY_DIR/.env" \
    --project-name povod --file "$DEPLOY_DIR/compose.yml" "$@"
}

stage=dump
dump_tmp="$(mktemp "$BACKUP_DIR/.backup-XXXXXXXX.dump.tmp")"
if ! compose exec -T postgres sh -c \
  'exec pg_dump --no-password -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --lock-wait-timeout=30s' \
  >"$dump_tmp" 2>/dev/null; then
  fail
fi
[[ -s "$dump_tmp" ]] || fail

stage=archive-validation
if ! compose exec -T postgres pg_restore --list <"$dump_tmp" >/dev/null 2>&1; then fail; fi

stage=checksum
checksum_tmp="$(mktemp "$BACKUP_DIR/.backup-XXXXXXXX.sha256.tmp")"
filename="sladkiy-dar-$(date -u +%Y%m%dT%H%M%SZ-%N).dump"
digest="$(sha256sum -- "$dump_tmp")"
digest="${digest%% *}"
[[ "$digest" =~ ^[a-f0-9]{64}$ ]] || fail
printf '%s  %s\n' "$digest" "$filename" >"$checksum_tmp"
chmod 0600 "$dump_tmp" "$checksum_tmp"
sync -f "$dump_tmp"
sync -f "$checksum_tmp"

stage=publication
[[ ! -e "$BACKUP_DIR/$filename" && ! -L "$BACKUP_DIR/$filename" ]] || fail
[[ ! -e "$BACKUP_DIR/$filename.sha256" && ! -L "$BACKUP_DIR/$filename.sha256" ]] || fail
mv -T -- "$dump_tmp" "$BACKUP_DIR/$filename"
published_dump="$BACKUP_DIR/$filename"
dump_tmp=
mv -T -- "$checksum_tmp" "$BACKUP_DIR/$filename.sha256"
published_checksum="$BACKUP_DIR/$filename.sha256"
checksum_tmp=
sync -f "$BACKUP_DIR"
backup_complete=1

stage=retention
# Keep the newest 14 completed pairs, even after gaps longer than 14 days.
# Only this script's strict filename pattern is eligible; no recursive deletion.
mapfile -t candidates < <(printf '%s\n' "$BACKUP_DIR"/sladkiy-dar-*.dump | LC_ALL=C sort -r)
kept=0
for path in "${candidates[@]}"; do
  name="${path##*/}"
  [[ "$name" =~ ^sladkiy-dar-[0-9]{8}T[0-9]{6}Z-[0-9]{9}\.dump$ ]] || continue
  [[ -f "$path" && ! -L "$path" && -f "$path.sha256" && ! -L "$path.sha256" ]] || continue
  [[ "$(stat -c %u -- "$path")" == 0 && "$(stat -c %u -- "$path.sha256")" == 0 ]] || fail
  kept=$((kept + 1))
  if (( kept > KEEP_BACKUPS )); then
    # Publish the new verified backup before removing any older successful pair.
    rm -- "$path.sha256"
    rm -- "$path"
  fi
done

printf 'Database backup completed: %s; retaining the newest %s local backups.\n' "$filename" "$KEEP_BACKUPS"
