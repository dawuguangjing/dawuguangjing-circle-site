// ── GA4 TRACKING ─────────────────────────────────────────────────────────
// GA4 イベント追跡（クリック委譲）+ View Transitions 時の仮想PV送信

import { GA4_ID } from '../utils/constants';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** [data-ga-event] ボタンのクリックをイベント委譲で追跡 */
export function initGa4EventTracking() {
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-ga-event]');
    if (!btn) return;
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', btn.dataset.gaEvent, {
      store: btn.dataset.store ?? '',
      click_location: btn.dataset.gaLocation ?? '',
      link_url: (btn as HTMLAnchorElement).href ?? '',
    });
  }, { capture: true });
}

/** View Transitions ナビゲーション時の仮想ページビュー送信 */
export function sendGa4VirtualPv() {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA4_ID, {
      page_location: window.location.href,
      page_title: document.title,
    });
  }
}
