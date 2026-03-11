// ── List Filter/Sort 共通モジュール ──────────────────────────────────────
// 一覧ページのフィルタ・ソート・URL同期・バッジ更新を一元管理する。

import { FILTER_STAGGER, FILTER_DEBOUNCE_MS } from '../utils/constants';
import type { FilterDimension, SortDimension, Dimension, ListFilterConfig } from './filter-state';
import { getActiveFilterValues, getActiveSortValue, restoreFilterFromUrl, syncFilterStateToUrl } from './filter-url';

// Re-export types for public API
export type { FilterDimension, SortDimension, Dimension, ListFilterConfig } from './filter-state';

// ── ヘルパー ──

/** チップから値を取得 */
function chipValue(chip: HTMLElement, dataKey: string): string {
  return chip.dataset[dataKey] ?? '';
}

/** チップ配列からラベルマップを構築 */
function buildLabelMap(chips: HTMLElement[], dataKey: string, excludeValues: string[] = []): Map<string, string> {
  const exclude = new Set(excludeValues);
  return new Map(
    chips
      .filter(c => !exclude.has(chipValue(c, dataKey)))
      .map(c => [chipValue(c, dataKey), (c.textContent ?? '').trim() || chipValue(c, dataKey)])
  );
}

// ── メインセットアップ ──

