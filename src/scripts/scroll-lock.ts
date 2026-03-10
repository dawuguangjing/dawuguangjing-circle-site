// ── Scroll Lock Utility ──────────────────────────────────────────────
// BaseLayout が window に登録する lockBodyScroll / unlockBodyScroll の
// 薄いラッパー。未初期化時は document.body.style.overflow に直接フォールバック。

type UiWindow = Window & {
  lockBodyScroll?: (key: string) => void;
  unlockBodyScroll?: (key: string) => void;
};

export function lockScroll(key: string): void {
  const w = window as UiWindow;
  if (w.lockBodyScroll) w.lockBodyScroll(key);
  else document.body.style.overflow = 'hidden';
}

export function unlockScroll(key: string): void {
  const w = window as UiWindow;
  if (w.unlockBodyScroll) w.unlockBodyScroll(key);
  else document.body.style.overflow = '';
}
