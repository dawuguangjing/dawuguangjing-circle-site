import { describe, expect, test, vi } from 'vitest';

vi.mock('astro:content', () => ({ getCollection: vi.fn() }));

import { extractFirstImageUrl, resolveImageCount, buildPrevNext } from './collections';

describe('extractFirstImageUrl', () => {
  test('Markdown 画像の URL を抽出する', () => {
    const body = 'テキスト ![alt](https://example.com/img.png) 続き';
    expect(extractFirstImageUrl(body)).toBe('https://example.com/img.png');
  });

  test('画像がない場合は undefined', () => {
    expect(extractFirstImageUrl('テキストのみ')).toBeUndefined();
  });

  test('複数画像がある場合は最初のみ返す', () => {
    const body = '![a](https://a.com/1.png) ![b](https://b.com/2.png)';
    expect(extractFirstImageUrl(body)).toBe('https://a.com/1.png');
  });

  test('ローカルパスの画像はマッチしない', () => {
    expect(extractFirstImageUrl('![alt](/images/local.png)')).toBeUndefined();
  });
});

describe('resolveImageCount', () => {
  test('imageCount 指定時はそれを返す', () => {
    expect(resolveImageCount({ imageCount: 10, images: ['a', 'b'] })).toBe(10);
  });

  test('imageCount 未指定時は images.length を返す', () => {
    expect(resolveImageCount({ images: ['a', 'b', 'c'] })).toBe(3);
  });

  test('空配列で imageCount 未指定時は 0', () => {
    expect(resolveImageCount({ images: [] })).toBe(0);
  });
});

describe('buildPrevNext', () => {
  const entries = [
    { slug: 'a', title: 'A' },
    { slug: 'b', title: 'B' },
    { slug: 'c', title: 'C' }
  ];

  test('各エントリーの prev/next を正しく設定する', () => {
    const result = buildPrevNext(entries);
    expect(result).toHaveLength(3);

    // 先頭: prev=次の要素, next=なし
    expect(result[0].params).toEqual({ slug: 'a' });
    expect(result[0].props.prev?.slug).toBe('b');
    expect(result[0].props.next).toBeNull();

    // 中間: prev/next あり
    expect(result[1].props.prev?.slug).toBe('c');
    expect(result[1].props.next?.slug).toBe('a');

    // 末尾: prev=なし, next=前の要素
    expect(result[2].props.prev).toBeNull();
    expect(result[2].props.next?.slug).toBe('b');
  });

  test('1要素の場合は prev/next ともに null', () => {
    const result = buildPrevNext([{ slug: 'only' }]);
    expect(result[0].props.prev).toBeNull();
    expect(result[0].props.next).toBeNull();
  });

  test('空配列は空配列を返す', () => {
    expect(buildPrevNext([])).toEqual([]);
  });
});
