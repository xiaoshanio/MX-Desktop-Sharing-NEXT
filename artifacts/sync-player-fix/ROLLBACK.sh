#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
ARTIFACTS="$ROOT/artifacts/sync-player-fix"
BASELINE="$ARTIFACTS/BASELINE_SyncPlayerPanel.tsx.snapshot"
MODIFIED="$ARTIFACTS/MODIFIED_FILE"
TEST_COPY="$ARTIFACTS/rollback-test-copy"

mkdir -p "$TEST_COPY"
cp "$MODIFIED" "$TEST_COPY/SyncPlayerPanel.tsx.snapshot"
cp "$BASELINE" "$TEST_COPY/SyncPlayerPanel.tsx.snapshot"

if ! cmp -s "$TEST_COPY/SyncPlayerPanel.tsx.snapshot" "$BASELINE"; then
  printf '%s\n' 'ROLLBACK_FAILED: test copy does not match baseline'
  exit 1
fi
if cmp -s "$MODIFIED" "$BASELINE"; then
  printf '%s\n' 'ROLLBACK_FAILED: MODIFIED_FILE was changed'
  exit 1
fi

printf '%s\n' 'ROLLBACK_OK: test copy restored to BASELINE; MODIFIED_FILE remains changed'
