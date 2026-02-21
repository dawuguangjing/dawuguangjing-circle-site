/** サイト名（タイトル接尾辞、OGP、JSON-LD等で共用） */
export const SITE_NAME = 'ダウグアングジング公式';

/** サークル名（著作権表示・JSON-LD等） */
export const CIRCLE_NAME = 'ダウグアングジング';

/** サイトの説明文 */
export const SITE_DESCRIPTION = 'サークルの公式情報と外部リンクをまとめたハブ。';

/** トップページに表示するニュース件数 */
export const HOME_NEWS_LIMIT = 4;

/** 外部リンク */
export const EXTERNAL_LINKS = {
  cien: 'https://ci-en.dlsite.com/creator/35269',
} as const;

/** 年齢確認の localStorage キー */
export const AGE_GATE_STORAGE_KEY = 'circle_age_gate_until';

/** 年齢確認の有効期間（ミリ秒） */
export const AGE_GATE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
