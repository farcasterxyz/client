import {
  getSpecificallySizedImageUrl,
  getStandardizedEmbedImageUrl as getStandardizedEmbedImageUrlBase,
} from 'farcaster-client-hooks';
import { PixelRatio, Platform } from 'react-native';

const WRPCDN_PREFIX = 'https://wrpcd.net/cdn-cgi/image';
const WRPCDN_REGEX =
  /^https:\/\/wrpcd.net\/cdn-cgi\/image\/(?<options>[^/]+)\/(?<originalUrl>.*)$/;

const uncloudifyUrl = (maybeCloudflareUrl: string) => {
  if (!maybeCloudflareUrl.startsWith(WRPCDN_PREFIX)) {
    return;
  }

  const match = maybeCloudflareUrl.match(WRPCDN_REGEX);
  if (match?.groups?.originalUrl) {
    return decodeURIComponent(match.groups.originalUrl);
  }

  return;
};

// Helper to get pixel density for React Native
export function getPixelDensity(): number {
  // Cap at 3 for iOS and 2 for Android to avoid unnecessarily large images
  return Math.min(PixelRatio.get(), Platform.OS === 'ios' ? 3 : 2);
}

// React Native wrapper for standardized avatar URLs
// We are moving to a strict model in which where we only ever load 2 sizes of avatars.
// 128x128 or 1000x1000. This should allow us to populate caches accurately.
export function getStandardizedAvatarUrl({
  url,
  size,
}: {
  url: string;
  size: 'default' | 'profile-header';
}) {
  const standardPixelWidth = size === 'default' ? 128 : 1000;

  const standardPixelHeight = standardPixelWidth / 1;

  return getSpecificallySizedImageUrl({
    staticRaster: url,
    w: standardPixelWidth,
    h: standardPixelHeight,
    applyWidthLimits: true,
    blockAnimated: true,
    increasedWidth: false,
  });
}

export function getStandardizedEmbedImageUrl({
  url,
  width,
  height,
}: {
  url: string;
  width: number;
  height?: number;
}) {
  return getStandardizedEmbedImageUrlBase({
    url,
    width,
    height,
    pixelDensity: getPixelDensity(),
  });
}

export { uncloudifyUrl };
