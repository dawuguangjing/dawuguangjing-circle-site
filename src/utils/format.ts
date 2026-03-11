/** ja-JP の日付フォーマット（例: 2025年12月15日） */
export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);

/** Markdown 本文からプレーンテキスト抜粋を生成する */
export function extractExcerpt(body: string, maxLen = 100): string {
  const text = body
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~>#\-|]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '\u2026' : text;
}
