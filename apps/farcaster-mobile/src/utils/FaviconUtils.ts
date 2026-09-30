const loadedDomains = new Set<string>();

const GOOGLE_FAVICON_URL = 'https://www.google.com/s2/favicons';

const getDomain = (origin: string): string | null => {
  const trimmedOrigin = origin.trim();

  if (!trimmedOrigin || trimmedOrigin === 'null') {
    return null;
  }

  try {
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmedOrigin);
    const parsed = new URL(
      hasScheme ? trimmedOrigin : `https://${trimmedOrigin}`,
    );

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.hostname || null;
  } catch {
    return null;
  }
};

const buildGoogleFaviconUrl = (domain: string, size = 32): string => {
  return `${GOOGLE_FAVICON_URL}?domain=${encodeURIComponent(domain)}&sz=${size}`;
};

const markFaviconLoaded = (domain: string): void => {
  loadedDomains.add(domain);
};

const isFaviconCached = (domain: string): boolean => {
  return loadedDomains.has(domain);
};

export { buildGoogleFaviconUrl, getDomain, isFaviconCached, markFaviconLoaded };
