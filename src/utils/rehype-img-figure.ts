import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';

/**
 * Markdown の `![alt](img)` が生成する `<p><img></p>` を
 * `<figure><img><figcaption>alt</figcaption></figure>` に変換する。
 */
export function rehypeImgFigure() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'p' || !parent || index === undefined) return;

      const children = node.children.filter(
        (child) => child.type !== 'text' || (child as { value: string }).value.trim() !== ''
      );

      if (children.length !== 1 || children[0].type !== 'element') return;

      const img = children[0] as Element;
      if (img.tagName !== 'img') return;

      const alt = (img.properties?.alt as string) ?? '';

      const figure: Element = {
        type: 'element',
        tagName: 'figure',
        properties: { class: 'article-figure' },
        children: [
          img,
          ...(alt
            ? [
                {
                  type: 'element',
                  tagName: 'figcaption',
                  properties: {},
                  children: [{ type: 'text', value: alt }],
                } as Element,
              ]
            : []),
        ],
      };

      parent.children[index] = figure;
    });
  };
}
