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

/** slug → work の Map を返す */
export async function getWorkIndex() {
  const works = await getCollection('works');
  return new Map(works.map((w) => [w.slug, w]));
}
