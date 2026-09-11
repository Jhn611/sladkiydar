#!/bin/sh
# Install as /usr/local/sbin/sladkiy-dar-status (root:root, 0755).
# Restricted status command: containers and fixed backup/health units only.
set -eu
umask 077
PATH=/usr/sbin:/usr/bin:/sbin:/bin
export PATH

DEPLOY_DIR=/opt/sladkiy-dar/current
readonly DEPLOY_DIR

fail() {
  printf 'Status query failed: %s.\n' "$1" >&2
  exit 1
}

[ "$#" -eq 0 ] || fail 'arguments are not accepted'
[ "$(id -u)" = 0 ] || fail 'root is required'
for utility in stat readlink env timeout docker systemctl; do
  command -v "$utility" >/dev/null 2>&1 || fail 'a required system tool is unavailable'
done

check_directory() {
  [ -d "$1" ] || fail 'deployment directory is unavailable'
  directory_metadata=$(stat -Lc '%u:%a' -- "$1" 2>/dev/null) ||
    fail 'deployment directory metadata is unavailable'
  directory_owner=${directory_metadata%%:*}
  directory_mode=${directory_metadata#*:}
  [ "$directory_owner" = 0 ] || fail 'deployment directory is not owned by root'
  case "$directory_mode" in
    ''|*[!0-7]*) fail 'deployment directory permissions are invalid' ;;
  esac
  [ "$((0$directory_mode & 0022))" -eq 0 ] ||
    fail 'deployment directory is writable by another user'
}

check_directory_chain() {
  checked_directory=$1
  while :; do
    check_directory "$checked_directory"
    [ "$checked_directory" = / ] && break
    checked_directory=${checked_directory%/*}
    [ -n "$checked_directory" ] || checked_directory=/
  done
}

# Permit a root-managed current release symlink, but verify both parent chains.
check_directory_chain "$DEPLOY_DIR"
resolved_deploy_dir=$(readlink -f -- "$DEPLOY_DIR" 2>/dev/null) ||
  fail 'deployment directory cannot be resolved'
check_directory_chain "$resolved_deploy_dir"

[ -f "$DEPLOY_DIR/compose.yml" ] && [ ! -L "$DEPLOY_DIR/compose.yml" ] ||
  fail 'Compose configuration is not a regular file'
compose_metadata=$(stat -c '%u:%a' -- "$DEPLOY_DIR/compose.yml" 2>/dev/null) ||
  fail 'Compose configuration metadata is unavailable'
compose_owner=${compose_metadata%%:*}
compose_mode=${compose_metadata#*:}
[ "$compose_owner" = 0 ] || fail 'Compose configuration is not owned by root'
case "$compose_mode" in
  ''|*[!0-7]*) fail 'Compose configuration permissions are invalid' ;;
esac
[ "$((0$compose_mode & 0022))" -eq 0 ] ||
  fail 'Compose configuration is writable by another user'
[ -f "$DEPLOY_DIR/.env" ] && [ ! -L "$DEPLOY_DIR/.env" ] ||
  fail 'environment file is not a regular file'
[ "$(stat -c '%u:%a' -- "$DEPLOY_DIR/.env" 2>/dev/null)" = '0:600' ] ||
  fail 'environment file must be owned by root with mode 0600'


docker_status() {
  /usr/bin/env -i PATH="$PATH" DOCKER_CONFIG=/etc/docker \
    /usr/bin/timeout -k 2s 8s \
    /usr/bin/docker --host unix:///var/run/docker.sock compose \
    --project-directory "$DEPLOY_DIR" --env-file "$DEPLOY_DIR/.env" \
    --project-name povod --file "$DEPLOY_DIR/compose.yml" \
    ps --all
}

systemd_status() {
  /usr/bin/env -i PATH="$PATH" \
    /usr/bin/timeout -k 2s 8s \
    /usr/bin/systemctl --no-pager --no-ask-password "$@"
}

# These fixed read-only commands are the entire privileged surface.
# Never expose expanded configuration, inspect dumps, logs, or user-supplied units.
docker_status 2>/dev/null || fail 'cannot query project containers'
systemd_status show --property=Id --property=Result --property=ExecMainStatus \
  sladkiy-dar-backup.service sladkiy-dar-health.service 2>/dev/null ||
  fail 'cannot query backup and health results'
systemd_status list-timers --all \
  sladkiy-dar-backup.timer sladkiy-dar-health.timer 2>/dev/null ||
  fail 'cannot query backup and health timers'
