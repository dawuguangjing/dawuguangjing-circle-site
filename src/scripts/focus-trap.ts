/**
 * Tab キーのフォーカストラップ処理。
 * keydown イベントハンドラ内で呼び出す。
 */
export function trapFocus(e: KeyboardEvent, focusableEls: HTMLElement[]): void {
  if (e.key !== 'Tab' || focusableEls.length === 0) return;
  const first = focusableEls[0];
  const last = focusableEls[focusableEls.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}
