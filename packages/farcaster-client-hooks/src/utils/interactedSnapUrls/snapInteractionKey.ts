/**
 * Normalize a snap URL to a stable storage key: origin + pathname, lowercase host,
 * no query, no fragment, trailing slash trimmed except for root `/`.
 */
function snapInteractionKey(url: string): string | null {
  try {
    const u = new URL(url);
    let pathname = u.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    const host = u.host.toLowerCase();
    const origin = `${u.protocol}//${host}`;
    return `${origin}${pathname}`;
  } catch {
    return null;
  }
}

export { snapInteractionKey };
