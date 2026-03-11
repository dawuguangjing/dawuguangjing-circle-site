// ── List Filter/Sort 型定義 ──────────────────────────────────────

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
