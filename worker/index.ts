import assetPolicy from '../.vitepress/cache/access-assets.json' with { type: 'json' }
import loginTheme from '../.vitepress/cache/login-theme.json' with { type: 'json' }
import { isProductPath, safeNext } from '../auth/policy.ts'

const COOKIE = '__Host-sp_docs'
const SESSION_SECONDS = 7 * 24 * 60 * 60
const encoder = new TextEncoder()
const publicAssets = new Set(assetPolicy.publicAssets)

export function requiresAuth(path: string): boolean {
  return isProductPath(path)
    || /^\/img\/docs(?:\/|$)/.test(path)
    || /(?:^|\/)llms(?:-full)?\.txt$/.test(path)
    || (path.startsWith('/assets/') && !publicAssets.has(path))
}

function noStore(response: Response): Response {
  const result = new Response(response.body, response)
  result.headers.set('Cache-Control', 'private, no-store')
  result.headers.set('Vary', 'Cookie')
  result.headers.set('X-Content-Type-Options', 'nosniff')
  result.headers.set('Referrer-Policy', 'same-origin')
  return result
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}

function loginPage(next: string, message = '', status = 200): Response {
  const zh = next.startsWith('/zh/')
  const title = zh ? '访问产品文档' : 'Access product documentation'
  return noStore(new Response(`<!doctype html>
<html lang="${zh ? 'zh-CN' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} · Softprobe</title>
<style>${loginTheme.css}
:root{font-family:var(--sp-font-sans);color-scheme:light dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--sp-canvas);color:var(--sp-ink)}main{width:min(420px,calc(100% - 40px));background:var(--sp-surface);border:1px solid var(--sp-border);border-radius:12px;padding:36px;box-shadow:0 12px 40px #251f1908}.brand{color:var(--sp-brand-link);font-weight:700}h1{font-size:24px;margin:24px 0 12px}p{color:var(--sp-muted);font-size:14px;line-height:1.7}label{display:block;margin-top:24px;font-size:14px}input,button{width:100%;font:inherit;border-radius:8px;padding:12px;margin-top:8px}input{border:1px solid var(--sp-border);background:var(--sp-canvas);color:inherit}input:focus-visible{outline:2px solid var(--sp-brand);outline-offset:2px}button{border:0;background:var(--vp-button-brand-bg);color:var(--vp-button-brand-text);cursor:pointer;margin-top:16px}button:hover{background:var(--vp-button-brand-hover-bg)}.error{color:#ae2525;min-height:24px}a{font-size:14px;color:var(--sp-brand-link)}@media(prefers-color-scheme:dark){.error{color:#ffabab}}</style></head>
<body><main><a class="brand" href="${zh ? '/zh/' : '/en/'}">Softprobe</a><h1>${title}</h1><p>${zh ? '请输入访问密码。登录后 7 天内无需重复输入。' : 'Enter the access password. You will stay signed in for 7 days.'}</p>
<form action="/__docs/login" method="post"><input type="hidden" name="next" value="${escapeHtml(next)}"><label for="password">${zh ? '访问密码' : 'Password'}</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus maxlength="1024"><button type="submit">${zh ? '查看文档' : 'Open documentation'}</button><p class="error" role="alert">${escapeHtml(message)}</p></form><a href="${zh ? '/zh/' : '/en/'}">${zh ? '返回首页' : 'Back to home'}</a></main></body></html>`, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      'X-Frame-Options': 'DENY',
    },
  }))
}

async function signingKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

function tokenMessage(value: string): Uint8Array {
  return encoder.encode('softprobe-docs:session:v1:' + value)
}

async function createSession(password: string): Promise<string> {
  const value = `${Math.floor(Date.now() / 1000) + SESSION_SECONDS}.${crypto.randomUUID()}`
  const signature = await crypto.subtle.sign('HMAC', await signingKey(password), tokenMessage(value))
  return value + '.' + btoa(String.fromCharCode(...new Uint8Array(signature)))
}

