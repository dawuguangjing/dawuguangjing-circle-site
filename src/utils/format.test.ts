import { describe, expect, test } from 'vitest';
import { formatDate, imageLoadingProps, extractExcerpt } from './format';

describe('formatDate', () => {
  test('通常の日付をフォーマットする', () => {
    const result = formatDate(new Date(2025, 11, 15));
    expect(result).toContain('2025');
    expect(result).toContain('12');
    expect(result).toContain('15');
  });

  test('年始をフォーマットする', () => {
    const result = formatDate(new Date(2024, 0, 1));
    expect(result).toContain('2024');
    expect(result).toContain('1');
  });
});

describe('imageLoadingProps', () => {
  test('index=0 は eager + high', () => {
    expect(imageLoadingProps(0)).toEqual({ loading: 'eager', fetchpriority: 'high' });
  });

  test('index>0 は lazy + undefined', () => {
    expect(imageLoadingProps(1)).toEqual({ loading: 'lazy', fetchpriority: undefined });
    expect(imageLoadingProps(5)).toEqual({ loading: 'lazy', fetchpriority: undefined });
  });
});

describe('extractExcerpt', () => {
  test('プレーンテキストをそのまま返す', () => {
    expect(extractExcerpt('Hello world')).toBe('Hello world');
  });

  test('Markdown 見出しを除去する', () => {
    expect(extractExcerpt('## Title\nBody text')).toBe('Body text');
  });

  test('Markdown リンクをテキストのみにする', () => {
    expect(extractExcerpt('[link](https://example.com)')).toBe('link');
  });

  test('画像記法を除去する', () => {
    expect(extractExcerpt('![alt](image.png) text')).toBe('text');
  });

  test('maxLen を超える場合は省略記号を付与する', () => {
    const long = 'a'.repeat(150);
    const result = extractExcerpt(long, 100);
    expect(result.length).toBe(101); // 100 chars + ellipsis
    expect(result.endsWith('\u2026')).toBe(true);
  });

  test('maxLen ちょうどの場合は省略記号なし', () => {
    const exact = 'a'.repeat(100);
    expect(extractExcerpt(exact, 100)).toBe(exact);
  });

  test('空文字列を処理する', () => {
    expect(extractExcerpt('')).toBe('');
  });
});
