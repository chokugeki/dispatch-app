addEventListener('fetch', event => {
  event.respondWith(handle(event.request))
})

// 許可するオリジンのリスト（必要に応じて追加）
// 注意: デプロイ先で変更する場合はこの配列を編集するか、
// Cloudflare の環境変数バインディング (ALLOWED_ORIGINS_BINDING) を使ってください。
const DEFAULT_ALLOWED_ORIGINS = [
  'https://chokugeki.github.io',
  'http://localhost:5173',
  'http://localhost:5174'
]

// If a binding named ALLOWED_ORIGINS_BINDING is provided (comma-separated), use it.
const ORIGINS = (typeof ALLOWED_ORIGINS_BINDING !== 'undefined' && ALLOWED_ORIGINS_BINDING)
  ? ALLOWED_ORIGINS_BINDING.split(',').map(s => s.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_ORIGINS

function makeCorsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin'
  }
}

async function handle(request) {
  const origin = request.headers.get('Origin')

  // ブラウザからのリクエスト（Origin ヘッダあり）は許可リストに厳格に照合する
  if (origin) {
    const allowed = ORIGINS.includes(origin)
    if (!allowed) {
      console.warn(`Blocked origin: ${origin}`)
      return new Response('Origin not allowed', { status: 403 })
    }
  }
  // Origin ヘッダが無いリクエスト（サーバ間通信など）は許可する

  // プリフライト処理
  if (request.method === 'OPTIONS') {
    if (origin && !ORIGINS.includes(origin)) return new Response('Origin not allowed', { status: 403 })
    const headers = origin ? makeCorsHeaders(origin) : { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH, DELETE' }
    return new Response(null, { status: 204, headers })
  }

  // ルーティング: サポートするパスは複数パターンを受け入れます
  // - /api/auth/* -> /auth/v1/*
  // - /api/storage/* -> /storage/v1/*
  // - /api/* -> /rest/v1/*
  // - /auth/v1/*, /storage/v1/*, /rest/v1/* を直接受け取り、そのまま転送
  const url = new URL(request.url)
  let targetPath = null
  if (url.pathname.startsWith('/api/auth')) {
    targetPath = url.pathname.replace(/^\/api\/auth/, '/auth/v1') + url.search
  } else if (url.pathname.startsWith('/api/storage')) {
    targetPath = url.pathname.replace(/^\/api\/storage/, '/storage/v1') + url.search
  } else if (url.pathname.startsWith('/api')) {
    targetPath = url.pathname.replace(/^\/api/, '/rest/v1') + url.search
  } else if (url.pathname.startsWith('/auth/v1') || url.pathname.startsWith('/storage/v1') || url.pathname.startsWith('/rest/v1')) {
    // 既に supabase クライアントが直接 /auth/v1 等を叩く場合に対応
    targetPath = url.pathname + url.search
  } else {
    return new Response('Not found', { status: 404 })
  }

  const SUPABASE_URL = typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : ''
  const SUPABASE_ANON_KEY = typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : ''
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: 'Supabase credentials not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const target = SUPABASE_URL.replace(/\/$/, '') + targetPath

  const headers = new Headers()
  headers.set('apikey', SUPABASE_ANON_KEY)
  headers.set('Authorization', `Bearer ${SUPABASE_ANON_KEY}`)
  const contentType = request.headers.get('Content-Type')
  if (contentType) headers.set('Content-Type', contentType)

  // 認証検証: 書き込み系リクエストは有効な access_token を持つことを要求する
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  const isAuthEndpoint = targetPath.startsWith('/auth/v1')
  if (mutatingMethods.includes(request.method) && !isAuthEndpoint) {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace(/^Bearer\s+/, '')
    const valid = await validateAuthToken(token, SUPABASE_URL, SUPABASE_ANON_KEY)
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    // Forward the original Authorization header to Supabase so user context is preserved
    headers.set('Authorization', `Bearer ${token}`)
  }

  const supaReq = new Request(target, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  })

  const res = await fetch(supaReq)
  const resBody = await res.arrayBuffer()
  const responseHeaders = new Headers(res.headers)

  // CORS ヘッダを付与
  const cors = makeCorsHeaders(origin)
  Object.entries(cors).forEach(([k, v]) => responseHeaders.set(k, v))

  return new Response(resBody, { status: res.status, headers: responseHeaders })
}

async function validateAuthToken(token, supabaseUrl, anonKey) {
  try {
    const url = supabaseUrl.replace(/\/$/, '') + '/auth/v1/user'
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': anonKey
      }
    })
    return res.ok
  } catch (e) {
    console.error('Token validation error', e)
    return false
  }
}
