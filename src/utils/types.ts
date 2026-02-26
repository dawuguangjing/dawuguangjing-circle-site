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
