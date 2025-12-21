# Cloudflare Worker proxy (簡易)

このディレクトリは、GitHub Pages 等の静的フロントエンドから Supabase に直接アクセスする際の CORS 問題を回避するための Cloudflare Worker サンプルです。

使い方（簡易）

1. Wrangler をインストールします:

```bash
npm install -g wrangler
```

2. Cloudflare にログインします:

```bash
wrangler login
```

3. Secrets を設定します:

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
```

`SUPABASE_URL` には `https://<your-project>.supabase.co` を、`SUPABASE_ANON_KEY` には Supabase の publishable (anon) key を入力してください。

4. デプロイ:

```bash
wrangler publish
```

追加: この強化版 Worker は以下のルーティングをサポートします。

- `/api/auth/*` → `https://<your-project>.supabase.co/auth/v1/*` (認証関連)
- `/api/storage/*` → `https://<your-project>.supabase.co/storage/v1/*` (ストレージ)
- `/api/*` → `https://<your-project>.supabase.co/rest/v1/*` (テーブル操作)

フロントエンド側では、Supabase に直接叩く代わりに Worker の URL を使ってください。例:

```
fetch('https://<your-worker>.workers.dev/api/messages', { method: 'POST', body: JSON.stringify(data) })
```

注意点
- Worker は指定されたオリジンのみを許可するようになっています（`https://chokugeki.github.io` と `http://localhost:5173` を許可）。別のオリジンを許可する場合は `worker/index.js` の `ALLOWED_ORIGINS` に追加してください。
- Secrets に `SUPABASE_URL` と `SUPABASE_ANON_KEY` を設定することで、anon key をブラウザに晒さずに利用できます。
- 認証トークンの扱い: ブラウザが既に `access_token` を持っている場合、Worker はそのまま `Authorization: Bearer <token>` を受け渡す仕様です（カスタム処理が必要なら追加できます）。

