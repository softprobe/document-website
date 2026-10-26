// Shared by the Worker, build checks and browser navigation.
export function isProductPath(path: string): boolean {
  return /^\/(en|zh)\/(testing|platform|agent-qa|evaluation)(?:\/|\.|$)/.test(path)
}

export function isProductModule(id: string): boolean {
  return /\/(en|zh)\/(testing|platform|agent-qa|evaluation)\/.*\.md(?:\?|$)/.test(id.replaceAll('\\', '/'))
}

export function shouldReloadProductNavigation(to: string, current: string): boolean {
  const source = new URL(current)
  const target = new URL(to, source)
  return target.origin === source.origin && isProductPath(target.pathname)
    && (target.pathname !== source.pathname || target.search !== source.search)
}

export function safeNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '/en/testing/'
  const url = new URL(value, 'https://docs.invalid')
  if (url.origin !== 'https://docs.invalid' || url.pathname.startsWith('/__docs/')) return '/en/testing/'
  return url.pathname + url.search + url.hash
}
