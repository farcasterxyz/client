import { Linking, Platform } from 'react-native';

import { trackError } from './ErrorUtils';

const getWarpcastParsedUrl = (url: string) => {
  const parsedUrl = parseUrl(url);

  if (!parsedUrl) {
    return;
  }

  if (
    parsedUrl.host.toLowerCase() !== 'warpcast.com' &&
    parsedUrl.host.toLowerCase() !== 'farcaster.xyz' &&
    parsedUrl.protocol !== 'farcaster:'
  ) {
    return;
  }

  return parsedUrl;
};

const openWarpcastSettings = () => Linking.openSettings();

const openWarpcastAppDownload = () =>
  Platform.select({
    ios: () => {
      Linking.openURL('https://apps.apple.com/us/app/farcaster/id1600555445');
    },
    android: () => {
      Linking.openURL(
        'https://play.google.com/store/apps/details?id=com.farcaster.mobile',
      );
    },
    default: () => {
      Linking.openURL('https://farcaster.xyz/~/download');
    },
  })();

const isAbsoluteUrl = (url: string): boolean => {
  const downcasedUrl = url.toLowerCase();
  return (
    downcasedUrl.startsWith('http://') || downcasedUrl.startsWith('https://')
  );
};

const parseUrl = (url: string) => {
  try {
    if (isAbsoluteUrl(url)) {
      return new URL(url);
    }
  } catch (err) {
    trackError(err);
  }

  return undefined;
};

const hasExtension = (url: string, extensions: string[]) => {
  const trimmedLowercasedURL = url.trim().toLowerCase();

  return (
    (trimmedLowercasedURL.startsWith('http://') ||
      trimmedLowercasedURL.startsWith('https://')) &&
    extensions.some((extension) => trimmedLowercasedURL.endsWith(extension))
  );
};

const imageExtensions = ['.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'];

const hasImageExtension = (url: string) => hasExtension(url, imageExtensions);

/** Only to be used for specific UX enhancements, please prefer standard CSS text-overflow in general */
const truncateMiddle = (text: string) => {
  if (text.length > 35) {
    return `${text.substring(0, 20)}...${text.substring(
      text.length - 10,
      text.length,
    )}`;
  }
  return text;
};

const truncateURLForFeeds = ({ url }: { url: string }) => {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return url;
    }
    const path = (u.pathname === '/' ? '' : u.pathname) + u.search + u.hash;
    if (path.length > 15) {
      return u.host + path.slice(0, 13) + '...';
    }
    return u.host + path;
  } catch (e) {
    return url;
  }
};

const sanitizeUrl = (input: string): string => {
  // Trim leading and trailing whitespace
  const trimmed = input.trim();

  // If empty string, return it
  if (!trimmed) {
    return '';
  }

  // Try to parse as URL to validate it
  try {
    // If it's already a valid absolute URL, return it
    const url = new URL(trimmed);
    return url.href;
  } catch {
    // Not a valid URL yet
  }

  // Check for incomplete protocols (e.g., "https:/", "http:")
  if (/^https?:\/*/i.test(trimmed)) {
    // Extract the part after any protocol-like prefix
    const withoutProtocol = trimmed.replace(/^https?:\/*/i, '');
    if (!withoutProtocol) {
      return '';
    }
    return `https://${withoutProtocol}`;
  }

  // Try adding https:// and validate
  try {
    const url = new URL(`https://${trimmed}`);
    return url.href;
  } catch {
    // If it still fails, return the original with https://
    return `https://${trimmed}`;
  }
};

const isDomainOrSubdomain = (domain: string, parentDomain: string) => {
  if (!domain || !parentDomain) {
    return false;
  }

  domain = domain.toLowerCase();
  parentDomain = parentDomain.toLowerCase();

  if (domain === parentDomain) {
    return true;
  }

  return domain.endsWith('.' + parentDomain);
};

type OpenGraphRenderType =
  | 'url'
  | 'explore-apps'
  | 'warpcast-settings'
  | 'starter-pack'
  | 'contract-address'
  | 'token'
  | 'rich-warpcast-attachment'
  | 'news';

function getOpenGraphType({
  domain,
  url,
}: {
  domain: string | undefined;
  url: string;
}): OpenGraphRenderType {
  if (typeof domain === 'undefined') {
    return 'url';
  }

  const farcasterAssociated =
    isDomainOrSubdomain(domain, 'warpcast.com') ||
    isDomainOrSubdomain(domain, 'farcaster.xyz');

  if (!farcasterAssociated) {
    return 'url';
  }

  if (
    url.indexOf('/~/explore/apps/') !== -1 &&
    !url.endsWith('/~/explore/apps/')
  ) {
    return 'explore-apps';
  }

  if (url.indexOf('/~/news/') !== -1 && !url.endsWith('/~/news/')) {
    return 'news';
  }

  if (
    url.indexOf('/settings/muted-accounts') !== -1 ||
    url.indexOf('/settings/mutes-and-blocks') !== -1 ||
    url.indexOf('/settings/mutes-and-blocks') !== -1 ||
    url.indexOf('/settings/import') !== -1 ||
    url.indexOf('/settings/muted-keywords') !== -1 ||
    url.indexOf('/settings/muted-words') !== -1 ||
    url.indexOf('/settings/verifications') !== -1
  ) {
    return 'warpcast-settings';
  }

  if (
    (url.indexOf('/~/starter-packs/') !== -1 &&
      !url.endsWith('/~/starter-packs/')) ||
    (url.indexOf('/pack/') !== -1 && !url.endsWith('/pack/'))
  ) {
    return 'starter-pack';
  }

  if (url.indexOf('/~/c/') !== -1) {
    return 'token';
  }

  if (
    url.indexOf('/~/developers/rewards') !== -1 ||
    url.indexOf('/~/mini-apps/rewards') !== -1 ||
    url.indexOf('/miniapps/rewards') !== -1
  ) {
    return 'rich-warpcast-attachment';
  }

  return 'url';
}

export {
  getOpenGraphType,
  getWarpcastParsedUrl,
  hasExtension,
  hasImageExtension,
  imageExtensions,
  isAbsoluteUrl,
  openWarpcastAppDownload,
  openWarpcastSettings,
  parseUrl,
  sanitizeUrl,
  truncateMiddle,
  truncateURLForFeeds,
};
