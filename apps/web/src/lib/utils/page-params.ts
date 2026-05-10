/**
 * URL → numeric pagination params.
 *
 * Backend now declares `page` and `limit` as `integer` (Q1). Routes used
 * to pass `'1'` / `'20'` (strings) which now fail the SDK's typed
 * params. This helper does the conversion + clamping in one place so
 * call sites stop sprinkling `Number()` and re-validating defaults.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function pageParams(
  source: URL | URLSearchParams,
  defaults: { page?: number; limit?: number } = {},
): { page: number; limit: number } {
  const sp = source instanceof URL ? source.searchParams : source;

  const rawPage = Number(sp.get('page') ?? defaults.page ?? DEFAULT_PAGE);
  const rawLimit = Number(sp.get('limit') ?? defaults.limit ?? DEFAULT_LIMIT);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : DEFAULT_PAGE;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;

  return { page, limit };
}
