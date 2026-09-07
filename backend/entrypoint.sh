#!/bin/sh
set -e
pnpm run migration:run
node --import ./scripts/register-stream-json-case-loader.mjs dist/main.js
