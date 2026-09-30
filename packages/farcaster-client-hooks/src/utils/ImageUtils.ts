import { ApiMediaV2 } from 'farcaster-client-data';

export const DEFAULT_AVATAR_URL = 'https://farcaster.xyz/avatar.png';

const CLOUDINARY_PREFIX =
  'https://res.cloudinary.com/merkle-manufactory/image/fetch';

export const WARPCAST_CLOUDFLARE_CDN_PREFIX =
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw';

const WRPCDN_PREFIX = 'https://wrpcd.net/cdn-cgi/image';
const SIM_COLLECTIBLE_IMAGE_PREFIX =
  'https://api.sim.dune.com/v1/evm/collectible/image/';

const wrapWithWrpCdnForPrefetching = ({ url }: { url: string }) => {
  return 'https://wrpcd.net/cdn-cgi/imagedelivery' + new URL(url).pathname;
};

const getCloudflareImageUrl = ({
  url,
  windowWidth,
  width,
  blockAnimated = true,
  increasedWidth = false,
  applyWidthLimits = false,
  proxySimImages = false,
}: {
  url: string;
  windowWidth: number;
  width?: number;
  blockAnimated?: boolean;
  increasedWidth?: boolean;
  applyWidthLimits?: boolean;
  proxySimImages?: boolean;
}) => {
  // Sim collectible images are hot-linked as-is on native; opt in to proxying
  // them through wrpcd.net (web, where direct loads fail CORS/referer checks).
  if (url.startsWith(SIM_COLLECTIBLE_IMAGE_PREFIX) && !proxySimImages) {
    return url;
  }

  const extension =
    (url.split(/[#?]/, 2) || [])[0]?.split('.')?.pop()?.trim() || '';
  if (extension === 'svg') {
    const filters = ['c_fill', 'f_png'];
    if (width) {
      filters.push(`w_${width}`);
    }
    return `${CLOUDINARY_PREFIX}/${filters.join(',')}/${encodeURIComponent(
      url,
    )}`;
  }

  const wMulti = applyWidthLimits ? 1 : 3;
  const w = Math.round(width || windowWidth) * wMulti;
  const maxW = increasedWidth ? Math.max(1200, w) : w;

  const optionsArray = ['f=auto', `w=${maxW}`];

  if (blockAnimated) {
    optionsArray.unshift('anim=false');
  }

  const options = optionsArray.join(',');

  if (
    url.startsWith(WARPCAST_CLOUDFLARE_CDN_PREFIX) &&
    (url.endsWith('/original') ||
      url.endsWith('/rectcontain1') ||
      url.endsWith('/rectcontain2') ||
      url.endsWith('/rectcontain3') ||
      url.endsWith('/rectcrop1') ||
      url.endsWith('/rectcrop2') ||
      url.endsWith('/rectcrop3') ||
      url.endsWith('/squarecrop1') ||
      url.endsWith('/squarecrop2') ||
      url.endsWith('/squarecrop3') ||
      url.endsWith('/squarecover1') ||
      url.endsWith('/squarecover2') ||
      url.endsWith('/squarecover3'))
  ) {
    const path = url
      .replace(WARPCAST_CLOUDFLARE_CDN_PREFIX, '')
      .replace('/original', `/${options}`)
      .replace('/rectcontain1', `/${options}`)
      .replace('/rectcontain2', `/${options}`)
      .replace('/rectcontain3', `/${options}`)
      .replace('/rectcontain1', `/${options}`)
      .replace('/rectcrop1', `/${options}`)
      .replace('/rectcrop2', `/${options}`)
      .replace('/rectcrop3', `/${options}`)
      .replace('/squarecrop1', `/${options}`)
      .replace('/squarecrop2', `/${options}`)
      .replace('/squarecrop3', `/${options}`)
      .replace('/squarecover1', `/${options}`)
      .replace('/squarecover2', `/${options}`)
      .replace('/squarecover3', `/${options}`);

    return `https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw${path}`;
  }

  // Cloudflare image but not Farcaster
  // Don't transform these images because their account might have this disabled.
  if (
    url.startsWith('https://imagedelivery.net') &&
    url.indexOf('BXluQx4ige9GuW0Ia56BHw') === -1
  ) {
    return url;
  }

  return `${WRPCDN_PREFIX}/${options}/${encodeURIComponent(url)}`;
};

const clamp = ({ v, min, max }: { v: number; min: number; max: number }) => {
  return Math.min(max, Math.max(min, v));
};

const getImageAspectRatio = ({ w, h }: { w: number; h: number }) => {
  if (w === 0 || h === 0) {
    return 1;
  }
  return clamp({ v: w / h, min: 0.33, max: 10 });
};

export type ClientProcessedMedia = {
  width: number;
  thumbnail: string;
  original: string;
  aspectRatio: number;
  mimeType?: string;
};

const pdToPx = [75, 150, 225];

// Below are the available variants as of Jan 2024 for images.
// original
// rectcontain1
// rectcontain2
// rectcontain3
// rectcover1
// rectcover2
// rectcover3
// rectcrop1
// rectcrop2
// rectcrop3
// rectscaledown1
// rectscaledown2
// rectscaledown3
// squarecover1
// squarecover2
// squarecover3
// squarecrop1
// squarecrop2
// squarecrop3
const processMediasForRendering = ({
  medias,
  pixelDensity,
  blockAnimated = true,
  increasedWidth = false,
  useLowQualityImages = false,
}: {
  medias: ApiMediaV2[];
  pixelDensity: number;
  blockAnimated?: boolean;
  increasedWidth?: boolean;
  useLowQualityImages?: boolean;
}): ClientProcessedMedia[] => {
  const processed: ClientProcessedMedia[] = [];

  const pd = Math.max(
    Math.min(Math.floor(pixelDensity), 1),
    useLowQualityImages ? 2 : 3,
  );

  const px = pdToPx[pd - 1];

  for (const media of medias) {
    let url = media.staticRaster;
    let thumbnail = media.staticRaster;

    if (url.startsWith(WARPCAST_CLOUDFLARE_CDN_PREFIX)) {
      url = 'https://wrpcd.net/cdn-cgi/imagedelivery' + new URL(url).pathname;

      if (media.mimeType === 'image/gif' && useLowQualityImages) {
        thumbnail = url.replace('/original', '/anim=false');
      } else {
        thumbnail = url.replace('/original', `/rectcontain${pd}`);
      }
    } else {
      url = getCloudflareImageUrl({
        url: media.staticRaster,
        // Non-Farcaster images we are going to allow them to be loaded on their original width we intake
        // otherwise callers of this method is generally optimized for feed and quality tends to be low.
        windowWidth: media.width,
        width: media.width,
        increasedWidth: false,
        blockAnimated: false,
        applyWidthLimits: true,
      });

      thumbnail = getCloudflareImageUrl({
        url: media.staticRaster,
        windowWidth: px,
        width: px,
        blockAnimated:
          blockAnimated ||
          (media.mimeType === 'image/gif' && useLowQualityImages),
        increasedWidth: increasedWidth,
      });
    }

    const aspectRatio = getImageAspectRatio({
      w: media.width,
      h: media.height,
    });

    processed.push({
      width: media.width,
      thumbnail: thumbnail,
      original: url,
      aspectRatio: aspectRatio,
      mimeType: media.mimeType,
    });
  }

  return processed;
};

const getSpecificallySizedImageUrl = ({
  staticRaster,
  h: _,
  w,
  increasedWidth = false,
  applyWidthLimits = false,
  blockAnimated = true,
}: {
  staticRaster: string;
  w: number;
  h: number;
  increasedWidth?: boolean;
  applyWidthLimits?: boolean;
  blockAnimated?: boolean;
}): string => {
  return getCloudflareImageUrl({
    url: staticRaster,
    width: w,
    windowWidth: w,
    increasedWidth,
    applyWidthLimits,
    blockAnimated,
  });
};

export function getStandardizedImageUrl({
  url,
  width,
  height,
  buckets,
  aspectRatio,
  pixelDensity,
}: {
  url: string;
  width: number;
  buckets: number[];
  pixelDensity: number;
  height?: number;
  aspectRatio?: number; // If provided, height will be calculated from width
}) {
  // Calculate pixel sizes with provided pixel density
  const pixelWidth = Math.round(width * pixelDensity);

  // Find the smallest bucket that's >= the calculated pixel size
  const standardPixelWidth =
    buckets.find((size) => size >= pixelWidth) || buckets[buckets.length - 1];

  // Calculate height based on aspect ratio or use provided height
  let standardPixelHeight: number;
  if (aspectRatio) {
    standardPixelHeight = Math.round(standardPixelWidth / aspectRatio);
  } else if (height) {
    const pixelHeight = Math.round(height * pixelDensity);
    standardPixelHeight =
      buckets.find((size) => size >= pixelHeight) ||
      buckets[buckets.length - 1];
  } else {
    standardPixelHeight = standardPixelWidth; // Default to square
  }

  const result = getSpecificallySizedImageUrl({
    staticRaster: url,
    w: standardPixelWidth,
    h: standardPixelHeight,
    applyWidthLimits: true,
  });

  return result;
}

const AVATAR_SIZE_BUCKETS = [128, 256, 512, 1024, 2048];

export function getStandardizedAvatarUrl({
  url,
  diameter,
  pixelDensity,
}: {
  url: string;
  diameter: number; // Expected to be in logical pixels
  pixelDensity: number;
  defaultUrl?: string;
}) {
  const result = getStandardizedImageUrl({
    url,
    width: diameter,
    buckets: AVATAR_SIZE_BUCKETS,
    aspectRatio: 1, // Avatars are always square
    pixelDensity,
  });

  return result;
}

const EMBED_IMAGE_BUCKETS = [64, 128, 256, 512, 1024, 2048];

export function getStandardizedEmbedImageUrl({
  url,
  width,
  height,
  pixelDensity,
}: {
  url: string;
  width: number;
  height?: number;
  pixelDensity: number;
}) {
  return getStandardizedImageUrl({
    url,
    width,
    height,
    buckets: EMBED_IMAGE_BUCKETS,
    pixelDensity,
  });
}

export {
  getCloudflareImageUrl,
  getImageAspectRatio,
  getSpecificallySizedImageUrl,
  processMediasForRendering,
  wrapWithWrpCdnForPrefetching,
};