async function validSession(request: Request, password: string): Promise<boolean> {
  const cookie = request.headers.get('Cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1)
  if (!cookie || cookie.length > 256) return false
  const parts = cookie.split('.')
  if (parts.length !== 3 || !/^\d+$/.test(parts[0])) return false
  const expiry = Number(parts[0])
  const now = Math.floor(Date.now() / 1000)
  if (expiry <= now || expiry > now + SESSION_SECONDS) return false
  try {
    const signature = Uint8Array.from(atob(parts[2]), char => char.charCodeAt(0))
    return await crypto.subtle.verify('HMAC', await signingKey(password), signature, tokenMessage(parts[0] + '.' + parts[1]))
  } catch {
    return false
  }
}

async function correctPassword(actual: string, supplied: string): Promise<boolean> {
  // HMAC verification performs the secret comparison without a JS string compare.
  const message = encoder.encode('softprobe-docs:password-check:v1')
  const suppliedSignature = await crypto.subtle.sign('HMAC', await signingKey(supplied), message)
  return crypto.subtle.verify('HMAC', await signingKey(actual), suppliedSignature, message)
}

async function login(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return loginPage(safeNext(url.searchParams.get('next')))
  }
  if (request.method !== 'POST') return noStore(new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD, POST' } }))
  if (request.headers.get('Origin') !== url.origin) return noStore(new Response('Forbidden', { status: 403 }))
  if (!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded')) {
    return noStore(new Response('Unsupported media type', { status: 415 }))
  }
  const { success } = await env.LOGIN_RATE_LIMIT.limit({ key: 'login:' + (request.headers.get('CF-Connecting-IP') || 'local') })
  if (!success) return noStore(new Response('Too many login attempts. Try again in a minute.', { status: 429, headers: { 'Retry-After': '60' } }))
  // Bound the body even if Content-Length is absent or forged.
  const reader = request.body?.getReader()
  let body = ''
  let length = 0
  const decoder = new TextDecoder()
  if (reader) {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > 8192) {
        await reader.cancel()
        return noStore(new Response('Request too large', { status: 413 }))
      }
      body += decoder.decode(value, { stream: true })
    }
    body += decoder.decode()
  }
  const fields = new URLSearchParams(body)
  const next = safeNext(fields.get('next'))
  if (!env.DOCS_PASSWORD) {
    return loginPage(next, next.startsWith('/zh/') ? '访问密码尚未配置，请联系管理员。' : 'Access is not configured. Please contact the administrator.', 503)
  }
  const password = fields.get('password') || ''
  if (!password || password.length > 1024 || !await correctPassword(env.DOCS_PASSWORD, password)) {
    return loginPage(next, next.startsWith('/zh/') ? '密码不正确，请重试。' : 'Incorrect password. Please try again.', 401)
  }
  return noStore(new Response(null, { status: 303, headers: {
    Location: next,
    'Set-Cookie': `${COOKIE}=${await createSession(env.DOCS_PASSWORD)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`,
  } }))
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    let path: string
    try {
      const decoded = decodeURIComponent(url.pathname)
      if (/[\\%\u0000-\u0020]/.test(decoded) || decoded.startsWith('//')) throw new Error('Invalid path')
      // Classify and serve the exact same normalized path.
      path = decodeURIComponent(new URL(decoded.replace(/\/{2,}/g, '/'), url.origin).pathname)
      if (path !== decoded) {
        url.pathname = path
        return noStore(new Response(null, { status: 308, headers: { Location: url.pathname + url.search } }))
      }
    } catch {
      return noStore(new Response('Bad request', { status: 400 }))
    }
    if (path === '/__docs/login') return login(request, env, url)
    if (path === '/__docs/logout' && request.method === 'POST') {
      if (request.headers.get('Origin') !== url.origin) return noStore(new Response('Forbidden', { status: 403 }))
      return noStore(new Response(null, { status: 303, headers: {
        Location: '/en/',
        'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
        'Clear-Site-Data': '"cache"',
      } }))
    }
    if (path.startsWith('/__docs/') || /(?:^|\/)\.[^/]/.test(path)) return noStore(new Response('Not found', { status: 404 }))
    if (request.method !== 'GET' && request.method !== 'HEAD') return noStore(new Response('Method not allowed', { status: 405 }))
    const protectedPath = requiresAuth(path)
    if (protectedPath && (!env.DOCS_PASSWORD || !await validSession(request, env.DOCS_PASSWORD))) {
      if (request.headers.get('Accept')?.includes('text/html')) {
        return noStore(new Response(null, { status: 303, headers: { Location: '/__docs/login?next=' + encodeURIComponent(path + url.search) } }))
      }
      return noStore(new Response('Authentication required', { status: 401 }))
    }
    const response = await env.ASSETS.fetch(request)
    return protectedPath ? noStore(response) : response
  },
} satisfies ExportedHandler<Env>
