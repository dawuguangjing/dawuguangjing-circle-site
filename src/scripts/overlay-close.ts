// ── OVERLAY CLOSE ────────────────────────────────────────────────────────
// ESC キー → ui:close-overlays カスタムイベントをディスパッチ

export function closeTransientUi() {
  document.dispatchEvent(new CustomEvent('ui:close-overlays'));
}

let _inited = false;

export function initGlobalOverlayClose() {
  if (_inited) return;
  _inited = true;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeTransientUi();
  });
}
