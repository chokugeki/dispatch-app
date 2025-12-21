# Lolipop（ロリポップ）レンタルサーバーへのデプロイ手順

このプロジェクトは React + Vite で構築されているため、Lolipop などのレンタルサーバーへデプロイするには、ビルド後の静的ファイルをアップロードする必要があります。

## 1. 事前準備
ビルドを行う前に、接続先の設定が正しいか確認してください。

- **`src/supabaseClient.js` の確認**:
  - `VITE_WORKER_URL` または `VITE_SUPABASE_URL` が正しく設定されているか。
  - Cloudflare Worker を使用している場合、Worker 側の許可オリジン（`ALLOWED_ORIGINS`）に、Lolipop で使用するドメインを追加する必要があります。

## 2. ビルドの実行
ローカル環境で以下のコマンドを実行し、本番用のファイルを出力します。

```powershell
npm run build
```

実行が完了すると、プロジェクトルートに **`dist`** というフォルダが生成されます。この中身をサーバーにアップロードします。

## 3. ファイルのアップロード
FTPソフト（FileZillaなど）または Lolipop の「ロリポップ！FTP」を使用して、以下の手順でアップロードします。

1.  Lolipop の公開フォルダ（例: `web` または `public_html`）に接続します。
2.  ビルドで生成された **`dist` フォルダの中身**（`index.html`, `assets/` など）をすべてアップロードします。

## 4. ルーティング設定（.htaccess）
このアプリは `react-router-dom` を使用しているため、ブラウザでページをリロードした際に 404 エラーになるのを防ぐ必要があります。

`index.html` と同じ階層に **`.htaccess`** という名前のファイルを作成し、以下の内容を記述してください。

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

> [!NOTE]
> サブディレクトリ（例: `example.com/app/`）に配置する場合は、`RewriteBase /app/` および `RewriteRule . /app/index.html [L]` に書き換えてください。

## 5. 注意事項

### SSL（HTTPS）の利用
Supabase などの外部 API と通信するため、必ず **「独自SSL（無料）」** を設定し、`https://` でアクセスするようにしてください。

### CORS（Worker の設定）
Cloudflare Worker を介して Supabase にアクセスしている場合、Worker の `index.js` 内にある `DEFAULT_ALLOWED_ORIGINS` に Lolipop のドメインを追加し、Worker を再デプロイする必要があります。

```javascript
const DEFAULT_ALLOWED_ORIGINS = [
  'https://chokugeki.github.io',
  'http://localhost:5173',
  'https://あなたのドメイン.jp' // ここを追加
]
```

### ベースURLの設定 (サブディレクトリの場合)
ドメイン直下ではなくサブディレクトリに配置する場合は、`vite.config.js` の `base` 設定を変更して再ビルドする必要があります。

```javascript
// vite.config.js
export default defineConfig({
  base: '/app/', // サブディレクトリ名
  // ...
})
```
