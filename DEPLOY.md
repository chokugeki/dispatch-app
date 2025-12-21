# 🚀 運用・デプロイ手順書

## 1. 概要
このシステムは **Supabase** (データベース/認証) と **React** (フロントエンド) で構成されています。
マルチテナントに対応しており、Supabaseに登録されたユーザーIDごとにデータが完全に分離されます。

---

## 2. GitHub Pages へのデプロイ（推奨）
GitHub Actionsの設定ファイル（`.github/workflows/static.yml`）が含まれているため、**GitHubへプッシュするだけで自動的に公開**されます。

### 手順
1. VS Code等のターミナルを開く。
2. 変更をコミットしてプッシュする。
   ```bash
   git add .
   git commit -m "本番リリース"
   git push

   ---

   ## 3. 本番（GitHub Pages）でデータ保存を有効にする手順

   ### 3.1 Supabase 側の設定（UI ナビゲーション）

   - リダイレクト URL（認証後の戻り先）
      1. Supabase コンソールで対象のプロジェクトを選択。
      2. サイドバーから `Authentication` → `Settings` を開く。
      3. `Redirect URLs` 欄に `https://chokugeki.github.io` を追加して保存。

   - ブラウザからの API 呼び出し（CORS 設定）
      1. Supabase コンソールでプロジェクトを選択。
      2. サイドバーから `Settings` → `API` を開く。
      3. `Allowed CORS origins` / `Allowed origins` / `CORS` と表記されている欄（UI バージョンにより名称が変わります）に `https://chokugeki.github.io` を追加して保存。

   上記を追加しないと、公開サイトからのブラウザアクセスで保存や認証がブロックされます。UI に該当フィールドが見当たらない場合は、画面のセクション名（例: `Authentication` の画面内にあるフィールド名や `Settings`配下のセクション名）を教えてください。

   ### 3.2 フロントエンドに環境変数を渡す（ビルド時）
   選択肢:
   - ローカルで手動ビルド: リポジトリルートに `.env.production` を作成し、以下を追加してから `npm run build` を実行します。

      VITE_SUPABASE_URL=https://<あなたのプロジェクト>.supabase.co
      VITE_SUPABASE_ANON_KEY=<あなたの ANON KEY>

      - もしくは Worker を使う場合は `VITE_WORKER_URL` を指定します（Worker により Supabase への中継を行う想定）。
        ```
        VITE_WORKER_URL=https://<your-worker>.workers.dev
        ```

   - CI（推奨）: GitHub リポジトリの `Settings` → `Secrets` に `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を登録し、ワークフローで環境変数として渡します（以下参照）。
    - CI（推奨）: Worker を使う場合は `VITE_WORKER_URL` を Secrets に入れてください。直接 Supabase を使う場合は `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を登録します。

   ### 3.3 サンプル: GitHub Actions ワークフロー
   - ファイルパス: `.github/workflows/deploy.yml`
   - このワークフローは `main` ブランチへプッシュされたらビルドして `gh-pages` に公開します。CI内で `VITE_*` を渡します（キーは GitHub Secrets に保存してください）。

   注意: Vite では `VITE_` プレフィックス付きの env はビルド時に静的に埋め込まれるため、`ANON` キーは公開バンドルに含まれます。公開リポジトリではこの点に注意してください。より安全にするには、書き込み操作をプロキシするサーバー側エンドポイントを用意してください。

   ---

   次のステップ
   - Supabase の `Redirect URLs` / `Allowed origins` を追加してください。
   - 私がワークフローを作成済みなので、`main` にプッシュすれば自動デプロイされます。

   ---

   ## 4. ブラウザ側の CORS を回避する（推奨: Proxy を挟む）

   GitHub Pages のような静的ホスティングから Supabase に直接アクセスすると、ダッシュボード上での CORS 設定が無い場合にブラウザでブロックされることがあります。安全かつ確実な方法として、ブラウザ → Proxy（サーバまたは Worker）→ Supabase の形でリクエストを中継する方法を推奨します。

   以下は Cloudflare Worker を使った最小構成の例です。Worker に `SUPABASE_URL` と `SUPABASE_ANON_KEY` をシークレットとして設定し、ブラウザは Worker を経由して Supabase にアクセスします。

   サンプル Worker (`worker/index.js`)
   ```js
   addEventListener('fetch', event => {
      event.respondWith(handle(event.request))
   })

   async function handle(request) {
      const SUPABASE_URL = SUPABASE_URL_BINDING // Cloudflare の環境変数バインディング
      const SUPABASE_ANON_KEY = SUPABASE_ANON_KEY_BINDING

      const url = new URL(request.url)
      // 例: Worker は /api/* を受け取り、Supabase REST に転送する想定
      const target = SUPABASE_URL + url.pathname.replace(/^\/api/, '/rest/v1') + url.search

      const headers = new Headers(request.headers)
      headers.set('apikey', SUPABASE_ANON_KEY)
      headers.set('Authorization', `Bearer ${SUPABASE_ANON_KEY}`)

      const supaReq = new Request(target, {
         method: request.method,
         headers,
         body: ['GET','HEAD'].includes(request.method) ? undefined : request.body
      })

      const res = await fetch(supaReq)
      const responseHeaders = new Headers(res.headers)
      // 必要なCORSヘッダーを付与
      responseHeaders.set('Access-Control-Allow-Origin', 'https://chokugeki.github.io')
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, DELETE')
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey')

      if (request.method === 'OPTIONS') {
         return new Response(null, { status: 204, headers: responseHeaders })
      }

      const body = await res.arrayBuffer()
      return new Response(body, { status: res.status, headers: responseHeaders })
   }
   ```

   デプロイ手順（簡易）
   - Cloudflare Workers を使う場合: `wrangler` を使ってデプロイします。`wrangler.toml` に環境変数（Secrets）を設定し、`wrangler publish` で反映。
   - Vercel / Netlify の Functions でも同様のプロキシを実装できます（仕組みは同じで、環境変数は各サービスの Secrets に設定）。

   注意点
   - Worker 経由にすることで `ANON` キーはブラウザに直接露出しません（Worker が付与するため）。
   - Worker 側でオリジン制御を厳格に行い、任意のオリジンからのアクセスを許可しないようにしてください。

   必要なら、このリポジトリに `worker/` ディレクトリと簡易コードを追加します。自動で commit してよいですか？