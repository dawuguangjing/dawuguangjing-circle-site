import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { CIRCLE_NAME } from '../utils/constants';
import { getSortedNews } from '../utils/collections';

function toExcerpt(body: string, maxLen = 160): string {
  return body
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_`~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export async function GET(context: APIContext) {
  const news = await getSortedNews();

  return rss({
    title: `${CIRCLE_NAME} 開発ログ`,
    description: `同人ゲームサークル ${CIRCLE_NAME}の更新情報。`,
    site: context.site!.toString(),
    items: news.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      link: `${context.site}news/${entry.slug}/`,
      description: toExcerpt(entry.body)
    }))
  });
}
