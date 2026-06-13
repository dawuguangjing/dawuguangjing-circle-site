import { describe, expect, test } from 'vitest';
import {
  clamp,
  wrapIndex,
  clampZoom,
  clampPan,
  zoomToPoint,
  swipeDirection
} from './lightbox-math';

describe('clamp', () => {
  test('範囲内はそのまま', () => expect(clamp(5, 0, 10)).toBe(5));
  test('下限でクランプ', () => expect(clamp(-3, 0, 10)).toBe(0));
  test('上限でクランプ', () => expect(clamp(99, 0, 10)).toBe(10));
});

describe('wrapIndex', () => {
  test('範囲内', () => expect(wrapIndex(2, 5)).toBe(2));
  test('末尾から次へ → 先頭', () => expect(wrapIndex(5, 5)).toBe(0));
  test('先頭から前へ → 末尾', () => expect(wrapIndex(-1, 5)).toBe(4));
  test('大きく超過しても環状', () => expect(wrapIndex(-7, 5)).toBe(3));
  test('length 0 は 0', () => expect(wrapIndex(3, 0)).toBe(0));
});

describe('clampZoom', () => {
  test('範囲内', () => expect(clampZoom(2, 1, 4)).toBe(2));
  test('最小未満', () => expect(clampZoom(0.5, 1, 4)).toBe(1));
  test('最大超過', () => expect(clampZoom(9, 1, 4)).toBe(4));
});

describe('clampPan', () => {
  test('画像がビューポート内なら移動不可（0に固定）', () => {
    // scaledW < vw, scaledH < vh → maxT = 0
    expect(clampPan(50, 50, 800, 600, 1000, 800)).toEqual({ x: 0, y: 0 });
  });
  test('はみ出し分だけ移動可（境界でクランプ）', () => {
    // scaledW=1400, vw=1000 → maxTx=(1400-1000)/2=200
    expect(clampPan(500, 0, 1400, 600, 1000, 800)).toEqual({ x: 200, y: 0 });
    expect(clampPan(-500, 0, 1400, 600, 1000, 800)).toEqual({ x: -200, y: 0 });
    expect(clampPan(100, 0, 1400, 600, 1000, 800)).toEqual({ x: 100, y: 0 });
  });
});

describe('zoomToPoint', () => {
  test('中心点でのズームは平行移動を生まない', () => {
    const r = zoomToPoint({
      px: 500,
      py: 400,
      vcx: 500,
      vcy: 400,
      oldScale: 1,
      newScale: 2,
      tx: 0,
      ty: 0
    });
    expect(r).toEqual({ scale: 2, tx: 0, ty: 0 });
  });
  test('中心からずれた点を固定してズーム', () => {
    // 右に100px(中心から)の点を等倍からズーム2倍 → その点を保つため -100 シフト
    const r = zoomToPoint({
      px: 600,
      py: 400,
      vcx: 500,
      vcy: 400,
      oldScale: 1,
      newScale: 2,
      tx: 0,
      ty: 0
    });
    expect(r.scale).toBe(2);
    expect(r.tx).toBe(-100);
    expect(r.ty).toBe(0);
  });
});

describe('swipeDirection', () => {
  test('閾値以下は0', () => expect(swipeDirection(30, 50)).toBe(0));
  test('左スワイプ→次へ(+1)', () => expect(swipeDirection(-80, 50)).toBe(1));
  test('右スワイプ→前へ(-1)', () => expect(swipeDirection(80, 50)).toBe(-1));
  test('境界ちょうどは0（厳密超過のみ有効）', () => expect(swipeDirection(50, 50)).toBe(0));
});
