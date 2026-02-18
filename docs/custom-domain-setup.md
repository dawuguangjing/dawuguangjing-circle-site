# カスタムドメイン設定手順

GitHub Pages にカスタムドメインを反映するための手順書です。

## 前提

- ドメインを取得済みであること
- GitHub Pages でのデプロイが完了していること

---

## 1. DNS設定

ドメイン管理画面（お名前.com、Cloudflare、Google Domains など）で以下を設定します。

### Apexドメイン（例: `example.com`）

| タイプ | ホスト | 値 |
|--------|--------|-----|
| A | @ | `185.199.108.153` |
| A | @ | `185.199.109.153` |
| A | @ | `185.199.110.153` |
| A | @ | `185.199.111.153` |

### サブドメイン（例: `www.example.com`）

| タイプ | ホスト | 値 |
|--------|--------|-----|
| CNAME | www | `dawuguangjing.github.io` |

> DNS の反映には数分〜最大48時間かかることがあります。

---

## 2. `public/CNAME` ファイルの作成

ビルド成果物にドメイン情報を含めるため、`public/CNAME` を作成します。

```
example.com
```

> `example.com` を実際のドメインに置き換えてください。

---

## 3. `astro.config.mjs` の更新

カスタムドメインではサブパス（`/dawuguangjing-circle-site/`）が不要になるため、`site` と `base` を変更します。

```js
const site =
  process.env.ASTRO_SITE ??
  (isCI ? 'https://example.com/' : `http://localhost:4321/${repoName}/`);

const base = process.env.ASTRO_BASE ?? (isCI ? '/' : `/${resolvedRepo}/`);
```

> `example.com` を実際のドメインに置き換えてください。

---

## 4. GitHub Pages にカスタムドメインを登録

以下のいずれかの方法で設定します。

### 方法A: GitHub CLI

```bash
gh api repos/dawuguangjing/dawuguangjing-circle-site/pages -X PUT \
  -f cname="example.com"
```

### 方法B: GitHub Web UI

1. リポジトリの **Settings** → **Pages** を開く
2. **Custom domain** にドメインを入力
3. **Save** をクリック

---

## 5. HTTPS の有効化

DNS が反映された後、GitHub が自動的に SSL 証明書を発行します。

1. リポジトリの **Settings** → **Pages** を開く
2. **Enforce HTTPS** にチェックを入れる

> 証明書の発行には数分かかる場合があります。チェックがグレーアウトしている場合は DNS 反映を待ってください。

---

## 6. 変更をデプロイ

```bash
git add public/CNAME astro.config.mjs
git commit -m "Add custom domain configuration"
git push
```

プッシュ後、GitHub Actions が自動でビルド・デプロイします。

---

## 確認

- `https://example.com/` にアクセスしてサイトが表示されることを確認
- HTTPS でアクセスできることを確認
- `http://` でアクセスした場合に `https://` にリダイレクトされることを確認
