import { describe, expect, test } from 'vitest';
import { rehypeImgFigure } from './rehype-img-figure';
import type { Root, Element } from 'hast';

/** テスト用の p > img ツリーを生成 */
function makeTree(alt: string, src = 'img.png'): Root {
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'p',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'img',
            properties: { src, alt },
            children: []
          }
        ]
      }
    ]
  };
}

describe('rehypeImgFigure', () => {
  test('p > img を figure > img + figcaption に変換する', () => {
    const tree = makeTree('キャプション');
    rehypeImgFigure()(tree);

    const figure = tree.children[0] as Element;
    expect(figure.tagName).toBe('figure');
    expect(figure.properties?.class).toBe('article-figure');
    expect(figure.children).toHaveLength(2);

    const img = figure.children[0] as Element;
    expect(img.tagName).toBe('img');

    const caption = figure.children[1] as Element;
    expect(caption.tagName).toBe('figcaption');
    expect(caption.children[0]).toEqual({ type: 'text', value: 'キャプション' });
  });

  test('alt が空の場合は figcaption を生成しない', () => {
    const tree = makeTree('');
    rehypeImgFigure()(tree);

    const figure = tree.children[0] as Element;
    expect(figure.tagName).toBe('figure');
    expect(figure.children).toHaveLength(1);
  });

  test('p 内にテキスト + img がある場合は変換しない', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            { type: 'text', value: 'テキスト' },
            {
              type: 'element',
              tagName: 'img',
              properties: { src: 'img.png', alt: 'alt' },
              children: []
            }
          ]
        }
      ]
    };
    rehypeImgFigure()(tree);

    const p = tree.children[0] as Element;
    expect(p.tagName).toBe('p');
  });

  test('p 内の単一要素が img でない場合は変換しない', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'strong',
              properties: {},
              children: [{ type: 'text', value: 'bold' }]
            }
          ]
        }
      ]
    };
    rehypeImgFigure()(tree);

    const p = tree.children[0] as Element;
    expect(p.tagName).toBe('p');
  });

  test('空白テキストノードは無視して変換する', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            { type: 'text', value: '  \n  ' },
            {
              type: 'element',
              tagName: 'img',
              properties: { src: 'img.png', alt: 'テスト' },
              children: []
            }
          ]
        }
      ]
    };
    rehypeImgFigure()(tree);

    const figure = tree.children[0] as Element;
    expect(figure.tagName).toBe('figure');
  });
});
