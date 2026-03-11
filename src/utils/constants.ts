/** サイト名（タイトル接尾辞、OGP、JSON-LD等で共用） */
export const SITE_NAME = 'ダウグアングジング公式';

/** サークル名（著作権表示・JSON-LD等） */
export const CIRCLE_NAME = 'ダウグアングジング';

/** サイトの説明文 */
export const SITE_DESCRIPTION = 'ダウグアングジング（読み：だうぐあんぐじんぐ）公式サイト。作品・告知・外部リンクをまとめたハブ。';

/** トップページに表示するニュース件数 */
export const HOME_NEWS_LIMIT = 5;

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

/** スクロールアニメーション: CSS --anim-delay の値を計算する
 *  @param index - 0始まりのアイテムインデックス
 *  @param extraDelay - 追加ベース遅延（秒）、デフォルト 0 */
export function animDelay(index: number, extraDelay = 0): string {
  return `${ANIM_BASE_DELAY + extraDelay + index * ANIM_STAGGER}s`;
}

/** フィルター/ソート再適用時のスタガー間隔（秒）
 *  初期ロードの ANIM_STAGGER より短く、リフロー後の軽快な印象を優先 */
export const FILTER_STAGGER = 0.05;

/** 操作ヒントの自動消去タイマー（ミリ秒） */
export const HINT_DISMISS_MS = 3000;

/** コンテキストナビ: 復帰ハイライト表示時間（ミリ秒） */
export const RETURN_HIGHLIGHT_MS = 1500;

/** アナウンスバー設定（null にすると非表示） */
export const ANNOUNCEMENT: { id: string; message: string; href?: string } | null = {
  id: 'shinsa2-2026v1',
  message: '🎉従順審査2 制作開始！続報は開発ログ/Ci-enで配信中',
  href: 'https://ci-en.dlsite.com/creator/35269',
};

/** ダークモードの localStorage キー */
export const THEME_STORAGE_KEY = 'theme';

/** 年齢確認の localStorage キー */
export const AGE_GATE_STORAGE_KEY = 'circle_age_gate_until';

/** 年齢確認の有効期間（ミリ秒） */
export const AGE_GATE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** 「NEW」バッジを表示する期間（ミリ秒） */
export const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;

/** 未発売作品の releaseDate プレースホルダー年 */
export const COMING_SOON_YEAR = 2099;

// ── GA4 ──────────────────────────────────────────────────────────────────────

/** Google Analytics 4 測定 ID */
export const GA4_ID = 'G-JGLGSCB94V';

// ── UI タイミング ─────────────────────────────────────────────────────────────

/** トースト通知: 自動消去タイマー（ms） */
export const TOAST_DISMISS_MS = 3500;
/** トースト通知: フェードアウト時間（ms） */
export const TOAST_FADE_MS = 300;
/** URLコピー: 完了フィードバック表示時間（ms） */
export const COPY_FEEDBACK_MS = 2000;

/** FAQ アコーディオン: transitionend 未発火時のフォールバック（ms） */
export const FAQ_CLEANUP_MS = 250;

/** お問い合わせフォーム: iframe 読み込みタイムアウト（ms） */
export const FORM_LOAD_TIMEOUT_MS = 20000;
/** お問い合わせフォーム: 遅延読み込みの IntersectionObserver rootMargin */
export const FORM_OBSERVE_MARGIN = '200px';

// ── UI タイミング（追加分） ──────────────────────────────────────────────

/** コンテキストナビ: history.back() フォールバックタイムアウト（ms） */
export const BACK_NAV_TIMEOUT_MS = 480;

/** ライトボックス: サムネイルスクロール完了待ち（ms） */
export const LIGHTBOX_SCROLL_SYNC_MS = 450;

/** ライトボックス: サムネイル scroll デバウンス間隔（ms） */
export const LIGHTBOX_SCROLL_DEBOUNCE_MS = 250;

/** ルートプログレス: 進捗アニメーション間隔（ms） */
export const ROUTE_PROGRESS_INTERVAL_MS = 70;

/** ルートプログレス: 完了後の非表示遅延（ms） */
export const ROUTE_PROGRESS_HIDE_MS = 180;

/** アナウンスバー: 閉じるアニメーション完了待ち（ms） */
export const ANNOUNCEMENT_DISMISS_MS = 350;

/** ダークモード: アイコン切替アニメーション時間（ms） */
export const DARK_MODE_ICON_MS = 260;

/** ダークモード: テーマ遷移クラス除去タイマー（ms） */
export const DARK_MODE_TRANSITION_MS = 320;

/** フィルター操作: デバウンス間隔（ms） */
export const FILTER_DEBOUNCE_MS = 150;

// ── ライトボックス: タッチ操作 ─────────────────────────────────────────────

/** ピンチズーム最大倍率 */
export const LIGHTBOX_MAX_ZOOM = 4;

/** ピンチズーム最小倍率 */
export const LIGHTBOX_MIN_ZOOM = 1;

/** ピンチズーム: リセット閾値（この倍率未満で等倍に戻す） */
export const LIGHTBOX_ZOOM_RESET_THRESHOLD = 1.1;

/** タッチスワイプ: 有効判定の最小距離（px） */
export const LIGHTBOX_SWIPE_THRESHOLD_PX = 50;

// ── スクロールアニメーション ──────────────────────────────────────────────

/** IntersectionObserver の交差閾値 */
export const ANIM_INTERSECTION_THRESHOLD = 0.12;
