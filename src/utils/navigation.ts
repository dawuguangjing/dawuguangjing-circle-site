import { withBase } from './withBase';

export interface NavItem {
  label: string;
  href: string;
  /** withBase未適用のパス（フッターのグルーピング等に利用） */
  path: string;
}

/** ヘッダー・フッター共通のナビゲーション定義 */
export const mainNav: NavItem[] = [
  { label: 'ストア',       path: 'works/',   href: withBase('works/') },
  { label: '更新履歴',     path: 'news/',    href: withBase('news/') },
  { label: 'サークル情報', path: 'about/',   href: withBase('about/') },
  { label: 'FAQ',          path: 'faq/',     href: withBase('faq/') },
  { label: 'お問い合わせ', path: 'contact/', href: withBase('contact/') },
];

/** フッター用のグルーピング */
export const footerNav = [
  {
    heading: '作品',
    items: [
      { label: '作品一覧', href: withBase('works/') },
      { label: '更新履歴', href: withBase('news/') },
    ],
  },
  {
    heading: 'サポート',
    items: [
      { label: 'FAQ',          href: withBase('faq/') },
      { label: 'お問い合わせ', href: withBase('contact/') },
    ],
  },
  {
    heading: 'その他',
    items: [
      { label: 'サークル情報', href: withBase('about/') },
      { label: 'プライバシー', href: withBase('privacy/') },
    ],
  },
  {
    heading: '外部リンク',
    items: [
      { label: 'Ci-en', href: 'https://ci-en.dlsite.com/creator/35269' },
    ],
  },
];
