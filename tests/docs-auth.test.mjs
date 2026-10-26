import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import worker, { requiresAuth } from '../worker/index.ts'
import { safeNext, shouldReloadProductNavigation } from '../auth/policy.ts'

const origin = 'https://docs.example.com'
const password = 'test-only-password-2026-long'
const policy = JSON.parse(readFileSync(new URL('../.vitepress/cache/access-assets.json', import.meta.url)))

function environment(overrides = {}) {
  const calls = []
  return {
    calls,
    DOCS_PASSWORD: password,
    LOGIN_RATE_LIMIT: { limit: async () => ({ success: true }) },
    ASSETS: { fetch: async request => {
      calls.push(request.url)
      return new Response('DOCUMENT CONTENT', { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } })
    } },
    ...overrides,
  }
}

function get(path, headers = {}) { return new Request(origin + path, { headers }) }
function post(fields, headers = {}) {
  return new Request(origin + '/__docs/login', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
    body: new URLSearchParams(fields),
  })
}
async function login(env, next = '/zh/testing/getting-started') {
  const response = await worker.fetch(post({ password, next }), env)
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('Location'), next)
  return response.headers.get('Set-Cookie').split(';')[0]
}

test('public pages and every public build asset remain accessible', async () => {
  const env = environment()
  for (const path of ['/en/', '/zh/', '/en.md', '/favicon.ico', '/img/sp-logo-trans.png', '/about.html', ...policy.publicAssets]) {
    assert.equal((await worker.fetch(get(path), env)).status, 200, path)
  }
})

test('product navigation reaches the Worker without reloading initial hydration or anchors', () => {
  assert.equal(shouldReloadProductNavigation('/en/testing/', origin + '/en/'), true)
  assert.equal(shouldReloadProductNavigation('/en/testing/recording', origin + '/en/testing/'), true)
  assert.equal(shouldReloadProductNavigation('/en/testing/', origin + '/en/testing/'), false)
  assert.equal(shouldReloadProductNavigation('/en/testing/#setup', origin + '/en/testing/'), false)
  assert.equal(shouldReloadProductNavigation('/en/', origin + '/zh/'), false)
})

test('VitePress HTML normalization cannot reload the same Cloudflare document', () => {
  // VitePress passes the .html variant to onBeforeRouteChange on initial load;
  // Cloudflare serves the document without .html and redirects that alias back.
  const path = '/zh/testing/webhook-and-ci'
  assert.equal(shouldReloadProductNavigation(path + '.html', origin + path), false)
  assert.equal(shouldReloadProductNavigation(path, origin + path + '.html'), false)
  assert.equal(shouldReloadProductNavigation(path + '.html#configuration', origin + path), false)
  assert.equal(shouldReloadProductNavigation('/en/testing/index.html', origin + '/en/testing/'), false)
  assert.equal(shouldReloadProductNavigation('/zh/testing/recording.html', origin + path), true)
  assert.equal(shouldReloadProductNavigation(path + '?mode=ci', origin + path), true)
})

test('both product trees, raw Markdown, screenshots and aggregate exports are blocked', async () => {
  const env = environment()
  const paths = ['/en/testing', '/en/testing.html', '/en/testing.md', '/en/testing/installation/server.html', '/zh/testing/commands/ops.md', '/en/platform/', '/zh/platform.md', '/en/agent-qa/', '/zh/agent-qa.md', '/en/evaluation/', '/zh/evaluation/getting-started.md', '/img/docs/replay/trace-diff-open.png', '/llms.txt', '/llms-full.txt', '/assets/unknown-future-page.js', ...policy.privateAssets]
  assert.ok(policy.privateAssets.length > 100)
  for (const path of paths) {
    assert.equal(requiresAuth(path), true, path)
    const response = await worker.fetch(get(path), env)
    assert.equal(response.status, 401, path)
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
    assert.doesNotMatch(await response.text(), /DOCUMENT CONTENT/)
  }
  assert.equal(env.calls.length, 0)
})

test('browser visits redirect to login with the requested path and query', async () => {
  const response = await worker.fetch(get('/zh/testing/recording?view=detail', { Accept: 'text/html' }), environment())
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('Location'), '/__docs/login?next=%2Fzh%2Ftesting%2Frecording%3Fview%3Ddetail')
})

test('login page escapes return paths and restricts scripts and framing', async () => {
  const response = await worker.fetch(get('/__docs/login?next=' + encodeURIComponent('/en/testing/?x="<script>')), environment())
  const html = await response.text()
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /value="\/en\/testing\/\?x=%22%3Cscript%3E"/)
  assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/)
})

test('correct password grants access using a secure seven-day signed cookie', async () => {
  const env = environment()
  const response = await worker.fetch(post({ password, next: '/en/testing/' }), env)
  const setCookie = response.headers.get('Set-Cookie')
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=604800']) assert.ok(setCookie.includes(flag))
  const cookie = setCookie.split(';')[0]
  for (const path of ['/en/testing/', '/zh/platform/', '/llms-full.txt', policy.privateAssets[0], '/img/docs/trace-isolated.png']) {
    const document = await worker.fetch(get(path, { Cookie: cookie }), env)
    assert.equal(document.status, 200)
    assert.equal(await document.text(), 'DOCUMENT CONTENT')
    assert.equal(document.headers.get('Cache-Control'), 'private, no-store')
    assert.equal(document.headers.get('Vary'), 'Cookie')
  }
})

