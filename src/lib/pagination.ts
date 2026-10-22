export type PageToken = number | 'ellipsis';

/** Compact page list for large archives, e.g. 1 … 5 6 7 … 12 */
export function paginationRange(current: number, total: number, siblingCount = 1): PageToken[] {
  if (total <= 1) return [1];

  const first = 1;
  const last = total;
  const start = Math.max(first + 1, current - siblingCount);
  const end = Math.min(last - 1, current + siblingCount);
  const items: PageToken[] = [first];

  if (start > first + 1) items.push('ellipsis');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < last - 1) items.push('ellipsis');
  if (last > first) items.push(last);

  return items;
}
