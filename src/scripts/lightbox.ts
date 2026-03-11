// ── Lightbox ─────────────────────────────────────────────────────────
// ライトボックスの全ロジック。Lightbox.astro からインポートされる。
// astro:page-load で毎回再初期化（VT 後も確実にリスナーを付け直す）。

import { lockScroll, unlockScroll } from './scroll-lock';
import { HINT_DISMISS_MS, LIGHTBOX_SCROLL_SYNC_MS, LIGHTBOX_SCROLL_DEBOUNCE_MS } from '../utils/constants';

const _initedElements = new WeakSet<HTMLElement>();

function initLightbox() {
  const lightbox = document.getElementById('lightbox') as HTMLElement | null;
  if (!lightbox) return;
  // 同一ページ内での二重初期化を防ぐ
  if (_initedElements.has(lightbox)) return;
  _initedElements.add(lightbox);

  const itemSelector = lightbox.dataset.itemSelector!;
  const lbImg     = lightbox.querySelector<HTMLImageElement>('.lightbox-img')!;
  const lbVideo   = lightbox.querySelector<HTMLVideoElement>('.lightbox-video')!;
  const lbClose   = lightbox.querySelector<HTMLButtonElement>('.lightbox-close')!;
  const lbPrev    = lightbox.querySelector<HTMLButtonElement>('.lightbox-prev')!;
  const lbNext    = lightbox.querySelector<HTMLButtonElement>('.lightbox-next')!;
  const lbCounter = lightbox.querySelector<HTMLElement>('.lightbox-counter')!;
  const lbThumbs  = lightbox.querySelector<HTMLElement>('.lightbox-thumbs')!;

  const itemEls = Array.from(document.querySelectorAll<HTMLElement>(itemSelector));
  const items = itemEls.map((el) => ({
    src:  el.dataset.lightboxSrc  || '',
    type: el.dataset.lightboxType || 'image',
    alt:  el.dataset.lightboxAlt  || '',
  }));
  let current = 0;
  let triggerEl: HTMLElement | null = null;
  // プログラム側スクロール中はサムネイル scroll イベントを無視するフラグ
  let _isProgramScroll = false;
  let _programScrollTimer: ReturnType<typeof setTimeout> | null = null;

  function scrollActiveThumb(behavior: ScrollBehavior = 'smooth') {
    _isProgramScroll = true;
    if (_programScrollTimer) clearTimeout(_programScrollTimer);
    lbThumbs.querySelector<HTMLElement>('.lightbox-thumb.is-active')
      ?.scrollIntoView({ behavior, block: 'nearest', inline: 'center' });
    // smooth アニメーション終了後にフラグをリセット
    _programScrollTimer = setTimeout(() => { _isProgramScroll = false; }, behavior === 'instant' ? 0 : LIGHTBOX_SCROLL_SYNC_MS);
  }

  function showMedia(index: number, scrollBehavior: ScrollBehavior = 'smooth', skipScroll = false) {
    current = (index + items.length) % items.length;
    const { src, type, alt } = items[current];

    // ピンチズームリセット
    lbImg.style.transform = '';
    _pinchScale = 1;

    if (type === 'video') {
      lbImg.style.display = 'none';
      lbVideo.style.display = 'block';
      lbVideo.style.opacity = '0';
      lbVideo.src = src;
      lbVideo.play().catch(() => {});
      lbVideo.addEventListener('canplay', () => { lbVideo.style.opacity = '1'; }, { once: true });
    } else {
      lbVideo.pause();
      lbVideo.src = '';
      lbVideo.style.display = 'none';
      lbImg.style.display = '';
      lbImg.style.opacity = '0';
      lbImg.src = src;
      lbImg.alt = alt;
      lbImg.addEventListener('load', () => { lbImg.style.opacity = '1'; }, { once: true });
    }

    lbPrev.classList.toggle('is-hidden', items.length <= 1);
    lbNext.classList.toggle('is-hidden', items.length <= 1);
    lbCounter.textContent = items.length > 1 ? `${current + 1} / ${items.length}` : '';

    // サムネイルのアクティブ状態を更新
    lbThumbs.querySelectorAll('.lightbox-thumb').forEach((t, i) => {
      t.classList.toggle('is-active', i === current);
    });
    // アクティブサムネイルを中央にスクロール（skipScroll=true のときは呼ばない）
    if (!skipScroll) scrollActiveThumb(scrollBehavior);
  }

  // ── 操作ヒント（初回のみ） ──
  const HINT_KEY = 'lightbox-hint-shown';
  const lbHint = lightbox.querySelector<HTMLElement>('#lightbox-hint');

  function showHint() {
    if (!lbHint) return;
    try { if (localStorage.getItem(HINT_KEY)) return; } catch {}
    lbHint.classList.add('is-visible');
    const dismiss = () => {
      lbHint.classList.remove('is-visible');
      try { localStorage.setItem(HINT_KEY, '1'); } catch {}
    };
    lbHint.addEventListener('click', dismiss, { once: true });
    setTimeout(dismiss, HINT_DISMISS_MS);
  }

  function openLightbox(index: number) {
    triggerEl = document.activeElement as HTMLElement;
    showMedia(index, 'instant');
    lightbox.classList.add('is-active');
    lightbox.setAttribute('aria-hidden', 'false');
    // visibility:hidden 状態では scrollIntoView が効かないブラウザへの対策
    requestAnimationFrame(() => scrollActiveThumb('instant'));
    lockScroll('lightbox');
    lbClose.focus();
    showHint();
  }

  function closeLightbox() {
    lbVideo.pause();
    lbVideo.src = '';
    lightbox.classList.remove('is-active');
    lightbox.setAttribute('aria-hidden', 'true');
    unlockScroll('lightbox');
    if (triggerEl && typeof triggerEl.focus === 'function') triggerEl.focus();
  }

  // アイテムへのクリック・キーボードイベント
  itemEls.forEach((el, i) => {
    el.addEventListener('click', () => openLightbox(i));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(i);
      }
    });
  });

  // メディア本体クリックは overlay に伝播させない（動画コントロール操作で閉じないよう）
  lightbox.querySelector('.lightbox-media')!.addEventListener('click', (e) => e.stopPropagation());

  lbPrev.addEventListener('click', (e) => { e.stopPropagation(); showMedia(current - 1); });
  lbNext.addEventListener('click', (e) => { e.stopPropagation(); showMedia(current + 1); });
  lbClose.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });
  lightbox.addEventListener('click', closeLightbox);
  document.addEventListener('ui:close-overlays', closeLightbox);
  document.addEventListener('astro:before-preparation', closeLightbox, { once: true });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!lightbox.classList.contains('is-active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showMedia(current - 1);
    if (e.key === 'ArrowRight') showMedia(current + 1);
    // f / F: フルスクリーン切り替え
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      if (!document.fullscreenElement) {
        lightbox.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
    // 0: ピンチズームをリセット
    if (e.key === '0') {
      lbImg.style.transform = '';
      _pinchScale = 1;
    }
    // Tab フォーカストラップ
    if (e.key === 'Tab') {
      const focusable = [lbClose, lbPrev, lbNext].filter(
        (el) => el && !el.classList.contains('is-hidden')
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }
  });

  // ── サムネイルストリップ生成 ──
  if (items.length > 1) {
    items.forEach((item, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lightbox-thumb';
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', `${i + 1} 枚目を表示`);
      if (item.type === 'image') {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = '';
        img.loading = 'lazy';
        img.setAttribute('aria-hidden', 'true');
        btn.appendChild(img);
      } else {
        btn.textContent = '▶';
      }
      btn.addEventListener('click', (e) => { e.stopPropagation(); showMedia(i); });
      lbThumbs.appendChild(btn);
    });

    // ── サムネイル横スクロールでメイン画像を自動切り替え ──
    // スクロール停止時に中央のサムネイルを検出し、対応するメイン画像を表示する
    let _thumbScrollTimer: ReturnType<typeof setTimeout> | null = null;

    function syncFromThumbScroll() {
      if (_isProgramScroll) return; // プログラム側スクロールは無視
      const containerCenter = lbThumbs.scrollLeft + lbThumbs.clientWidth / 2;
      let closestIndex = current;
      let closestDist = Infinity;
      lbThumbs.querySelectorAll<HTMLElement>('.lightbox-thumb').forEach((thumb, i) => {
        const thumbCenter = thumb.offsetLeft + thumb.offsetWidth / 2;
        const dist = Math.abs(thumbCenter - containerCenter);
        if (dist < closestDist) { closestDist = dist; closestIndex = i; }
      });
      // 画像のみ更新。プログラム側スクロールは起こさない（モバイルの引っかかりを防ぐ）
      if (closestIndex !== current) showMedia(closestIndex, 'smooth', true);
    }

    // scrollend: スナップ完了後に一度だけ発火（モダンブラウザ）
    lbThumbs.addEventListener('scrollend', syncFromThumbScroll, { passive: true });
    // scroll デバウンス: scrollend 未対応ブラウザ（古い Safari 等）向けフォールバック
    lbThumbs.addEventListener('scroll', () => {
      if (_thumbScrollTimer) clearTimeout(_thumbScrollTimer);
      _thumbScrollTimer = setTimeout(syncFromThumbScroll, LIGHTBOX_SCROLL_DEBOUNCE_MS);
    }, { passive: true });
  }

  // ── ピンチズーム対応（モバイル） ──
  let _pinchScale = 1;
  let _pinchStartDist = 0;
  const lbMediaEl = lightbox.querySelector<HTMLElement>('.lightbox-media')!;

  lbMediaEl.addEventListener('touchstart', function(e) {
    if (e.touches.length === 2) {
      _pinchStartDist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
    }
  }, { passive: true });

  lbMediaEl.addEventListener('touchmove', function(e) {
    if (e.touches.length !== 2 || lbImg.style.display === 'none') return;
    e.preventDefault();
    const dist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    );
    const scale = Math.min(4, Math.max(1, (_pinchScale * dist) / _pinchStartDist));
    lbImg.style.transform = `scale(${scale})`;
  }, { passive: false });

  lbMediaEl.addEventListener('touchend', function(e) {
    if (e.touches.length < 2) {
      const m = lbImg.style.transform.match(/scale\(([\d.]+)\)/);
      _pinchScale = m ? parseFloat(m[1]) : 1;
      if (_pinchScale < 1.1) {
        _pinchScale = 1;
        lbImg.style.transform = '';
      }
    }
  }, { passive: true });

  // ── タッチスワイプ対応（モバイル） ──
  let _touchStartX = 0;
  let _touchFromMedia = false;
  lightbox.addEventListener('touchstart', function(e) {
    _touchStartX = e.touches[0].clientX;
    // .lightbox-thumbs からのタッチもスワイプ判定から除外（サムネイルスクロールと競合するため）
    _touchFromMedia = !!(e.target as HTMLElement).closest('.lightbox-media, .lightbox-thumbs');
  }, { passive: true });
  lightbox.addEventListener('touchend', function(e) {
    if (!lightbox.classList.contains('is-active') || _touchFromMedia) return;
    const delta = e.changedTouches[0].clientX - _touchStartX;
    if (Math.abs(delta) > 50) {
      if (delta < 0) showMedia(current + 1);
      else showMedia(current - 1);
    }
  }, { passive: true });
}

// astro:page-load で毎回再初期化（VT 後も確実にリスナーを付け直す）
document.addEventListener('astro:page-load', initLightbox);