test('wrong password never grants access or issues a cookie', async () => {
  const env = environment()
  const response = await worker.fetch(post({ password: 'wrong', next: '/zh/testing/' }), env)
  assert.equal(response.status, 401)
  assert.equal(response.headers.get('Set-Cookie'), null)
  assert.match(await response.text(), /密码不正确/)
  assert.equal(env.calls.length, 0)
})

test('forged, expired and malformed cookies fail; password rotation revokes old sessions', async () => {
  const env = environment()
  const cookie = await login(env)
  for (const value of [cookie.replace(/.$/, 'X'), '__Host-sp_docs=9999999999.nonce.fake', '__Host-sp_docs=broken']) {
    assert.equal((await worker.fetch(get('/en/testing/', { Cookie: value }), env)).status, 401)
  }
  const expired = `${Math.floor(Date.now() / 1000) - 1}.nonce`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('softprobe-docs:session:v1:' + expired))
  const expiredCookie = '__Host-sp_docs=' + expired + '.' + Buffer.from(signature).toString('base64')
  assert.equal((await worker.fetch(get('/en/testing/', { Cookie: expiredCookie }), env)).status, 401)
  assert.equal((await worker.fetch(get('/en/testing/', { Cookie: cookie }), environment({ DOCS_PASSWORD: password + '-rotated' }))).status, 401)
})

test('missing or short production secrets fail closed while homepage stays open', async () => {
  for (const secret of ['', 'too-short']) {
    const env = environment({ DOCS_PASSWORD: secret })
    assert.equal((await worker.fetch(get('/en/testing/'), env)).status, 401)
    assert.equal((await worker.fetch(post({ password }), env)).status, 503)
    assert.equal((await worker.fetch(get('/en/'), env)).status, 200)
  }
})

test('cross-origin login, unsupported methods and content types are rejected', async () => {
  const env = environment()
  assert.equal((await worker.fetch(post({ password }, { Origin: 'https://evil.example' }), env)).status, 403)
  assert.equal((await worker.fetch(post({ password }, { 'Content-Type': 'application/json' }), env)).status, 415)
  assert.equal((await worker.fetch(new Request(origin + '/__docs/login', { method: 'PUT' }), env)).status, 405)
})

test('password guessing is rate limited and request bodies are bounded', async () => {
  const limited = environment({ LOGIN_RATE_LIMIT: { limit: async () => ({ success: false }) } })
  const response = await worker.fetch(post({ password }), limited)
  assert.equal(response.status, 429)
  assert.equal(response.headers.get('Retry-After'), '60')
  assert.equal((await worker.fetch(post({ password: 'x'.repeat(9000) }), environment())).status, 413)
})

test('return paths cannot escape the site or loop through auth endpoints', async () => {
  for (const next of ['https://evil.example', '//evil.example', '/\\evil.example', '/__docs/login', '/en/\nLocation:evil']) {
    assert.equal(safeNext(next), '/en/testing/')
    const response = await worker.fetch(post({ password, next }), environment())
    assert.equal(response.headers.get('Location'), '/en/testing/')
  }
})

test('encoded and repeated slash paths cannot bypass the same-path auth check', async () => {
  const env = environment()
  for (const path of ['/%65n/testing/recording', '/en%2Ftesting%2Frecording']) {
    assert.equal((await worker.fetch(get(path), env)).status, 401)
  }
  for (const path of ['/en//testing/recording']) {
    const response = await worker.fetch(get(path), env)
    assert.equal(response.status, 308)
    assert.equal((await worker.fetch(get(response.headers.get('Location')), env)).status, 401)
  }
  for (const path of ['/en%252ftesting/recording', '/%5c%5cevil.example', '/en/testing/%00', '/.vitepress/cache/access-assets.json']) {
    assert.ok([400, 404].includes((await worker.fetch(get(path), env)).status), path)
  }
  assert.equal(env.calls.length, 0)
})

test('encoded search-index names do not redirect in a loop', async () => {
  const env = environment()
  const cookie = await login(env)
  const path = policy.privateAssets.find(file => file.includes('@localSearchIndex'))
  assert.ok(path)
  assert.equal((await worker.fetch(get(path.replace('@', '%40'), { Cookie: cookie }), env)).status, 200)
  assert.equal(env.calls.length, 1)
})

test('logout expires the cookie, clears cached content and rejects cross-origin POSTs', async () => {
  const env = environment()
  const cookie = await login(env)
  const response = await worker.fetch(new Request(origin + '/__docs/logout', { method: 'POST', headers: { Origin: origin, Cookie: cookie } }), env)
  assert.equal(response.status, 303)
  assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/)
  assert.equal(response.headers.get('Clear-Site-Data'), '"cache"')
  assert.equal((await worker.fetch(new Request(origin + '/__docs/logout', { method: 'POST', headers: { Origin: 'https://evil.example' } }), env)).status, 403)
})
