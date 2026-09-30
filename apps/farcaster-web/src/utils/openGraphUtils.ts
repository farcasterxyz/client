import {
  ApiOpenGraphMetadata,
  isDomainOrSubdomain,
  isExactDomain,
} from 'farcaster-client-data';
import { matchPath } from 'react-router-dom';

import { appPathPrefix } from '~/constants/routePrefixes';
import { routes } from '~/constants/routes';
import { applyCloudflarePath } from '~/utils/images';

const getOpenGraphFallbackAssetName = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  const downcasedDomain = attachment.domain;

  if (!downcasedDomain) {
    return 'Link';
  }
  if (isDomainOrSubdomain(downcasedDomain, 'amazon.com')) {
    return 'Amazon';
  }
  if (isDomainOrSubdomain(downcasedDomain, 'music.apple.com')) {
    return 'AppleMusic';
  }
  if (isDomainOrSubdomain(downcasedDomain, 'facebook.com')) {
    return 'Facebook';
  }
  if (isDomainOrSubdomain(downcasedDomain, 'instagram.com')) {
    return 'Instagram';
  }
  if (isDomainOrSubdomain(downcasedDomain, 'opensea.io')) {
    return 'OpenSea';
  }
  if (isDomainOrSubdomain(downcasedDomain, 'replit.com')) {
    return 'Replit';
  }
  if (isDomainOrSubdomain(downcasedDomain, 'substack.com')) {
    return 'Substack';
  }
  if (isDomainOrSubdomain(downcasedDomain, 'twitter.com')) {
    return 'Twitter';
  }
  if (isExactDomain(downcasedDomain, 'x.com')) {
    return 'Twitter';
  }
  if (isDomainOrSubdomain(downcasedDomain, 'wikipedia.org')) {
    return 'Wikipedia';
  }
  if (isDomainOrSubdomain(downcasedDomain, 'youtube.com')) {
    return 'YouTube';
  }
  if (
    // eslint-disable-next-line no-restricted-syntax
    isDomainOrSubdomain(downcasedDomain, 'notion.so') ||
    // eslint-disable-next-line no-restricted-syntax
    isDomainOrSubdomain(downcasedDomain, 'notion.site')
  ) {
    return 'Notion';
  }
  if (isDomainOrSubdomain(downcasedDomain, 'news.ycombinator.com')) {
    return 'YC';
  }
  if (isDomainOrSubdomain(downcasedDomain, 'etherscan.io')) {
    return 'Etherscan';
  }
  return 'Link';
};

const getShouldForceFallbackAsset = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  if (
    !attachment.domain ||
    isDomainOrSubdomain(attachment.domain, 'replit.com') ||
    isDomainOrSubdomain(attachment.domain, 'amazon.com') ||
    isDomainOrSubdomain(attachment.domain, 'wikipedia.org') ||
    // eslint-disable-next-line no-restricted-syntax
    isDomainOrSubdomain(attachment.domain, 'notion.so') ||
    // eslint-disable-next-line no-restricted-syntax
    isDomainOrSubdomain(attachment.domain, 'notion.site') ||
    isDomainOrSubdomain(attachment.domain, 'substack.com') ||
    isDomainOrSubdomain(attachment.domain, 'news.ycombinator.com') ||
    isDomainOrSubdomain(attachment.domain, 'etherscan.io')
  ) {
    return true;
  }
  return false;
};

const shouldRenderQuoteTweet = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  return !!(
    attachment.domain &&
    (isDomainOrSubdomain(attachment.domain, 'twitter.com') ||
      isExactDomain(attachment.domain, 'x.com')) &&
    attachment.title &&
    attachment.description
  );
};

const shouldRenderChannelAttachment = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  return !!(
    attachment.domain &&
    (isDomainOrSubdomain(attachment.domain, 'warpcast.com') ||
      isDomainOrSubdomain(attachment.domain, 'farcaster.xyz')) &&
    attachment.title &&
    attachment.channel
  );
};

