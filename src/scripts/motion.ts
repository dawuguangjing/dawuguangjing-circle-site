/** ユーザーが reduced-motion を希望しているかを返す */
export const prefersReducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;
