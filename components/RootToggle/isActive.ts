export function isActive(url: string, pathname: string, nested = true) {
    if (url.endsWith('/'))
        url = url.slice(0, -1);
    if (pathname.endsWith('/'))
        pathname = pathname.slice(0, -1);
    return pathname.includes(url) || (nested && pathname.startsWith(`${url}/`));
}
