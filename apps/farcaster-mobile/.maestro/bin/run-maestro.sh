#!/usr/bin/env bash
# Wrapper around `maestro test` for local CI parity with the
# BrowserStack-driven workflow in .github/workflows/mobile-e2e.yml.
#
# Why this exists: BrowserStack's setEnvVariables caps each value at
# 100 characters, which doesn't fit a 24-word BIP-39 phrase. The
# sign-in flow therefore expects the recovery phrase to be supplied as
# three roughly-balanced parts (E2E_RECOVERY_PHRASE_PART{1,2,3}). To
# keep the developer-facing env var a single value, we split here at
# exec time and re-export the parts before invoking maestro.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

PLATFORM="${1:-}"
if [ -z "$PLATFORM" ]; then
  echo "usage: $0 {ios|android}" >&2
  exit 2
fi
shift

if [ -f .maestro/fixtures/test-account.env ]; then
  set -a
  # shellcheck disable=SC1091
  . .maestro/fixtures/test-account.env
  set +a
fi

case "$PLATFORM" in
  ios)     APP_ID="${APP_ID_IOS:-com.farcaster.mobile-client}" ;;
  android) APP_ID="${APP_ID_ANDROID:-com.farcaster.mobile}" ;;
  *)       echo "unknown platform: $PLATFORM" >&2; exit 2 ;;
esac

# Split E2E_RECOVERY_PHRASE into three word-balanced chunks. Each chunk
# stays well under BrowserStack's 100-char per-value limit (24 8-char
# words split 8/8/8 = ~71 chars per chunk worst-case).
read -ra WORDS <<< "${E2E_RECOVERY_PHRASE:-}"
N=${#WORDS[@]}
if [ "$N" -eq 0 ]; then
  echo "warning: E2E_RECOVERY_PHRASE is empty; sign-in flow will fail." >&2
  PART1=""; PART2=""; PART3=""
else
  P=$(( (N + 2) / 3 ))
  PART1="${WORDS[*]:0:$P}"
  PART2="${WORDS[*]:$P:$P}"
  PART3="${WORDS[*]:$((P*2))}"
fi

exec maestro test \
  --env "APP_ID=$APP_ID" \
  --env "MAESTRO_RUN_ID=${MAESTRO_RUN_ID:-$(date +%s)}" \
  --env "E2E_RECOVERY_PHRASE_PART1=$PART1" \
  --env "E2E_RECOVERY_PHRASE_PART2=$PART2" \
  --env "E2E_RECOVERY_PHRASE_PART3=$PART3" \
  "$@" \
  .maestro/flows
