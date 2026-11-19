import { getCollection, type CollectionKey } from 'astro:content';

/** getCollection をラップし、失敗時にコレクション名を含むエラーメッセージを付与する */
async function safeGetCollection<T extends CollectionKey>(name: T) {
  try {
    return await getCollection(name);
  } catch (error) {
    throw new Error(`コレクション "${name}" の取得に失敗しました`, { cause: error });
  }
}

/** 作品をリリース日の降順で取得 */
export async function getSortedWorks() {
  return (await safeGetCollection('works')).sort(
    (a, b) => b.data.releaseDate.getTime() - a.data.releaseDate.getTime()
  );
}

/** ニュースを日付の降順で取得 */
export async function getSortedNews() {
  return (await safeGetCollection('news')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );
}

/** 記事本文から最初の外部画像 URL を抽出する */
export function extractFirstImageUrl(body: string): string | undefined {
  const match = body.match(/!\[.*?\]\((https?:\/\/[^)\s]+)\)/);
  return match?.[1];
}

/** ギャラリーをリリース日の降順で取得。画像枚数・画像＋動画の合計数を解決済みの値として付与する */
export async function getSortedGallery() {
  return (await safeGetCollection('gallery'))
    .sort(
      (a, b) =>
        b.data.releaseDate.getTime() - a.data.releaseDate.getTime() ||
        (a.data.order ?? 0) - (b.data.order ?? 0)
    )
    .map((entry) => ({
      ...entry,
      resolvedImageCount: resolveImageCount(entry.data),
      resolvedMediaCount: resolveMediaCount(entry.data)
    }));
}

/** ギャラリーエントリーの実効画像枚数を返す */
export function resolveImageCount(data: { imageCount?: number; images: string[] }): number {
  return data.imageCount ?? data.images.length;
}

/** 一覧表示用: 画像枚数と動画本数の合計を返す */
export function resolveMediaCount(data: {
  imageCount?: number;
  images: string[];
  videos?: string[];
}): number {
  return resolveImageCount(data) + (data.videos?.length ?? 0);
}

/** slug → work の Map を返す */
export async function getWorkIndex() {
  const works = await safeGetCollection('works');
  return new Map(works.map((w) => [w.slug, w]));
}

/** slug → gallery の Map を返す */
export async function getGalleryIndex() {
  const galleries = await safeGetCollection('gallery');
  return new Map(galleries.map((g) => [g.slug, g]));
}

/** 作品の登場人物一覧を取得。workSlug が一致するキャラを先に、
 *  appearsInWorkSlugs で再登場するキャラを後に並べる（それぞれ order 昇順） */
export async function getCharactersByWork(workSlug: string) {
  const all = await safeGetCollection('characters');
  const byOrder = (a: (typeof all)[number], b: (typeof all)[number]) => a.data.order - b.data.order;
  const main = all.filter((c) => c.data.workSlug === workSlug).sort(byOrder);
  const guests = all
    .filter(
      (c) => c.data.workSlug !== workSlug && (c.data.appearsInWorkSlugs ?? []).includes(workSlug)
    )
    .sort(byOrder);
  return [...main, ...guests];
}

/** ギャラリーに関連するキャラクター一覧を取得（order 昇順） */
export async function getCharactersByGallery(gallerySlug: string) {
  const all = await safeGetCollection('characters');
  return all
    .filter((c) => (c.data.gallerySlugs ?? []).includes(gallerySlug))
    .sort((a, b) => a.data.order - b.data.order);
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
      next: entries[i - 1] ?? null
    }
  }));
}
