import { ApiFrame } from '../types';

export const getMiniAppCanonicalUrl = ({
  frame,
  forceId = false,
}: {
  frame: ApiFrame;
  forceId?: boolean;
}) => {
  const origin =
    typeof window !== 'undefined' && window.location && window.location.origin
      ? window.location.origin
      : 'https://farcaster.xyz';
  const slug = frame.name
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return `${origin}/miniapps/${
    forceId ? frame.id : (frame.shortId ?? frame.id)
  }/${slug}`;
};

export const injectQueryParams = (
  url: ConstructorParameters<typeof URL>[0],
  queryParams: ConstructorParameters<typeof URLSearchParams>[0],
) => {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(queryParams);
    params.forEach((value, key) => {
      urlObj.searchParams.set(key, value);
    });
    return urlObj.toString();
  } catch (error) {
    return url.toString();
  }
};

/**
 * Merges the query params of `sourceUrl` onto `launchUrl` without overwriting
 * params that `launchUrl` already declares.
 *
 * Mini app launch URLs are resolved from the target's `fc:frame` / `fc:miniapp`
 * embed metadata, which returns the app's declared launch URL and drops any
 * query params that were on the URL a user actually opened (e.g. from a cast).
 * This forwards those params onto the declared launch URL so the app still
 * receives them. App-declared params win on conflict.
 */
export const preserveQueryParams = ({
  launchUrl,
  sourceUrl,
}: {
  launchUrl: string;
  sourceUrl: string;
}): string => {
  try {
    const launch = new URL(launchUrl);
    const source = new URL(sourceUrl);
    source.searchParams.forEach((value, key) => {
      if (!launch.searchParams.has(key)) {
        launch.searchParams.set(key, value);
      }
    });
    return launch.toString();
  } catch {
    return launchUrl;
  }
};

export const addPathToUrl = (
  url: ConstructorParameters<typeof URL>[0],
  path: string,
) => {
  if (!url) {
    return url;
  }

  if (!path || path === '' || path === '/') {
    return url;
  }
  try {
    const urlObj = new URL(url);
    let currentPath = urlObj.pathname;

    if (currentPath.endsWith('/')) {
      currentPath = currentPath.slice(0, -1);
    }

    let pathSegmentToAppend = path;
    if (pathSegmentToAppend.startsWith('/')) {
      pathSegmentToAppend = pathSegmentToAppend.substring(1);
    }

    urlObj.pathname = `${currentPath}/${pathSegmentToAppend}`;

    return urlObj.toString();
  } catch (error) {
    return url;
  }
};
