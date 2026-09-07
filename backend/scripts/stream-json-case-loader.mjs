// minio@8.0.7's notification.mjs imports the pre-3.x PascalCase path
// (`stream-json/jsonl/Parser.js`); the `stream-json: 3.6.0` override in
// pnpm-workspace.yaml (OPS-010 Dependabot security fix) renamed that
// file to lowercase. Silently tolerated on case-insensitive
// filesystems (Windows/macOS — invisible in dev), but
// ERR_MODULE_NOT_FOUND on any case-sensitive one, i.e. every
// production Docker image.
//
// Registered via `--import ./scripts/register-stream-json-case-loader.mjs`
// (see entrypoint.sh) rather than downgrading stream-json, which would
// undo that security fix, or a pnpm patch on stream-json itself.
const CASE_FIXES = {
  'stream-json/jsonl/Parser.js': 'stream-json/jsonl/parser.js',
  'stream-json/jsonl/Stringer.js': 'stream-json/jsonl/stringer.js',
};

export async function resolve(specifier, context, nextResolve) {
  return nextResolve(CASE_FIXES[specifier] ?? specifier, context);
}
