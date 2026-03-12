// ── SHARE COPY ───────────────────────────────────────────────────────────
// URLコピーボタン → clipboard API + トースト通知

import { COPY_FEEDBACK_MS } from '../utils/constants';
import { showToast } from './toast';

const _initedBtns = new WeakSet<Element>();

export function initShareCopy() {
  document.querySelectorAll<HTMLElement>('[data-copy-url]').forEach((btn) => {
    if (_initedBtns.has(btn)) return;
    _initedBtns.add(btn);
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

// ── NATIVE SHARE ──────────────────────────────────────────────────────────
// navigator.share 対応デバイスでネイティブ共有シートを開く

const _initedShareBtns = new WeakSet<Element>();

export function initNativeShare() {
  if (typeof navigator.share !== 'function') return;

  document.querySelectorAll<HTMLElement>('[data-share-native]').forEach((btn) => {
    if (_initedShareBtns.has(btn)) return;
    _initedShareBtns.add(btn);

    btn.removeAttribute('hidden');

    btn.addEventListener('click', async () => {
      const url = btn.dataset.shareUrl!;
      const title = btn.dataset.shareTitle ?? '';
      try {
        await navigator.share({ title, url });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          showToast('シェアに失敗しました');
        }
      }
    });
  });
}
