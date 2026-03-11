// ── IMAGE SKELETON ───────────────────────────────────────────────────────
// .img-skeleton → 画像ロード完了時に is-loaded クラスを付与してフェードイン
//                 エラー時は is-error クラスも付与してフォールバック表示

export function initImgSkeleton() {
  document.querySelectorAll<HTMLElement>('.img-skeleton').forEach((wrap) => {
    const img = wrap.querySelector<HTMLImageElement>('img:not([aria-hidden])');
    if (!img) {
      wrap.classList.add('is-loaded');
      return;
    }
    const onLoad = () => wrap.classList.add('is-loaded');
    const onError = () => {
      wrap.classList.add('is-loaded', 'is-error');
      img.style.display = 'none';
    };
    if (img.complete) {
      if (img.naturalWidth === 0 && img.src) {
        onError();
      } else {
        onLoad();
      }
    } else {
      img.addEventListener('load',  onLoad, { once: true });
      img.addEventListener('error', onError, { once: true });
    }
  });
}
