#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
build_dir=$(mktemp -d)
trap 'rm -rf "$build_dir"' EXIT
npm exec --yes --package typescript -- tsc --ignoreConfig --target ES2020 --module commonjs --strict --skipLibCheck --outDir "$build_dir" miniprogram/utils/statistics.ts
STATS_TEST_BUILD="$build_dir" node --test tests/statistics.test.cjs
