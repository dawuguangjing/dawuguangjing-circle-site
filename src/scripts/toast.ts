// ── TOAST ─────────────────────────────────────────────────────────────────
// 一時的なトースト通知を表示・自動消去

import { TOAST_DISMISS_MS, TOAST_FADE_MS } from '../utils/constants';

export function showToast(message: string) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(text);
  const close = document.createElement('button');
  close.className = 'toast-close';
  close.setAttribute('aria-label', '閉じる');
  close.textContent = '\u00d7';
  toast.appendChild(close);
  document.body.appendChild(toast);
  const dismiss = () => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), TOAST_FADE_MS);
  };
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  const timer = setTimeout(dismiss, TOAST_DISMISS_MS);
  close.addEventListener('click', () => {
    clearTimeout(timer);
    dismiss();
  });
}
