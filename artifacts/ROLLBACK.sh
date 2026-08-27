#!/usr/bin/env sh
set -eu
cp "$(dirname "$0")/MODIFIED_FILE.orig.ts" "$(dirname "$0")/MODIFIED_FILE.ts"
node --check "$(dirname "$0")/MODIFIED_FILE.ts"
printf '%s\n' 'rollback restored MODIFIED_FILE.ts'
