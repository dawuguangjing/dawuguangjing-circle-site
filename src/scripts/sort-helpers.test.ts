import { describe, expect, test } from 'vitest';
import { dateTitleSort, orderNameSort } from './sort-helpers';

// コンパレータは dataset しか参照しないため最小モックで代用する
const el = (dataset: Record<string, string>) => ({ dataset }) as unknown as HTMLElement;

describe('dateTitleSort', () => {
  const sort = dateTitleSort();
  const older = el({ releaseDate: '100', title: 'あ' });
  const newer = el({ releaseDate: '200', title: 'い' });

  test('newest: 新しい日付が先（降順）', () => {
    // 正の戻り値 = older が newer より後ろ
    expect(sort(older, newer, 'newest')).toBeGreaterThan(0);
  });

  test('oldest: 古い日付が先（昇順）', () => {
    expect(sort(older, newer, 'oldest')).toBeLessThan(0);
  });

  test('title: 日本語ロケールで比較', () => {
    expect(sort(older, newer, 'title')).toBeLessThan(0); // 'あ' < 'い'
  });
});

describe('orderNameSort', () => {
  const sort = orderNameSort();
  const first = el({ order: '1', name: 'あ' });
  const second = el({ order: '2', name: 'い' });

  test('order: 昇順', () => {
    expect(sort(first, second, 'order')).toBeLessThan(0);
  });

  test('name: 日本語ロケールで比較', () => {
    expect(sort(second, first, 'name')).toBeGreaterThan(0); // 'い' > 'あ'
  });
});
