// ── Lightbox ─────────────────────────────────────────────────────────
// ライトボックスの全ロジック。Lightbox.astro からインポートされる。
// astro:page-load で毎回再初期化（VT 後も確実にリスナーを付け直す）。

import { lockScroll, unlockScroll } from './scroll-lock';
import { safeGet, safeSet } from './safe-storage';
import { prefersReducedMotion, smoothScrollBehavior } from './motion';
import { onTransitionEnd } from './transition-end';
import {
  HINT_DISMISS_MS,
  LIGHTBOX_HINT_KEY,
  LIGHTBOX_SCROLL_SYNC_MS,
  LIGHTBOX_SCROLL_DEBOUNCE_MS,
  LIGHTBOX_MAX_ZOOM,
  LIGHTBOX_MIN_ZOOM,
  LIGHTBOX_ZOOM_RESET_THRESHOLD,
  LIGHTBOX_SWIPE_THRESHOLD_PX,
  LIGHTBOX_FADE_OUT_MS,
  LIGHTBOX_DOUBLE_TAP_MS,
  LIGHTBOX_DOUBLE_TAP_ZOOM,
  LIGHTBOX_WHEEL_ZOOM_STEP,
  LIGHTBOX_PAN_THRESHOLD_PX
} from '../utils/constants';

// #1: AbortController で VT 遷移時に前回のリスナーを一括解除
let _ac: AbortController | null = null;

