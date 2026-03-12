/** ユーザーが reduced-motion を希望しているかを返す */
export const prefersReducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;

/** reduced-motion に応じた ScrollBehavior を返す */
export const smoothScrollBehavior = (): ScrollBehavior =>
  prefersReducedMotion() ? 'auto' : 'smooth';