const shouldRenderAppAttachment = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  return !!(
    attachment.domain &&
    (isDomainOrSubdomain(attachment.domain, 'warpcast.com') ||
      isDomainOrSubdomain(attachment.domain, 'farcaster.xyz')) &&
    attachment.title &&
    attachment.url.indexOf('~/explore/apps') !== -1 &&
    !attachment.url.endsWith('warpcast.com/~/explore/apps') &&
    !attachment.url.endsWith('warpcast.com/~/explore/apps/') &&
    !attachment.url.endsWith('farcaster.xyz/~/explore/apps') &&
    !attachment.url.endsWith('farcaster.xyz/~/explore/apps/')
  );
};

const shouldRenderNewsArticleAttachment = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  return !!(
    attachment.domain &&
    (isDomainOrSubdomain(attachment.domain, 'warpcast.com') ||
      isDomainOrSubdomain(attachment.domain, 'farcaster.xyz')) &&
    attachment.title &&
    attachment.url.indexOf('~/news/') !== -1 &&
    !attachment.url.endsWith('warpcast.com/~/news') &&
    !attachment.url.endsWith('warpcast.com/~/news/') &&
    !attachment.url.endsWith('farcaster.xyz/~/news') &&
    !attachment.url.endsWith('farcaster.xyz/~/news/')
  );
};

const shouldRenderWarpcastSettingsAttachment = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  return !!(
    attachment.domain &&
    (isDomainOrSubdomain(attachment.domain, 'warpcast.com') ||
      isDomainOrSubdomain(attachment.domain, 'farcaster.xyz')) &&
    attachment.title &&
    attachment.url.indexOf('~/settings/') !== -1
  );
};

const shouldRenderStarterPackAttachment = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  return !!(
    attachment.domain &&
    (isDomainOrSubdomain(attachment.domain, 'warpcast.com') ||
      isDomainOrSubdomain(attachment.domain, 'farcaster.xyz')) &&
    attachment.title &&
    attachment.url.indexOf('/pack/') !== -1 &&
    attachment.url.indexOf('warpcast.com/pack') === -1
  );
};

const shouldRenderRichWarpcastAttachment = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  return !!(
    attachment.domain &&
    (isDomainOrSubdomain(attachment.domain, 'warpcast.com') ||
      isDomainOrSubdomain(attachment.domain, 'farcaster.xyz')) &&
    attachment.title &&
    (attachment.url.indexOf('warpcast.com/~/invites') !== -1 ||
      attachment.url.indexOf('warpcast.com/~/developers/rewards') !== -1 ||
      attachment.url.indexOf('warpcast.com/~/mini-apps/rewards') !== -1)
  );
};

const shouldRenderContractAddressAttachment = ({
  urlEmbed: attachment,
}: {
  urlEmbed: ApiOpenGraphMetadata;
}) => {
  return !!(
    attachment.domain &&
    (isDomainOrSubdomain(attachment.domain, 'warpcast.com') ||
      isDomainOrSubdomain(attachment.domain, 'farcaster.xyz')) &&
    attachment.title &&
    attachment.url.indexOf('~/ca/') !== -1
  );
};

const shouldRenderCoinAttachment = ({
  urlEmbed: attachment,
}: {
  urlEmbed: ApiOpenGraphMetadata;
}) => {
  return !!(
    attachment.domain &&
    isDomainOrSubdomain(attachment.domain, 'farcaster.xyz') &&
    attachment.url.indexOf('~/c/') !== -1
  );
};

const getPathnameFromUrl = ({ url }: { url: string }) => {
  try {
    return new URL(url).pathname;
  } catch {
    return undefined;
  }
};

