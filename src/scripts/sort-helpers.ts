// ── ソート関数ビルダー ──────────────────────────────────────────────

import type { SortDimension } from './filter-state';

type SortFn = SortDimension['sortFn'];

/**
 * 日付 + タイトルソート。newest / oldest / title の 3 値に対応。
 * @param dateKey  - dataset キー名（デフォルト: 'releaseDate'）
 * @param titleKey - dataset キー名（デフォルト: 'title'）
 */
export function dateTitleSort(dateKey: 'releaseDate' = 'releaseDate', titleKey: 'title' = 'title'): SortFn {
  return (a, b, sort) => {
    if (sort === 'title')
      return (a.dataset[titleKey] ?? '').localeCompare(b.dataset[titleKey] ?? '', 'ja');
    const da = Number(a.dataset[dateKey]);
    const db = Number(b.dataset[dateKey]);
    return sort === 'oldest' ? da - db : db - da;
  };
}

/**
 * 表示順 + 名前ソート。order / name の 2 値に対応。
 * @param orderKey - dataset キー名（デフォルト: 'order'）
 * @param nameKey  - dataset キー名（デフォルト: 'name'）
 */
export function orderNameSort(orderKey: 'order' = 'order', nameKey: 'name' = 'name'): SortFn {
  return (a, b, sort) => {
    if (sort === 'name')
      return (a.dataset[nameKey] ?? '').localeCompare(b.dataset[nameKey] ?? '', 'ja');
    return Number(a.dataset[orderKey]) - Number(b.dataset[orderKey]);
  };
}
