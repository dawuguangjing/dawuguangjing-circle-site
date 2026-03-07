/** ストア購入・体験版リンクの表示用データ */
export type StoreLink = {
  label: string;
  href: string;
  track: string;
  store: string;
};

/** sources オブジェクトから StoreLink 配列を構築するユーティリティ */
export function buildLinks(
  sources: Record<string, string | undefined>,
  entries: { key: string; label: string; track: string; store: string }[]
): StoreLink[] {
  return entries.flatMap(({ key, label, track, store }) =>
    sources[key] ? [{ label, href: sources[key]!, track, store }] : []
  );
}

/** buildLinks に渡す購入リンク設定 */
export const PURCHASE_LINK_ENTRIES = [
  { key: 'fanza',  label: 'FANZA で購入',  track: 'click_fanza',  store: 'fanza'  },
  { key: 'dlsite', label: 'DLsite で購入', track: 'click_dlsite', store: 'dlsite' },
] satisfies Parameters<typeof buildLinks>[1];

/** buildLinks に渡す体験版リンク設定 */
export const TRIAL_LINK_ENTRIES = [
  { key: 'fanza',  label: 'FANZA 体験版',  track: 'click_trial_fanza',  store: 'fanza'  },
  { key: 'dlsite', label: 'DLsite 体験版', track: 'click_trial_dlsite', store: 'dlsite' },
] satisfies Parameters<typeof buildLinks>[1];
