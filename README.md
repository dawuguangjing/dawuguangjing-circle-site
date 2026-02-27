# ダウグアングジング公式

Astro ベースの同人ゲームサークル公式サイト。作品情報・更新履歴・外部ストアリンクを集約するハブサイトです。

## セットアップ

```bash
npm install
npm run dev       # 開発サーバー起動 (localhost:4321)
```

## ビルド & プレビュー

```bash
npm run build     # 静的ファイル生成 → dist/
npm run preview   # ビルド結果をローカルで確認
```

## 開発ツール

```bash
npm run lint      # ESLint で TypeScript をチェック
npm run format    # Prettier でコードを整形
npm run check:image-paths  # 期限付き/private URLや危険な画像パスを検出
```

---

## コンテンツ管理ガイド

コンテンツは Markdown ファイルで管理しています。ファイルを追加・編集するだけでページが自動生成されます。

### 作品を追加する

1. `src/content/works/` に新しい `.md` ファイルを作成（ファイル名がURLスラッグになります）

```
src/content/works/my-new-game.md
→ /works/my-new-game/ でアクセス可能
```

2. 以下のフロントマターをコピーして記入：

```yaml
---
title: "作品タイトル"
catch: "キャッチコピー（短い一文）"
shortDescription: "作品の簡単な説明文"
releaseDate: 2025-01-15
isR18: true
platformLinks:
  fanza: "https://www.dmm.co.jp/dc/doujin/-/detail/=/cid=xxxxx/"
  dlsite: "https://www.dlsite.com/maniax/work/=/product_id/RJxxxxxx.html"
trialLinks:                    # 体験版がない場合はこのブロックごと省略可
  fanza: "https://..."
  dlsite: "https://..."
environments:
  windows: true
  mac: false
  browserPc: true
  browserMobileBeta: false
volume:
  playTimeMin: 90              # プレイ時間（分）
  cgCount: 24                  # CG枚数
  hSceneCount: 6               # Hシーン数
  branching: "light"           # none / light / multi
aiUsage:
  level: "none"                # none / partial / major
  noteShort: "AI未使用"
images:
  cover: "images/works/my-new-game-cover.png"
  screenshots:
    - "images/works/my-new-game-ss1.png"
    - "images/works/my-new-game-ss2.png"
videoUrl: "https://..."        # 紹介動画URL（省略可）
sellingPoints:                 # 訴求ポイント（省略可）
  - "ポイント1"
  - "ポイント2"
---

ここに作品の詳細説明を Markdown で記述します。
箇条書き・見出し・リンクなど自由に使えます。
```

3. 画像ファイルを `public/images/works/` に配置
4. `npm run build` でエラーがないことを確認

### 更新履歴（ニュース）を追加する

1. `src/content/news/` に新しい `.md` ファイルを作成

```
src/content/news/v2-update.md
→ /news/v2-update/ でアクセス可能
```

2. フロントマター：

```yaml
---
title: "v2.0 アップデート配信開始"
date: 2025-06-01
category: "update"            # release / update / sale / devlog
eyecatch: "images/og/v2-eyecatch.png"  # OGP画像（省略可）
relatedWorkSlugs:             # 関連作品のスラッグ（省略可）
  - "my-new-game"
---

本文をここに記述します。Markdown が使えます。
```

### ギャラリーを追加する

1. `src/content/gallery/` に新しい `.md` ファイルを作成

```
src/content/gallery/my-cg-set.md
→ /gallery/my-cg-set/ でアクセス可能
```

2. フロントマター：

```yaml
---
title: "CG集タイトル"
description: "CG集の説明文"
releaseDate: 2025-03-01
isR18: true
cover: "images/gallery/my-cg-set-cover.png"
images:
  - "images/gallery/my-cg-set-1.png"
  - "images/gallery/my-cg-set-2.png"
imageCount: 50                 # 実際の枚数（省略可）
relatedWorkSlugs:              # 原作スラッグ（省略可）
  - "my-new-game"
platformLinks:                 # 購入リンク（省略可）
  fanza: "https://..."
  dlsite: "https://..."
---
```

3. 画像ファイルを `public/images/gallery/` に配置

### 画像の追加・差し替え

| 用途 | 配置先 | 推奨サイズ |
|------|--------|-----------|
| 作品カバー | `public/images/works/` | 720×480 以上 |
| スクリーンショット | `public/images/works/` | 16:9 推奨 |
| ギャラリーカバー | `public/images/gallery/` | 720×480 以上 |
| OGP画像 | `public/images/og/` | 1200×630 |

フロントマターの `images.cover` や `images.screenshots` にパスを記入してください（`public/` は含めず `images/works/...` と書きます）。

### 既存コンテンツの編集

- **作品情報の更新**: 該当する `src/content/works/<slug>.md` のフロントマターを編集
- **ニュースの修正**: `src/content/news/<slug>.md` を編集
- **ギャラリーの更新**: `src/content/gallery/<slug>.md` を編集
- **静的ページ**: `src/pages/about.astro`、`faq.astro`、`contact.astro`、`privacy.astro` を直接編集
- **ナビゲーション**: `src/utils/navigation.ts` でヘッダー・フッターの両方が同時に更新されます

### フロントマターのバリデーション

スキーマは `src/content/config.ts` で Zod により定義されています。必須フィールドの欠落や型の不一致があるとビルド時にエラーが表示されます。

---

## ページ一覧

