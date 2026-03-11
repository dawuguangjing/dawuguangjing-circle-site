// ── List Filter/Sort 共通モジュール ──────────────────────────────────────
// 一覧ページのフィルタ・ソート・URL同期・バッジ更新を一元管理する。

import { FILTER_STAGGER } from '../utils/constants';

// ── 型定義 ──

export interface FilterDimension {
  type: 'filter-single' | 'filter-multi';
  /** URL パラメータ名 */
  paramName: string;
  /** デフォルト値（'all' 等） */
  defaultValue: string;
  /** チップの CSS セレクタ */
  chipSelector: string;
  /** chip.dataset のキー名（data-filter → 'filter'） */
  chipDataKey: string;
  /** item.dataset のキー名（data-category → 'category'）。filterTest がある場合は不要 */
  itemDataKey?: string;
  /** filter-multi 用カスタム述語マップ */
  filterTest?: Record<string, (el: HTMLElement) => boolean>;
  /** 状態サマリーの接頭辞（例: '絞り込み'） */
  summaryPrefix?: string;
}

export interface SortDimension {
  type: 'sort';
  paramName: string;
  defaultValue: string;
  chipSelector: string;
  chipDataKey: string;
  sortFn: (a: HTMLElement, b: HTMLElement, value: string) => number;
  summaryPrefix?: string;
}

export type Dimension = FilterDimension | SortDimension;

export interface ListFilterConfig {
  /** 状態サマリー要素のプレフィックス（#{stateId}-state-text 等） */
  stateId: string;
  /** グリッドコンテナの CSS セレクタ */
  gridSelector: string;
  /** フィルタ対象アイテムの CSS セレクタ */
  itemSelector: string;
  /** フィルタ/ソートの次元定義 */
  dimensions: Dimension[];
  /** --anim-delay 再計算の有無（デフォルト: true） */
  animateDelay?: boolean;
  /** フィルタ/ソート適用後のコールバック */
  onUpdate?: (visibleCount: number, totalCount: number) => void;
}

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

  // ── 状態取得 ──

  function getActiveValues(dim: FilterDimension): string[] {
    const chips = dimChips.get(dim)!;
    if (dim.type === 'filter-multi') {
      return chips
        .filter(c => c.classList.contains('is-active') && chipValue(c, dim.chipDataKey) !== dim.defaultValue)
        .map(c => chipValue(c, dim.chipDataKey));
    }
    const active = chips.find(c => c.classList.contains('is-active'));
    const val = active ? chipValue(active, dim.chipDataKey) : dim.defaultValue;
    return val === dim.defaultValue ? [] : [val];
  }

  function getActiveSortValue(dim: SortDimension): string {
    const chips = dimChips.get(dim)!;
    const active = chips.find(c => c.classList.contains('is-active'));
    return active ? chipValue(active, dim.chipDataKey) : dim.defaultValue;
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
      if (getActiveSortValue(dim) !== dim.defaultValue) count++;
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
      const val = getActiveSortValue(dim);
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

  // ── URL 同期 ──

  function syncStateToUrl() {
    const url = new URL(window.location.href);
    for (const dim of filterDims) {
      const vals = getActiveValues(dim);
      if (vals.length === 0) {
        url.searchParams.delete(dim.paramName);
      } else if (dim.type === 'filter-multi') {
        url.searchParams.set(dim.paramName, vals.join(','));
      } else {
        url.searchParams.set(dim.paramName, vals[0]);
      }
    }
    for (const dim of sortDims) {
      const val = getActiveSortValue(dim);
      if (val === dim.defaultValue) {
        url.searchParams.delete(dim.paramName);
      } else {
        url.searchParams.set(dim.paramName, val);
      }
    }
    history.replaceState(null, '', url.toString());
  }

  // ── フィルタ＆ソート適用 ──

  function applyAll(scroll: boolean) {
    // 1) 表示判定
    let visibleCount = 0;
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
      } else {
        el.style.display = 'none';
        el.classList.remove('is-visible');
      }
    });

    // 2) ソート（表示中アイテムのみ）
    if (sortDims.length > 0) {
      const allItems = [...items];
      for (const dim of sortDims) {
        const val = getActiveSortValue(dim);
        allItems.sort((a, b) => dim.sortFn(a, b, val));
      }
      allItems.forEach(el => grid.appendChild(el));
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
    syncStateToUrl();
    onUpdate?.(visibleCount, items.length);

    // 5) スクロール
    if (scroll) {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
          applyAll(true);
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
          applyAll(true);
        });
      });
    }
  }

  for (const dim of sortDims) {
    const chips = dimChips.get(dim)!;
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.toggle('is-active', c === chip));
        applyAll(true);
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

  // ── URL パラメータからの復元 ──

  function restoreFromUrl() {
    const params = new URL(window.location.href).searchParams;
    let restored = false;

    for (const dim of filterDims) {
      const paramVal = params.get(dim.paramName);
      if (!paramVal) continue;
      const chips = dimChips.get(dim)!;
      if (dim.type === 'filter-multi') {
        const allChip = chips.find(c => chipValue(c, dim.chipDataKey) === dim.defaultValue);
        const values = paramVal.split(',');
        let activeCount = 0;
        allChip?.classList.remove('is-active');
        allChip?.setAttribute('aria-pressed', 'false');
        for (const v of values) {
          const chip = chips.find(c => chipValue(c, dim.chipDataKey) === v);
          if (chip) {
            chip.classList.add('is-active');
            chip.setAttribute('aria-pressed', 'true');
            activeCount++;
          }
        }
        if (activeCount === 0) {
          allChip?.classList.add('is-active');
          allChip?.setAttribute('aria-pressed', 'true');
        }
        restored = true;
      } else {
        // filter-single
        const targetChip = chips.find(c => chipValue(c, dim.chipDataKey) === paramVal);
        if (targetChip) {
          chips.forEach(c => {
            const isTarget = c === targetChip;
            c.classList.toggle('is-active', isTarget);
            c.setAttribute('aria-pressed', String(isTarget));
          });
          restored = true;
        }
      }
    }

    for (const dim of sortDims) {
      const paramVal = params.get(dim.paramName);
      if (!paramVal) continue;
      const chips = dimChips.get(dim)!;
      const targetChip = chips.find(c => chipValue(c, dim.chipDataKey) === paramVal);
      if (targetChip) {
        chips.forEach(c => c.classList.toggle('is-active', c === targetChip));
        restored = true;
      }
    }

    return restored;
  }

  // ── 初期化実行 ──

  restoreFromUrl();
  applyAll(false);

  return { applyAll, dimChips };
}
