import { getCollection } from 'astro:content';

/** 作品をリリース日の降順で取得 */
export async function getSortedWorks() {
  return (await getCollection('works')).sort(
    (a, b) => b.data.releaseDate.getTime() - a.data.releaseDate.getTime()
  );
}

/** ニュースを日付の降順で取得 */
export async function getSortedNews() {
  return (await getCollection('news')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );
}

/** 記事本文から最初の外部画像 URL を抽出する */
export function extractFirstImageUrl(body: string): string | undefined {
  const match = body.match(/!\[.*?\]\((https?:\/\/[^)\s]+)\)/);
  return match?.[1];
}

/** ギャラリーをリリース日の降順で取得。imageCount を解決済みの値として付与する */
export async function getSortedGallery() {
  return (await getCollection('gallery'))
    .sort((a, b) => b.data.releaseDate.getTime() - a.data.releaseDate.getTime())
    .map((entry) => ({
      ...entry,
      resolvedImageCount: resolveImageCount(entry.data),
    }));
}

/** ギャラリーエントリーの実効画像枚数を返す */
export function resolveImageCount(data: { imageCount?: number; images: string[] }): number {
  return data.imageCount ?? data.images.length;
}

/** slug → work の Map を返す */
export async function getWorkIndex() {
  const works = await getCollection('works');
  return new Map(works.map((w) => [w.slug, w]));
}

/** slug → gallery の Map を返す */
export async function getGalleryIndex() {
  const galleries = await getCollection('gallery');
  return new Map(galleries.map((g) => [g.slug, g]));
}

/** ソート済みコレクション配列から getStaticPaths 用の prev/next 付きパス配列を生成 */
export function buildPrevNext<T extends { slug: string }>(
  entries: T[]
): { params: { slug: string }; props: { entry: T; prev: T | null; next: T | null } }[] {
  return entries.map((entry, i) => ({
    params: { slug: entry.slug },
    props: {
      entry,
      prev: entries[i + 1] ?? null,
      next: entries[i - 1] ?? null,
    },
  }));
}
