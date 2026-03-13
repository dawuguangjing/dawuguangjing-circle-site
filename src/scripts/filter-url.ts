// ── URL 同期ユーティリティ ──────────────────────────────────────

import type { FilterDimension, SortDimension } from './filter-state';

/** チップから値を取得 */
export function chipValue(chip: HTMLElement, dataKey: string): string {
  return chip.dataset[dataKey] ?? '';
}

/** チップの is-active / aria-pressed を一括トグル */
export function setChipActive(chip: HTMLElement, active: boolean): void {
  chip.classList.toggle('is-active', active);
  chip.setAttribute('aria-pressed', String(active));
}

// ── 状態取得ヘルパー ──

export function getActiveFilterValues(chips: HTMLElement[], dim: FilterDimension): string[] {
  if (dim.type === 'filter-multi') {
    return chips
      .filter(
        (c) =>
          c.classList.contains('is-active') && chipValue(c, dim.chipDataKey) !== dim.defaultValue
      )
      .map((c) => chipValue(c, dim.chipDataKey));
  }
  const active = chips.find((c) => c.classList.contains('is-active'));
  const val = active ? chipValue(active, dim.chipDataKey) : dim.defaultValue;
  return val === dim.defaultValue ? [] : [val];
}

export function getActiveSortValue(chips: HTMLElement[], dim: SortDimension): string {
  const active = chips.find((c) => c.classList.contains('is-active'));
  return active ? chipValue(active, dim.chipDataKey) : dim.defaultValue;
}

// ── URL → チップ状態の復元 ──

export function restoreFilterFromUrl(
  filterDims: FilterDimension[],
  sortDims: SortDimension[],
  dimChips: Map<FilterDimension | SortDimension, HTMLElement[]>
): boolean {
  const params = new URL(window.location.href).searchParams;
  let restored = false;

  for (const dim of filterDims) {
    const paramVal = params.get(dim.paramName);
    if (!paramVal) continue;
    const chips = dimChips.get(dim)!;
    if (dim.type === 'filter-multi') {
      const allChip = chips.find((c) => chipValue(c, dim.chipDataKey) === dim.defaultValue);
      const values = paramVal.split(',');
      let activeCount = 0;
      if (allChip) setChipActive(allChip, false);
      for (const v of values) {
        const chip = chips.find((c) => chipValue(c, dim.chipDataKey) === v);
        if (chip) {
          setChipActive(chip, true);
          activeCount++;
        }
      }
      if (activeCount === 0 && allChip) {
        setChipActive(allChip, true);
      }
      restored = true;
    } else {
      // filter-single
      const targetChip = chips.find((c) => chipValue(c, dim.chipDataKey) === paramVal);
      if (targetChip) {
        chips.forEach((c) => setChipActive(c, c === targetChip));
        restored = true;
      }
    }
  }

  for (const dim of sortDims) {
    const paramVal = params.get(dim.paramName);
    if (!paramVal) continue;
    const chips = dimChips.get(dim)!;
    const targetChip = chips.find((c) => chipValue(c, dim.chipDataKey) === paramVal);
    if (targetChip) {
      chips.forEach((c) => c.classList.toggle('is-active', c === targetChip));
      restored = true;
    }
  }

  return restored;
}

// ── チップ状態 → URL の同期 ──

export function syncFilterStateToUrl(
  filterDims: FilterDimension[],
  sortDims: SortDimension[],
  dimChips: Map<FilterDimension | SortDimension, HTMLElement[]>
): void {
  const url = new URL(window.location.href);
  for (const dim of filterDims) {
    const vals = getActiveFilterValues(dimChips.get(dim)!, dim);
    if (vals.length === 0) {
      url.searchParams.delete(dim.paramName);
    } else if (dim.type === 'filter-multi') {
      url.searchParams.set(dim.paramName, vals.join(','));
    } else {
      url.searchParams.set(dim.paramName, vals[0]);
    }
  }
  for (const dim of sortDims) {
    const val = getActiveSortValue(dimChips.get(dim)!, dim);
    if (val === dim.defaultValue) {
      url.searchParams.delete(dim.paramName);
    } else {
      url.searchParams.set(dim.paramName, val);
    }
  }
  history.replaceState(history.state, '', url.toString());
}
