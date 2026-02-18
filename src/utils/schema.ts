import { CIRCLE_NAME } from './constants';

const author = { '@type': 'Organization' as const, name: CIRCLE_NAME };

/** Organization JSON-LD（全ページ共通） */
export function buildOrgSchema(siteUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: CIRCLE_NAME,
    url: siteUrl,
    description: '同人ゲームサークル公式サイト',
  };
}

/** SoftwareApplication JSON-LD（作品詳細用） */
export function buildProductSchema(opts: {
  title: string;
  description: string;
  os: string;
  datePublished: Date;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: opts.title,
    description: opts.description,
    applicationCategory: 'GameApplication',
    operatingSystem: opts.os,
    author,
    datePublished: opts.datePublished.toISOString().split('T')[0],
  };
}

/** Article JSON-LD（更新履歴詳細用） */
export function buildArticleSchema(opts: {
  headline: string;
  datePublished: Date;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    datePublished: opts.datePublished.toISOString().split('T')[0],
    author,
  };
}