const shouldRenderFauxQuoteCast = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  const pathname = getPathnameFromUrl({ url: attachment.url });
  if (typeof pathname === 'undefined') {
    return false;
  }

  if (pathname.startsWith('/~')) {
    return false;
  }

  // Using same logic used by QuoteCast
  const matched = matchPath(routes.conversationWithUsername.path, pathname);

  return !!(
    attachment.domain &&
    (isDomainOrSubdomain(attachment.domain, 'warpcast.com') ||
      isDomainOrSubdomain(attachment.domain, 'farcaster.xyz')) &&
    attachment.title &&
    attachment.description &&
    matched
  );
};

const shouldRenderExploreChannels = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  const pathname = getPathnameFromUrl({ url: attachment.url });
  if (typeof pathname === 'undefined') {
    return false;
  }

  const matched = matchPath(routes.channels.path, pathname);

  return !!(
    attachment.domain &&
    (isDomainOrSubdomain(attachment.domain, 'warpcast.com') ||
      isDomainOrSubdomain(attachment.domain, 'farcaster.xyz')) &&
    attachment.title &&
    attachment.description &&
    matched
  );
};

type OpenGraphWithAlternateImageFields = ApiOpenGraphMetadata & {
  ogImage?: string;
  ogImageUrl?: string;
  imageUrl?: string;
  /** Snake_case variants from API responses (e.g. Neynar, hub) */
  og_image?: string;
  og_image_url?: string;
};

const getFirstImageUrl = (...urls: (string | undefined)[]) =>
  urls.find((url) => typeof url === 'string' && url.length > 0);

/**
 * Returns the first available image URL from attachment metadata.
 * Falls back to ogImageUrl/ogImage (and snake_case variants) when image/logo
 * are missing. Supports BaseScan and other sites where the API returns
 * og:image under alternate field names.
 */
const getOpenGraphImageSource = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}): string | undefined => {
  const ext = attachment as OpenGraphWithAlternateImageFields;
  return getFirstImageUrl(
    attachment.image,
    attachment.logo,
    ext.imageUrl,
    ext.ogImageUrl,
    ext.ogImage,
    ext.og_image_url,
    ext.og_image,
  );
};

const getOpenGraphImageUrl = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  const imageSource = getOpenGraphImageSource({ attachment });
  return imageSource ? applyCloudflarePath(imageSource, undefined) : undefined;
};

const getOpenGraphImagePropsFromUrl = (imageUrl: string) => {
  const src = applyCloudflarePath(imageUrl, undefined);
  const dpr1Src = applyCloudflarePath(imageUrl, undefined, { dpr: 1 });
  const dpr2Src = applyCloudflarePath(imageUrl, undefined, { dpr: 2 });
  const dpr3Src = applyCloudflarePath(imageUrl, undefined, { dpr: 3 });
  return {
    src,
    srcSet: `\n${dpr1Src} 1x,\n${dpr2Src} 2x,\n${dpr3Src} 3x\n`,
  };
};

const getOpenGraphImageProps = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  const imageSource = getOpenGraphImageSource({ attachment });
  if (!imageSource) {
    return { src: '', srcSet: '' };
  }
  return getOpenGraphImagePropsFromUrl(imageSource);
};

const getOpenGraphFallbackImageUrl = ({
  assetName,
  assetExtension = 'png',
}: {
  assetName: string;
  assetExtension?: 'png' | 'webp';
}) => `${appPathPrefix}/images/og/${assetName}.${assetExtension}`;

export {
  getOpenGraphFallbackAssetName,
  getOpenGraphFallbackImageUrl,
  getOpenGraphImageProps,
  getOpenGraphImageSource,
  getOpenGraphImageUrl,
  getShouldForceFallbackAsset,
  shouldRenderAppAttachment,
  shouldRenderChannelAttachment,
  shouldRenderCoinAttachment,
  shouldRenderContractAddressAttachment,
  shouldRenderExploreChannels,
  shouldRenderFauxQuoteCast,
  shouldRenderNewsArticleAttachment,
  shouldRenderQuoteTweet,
  shouldRenderRichWarpcastAttachment,
  shouldRenderStarterPackAttachment,
  shouldRenderWarpcastSettingsAttachment,
};
