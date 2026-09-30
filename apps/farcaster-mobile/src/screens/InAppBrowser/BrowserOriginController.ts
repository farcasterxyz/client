import { getBrowserPermission } from './BrowserPermissionStore';
import { BrowserPermissionTier, BrowserSession } from './BrowserTypes';

function parseOrigin(input: string): string | undefined {
  try {
    const parsed = new URL(input);
    return parsed.origin.toLowerCase();
  } catch {
    return undefined;
  }
}

export function normalizeOriginFromUrl(url: string) {
  return parseOrigin(url);
}

export function normalizeHostnameFromUrl(input: string) {
  try {
    const parsed = input.includes('://')
      ? new URL(input)
      : new URL(`https://${input}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

export function isBlockedBrowserUrl({
  url,
  blockedDomains,
}: {
  url: string;
  blockedDomains: Set<string>;
}) {
  const hostname = normalizeHostnameFromUrl(url);
  if (!hostname) {
    return false;
  }

  for (const blockedDomain of blockedDomains) {
    if (hostname === blockedDomain || hostname.endsWith(`.${blockedDomain}`)) {
      return true;
    }
  }

  return false;
}

export function isSecureTopLevelOrigin(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getBrowserPermissionTier({
  url,
  origin,
  sessionConnectedAddress,
}: {
  url: string;
  origin?: string;
  sessionConnectedAddress?: string;
}): BrowserPermissionTier {
  const resolvedOrigin = origin ?? normalizeOriginFromUrl(url);
  const secure = isSecureTopLevelOrigin(url);
  if (!resolvedOrigin || !secure) {
    return 0;
  }

  const permission = getBrowserPermission(resolvedOrigin);
  if (permission?.connectGranted) {
    return permission.trusted ? 3 : 2;
  }

  if (sessionConnectedAddress) {
    return 2;
  }

  return 1;
}

export function buildBrowserSession({
  url,
  title,
  sessionConnectedAddress,
}: {
  url: string;
  title?: string;
  sessionConnectedAddress?: BrowserSession['sessionConnectedAddress'];
}): BrowserSession {
  const origin = normalizeOriginFromUrl(url);
  const secureTopLevelOrigin = isSecureTopLevelOrigin(url);
  const tier = getBrowserPermissionTier({
    url,
    origin,
    sessionConnectedAddress,
  });

  return {
    url,
    origin,
    pageTitle: title,
    sessionConnectedAddress,
    secureTopLevelOrigin,
    tier,
    injectEnabled: secureTopLevelOrigin && typeof origin !== 'undefined',
  };
}

export function hasOriginChanged({
  previousUrl,
  nextUrl,
}: {
  previousUrl?: string;
  nextUrl?: string;
}) {
  if (!previousUrl || !nextUrl) {
    return false;
  }
  return (
    normalizeOriginFromUrl(previousUrl) !== normalizeOriginFromUrl(nextUrl)
  );
}
