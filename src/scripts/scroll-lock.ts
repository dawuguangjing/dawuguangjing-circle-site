// ── Scroll Lock ─────────────────────────────────────────────────────────
// window API: lockBodyScroll / unlockBodyScroll / resetBodyScrollLocks
// オーバーレイ系コンポーネントが呼び出す共通ロック機構

type UiWindow = Window & {
  lockBodyScroll?: (key: string) => void;
  unlockBodyScroll?: (key: string) => void;
  resetBodyScrollLocks?: () => void;
};

const uiWindow = window as UiWindow;

/** window にスクロールロック API を登録する（BaseLayout が初期化時に呼ぶ） */
export function ensureScrollLockController() {
  if (uiWindow.lockBodyScroll && uiWindow.unlockBodyScroll && uiWindow.resetBodyScrollLocks) return;
  const locks = new Set<string>();
  const syncBodyScroll = () => {
    document.body.style.overflow = locks.size > 0 ? 'hidden' : '';
  };
  uiWindow.lockBodyScroll = (key: string) => {
    locks.add(key);
    syncBodyScroll();
  };
  uiWindow.unlockBodyScroll = (key: string) => {
    locks.delete(key);
    syncBodyScroll();
  };
  uiWindow.resetBodyScrollLocks = () => {
    locks.clear();
    syncBodyScroll();
  };
}

/** 全ロックを解除する */
export function resetBodyScrollLocks() {
  uiWindow.resetBodyScrollLocks?.();
}

/** スクロールをロックする（コンポーネント向けラッパー） */
export function lockScroll(key: string): void {
  if (uiWindow.lockBodyScroll) uiWindow.lockBodyScroll(key);
  else document.body.style.overflow = 'hidden';
}

/** スクロールロックを解除する（コンポーネント向けラッパー） */
export function unlockScroll(key: string): void {
  if (uiWindow.unlockBodyScroll) uiWindow.unlockBodyScroll(key);
  else document.body.style.overflow = '';
}
