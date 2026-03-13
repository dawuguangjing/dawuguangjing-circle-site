// ── Filter Sheet Utility ─────────────────────────────────────────────
// モバイル向けフィルターボトムシートの共通 open / close ロジック。
// バッジ更新はページ固有のため含めない。

import { lockScroll, unlockScroll } from './scroll-lock';
import { trapFocus } from './focus-trap';

export interface FilterSheetConfig {
  /** フィルターバー要素の ID（ページごとに異なる） */
  filterBarId: string;
  /** スクリムオーバーレイ要素の ID */
  overlayId: string;
  /** トリガーボタン要素の ID */
  triggerId: string;
  /** 閉じるボタン要素の ID */
  closeBtnId: string;
  /** スクロールロックのキー（ページ固有） */
  lockKey: string;
}

export interface FilterSheetControls {
  open: () => void;
  close: () => void;
}

// 前回の初期化で登録した document リスナーを AbortController で一括解除
let _sheetAbort: AbortController | null = null;

export function initFilterSheet(config: FilterSheetConfig): FilterSheetControls {
  // 前回のリスナーをクリーンアップ（VT ページ遷移で蓄積するのを防止）
  _sheetAbort?.abort();
  _sheetAbort = new AbortController();
  const signal = _sheetAbort.signal;

  const filterBar = document.getElementById(config.filterBarId);
  const overlay = document.getElementById(config.overlayId);
  const trigger = document.getElementById(config.triggerId);
  const closeBtn = document.getElementById(config.closeBtnId);

  let prevFocus: HTMLElement | null = null;

  function open() {
    prevFocus = document.activeElement as HTMLElement;
    filterBar?.classList.add('is-open');
    overlay?.classList.add('is-visible');
    overlay?.removeAttribute('aria-hidden');
    trigger?.setAttribute('aria-expanded', 'true');
    lockScroll(config.lockKey);
  }

  function close() {
    filterBar?.classList.remove('is-open');
    overlay?.classList.remove('is-visible');
    overlay?.setAttribute('aria-hidden', 'true');
    trigger?.setAttribute('aria-expanded', 'false');
    unlockScroll(config.lockKey);
    if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
  }

  trigger?.addEventListener('click', () => {
    if (filterBar?.classList.contains('is-open')) close();
    else open();
  });
  overlay?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);
  document.addEventListener(
    'keydown',
    (e) => {
      // ESC は overlay-close.ts → ui:close-overlays で一元管理
      // フォーカストラップ: シートが開いている間、Tab をシート内に閉じ込める
      if (filterBar?.classList.contains('is-open') && filterBar) {
        const focusable = Array.from(
          filterBar.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled])'
          )
        ).filter((el) => el.offsetParent !== null);
        trapFocus(e, focusable);
      }
    },
    { signal }
  );
  document.addEventListener('ui:close-overlays', close, { signal });
  document.addEventListener('astro:before-preparation', close, { signal });

  return { open, close };
}

/**
 * ページ固有パラメータだけを渡す簡易ラッパー。
 * overlayId / triggerId / closeBtnId は全ページ共通のため省略。
 */
export function initPageFilterSheet(filterBarId: string, lockKey: string): FilterSheetControls {
  return initFilterSheet({
    filterBarId,
    overlayId: 'filter-sheet-overlay',
    triggerId: 'filter-sheet-trigger',
    closeBtnId: 'filter-sheet-close',
    lockKey
  });
}
