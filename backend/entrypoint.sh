#!/bin/sh
set -e
pnpm run migration:run
node dist/main.js
