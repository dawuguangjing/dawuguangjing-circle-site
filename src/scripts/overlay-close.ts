// ── OVERLAY CLOSE ────────────────────────────────────────────────────────
// ESC キー → ui:close-overlays カスタムイベントをディスパッチ

export function closeTransientUi() {
  document.dispatchEvent(new CustomEvent('ui:close-overlays'));
}

export function initGlobalOverlayClose() {
  if ((document as any)._globalOverlayCloseInited) return;
  (document as any)._globalOverlayCloseInited = true;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeTransientUi();
  });
}
