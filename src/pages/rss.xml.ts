import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { CIRCLE_NAME } from '../utils/constants';
import { getSortedNews } from '../utils/collections';

export async function GET(context: APIContext) {
  const news = await getSortedNews();

  return rss({
    title: `${CIRCLE_NAME} 開発ログ`,
    description: `同人ゲームサークル ${CIRCLE_NAME}の更新情報。`,
    site: context.site!.toString(),
    items: news.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      link: `${context.site}news/${entry.slug}/`
    }))
  });
}
