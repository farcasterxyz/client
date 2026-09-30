function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, '');
}

function shouldKeepMiniAppNavigationInContext({
  allowInsecure = false,
  appDomain,
  url,
}: {
  allowInsecure?: boolean;
  appDomain: string;
  url: string;
}) {
  try {
    const requestedUrl = new URL(url);
    const requestedHostname = normalizeHostname(requestedUrl.hostname);
    const normalizedAppDomain = normalizeHostname(appDomain);

    if (requestedUrl.protocol === 'http:' && !allowInsecure) {
      return false;
    }

    return (
      requestedHostname === normalizedAppDomain ||
      requestedHostname.endsWith(`.${normalizedAppDomain}`)
    );
  } catch {
    return true;
  }
}

function getMiniAppOpenWindowUrl(targetUrl?: string) {
  if (!targetUrl || targetUrl === 'about:blank') {
    return undefined;
  }

  return targetUrl;
}

export { getMiniAppOpenWindowUrl, shouldKeepMiniAppNavigationInContext };