function initLightbox() {
  const el = document.getElementById('lightbox');
  if (!el) return;
  const lightbox = el as HTMLDialogElement;

  // 前回の初期化で登録した document リスナーを一括解除
  _ac?.abort();
  _ac = new AbortController();
  const { signal } = _ac;

  const itemSelector = lightbox.dataset.itemSelector!;
  const lbImg = lightbox.querySelector<HTMLImageElement>('.lightbox-img')!;
  const lbVideo = lightbox.querySelector<HTMLVideoElement>('.lightbox-video')!;
  const lbClose = lightbox.querySelector<HTMLButtonElement>('.lightbox-close')!;
  const lbPrev = lightbox.querySelector<HTMLButtonElement>('.lightbox-prev')!;
  const lbNext = lightbox.querySelector<HTMLButtonElement>('.lightbox-next')!;
  const lbCounter = lightbox.querySelector<HTMLElement>('.lightbox-counter')!;
  const lbThumbs = lightbox.querySelector<HTMLElement>('.lightbox-thumbs')!;
  const lbSpinner = lightbox.querySelector<HTMLElement>('.lightbox-spinner')!;

  const itemEls = Array.from(document.querySelectorAll<HTMLElement>(itemSelector));
  const items = itemEls.map((el) => ({
    src: el.dataset.lightboxSrc || '',
    type: el.dataset.lightboxType || 'image',
    alt: el.dataset.lightboxAlt || ''
  }));
  let current = 0;
  let triggerEl: HTMLElement | null = null;
  // プログラム側スクロール中はサムネイル scroll イベントを無視するフラグ
  let _isProgramScroll = false;
  let _programScrollTimer: ReturnType<typeof setTimeout> | null = null;
  // #5: タイマー参照をクロージャ全体で保持
  let _thumbScrollTimer: ReturnType<typeof setTimeout> | null = null;
  let _hintTimer: ReturnType<typeof setTimeout> | null = null;
  // [B] フェードアウト: 閉じ中フラグ
  let _isClosing = false;

  // #6: reduced-motion 対応 — デフォルト引数で motion 設定を参照
  function scrollActiveThumb(behavior?: ScrollBehavior) {
    const b = behavior ?? smoothScrollBehavior();
    _isProgramScroll = true;
    if (_programScrollTimer) clearTimeout(_programScrollTimer);
    lbThumbs
      .querySelector<HTMLElement>('.lightbox-thumb.is-active')
      ?.scrollIntoView({ behavior: b, block: 'nearest', inline: 'center' });
    // smooth アニメーション終了後にフラグをリセット
    _programScrollTimer = setTimeout(
      () => {
        _isProgramScroll = false;
      },
      b === 'instant' || b === 'auto' ? 0 : LIGHTBOX_SCROLL_SYNC_MS
    );
  }

  // [A] 隣接画像プリロード
  function preloadAdjacent() {
    for (const offset of [-1, 1]) {
      const idx = (current + offset + items.length) % items.length;
      const item = items[idx];
      if (item.type === 'image') {
        const img = new Image();
        img.src = item.src;
      }
    }
  }

  function showMedia(index: number, scrollBehavior?: ScrollBehavior, skipScroll = false) {
    current = (index + items.length) % items.length;
    const { src, type, alt } = items[current];

    // ズーム/パンリセット
    _pinchScale = 1;
    _translateX = 0;
    _translateY = 0;
    lbImg.style.transform = '';
    lbImg.classList.remove('is-zoomed');
    lbImg.style.touchAction = '';

    // [E] スピナー表示
    lbSpinner.classList.remove('is-hidden');

    if (type === 'video') {
      lbImg.style.display = 'none';
      lbVideo.style.display = 'block';
      lbVideo.style.opacity = '0';
      lbVideo.src = src;
      // #4: oncanplay プロパティで前のハンドラを自動上書き
      lbVideo.oncanplay = () => {
        lbVideo.style.opacity = '1';
        lbSpinner.classList.add('is-hidden');
      };
      // #3: autoplay 拒否時もコントロール付きで表示する
      lbVideo.play().catch(() => {
        lbVideo.style.opacity = '1';
        lbSpinner.classList.add('is-hidden');
      });
    } else {
      lbVideo.pause();
      lbVideo.src = '';
      lbVideo.oncanplay = null;
      lbVideo.style.display = 'none';
      lbImg.style.display = '';
      lbImg.style.opacity = '0';
      // #4: onload プロパティで前のハンドラを自動上書き（レース条件解消）
      lbImg.onload = () => {
        lbImg.style.opacity = '1';
        lbSpinner.classList.add('is-hidden');
        updateImgBaseDimensions();
      };
      lbImg.src = src;
      lbImg.alt = alt;
      // プリロード済み（キャッシュ済み）画像は transition なしで即表示
      if (lbImg.complete && lbImg.naturalWidth > 0) {
        lbImg.style.transition = 'none';
        lbImg.style.opacity = '1';
        lbSpinner.classList.add('is-hidden');
        updateImgBaseDimensions();
        requestAnimationFrame(() => {
          lbImg.style.transition = '';
        });
      }
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

    // [A] 隣接画像プリロード
    preloadAdjacent();
  }

  // ── 操作ヒント（初回のみ） ──
  const lbHint = lightbox.querySelector<HTMLElement>('#lightbox-hint');

  function showHint() {
    if (!lbHint) return;
    if (safeGet(LIGHTBOX_HINT_KEY)) return;
    lbHint.classList.add('is-visible');
    const dismiss = () => {
      lbHint.classList.remove('is-visible');
      safeSet(LIGHTBOX_HINT_KEY, '1');
      _hintTimer = null;
    };
    lbHint.addEventListener(
      'click',
      (e) => {
        e.stopPropagation();
        if (_hintTimer) {
          clearTimeout(_hintTimer);
          _hintTimer = null;
        }
        dismiss();
      },
      { once: true }
    );
    // #5: タイマー参照を保持
    _hintTimer = setTimeout(dismiss, HINT_DISMISS_MS);
  }

  function openLightbox(index: number) {
    // #11(防御): 二重オープン防止 / [B] フェードアウト中も抑止
    if (lightbox.open || _isClosing) return;
    // #10: 上位オーバーレイが開いている場合は抑止
    if (document.querySelector('dialog[open]:not(#lightbox), .sheet-overlay.is-active')) return;
    triggerEl = document.activeElement as HTMLElement;
    showMedia(index, 'instant');
    lightbox.showModal();
    lightbox.classList.add('is-active');
    requestAnimationFrame(() => scrollActiveThumb('instant'));
    lockScroll('lightbox');
    lbClose.focus();
    showHint();
  }

  // [B] フェードアウト完了後の実際のクリーンアップ
  function finishClose() {
    if (!_isClosing) return; // 二重呼び出し防止
    _isClosing = false;
    lbVideo.pause();
    lbVideo.src = '';
    lbVideo.oncanplay = null;
    lbImg.onload = null;
    lbSpinner.classList.add('is-hidden');
    lightbox.close();
    unlockScroll('lightbox');
    if (triggerEl && typeof triggerEl.focus === 'function') triggerEl.focus();
  }

  function closeLightbox() {
    if (!lightbox.open || _isClosing) return;
    _isClosing = true;
    // #5: 全タイマーをクリア
    if (_programScrollTimer) {
      clearTimeout(_programScrollTimer);
      _programScrollTimer = null;
    }
    if (_thumbScrollTimer) {
      clearTimeout(_thumbScrollTimer);
      _thumbScrollTimer = null;
    }
    if (_hintTimer) {
      clearTimeout(_hintTimer);
      _hintTimer = null;
    }
    _isProgramScroll = false;
    // #13: ヒントのクラスをリセット
    lbHint?.classList.remove('is-visible');

    // ズーム/パンリセット（CSS close animation を正しく動かす）
    _pinchScale = 1;
    _translateX = 0;
    _translateY = 0;
    lbImg.style.transform = '';
    lbImg.classList.remove('is-zoomed');
    lbImg.style.touchAction = '';

    // [B] フェードアウト開始
    lightbox.classList.remove('is-active');

    // reduced-motion 時は即座に閉じる
    if (prefersReducedMotion()) {
      finishClose();
      return;
    }

    // transitionend を待ってから close()（フォールバックタイマー付き）
    onTransitionEnd(lightbox, finishClose, LIGHTBOX_FADE_OUT_MS);
  }

  // アイテムへのクリック・キーボードイベント
  itemEls.forEach((el, i) => {
    // キーボードアクセシビリティを保証（未設定の要素のみ補完）
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (!el.getAttribute('role')) el.setAttribute('role', 'button');
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', items[i].alt || `画像 ${i + 1} を拡大する`);
    }
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

  lbPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    showMedia(current - 1);
  });
  lbNext.addEventListener('click', (e) => {
    e.stopPropagation();
    showMedia(current + 1);
  });
  lbClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
  });
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  // #1: signal 付きで document リスナーを登録（VT 遷移時に自動解除）
  document.addEventListener('ui:close-overlays', closeLightbox, { signal });
  document.addEventListener('astro:before-preparation', closeLightbox, { once: true, signal });

  // native dialog の Escape を制御（クリーンアップ処理を通す）
  lightbox.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeLightbox();
  });

  // #2: フォーカストラップ + 既存キーボード操作を統合した keydown ハンドラ
  function handleKeydown(e: KeyboardEvent) {
    if (!lightbox.open) return;

    // フォーカストラップ: Tab / Shift+Tab で dialog 内をループ
    if (e.key === 'Tab') {
      const focusable = lightbox.querySelectorAll<HTMLElement>(
        'button:not([disabled]):not(.is-hidden), video[controls]'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }

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
    // 0: ズームをリセット
    if (e.key === '0') {
      resetZoom();
    }
  }

  // #1: signal 付きで keydown を登録
  document.addEventListener('keydown', handleKeydown, { signal });

  // ウィンドウリサイズ時: ズーム中なら境界を再計算
  window.addEventListener(
    'resize',
    () => {
      if (_pinchScale > 1) {
        updateImgBaseDimensions();
        clampTranslate();
        applyTransform(false);
      }
    },
    { signal }
  );

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
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showMedia(i);
      });
      lbThumbs.appendChild(btn);
    });

    // ── サムネイル横スクロールでメイン画像を自動切り替え ──
    // スクロール停止時に中央のサムネイルを検出し、対応するメイン画像を表示する

    function syncFromThumbScroll() {
      if (!lightbox.open) return; // #8: 閉じた後の scrollend 発火を無視
      if (_isProgramScroll) return; // プログラム側スクロールは無視
      const containerCenter = lbThumbs.scrollLeft + lbThumbs.clientWidth / 2;
      let closestIndex = current;
      let closestDist = Infinity;
      lbThumbs.querySelectorAll<HTMLElement>('.lightbox-thumb').forEach((thumb, i) => {
        const thumbCenter = thumb.offsetLeft + thumb.offsetWidth / 2;
        const dist = Math.abs(thumbCenter - containerCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = i;
        }
      });
      // 画像のみ更新。プログラム側スクロールは起こさない（モバイルの引っかかりを防ぐ）
      if (closestIndex !== current) showMedia(closestIndex, undefined, true);
    }

    // scrollend: スナップ完了後に一度だけ発火（モダンブラウザ）
    lbThumbs.addEventListener('scrollend', syncFromThumbScroll, { passive: true });
    // scroll デバウンス: scrollend 未対応ブラウザ（古い Safari 等）向けフォールバック
    lbThumbs.addEventListener(
      'scroll',
      () => {
        if (_thumbScrollTimer) clearTimeout(_thumbScrollTimer);
        _thumbScrollTimer = setTimeout(syncFromThumbScroll, LIGHTBOX_SCROLL_DEBOUNCE_MS);
      },
      { passive: true }
    );
  }

  // ── ズーム & パン状態 ──
  let _pinchScale = 1;
  let _pinchStartDist = 0;
  let _pinchBaseScale = 1;
  let _translateX = 0;
  let _translateY = 0;
  let _imgBaseW = 0;
  let _imgBaseH = 0;
  // ピンチ中間点
  let _pinchMidX = 0;
  let _pinchMidY = 0;
  // パン/ドラッグ
  let _isPanning = false;
  let _panStartX = 0;
  let _panStartY = 0;
  let _panStartTx = 0;
  let _panStartTy = 0;
  let _didPan = false;
  let _touchPanning = false;

  const lbMediaEl = lightbox.querySelector<HTMLElement>('.lightbox-media')!;

  // ── ズーム/パン ヘルパー ──

  function applyTransform(animate = true) {
    if (!animate) {
      lbImg.style.transition = 'none';
    }
    if (_pinchScale <= 1 && _translateX === 0 && _translateY === 0) {
      lbImg.style.transform = '';
    } else {
      lbImg.style.transform = `translate(${_translateX}px, ${_translateY}px) scale(${_pinchScale})`;
    }
    lbImg.classList.toggle('is-zoomed', _pinchScale > 1);
    lbImg.style.touchAction = _pinchScale > 1 ? 'none' : '';
    if (!animate) {
      void lbImg.offsetHeight; // force reflow
      requestAnimationFrame(() => {
        lbImg.style.transition = '';
      });
    }
  }

  function updateImgBaseDimensions() {
    const rect = lbImg.getBoundingClientRect();
    _imgBaseW = rect.width / _pinchScale;
    _imgBaseH = rect.height / _pinchScale;
  }

  function clampTranslate() {
    const scaledW = _imgBaseW * _pinchScale;
    const scaledH = _imgBaseH * _pinchScale;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxTx = Math.max(0, (scaledW - vw) / 2);
    const maxTy = Math.max(0, (scaledH - vh) / 2);
    _translateX = Math.min(maxTx, Math.max(-maxTx, _translateX));
    _translateY = Math.min(maxTy, Math.max(-maxTy, _translateY));
  }

  function zoomAtPoint(newScale: number, px: number, py: number) {
    const oldScale = _pinchScale;
    newScale = Math.min(LIGHTBOX_MAX_ZOOM, Math.max(LIGHTBOX_MIN_ZOOM, newScale));
    const vcx = window.innerWidth / 2;
    const vcy = window.innerHeight / 2;
    const relX = (px - vcx - _translateX) / oldScale;
    const relY = (py - vcy - _translateY) / oldScale;
    _pinchScale = newScale;
    _translateX = px - vcx - relX * newScale;
    _translateY = py - vcy - relY * newScale;
    clampTranslate();
  }

  function resetZoom() {
    _pinchScale = 1;
    _translateX = 0;
    _translateY = 0;
    applyTransform(true);
  }

  lbMediaEl.addEventListener(
    'touchstart',
    function (e) {
      if (e.touches.length === 2) {
        _pinchStartDist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
        _pinchBaseScale = _pinchScale;
        _pinchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        _pinchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        updateImgBaseDimensions();
      }
    },
    { passive: true }
  );

  lbMediaEl.addEventListener(
    'touchmove',
    function (e) {
      if (e.touches.length !== 2 || lbImg.style.display === 'none') return;
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      const newMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const newMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const newScale = Math.min(
        LIGHTBOX_MAX_ZOOM,
        Math.max(LIGHTBOX_MIN_ZOOM, (_pinchBaseScale * dist) / _pinchStartDist)
      );
      // ポイントズーム: 初回中間点を基準に拡大
      zoomAtPoint(newScale, _pinchMidX, _pinchMidY);
      // 2指パン: 中間点のドリフト分をシフト
      _translateX += newMidX - _pinchMidX;
      _translateY += newMidY - _pinchMidY;
      _pinchMidX = newMidX;
      _pinchMidY = newMidY;
      clampTranslate();
      applyTransform(false);
    },
    { passive: false }
  );

  lbMediaEl.addEventListener(
    'touchend',
    function (e) {
      if (e.touches.length < 2) {
        if (_pinchScale < LIGHTBOX_ZOOM_RESET_THRESHOLD) {
          resetZoom();
        }
      }
    },
    { passive: true }
  );

  // ── [C] ダブルタップズーム（モバイル） ──
  let _lastTapTime = 0;
  lbMediaEl.addEventListener(
    'touchend',
    function (e) {
      // ピンチ中・動画表示中はスキップ
      if (e.touches.length > 0 || lbImg.style.display === 'none') return;
      const now = Date.now();
      if (now - _lastTapTime < LIGHTBOX_DOUBLE_TAP_MS && !_didPan) {
        e.preventDefault();
        const tapX = e.changedTouches[0].clientX;
        const tapY = e.changedTouches[0].clientY;
        if (_pinchScale === 1) {
          updateImgBaseDimensions();
          zoomAtPoint(LIGHTBOX_DOUBLE_TAP_ZOOM, tapX, tapY);
          applyTransform(true);
        } else {
          resetZoom();
        }
        _lastTapTime = 0; // 3連タップ防止
      } else {
        _lastTapTime = now;
      }
    },
    { passive: false }
  );

  // ── [D] マウスホイールズーム（デスクトップ） ──
  lbMediaEl.addEventListener(
    'wheel',
    function (e) {
      if (lbImg.style.display === 'none') return; // 動画表示中はスキップ
      e.preventDefault();
      const direction = e.deltaY > 0 ? -1 : 1;
      const newScale = Math.min(
        LIGHTBOX_MAX_ZOOM,
        Math.max(LIGHTBOX_MIN_ZOOM, _pinchScale + direction * LIGHTBOX_WHEEL_ZOOM_STEP)
      );
      if (newScale < LIGHTBOX_ZOOM_RESET_THRESHOLD) {
        resetZoom();
      } else {
        updateImgBaseDimensions();
        zoomAtPoint(newScale, e.clientX, e.clientY);
        applyTransform(true);
      }
    },
    { passive: false }
  );

  // ── マウスドラッグ（デスクトップ） ──
  lbMediaEl.addEventListener('mousedown', function (e) {
    if (_pinchScale <= 1 || lbImg.style.display === 'none') return;
    e.preventDefault();
    _isPanning = true;
    _didPan = false;
    _panStartX = e.clientX;
    _panStartY = e.clientY;
    _panStartTx = _translateX;
    _panStartTy = _translateY;
    lbMediaEl.style.cursor = 'grabbing';
  });
  document.addEventListener(
    'mousemove',
    function (e) {
      if (!_isPanning) return;
      const dx = e.clientX - _panStartX;
      const dy = e.clientY - _panStartY;
      if (!_didPan && Math.hypot(dx, dy) < LIGHTBOX_PAN_THRESHOLD_PX) return;
      _didPan = true;
      _translateX = _panStartTx + dx;
      _translateY = _panStartTy + dy;
      clampTranslate();
      applyTransform(false);
    },
    { signal }
  );
  document.addEventListener(
    'mouseup',
    function () {
      if (!_isPanning) return;
      _isPanning = false;
      lbMediaEl.style.cursor = '';
    },
    { signal }
  );

  // ── タッチスワイプ & パン対応（モバイル） ──
  let _touchStartX = 0;
  let _swipeBlocked = false;
  let _wasPinching = false;
  lightbox.addEventListener(
    'touchstart',
    function (e) {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      _touchStartX = x;
      const fromThumbs = !!(e.target as HTMLElement).closest('.lightbox-thumbs');
      _swipeBlocked = fromThumbs || _pinchScale !== 1;
      // ピンチ操作の追跡: 2本指以上ならマーク、1本指の新規タッチでリセット
      if (e.touches.length >= 2) _wasPinching = true;
      else if (e.touches.length === 1) _wasPinching = false;
      // ズーム中 + 1指 + 画像上 → パン開始
      if (_pinchScale > 1 && e.touches.length === 1 && !fromThumbs) {
        _touchPanning = true;
        _didPan = false;
        _panStartX = x;
        _panStartY = y;
        _panStartTx = _translateX;
        _panStartTy = _translateY;
      } else {
        _touchPanning = false;
      }
    },
    { passive: true }
  );
  lightbox.addEventListener(
    'touchmove',
    function (e) {
      if (!_touchPanning || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - _panStartX;
      const dy = e.touches[0].clientY - _panStartY;
      if (!_didPan && Math.hypot(dx, dy) < LIGHTBOX_PAN_THRESHOLD_PX) return;
      _didPan = true;
      e.preventDefault();
      _translateX = _panStartTx + dx;
      _translateY = _panStartTy + dy;
      clampTranslate();
      applyTransform(false);
    },
    { passive: false }
  );
  lightbox.addEventListener(
    'touchend',
    function (e) {
      if (_touchPanning) {
        _touchPanning = false;
        if (_didPan) return; // パンした場合はスワイプナビを抑制
      }
      if (!lightbox.open || _swipeBlocked || _wasPinching) return;
      const delta = e.changedTouches[0].clientX - _touchStartX;
      if (Math.abs(delta) > LIGHTBOX_SWIPE_THRESHOLD_PX) {
        if (delta < 0) showMedia(current + 1);
        else showMedia(current - 1);
      }
    },
    { passive: true }
  );
}

// astro:page-load で毎回再初期化（VT 後も確実にリスナーを付け直す）
document.addEventListener('astro:page-load', initLightbox);
