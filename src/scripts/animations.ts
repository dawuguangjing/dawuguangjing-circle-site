import { ANIM_INTERSECTION_THRESHOLD } from '../utils/constants';

function initAnimations(instant = false) {
  if (instant) {
    document.querySelectorAll<HTMLElement>('[data-anim]').forEach((el) => {
      el.classList.add('is-visible');
    });
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        observer.unobserve(e.target);
      }
    }),
    { threshold: ANIM_INTERSECTION_THRESHOLD }
  );
  document.querySelectorAll('[data-anim]').forEach(el => observer.observe(el));
}

// VT ナビゲーション時: after-swap で即時アニメーション（2段階更新を防止）
// 初回ロード時: after-swap は発火しないため page-load にフォールバック
let _animInitedBySwap = false;
document.addEventListener('astro:after-swap', () => {
  _animInitedBySwap = true;
  initAnimations(true);
});
document.addEventListener('astro:page-load', () => {
  if (!_animInitedBySwap) {
    initAnimations();
  }
  _animInitedBySwap = false;
});
