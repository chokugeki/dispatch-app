addEventListener('fetch', event => {
  event.respondWith(handle(event.request))
})

// 許可するオリジンのリスト（必要に応じて追加）
const ALLOWED_ORIGINS = [
  'https://chokugeki.github.io',
  'http://localhost:5173'
]

function makeCorsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  }
}

async function handle(request) {
  const origin = request.headers.get('Origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(origin)

  // プリフライト処理
  if (request.method === 'OPTIONS') {
    if (!allowed) return new Response('Origin not allowed', { status: 403 })
    return new Response(null, { status: 204, headers: makeCorsHeaders(origin) })
  }

  if (!allowed) return new Response('Origin not allowed', { status: 403 })

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
