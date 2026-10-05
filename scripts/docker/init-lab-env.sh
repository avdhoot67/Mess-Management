#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
env_file="$repo_root/.env.docker"

if [[ -e "$env_file" ]]; then
    echo "Refusing to replace existing .env.docker" >&2
    exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
    echo "openssl is required to generate lab credentials" >&2
    exit 1
fi

umask 077
{
    printf 'MESSMATE_HTTP_PORT=18080\n'
    printf 'PROMETHEUS_PORT=9090\n'
    printf 'GRAFANA_PORT=3001\n'
    printf 'GRAFANA_ADMIN_PASSWORD=%s\n' "$(openssl rand -hex 32)"
    printf 'MYSQL_USER=messmate_app\n'
    printf 'MYSQL_PASSWORD=%s\n' "$(openssl rand -hex 32)"
    printf 'MYSQL_ROOT_PASSWORD=%s\n' "$(openssl rand -hex 32)"
    printf 'JWT_SECRET=%s\n' "$(openssl rand -hex 32)"
} > "$env_file"

echo "Created private lab configuration at .env.docker (permissions: owner only)."
echo "Do not print, share, or commit this file."
