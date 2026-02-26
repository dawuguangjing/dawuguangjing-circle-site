/** サイト名（タイトル接尾辞、OGP、JSON-LD等で共用） */
export const SITE_NAME = 'ダウグアングジング公式';

/** サークル名（著作権表示・JSON-LD等） */
export const CIRCLE_NAME = 'ダウグアングジング';

/** サイトの説明文 */
export const SITE_DESCRIPTION = 'ダウグアングジング（読み：だうぐあんぐじんぐ）公式サイト。作品・告知・外部リンクをまとめたハブ。';

/** トップページに表示するニュース件数 */
export const HOME_NEWS_LIMIT = 4;

/** トップページに表示するギャラリー件数 */
export const HOME_GALLERY_LIMIT = 4;

/** 外部リンク */
export const EXTERNAL_LINKS = {
  cien: 'https://ci-en.dlsite.com/creator/35269',
  x:    'https://x.com/dawuguangjing',
} as const;

/** スクロールアニメーション: 最初の要素の遅延（秒） */
export const ANIM_BASE_DELAY = 0.08;

/** スクロールアニメーション: 要素ごとのスタガー間隔（秒） */
export const ANIM_STAGGER = 0.07;

/** 年齢確認の localStorage キー */
export const AGE_GATE_STORAGE_KEY = 'circle_age_gate_until';

/** 年齢確認の有効期間（ミリ秒） */
export const AGE_GATE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
