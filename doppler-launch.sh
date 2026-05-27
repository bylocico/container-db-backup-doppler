#!/bin/sh

set -eu

if command -v doppler >/dev/null 2>&1; then
  if [ -n "${DOPPLER_TOKEN:-}" ] || [ -n "${DOPPLER_PROJECT:-}" ] || [ -n "${DOPPLER_CONFIG:-}" ]; then
    tmp="$(mktemp)"
    doppler secrets download --no-file --format env >"$tmp"
    set -a
    # shellcheck disable=SC1090
    . "$tmp"
    set +a
    rm -f "$tmp"
  fi
fi

exec /init "$@"
