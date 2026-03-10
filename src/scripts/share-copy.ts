// ── SHARE COPY ───────────────────────────────────────────────────────────
// URLコピーボタン → clipboard API + トースト通知

import { COPY_FEEDBACK_MS } from '../utils/constants';
import { showToast } from './toast';

export function initShareCopy() {
  document.querySelectorAll<HTMLElement>('[data-copy-url]').forEach((btn) => {
    if ((btn as any)._copyInited) return;
    (btn as any)._copyInited = true;
    btn.addEventListener('click', async () => {
      const url = btn.dataset.copyUrl!;
      try {
        await navigator.clipboard.writeText(url);
        btn.classList.add('share-btn--copied');
        showToast('URLをコピーしました');
        setTimeout(() => btn.classList.remove('share-btn--copied'), COPY_FEEDBACK_MS);
      } catch {
        showToast('コピーに失敗しました');
      }
    });
  });
}
