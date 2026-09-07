interface ApiEnvelope<T> {
  status: string;
  data: T;
}

/**
 * `response.body` is `any` (supertest doesn't know our response shapes),
 * so every `.data` access on it is flagged as unsafe by the type-aware
 * lint rules. Cast once at the boundary instead of at every call site.
 */
export function dataOf<T>(response: { body: unknown }): T {
  return (response.body as ApiEnvelope<T>).data;
}
