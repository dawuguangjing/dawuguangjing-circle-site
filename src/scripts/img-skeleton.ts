// ── IMAGE SKELETON ───────────────────────────────────────────────────────
// .img-skeleton → 画像ロード完了時に is-loaded クラスを付与してフェードイン

export function initImgSkeleton() {
  document.querySelectorAll<HTMLElement>('.img-skeleton').forEach((wrap) => {
    const img = wrap.querySelector<HTMLImageElement>('img:not([aria-hidden])');
    if (!img) return;
    const resolve = () => wrap.classList.add('is-loaded');
    if (img.complete) {
      resolve();
    } else {
      img.addEventListener('load',  resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    }
  });
}
