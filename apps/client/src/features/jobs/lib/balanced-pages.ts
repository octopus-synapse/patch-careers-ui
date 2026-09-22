/** Keep incomplete grid rows for the next page while more results may arrive. */
export function balancedPages<T>(
  items: T[],
  pageSize: number,
  hasNext: boolean,
  fixedPageSizes: number[] = [],
): T[][] {
  if (pageSize < 4 || pageSize % 4 !== 0)
    throw new RangeError("Page size must be a multiple of four");

  const pages: T[][] = [];
  let offset = 0;
  for (const size of fixedPageSizes) {
    if (size < 1 || size > pageSize || offset + size > items.length) break;
    pages.push(items.slice(offset, offset + size));
    offset += size;
  }
  while (items.length - offset >= pageSize) {
    pages.push(items.slice(offset, offset + pageSize));
    offset += pageSize;
  }

  const remaining = items.length - offset;
  const visible = hasNext ? Math.floor(remaining / 4) * 4 : remaining;
  if (visible > 0) pages.push(items.slice(offset, offset + visible));
  return pages;
}
