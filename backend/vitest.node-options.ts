import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * minio@8.0.7 imports the pre-3.x PascalCase path
 * (stream-json/jsonl/Parser.js); the stream-json 3.6.0 override in
 * pnpm-workspace.yaml (OPS-010 Dependabot security fix) renamed that
 * file to lowercase. Silently tolerated on case-insensitive
 * filesystems (Windows/macOS — invisible in dev), fatal
 * (ERR_MODULE_NOT_FOUND) on case-sensitive ones — every Linux CI
 * runner and production Docker image.
 *
 * The production entrypoint fixes this with the same
 * `backend/scripts/register-stream-json-case-loader.mjs` Node
 * `module.register()` resolve hook, loaded via `node --import`. Vitest
 * doesn't expose a way to pass that flag to its own worker processes
 * directly, and calling `register()` at runtime from a `setupFiles`
 * entry doesn't actually take effect for them either — appending it to
 * `NODE_OPTIONS` here, before vitest forks any workers, does: workers
 * inherit `process.env` (and therefore `NODE_OPTIONS`) from this
 * config-loading process, so this must run before `defineConfig` in
 * both vitest.config.ts and vitest.config.e2e.ts.
 *
 * `--import` needs a `file://` URL for an absolute path on Windows — a
 * raw `C:\...` path throws ERR_UNSUPPORTED_ESM_URL_SCHEME.
 */
export function registerStreamJsonCaseLoader(configDir: string): void {
  const loaderPath = path.join(
    configDir,
    'scripts',
    'register-stream-json-case-loader.mjs',
  );
  const importFlag = `--import=${pathToFileURL(loaderPath).href}`;
  process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, importFlag]
    .filter(Boolean)
    .join(' ');
}
