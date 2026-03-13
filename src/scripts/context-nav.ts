// ── Context Back Links ──────────────────────────────────────────────────────
// 一覧ページ → 詳細ページのバックナビゲーション:
// sessionStorage に保存されたコンテキストURLを使ってリストの位置を復元する

import {
  RETURN_HIGHLIGHT_MS,
  BACK_NAV_TIMEOUT_MS,
  LIST_CONTEXT_KEY_PREFIX,
  RETURN_HIGHLIGHT_SLUG_KEY
} from '../utils/constants';
import { navigate } from 'astro:transitions/client';
import { safeGet, safeSet, safeRemove } from './safe-storage';

function initContextBackLinks() {
  document.querySelectorAll<HTMLAnchorElement>('a[data-back-context]').forEach((node) => {
    const link = node as HTMLAnchorElement & { _backContextInited?: boolean };
    if (link._backContextInited) return;
    link._backContextInited = true;
    link.addEventListener('click', (e) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (link.target && link.target !== '_self') return;
      const contextKey = (link.dataset.backContextKey ?? '').trim();
      let savedContextUrl = '';
      if (contextKey) {
        const stored = safeGet(`${LIST_CONTEXT_KEY_PREFIX}:${contextKey}`, 'session') ?? '';
        if (stored.startsWith('/')) savedContextUrl = stored;
      }
      const fallbackHref = savedContextUrl || link.href;

      let sameOriginRef = false;
      try {
        sameOriginRef =
          !!document.referrer && new URL(document.referrer).origin === window.location.origin;
      } catch {
        sameOriginRef = false;
      }
      if (!sameOriginRef || history.length <= 1) {
        if (savedContextUrl) {
          e.preventDefault();
          navigate(fallbackHref);
        }
        return;
      }

      e.preventDefault();
      let navigated = false;
      const markNavigated = () => {
        navigated = true;
      };
      // pagehide: フルリロードナビゲーション検知
      // astro:before-swap: View Transitions クライアント側ナビゲーション検知
      window.addEventListener('pagehide', markNavigated, { once: true });
      document.addEventListener('astro:before-swap', markNavigated, { once: true });
      history.back();
      window.setTimeout(() => {
        window.removeEventListener('pagehide', markNavigated);
        document.removeEventListener('astro:before-swap', markNavigated);
        if (!navigated) navigate(fallbackHref);
      }, BACK_NAV_TIMEOUT_MS);
    });
  });
}

// ── List Context Persistence ────────────────────────────────────────────────
// 一覧ページを訪れたとき、そのURLをsessionStorageに保存する（バックナビ用）

function persistListContext() {
  const listRoot = document.querySelector<HTMLElement>('[data-list-context]');
  const contextKey = (listRoot?.dataset.listContext ?? '').trim();
  if (!contextKey) return;
  safeSet(
    `${LIST_CONTEXT_KEY_PREFIX}:${contextKey}`,
    `${window.location.pathname}${window.location.search}`,
    'session'
  );
}

// ── Return Highlight ────────────────────────────────────────────────────────
// 詳細→一覧に戻ったとき、直前に見ていたアイテムをハイライトする

function persistDetailSlug() {
  // 詳細ページ（/works/<slug>/ 等）にいる場合、スラッグを保存
  const match = window.location.pathname.match(/\/(works|news|gallery|characters)\/([^/]+)\/?$/);
  if (match) {
    safeSet(RETURN_HIGHLIGHT_SLUG_KEY, match[2], 'session');
  }
}

function highlightReturnedItem() {
  const listRoot = document.querySelector<HTMLElement>('[data-list-context]');
  if (!listRoot) return;
  const slug = safeGet(RETURN_HIGHLIGHT_SLUG_KEY, 'session') ?? '';
  if (!slug) return;
  safeRemove(RETURN_HIGHLIGHT_SLUG_KEY, 'session');

  // カード内のリンクからスラッグを逆引き
  const card = listRoot.querySelector<HTMLElement>(
    `a[href*="/${slug}/"], [data-work="${slug}"], [data-name="${slug}"]`
  );
  const target = card?.closest<HTMLElement>('[data-anim]') ?? card;
  if (!target) return;

  requestAnimationFrame(() => {
    target.classList.add('is-returning');
    target.scrollIntoView({ behavior: 'instant', block: 'center' });
    setTimeout(() => target.classList.remove('is-returning'), RETURN_HIGHLIGHT_MS);
  });
}

document.addEventListener('astro:page-load', initContextBackLinks);
document.addEventListener('astro:page-load', persistListContext);
document.addEventListener('astro:page-load', persistDetailSlug);
document.addEventListener('astro:page-load', highlightReturnedItem);
