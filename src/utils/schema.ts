import { CIRCLE_NAME, SITE_NAME } from './constants';

const author = { '@type': 'Organization' as const, name: CIRCLE_NAME };
const toISODate = (d: Date) => d.toISOString().split('T')[0];

/** Organization JSON-LD（全ページ共通） */
export function buildOrgSchema(siteUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: CIRCLE_NAME,
    alternateName: 'だうぐあんぐじんぐ',
    url: siteUrl,
    description: '同人ゲームサークル公式サイト'
  };
}

/** WebSite JSON-LD（トップページ用） */
export function buildWebSiteSchema(siteUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: ['だうぐあんぐじんぐ公式', 'だうぐあんぐじんぐ'],
    url: siteUrl
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
    datePublished: toISODate(opts.datePublished)
  };
}

/** Article JSON-LD（更新履歴詳細用） */
export function buildArticleSchema(opts: {
  headline: string;
  datePublished: Date;
  dateModified?: Date;
  image?: string;
}) {
  const published = toISODate(opts.datePublished);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    datePublished: published,
    dateModified: opts.dateModified ? toISODate(opts.dateModified) : published,
    author,
    publisher: author,
    ...(opts.image ? { image: opts.image } : {})
  };
}
