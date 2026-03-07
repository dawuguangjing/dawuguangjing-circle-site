// ── Context Back Links ──────────────────────────────────────────────────────
// 一覧ページ → 詳細ページのバックナビゲーション:
// sessionStorage に保存されたコンテキストURLを使ってリストの位置を復元する

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
        try {
          const stored = sessionStorage.getItem(`list-context:${contextKey}`) ?? '';
          if (stored.startsWith('/')) savedContextUrl = stored;
        } catch {
          savedContextUrl = '';
        }
      }
      const fallbackHref = savedContextUrl || link.href;

      let sameOriginRef = false;
      try {
        sameOriginRef = !!document.referrer && new URL(document.referrer).origin === window.location.origin;
      } catch {
        sameOriginRef = false;
      }
      if (!sameOriginRef || history.length <= 1) {
        if (savedContextUrl) {
          e.preventDefault();
          window.location.href = fallbackHref;
        }
        return;
      }

      e.preventDefault();
      let navigated = false;
      const markNavigated = () => { navigated = true; };
      window.addEventListener('pagehide', markNavigated, { once: true });
      history.back();
      window.setTimeout(() => {
        window.removeEventListener('pagehide', markNavigated);
        if (!navigated) window.location.href = fallbackHref;
      }, 480);
    });
  });
}

// ── List Context Persistence ────────────────────────────────────────────────
// 一覧ページを訪れたとき、そのURLをsessionStorageに保存する（バックナビ用）

function persistListContext() {
  const listRoot = document.querySelector<HTMLElement>('[data-list-context]');
  const contextKey = (listRoot?.dataset.listContext ?? '').trim();
  if (!contextKey) return;
  try {
    sessionStorage.setItem(`list-context:${contextKey}`, `${window.location.pathname}${window.location.search}`);
  } catch {
    return;
  }
}

document.addEventListener('astro:page-load', initContextBackLinks);
document.addEventListener('astro:page-load', persistListContext);
