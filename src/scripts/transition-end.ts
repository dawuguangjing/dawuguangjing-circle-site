// ── Transition End Utility ───────────────────────────────────────────
// transitionend を待ってコールバックを実行する。
// ブラウザが transitionend を発火しないケースに備え、
// fallbackMs 後にフォールバック実行する。二重呼び出しを防止。

export function onTransitionEnd(el: HTMLElement, callback: () => void, fallbackMs: number): void {
  let done = false;
  function finish() {
    if (done) return;
    done = true;
    callback();
  }
  el.addEventListener(
    'transitionend',
    (e) => {
      if (e.target === el) finish();
    },
    { once: true }
  );
  setTimeout(finish, fallbackMs);
}
