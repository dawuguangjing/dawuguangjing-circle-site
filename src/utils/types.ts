/** ストア名 */
export type StoreName = 'fanza' | 'dlsite';

/** ストア購入・体験版リンクの表示用データ */
export type StoreLink = {
  label: string;
  href: string;
  track: string;
  store: StoreName;
};

/** sources オブジェクトから StoreLink 配列を構築するユーティリティ */
export function buildLinks(
  sources: Record<string, string | undefined>,
  entries: { key: string; label: string; track: string; store: StoreName }[]
): StoreLink[] {
  return entries.flatMap(({ key, label, track, store }) => {
    const href = sources[key];
    return href ? [{ label, href, track, store }] : [];
  });
}

/** buildLinks に渡す購入リンク設定 */
export const PURCHASE_LINK_ENTRIES = [
  { key: 'fanza', label: 'FANZA で購入', track: 'click_fanza', store: 'fanza' },
  { key: 'dlsite', label: 'DLsite で購入', track: 'click_dlsite', store: 'dlsite' }
] satisfies Parameters<typeof buildLinks>[1];

/** buildLinks に渡す体験版リンク設定 */
export const TRIAL_LINK_ENTRIES = [
  { key: 'fanza', label: 'FANZA 体験版', track: 'click_trial_fanza', store: 'fanza' },
  { key: 'dlsite', label: 'DLsite 体験版', track: 'click_trial_dlsite', store: 'dlsite' }
] satisfies Parameters<typeof buildLinks>[1];

/** FANZA / DLsite リンクのソース（works・gallery 共用） */
export type StoreLinkSources = { fanza?: string; dlsite?: string };

/** work/gallery の platformLinks・trialLinks から購入・体験版リンクをまとめて構築する。
 *  各所に散在していた buildLinks(..., PURCHASE_LINK_ENTRIES) / buildLinks(..., TRIAL_LINK_ENTRIES)
 *  のペアを一本化するためのヘルパー。 */
export function getStoreLinks(source: {
  platformLinks?: StoreLinkSources;
  trialLinks?: StoreLinkSources;
}): { purchase: StoreLink[]; trial: StoreLink[] } {
  return {
    purchase: buildLinks(source.platformLinks ?? {}, PURCHASE_LINK_ENTRIES),
    trial: buildLinks(source.trialLinks ?? {}, TRIAL_LINK_ENTRIES)
  };
}

/** カード・画像コンポーネント共通の画像最適化 Props */
export interface ImageLoadProps {
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high' | 'low' | 'auto';
}
