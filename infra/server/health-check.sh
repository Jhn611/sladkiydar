#!/bin/sh
# Install as /usr/local/sbin/sladkiy-dar-health (root:root, 0750).
# Read-only container checks: no restarts, logs, lead data, or external requests.
set -eu
umask 077
PATH=/usr/sbin:/usr/bin:/sbin:/bin
export PATH

DEPLOY_DIR=/opt/sladkiy-dar/current
readonly DEPLOY_DIR

fail() {
  printf 'Health check failed: %s.\n' "$1" >&2
  exit 1
}

[ "$#" -eq 0 ] || fail 'arguments are not accepted'
[ "$(id -u)" = 0 ] || fail 'root is required'
for utility in stat readlink env timeout docker; do
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

docker_read() {
  # Ignore caller variables, Docker contexts, Compose overrides, and proxy settings.
  /usr/bin/env -i PATH="$PATH" DOCKER_CONFIG=/etc/docker \
    /usr/bin/timeout -k 2s 8s \
    /usr/bin/docker --host unix:///var/run/docker.sock "$@"
}

compose_ids() {
  docker_read compose \
    --project-directory "$DEPLOY_DIR" --env-file "$DEPLOY_DIR/.env" \
    --project-name povod --file "$DEPLOY_DIR/compose.yml" \
    ps --all --quiet "$1"
}

for service in caddy web api worker postgres migrate; do
  container_id=$(compose_ids "$service" 2>/dev/null) ||
    fail "cannot query $service"
  if [ -z "$container_id" ] && [ "$service" = migrate ]; then
    # A successful compose run --rm migrate intentionally leaves no container.
    continue
  fi
  [ "${#container_id}" -eq 64 ] || fail "$service does not have exactly one container"
  case "$container_id" in
    *[!0-9a-f]*) fail "$service returned an invalid container identifier" ;;
  esac

  # Extract only state fields: never dump inspect output, environment, or logs.
  container_state=$(docker_read inspect --type container --format \
    '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}|{{.State.ExitCode}}' \
    "$container_id" 2>/dev/null) || fail "cannot inspect $service"

  state_status=${container_state%%|*}
  state_tail=${container_state#*|}
  state_health=${state_tail%%|*}
  state_exit=${state_tail#*|}
  case "$service" in
    migrate)
      [ "$state_status" = exited ] && [ "$state_exit" = 0 ] ||
        fail 'migrate has not completed successfully'
      ;;
    web|api|postgres)
      [ "$state_status" = running ] && [ "$state_health" = healthy ] ||
        fail "$service is not running and healthy"
      ;;
    caddy|worker)
      [ "$state_status" = running ] || fail "$service is not running"
      ;;
  esac
done

printf 'Health check passed: five services running; web, api and postgres healthy.\n'