| URL | ファイル | 説明 |
|-----|---------|------|
| `/` | `src/pages/index.astro` | トップページ |
| `/works/` | `src/pages/works/index.astro` | 作品一覧（フィルター付き） |
| `/works/{slug}/` | `src/pages/works/[slug].astro` | 作品詳細 |
| `/gallery/` | `src/pages/gallery/index.astro` | ギャラリー一覧 |
| `/gallery/{slug}/` | `src/pages/gallery/[slug].astro` | ギャラリー詳細 |
| `/news/` | `src/pages/news/index.astro` | 更新履歴一覧 |
| `/news/{slug}/` | `src/pages/news/[slug].astro` | 更新履歴記事（右サイドバーに目次） |
| `/about/` | `src/pages/about.astro` | サークル情報 |
| `/faq/` | `src/pages/faq.astro` | FAQ |
| `/contact/` | `src/pages/contact.astro` | お問い合わせ |
| `/privacy/` | `src/pages/privacy.astro` | プライバシー |
| `/age/` | `src/pages/age.astro` | 年齢確認 |
| `/404` | `src/pages/404.astro` | エラーページ |
| `/rss.xml` | `src/pages/rss.xml.ts` | RSSフィード |

## プロジェクト構成

```
src/
├── components/       # 再利用コンポーネント
│   ├── Seo.astro             # OGP・JSON-LD・メタタグ
│   ├── SiteHeader.astro      # ヘッダー（ハンバーガーメニュー付）
│   ├── SiteFooter.astro      # フッター
│   ├── HeroBanner.astro      # トップのヒーローバナー
│   ├── TunaTank.astro        # マグロアニメーション（ヒーロー・年齢確認で共用）
│   ├── AgeGateOverlay.astro  # 年齢確認オーバーレイ（BaseLayoutから呼び出し）
│   ├── WorkCard.astro        # 作品カード（一覧表示用）
│   ├── GalleryCard.astro     # ギャラリーカード（一覧表示用）
│   ├── NewsCard.astro        # ニュースカード（一覧表示用）
│   ├── StoreButtonGroup.astro # FANZA/DLsite 購入ボタングループ
│   ├── FabPurchase.astro     # 購入セクションへのフローティングボタン
│   ├── Breadcrumb.astro      # パンくずリスト
│   ├── Lightbox.astro        # 画像拡大表示
│   ├── BackToTop.astro       # ページトップに戻るボタン
│   └── RelatedWorks.astro    # 関連作品リスト
├── content/          # Markdown コンテンツ
│   ├── config.ts         # Zod スキーマ定義
│   ├── works/            # 作品データ
│   ├── news/             # 更新履歴データ
│   └── gallery/          # ギャラリーデータ
├── layouts/
│   └── BaseLayout.astro  # 共通レイアウト（年齢確認含む）
├── pages/            # ルーティング
├── styles/
│   ├── tokens.css        # CSS カスタムプロパティ（カラー・シャドウ・フォント等）
│   └── global.css        # グローバルCSS（tokens.css を @import）
└── utils/            # 共通ユーティリティ
    ├── constants.ts      # サイト名・定数
    ├── navigation.ts     # ナビゲーション定義
    ├── schema.ts         # JSON-LD スキーマ生成
    ├── collections.ts    # コレクション取得ヘルパー
    ├── format.ts         # 日付フォーマット
    ├── labels.ts         # カテゴリ・AIレベルのラベル
    ├── types.ts          # 共通型定義・StoreLink ビルダー
    └── withBase.ts       # ベースパス付きURL生成
```

## 年齢確認（R18 UXゲート）

- クライアントサイドの UX ゲート（ハードなアクセス制御ではありません）
- `localStorage` で **7日間**保持（確認済みのまま再訪問可能）
- JavaScript 無効時は `<noscript>` メッセージを表示
- `/age/` ページ自体は年齢確認をバイパスします

## GitHub Pages デプロイ

### 初回セットアップ

1. GitHub にリポジトリを作成し、コードをプッシュ

```bash
git init
git remote add origin https://github.com/<ユーザー名>/dawuguangjing-circle-site.git
git add -A && git commit -m "initial commit"
git push -u origin main
```

2. リポジトリの **Settings → Pages** を開く
3. **Source** を **GitHub Actions** に変更（Branch ではなく Actions を選択）

これだけで `main` ブランチへの push 時に自動ビルド・デプロイされます。

### デプロイの仕組み

- `.github/workflows/deploy.yml` が CI を定義
- `astro.config.mjs` が `GITHUB_ACTIONS` 環境変数を検出し、`site` と `base` を自動解決
  - 例: `https://<ユーザー名>.github.io/dawuguangjing-circle-site/`
- `robots.txt`・`manifest.webmanifest` は動的エンドポイント（`src/pages/`）なので、`site` / `base` に自動追従します
- 404 ページは GitHub Pages 用に `dist/404.html` へ自動コピーされます

### デプロイ状況の確認

- リポジトリの **Actions** タブでワークフロー実行状況を確認
- デプロイ後の URL: `https://<ユーザー名>.github.io/dawuguangjing-circle-site/`

### カスタムドメインを設定する

1. `public/CNAME` ファイルを作成し、ドメインを記載

```
your-domain.com
```

2. 環境変数でビルド設定を上書き（GitHub Actions の場合は `.github/workflows/deploy.yml` の Build ステップに追加）

```yaml
- name: Build
  run: npm run build
  env:
    ASTRO_SITE: "https://your-domain.com/"
    ASTRO_BASE: "/"
```

3. DNS を設定
   - **Apex ドメイン** (`your-domain.com`): A レコードで GitHub Pages の IP を指定
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - **サブドメイン** (`www.your-domain.com`): CNAME レコードで `<ユーザー名>.github.io` を指定

4. リポジトリの **Settings → Pages → Custom domain** にドメインを入力し、**Enforce HTTPS** を有効化

> `robots.txt` の Sitemap URL や `manifest.webmanifest` のパスは `ASTRO_SITE` / `ASTRO_BASE` から自動生成されるため、手動更新は不要です。
