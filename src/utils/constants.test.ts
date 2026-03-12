import { describe, expect, test } from 'vitest';
import { animDelay, ANIM_BASE_DELAY, ANIM_STAGGER } from './constants';

describe('animDelay', () => {
  test('index=0 はベース遅延のみ', () => {
    expect(animDelay(0)).toBe(`${ANIM_BASE_DELAY}s`);
  });

  test('index=2 は正しく計算される', () => {
    const expected = ANIM_BASE_DELAY + 2 * ANIM_STAGGER;
    expect(animDelay(2)).toBe(`${expected}s`);
  });

  test('extraDelay が加算される', () => {
    const expected = ANIM_BASE_DELAY + 0.5 + 1 * ANIM_STAGGER;
    expect(animDelay(1, 0.5)).toBe(`${expected}s`);
  });
});