export function setupListFilter(config: ListFilterConfig) {
  const {
    stateId,
    gridSelector,
    itemSelector,
    dimensions,
    animateDelay = true,
    onUpdate,
  } = config;

  const grid = document.querySelector<HTMLElement>(gridSelector);
  if (!grid) return;

  const items = Array.from(document.querySelectorAll<HTMLElement>(itemSelector));
  const stateText = document.getElementById(`${stateId}-state-text`);
  const stateClear = document.getElementById(`${stateId}-state-clear`) as HTMLButtonElement | null;
  const activeBadge = document.getElementById('filter-active-badge');
  const sheetTrigger = document.getElementById('filter-sheet-trigger');

  // 各次元のチップとラベルマップ
  const dimChips = new Map<Dimension, HTMLElement[]>();
  const dimLabels = new Map<Dimension, Map<string, string>>();
  for (const dim of dimensions) {
    const chips = Array.from(document.querySelectorAll<HTMLElement>(dim.chipSelector));
    dimChips.set(dim, chips);
    const excludes = dim.type === 'filter-multi' ? [dim.defaultValue] : [];
    dimLabels.set(dim, buildLabelMap(chips, dim.chipDataKey, excludes));
  }

  const filterDims = dimensions.filter((d): d is FilterDimension => d.type === 'filter-single' || d.type === 'filter-multi');
  const sortDims = dimensions.filter((d): d is SortDimension => d.type === 'sort');

  // ── 状態取得ラッパー ──

  function getActiveValues(dim: FilterDimension): string[] {
    return getActiveFilterValues(dimChips.get(dim)!, dim);
  }

  function getSortValue(dim: SortDimension): string {
    return getActiveSortValue(dimChips.get(dim)!, dim);
  }

  // ── バッジ更新 ──

  function updateBadge() {
    if (!activeBadge) return;
    let count = 0;
    for (const dim of filterDims) {
      const vals = getActiveValues(dim);
      count += dim.type === 'filter-multi' ? vals.length : (vals.length > 0 ? 1 : 0);
    }
    for (const dim of sortDims) {
      if (getSortValue(dim) !== dim.defaultValue) count++;
    }
    if (count > 0) {
      activeBadge.textContent = String(count);
      activeBadge.removeAttribute('hidden');
      sheetTrigger?.classList.add('has-active');
    } else {
      activeBadge.setAttribute('hidden', '');
      sheetTrigger?.classList.remove('has-active');
    }
  }

  // ── 状態サマリー更新 ──

  function updateStateSummary() {
    if (!stateText || !stateClear) return;
    const parts: string[] = [];
    for (const dim of filterDims) {
      const vals = getActiveValues(dim);
      if (vals.length > 0) {
        const labels = vals.map(v => dimLabels.get(dim)!.get(v) ?? v);
        const prefix = dim.summaryPrefix ?? '絞り込み';
        parts.push(`${prefix}: ${labels.join(' / ')}`);
      }
    }
    for (const dim of sortDims) {
      const val = getSortValue(dim);
      if (val !== dim.defaultValue) {
        const prefix = dim.summaryPrefix ?? '並び順';
        parts.push(`${prefix}: ${dimLabels.get(dim)!.get(val) ?? val}`);
      }
    }
    if (parts.length === 0) {
      stateText.textContent = '現在条件: すべて';
      stateClear.hidden = true;
    } else {
      stateText.textContent = `現在条件: ${parts.join(' ・ ')}`;
      stateClear.hidden = false;
    }
  }

  // ── フィルタ＆ソート適用 ──

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function applyAll(scroll: boolean) {
    // 1) 表示判定
    let visibleCount = 0;
    const toHide: HTMLElement[] = [];
    items.forEach(el => {
      let show = true;
      for (const dim of filterDims) {
        const vals = getActiveValues(dim);
        if (vals.length === 0) continue;
        if (dim.filterTest) {
          // カスタム述語 AND
          if (!vals.every(v => dim.filterTest![v]?.(el))) { show = false; break; }
        } else if (dim.itemDataKey) {
          const itemVal = el.dataset[dim.itemDataKey] ?? '';
          if (!vals.includes(itemVal)) { show = false; break; }
        }
      }
      if (show) {
        el.style.display = '';
        visibleCount++;
      } else if (el.style.display !== 'none') {
        // 現在表示中 → 退出アニメーション
        el.classList.remove('is-visible');
        el.classList.add('is-exiting');
        toHide.push(el);
      }
    });

    // 退出アニメーション完了後に非表示化
    if (toHide.length > 0) {
      const dur = prefersReducedMotion ? 0
        : (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-fast')) * 1000 || 150);
      setTimeout(() => {
        toHide.forEach(el => {
          el.style.display = 'none';
          el.classList.remove('is-exiting');
        });
      }, dur);
    }

    // 2) ソート（表示中アイテムのみ）
    if (sortDims.length > 0) {
      const allItems = [...items];
      for (const dim of sortDims) {
        const val = getSortValue(dim);
        allItems.sort((a, b) => dim.sortFn(a, b, val));
      }
      allItems.forEach(el => grid!.appendChild(el));
    }

    // 3) アニメーションとリフロー
    let animIdx = 0;
    items.forEach(el => {
      if (el.style.display === 'none') return;
      if (animateDelay) {
        el.style.setProperty('--anim-delay', `${animIdx * FILTER_STAGGER}s`);
      }
      el.classList.remove('is-visible');
      void el.offsetWidth;
      el.classList.add('is-visible');
      animIdx++;
    });

    // 4) UI 更新
    updateBadge();
    updateStateSummary();
    syncFilterStateToUrl(filterDims, sortDims, dimChips);
    onUpdate?.(visibleCount, items.length);

    // 5) スクロール（0件時は空状態要素にスクロール）
    if (scroll) {
      const scrollTarget = (visibleCount === 0 && config.emptySelector)
        ? document.querySelector<HTMLElement>(config.emptySelector) ?? grid!
        : grid!;
      scrollTarget.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  // ── デバウンス付き applyAll ──

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  function applyAllDebounced(scroll: boolean) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyAll(scroll), FILTER_DEBOUNCE_MS);
  }

  // ── チップイベント ──

  for (const dim of filterDims) {
    const chips = dimChips.get(dim)!;
    if (dim.type === 'filter-multi') {
      const allChip = chips.find(c => chipValue(c, dim.chipDataKey) === dim.defaultValue);
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          const val = chipValue(chip, dim.chipDataKey);
          if (val === dim.defaultValue) {
            // "all" → 他チップをリセット
            chips.forEach(c => { c.classList.remove('is-active'); c.setAttribute('aria-pressed', 'false'); });
            chip.classList.add('is-active');
            chip.setAttribute('aria-pressed', 'true');
          } else {
            allChip?.classList.remove('is-active');
            allChip?.setAttribute('aria-pressed', 'false');
            const next = !chip.classList.contains('is-active');
            chip.classList.toggle('is-active', next);
            chip.setAttribute('aria-pressed', String(next));
            if (getActiveValues(dim).length === 0) {
              allChip?.classList.add('is-active');
              allChip?.setAttribute('aria-pressed', 'true');
            }
          }
          applyAllDebounced(true);
        });
      });
    } else {
      // filter-single
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => {
            const isActive = c === chip;
            c.classList.toggle('is-active', isActive);
            c.setAttribute('aria-pressed', String(isActive));
          });
          applyAllDebounced(true);
        });
      });
    }
  }

  for (const dim of sortDims) {
    const chips = dimChips.get(dim)!;
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.toggle('is-active', c === chip));
        applyAllDebounced(true);
      });
    });
  }

  // ── クリアボタン ──

  stateClear?.addEventListener('click', () => {
    // 全次元をデフォルトに戻す
    for (const dim of dimensions) {
      const chips = dimChips.get(dim)!;
      chips.forEach(c => {
        const isDefault = chipValue(c, dim.chipDataKey) === dim.defaultValue;
        c.classList.toggle('is-active', isDefault);
        c.setAttribute('aria-pressed', String(isDefault));
      });
    }
    applyAll(true);
  });

  // ── 初期化実行 ──

  restoreFilterFromUrl(filterDims, sortDims, dimChips);
  applyAll(false);

  return { applyAll, dimChips };
}
