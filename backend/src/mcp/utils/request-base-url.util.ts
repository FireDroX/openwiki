import type { Request } from 'express';

export function resolveRequestBaseUrl(req: Request): string {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol =
    typeof forwardedProto === 'string' && forwardedProto.length > 0
      ? forwardedProto.split(',')[0].trim()
      : req.protocol;
  return `${protocol}://${req.get('host')}`;
}
