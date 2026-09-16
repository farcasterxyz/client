import {
  ApiCast,
  ApiCastSnapEmbed,
  ApiCastUrlEmbed,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import {
  useBlockedDomains,
  useBlockedSnapUrls,
} from '../../providers/BlockedDomainsProvider';

const UNRESERVED_PERCENT_ENCODED_BYTE_REGEX = /%([0-9a-fA-F]{2})/g;

// Normalizes a URL's hostname to the form stored in the blocklist:
// lowercases and strips a trailing dot (fully-qualified DNS form).
// `https://Evil.COM./x` and `https://evil.com/x` both yield `evil.com`.
export function extractDomain(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.endsWith('.') ? hostname.slice(0, -1) : hostname;
  } catch {
    return undefined;
  }
}

// Suffix-with-dot match: a URL hostname matches a blocked entry if it equals
// the entry or is a subdomain of it. Blocking `phish.evil.com` matches
// `phish.evil.com` and `again.phish.evil.com`, but not `evil.com` (parent) or
// `other.evil.com` (sibling). `aaaphish.evil.com` is rejected by the dot.
export function isDomainBlocked(
  domain: string,
  blockedDomains: Set<string>,
): boolean {
  let cur = domain;
  while (cur) {
    if (blockedDomains.has(cur)) return true;
    const idx = cur.indexOf('.');
    if (idx === -1) return false;
    cur = cur.slice(idx + 1);
  }
  return false;
}

export function normalizeSnapUrlForBlocklist(
  snapUrl: string,
): string | undefined {
  try {
    const parsed = new URL(snapUrl);
    parsed.search = '';
    parsed.hash = '';
    return `${parsed.origin}${normalizePathname(parsed.pathname)}`;
  } catch {
    return undefined;
  }
}

function normalizePercentEncoding(pathname: string): string {
  return pathname.replace(
    UNRESERVED_PERCENT_ENCODED_BYTE_REGEX,
    (match, hex: string) => {
      const byte = parseInt(hex, 16);
      const char = String.fromCharCode(byte);

      if (/^[A-Za-z0-9._~-]$/.test(char)) {
        return char;
      }

      return match.toUpperCase();
    },
  );
}

function normalizePathname(pathname: string): string {
  let normalizedPathname = normalizePercentEncoding(pathname);

  while (normalizedPathname.endsWith('/')) {
    normalizedPathname = normalizedPathname.slice(0, -1);
  }

  return normalizedPathname;
}

function isUrlBlocked(
  url: string | undefined,
  blockedDomains: Set<string>,
): boolean {
  if (!url) return false;
  const domain = extractDomain(url);
  return domain ? isDomainBlocked(domain, blockedDomains) : false;
}

function isSnapUrlBlocked(
  snapUrl: string | undefined,
  blockedSnapUrls: Set<string>,
): boolean {
  if (!snapUrl) return false;
  const normalizedSnapUrl = normalizeSnapUrlForBlocklist(snapUrl);
  return normalizedSnapUrl ? blockedSnapUrls.has(normalizedSnapUrl) : false;
}

function urlEmbedHasBlockedUrl(
  urlEmbed: ApiCastUrlEmbed,
  blockedDomains: Set<string>,
  blockedSnapUrls: Set<string>,
): boolean {
  const og = urlEmbed.openGraph;
  if (!og) return false;

  if (isUrlBlocked(og.url, blockedDomains)) return true;
  if (isUrlBlocked(og.sourceUrl, blockedDomains)) return true;
  if (isSnapUrlBlocked(og.snap?.url, blockedSnapUrls)) return true;

  if (isUrlBlocked(og.frameEmbedNext?.frameUrl, blockedDomains)) return true;
  if (isUrlBlocked(og.frame?.frameUrl, blockedDomains)) return true;

  const launchAction = og.frameEmbedNext?.frameEmbed?.button?.action;
  if (launchAction && 'url' in launchAction && launchAction.url) {
    if (isUrlBlocked(launchAction.url, blockedDomains)) return true;
  }

  return false;
}

function snapsHaveBlockedUrl(
  snaps: ApiCastSnapEmbed[] | undefined,
  blockedSnapUrls: Set<string>,
): boolean {
  if (!snaps) return false;
  return snaps.some((snap) => isSnapUrlBlocked(snap.url, blockedSnapUrls));
}

function urlsHaveBlockedUrl(
  urls: ApiCastUrlEmbed[] | undefined,
  blockedDomains: Set<string>,
  blockedSnapUrls: Set<string>,
): boolean {
  if (!urls) return false;
  return urls.some((urlEmbed) =>
    urlEmbedHasBlockedUrl(urlEmbed, blockedDomains, blockedSnapUrls),
  );
}

export function castHasBlockedUrl(
  cast: ApiCast,
  blockedDomains: Set<string>,
  blockedSnapUrls: Set<string> = new Set(),
): boolean {
  if (blockedDomains.size === 0 && blockedSnapUrls.size === 0) return false;

  if (urlsHaveBlockedUrl(cast.embeds?.urls, blockedDomains, blockedSnapUrls)) {
    return true;
  }

  if (snapsHaveBlockedUrl(cast.embeds?.snap, blockedSnapUrls)) {
    return true;
  }

  const quoteCasts = cast.embeds?.casts;
  if (quoteCasts) {
    for (const quoteCast of quoteCasts) {
      if (
        urlsHaveBlockedUrl(
          quoteCast.embeds?.urls,
          blockedDomains,
          blockedSnapUrls,
        )
      ) {
        return true;
      }
      if (snapsHaveBlockedUrl(quoteCast.embeds?.snap, blockedSnapUrls)) {
        return true;
      }
    }
  }

  return false;
}

export const useCastHasBlockedUrl = () => {
  const blockedDomains = useBlockedDomains();
  const blockedSnapUrls = useBlockedSnapUrls();

  return useCallback(
    (cast: ApiCast): boolean =>
      castHasBlockedUrl(cast, blockedDomains, blockedSnapUrls),
    [blockedDomains, blockedSnapUrls],
  );
};
