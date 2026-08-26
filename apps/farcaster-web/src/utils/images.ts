const WARPCAST_CLOUDFLARE_CDN_PREFIX =
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw';
const CLOUDINARY_PREFIX =
  'https://res.cloudinary.com/merkle-manufactory/image/fetch';
const WRPCDN_PREFIX = 'https://wrpcd.net/cdn-cgi/image';
const WRPCDN_REGEX =
  /^https:\/\/wrpcd.net\/cdn-cgi\/image\/(?<options>[^/]+)\/(?<originalUrl>.*)$/;

function applyCloudflarePath(
  url: undefined,
  width: number | undefined,
  options?: { dpr?: number },
): undefined;
function applyCloudflarePath(
  url: string,
  width: number | undefined,
  options?: { dpr?: number },
): string;
function applyCloudflarePath(
  url: string | undefined,
  width: number | undefined,
  options?: { dpr?: number },
): string | undefined;
function applyCloudflarePath(
  url: string | undefined,
  width: number | undefined,
  options: { dpr?: number } = {},
) {
  if (!url) {
    return undefined;
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

  const transforms = [
    'anim=false',
    'fit=contain',
    'f=auto',
    width ? `w=${width * 3}` : `w=600`,
    ...(options.dpr ? [`dpr=${options.dpr}`] : []),
  ].join(',');

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
      .replace('/original', `/${transforms}`)
      .replace('/rectcontain1', `/${transforms}`)
      .replace('/rectcontain2', `/${transforms}`)
      .replace('/rectcontain3', `/${transforms}`)
      .replace('/rectcontain1', `/${transforms}`)
      .replace('/rectcrop1', `/${transforms}`)
      .replace('/rectcrop2', `/${transforms}`)
      .replace('/rectcrop3', `/${transforms}`)
      .replace('/squarecrop1', `/${transforms}`)
      .replace('/squarecrop2', `/${transforms}`)
      .replace('/squarecrop3', `/${transforms}`)
      .replace('/squarecover1', `/${transforms}`)
      .replace('/squarecover2', `/${transforms}`)
      .replace('/squarecover3', `/${transforms}`);

    return `https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw${path}`;
  }

  // Cloudflare image but not Warpcast - Cloudflare won't allow re-transform so attempt
  // to transform from those serving these images.
  if (
    url.startsWith('https://imagedelivery.net') &&
    url.indexOf('BXluQx4ige9GuW0Ia56BHw') === -1
  ) {
    return url
      .replace('/original', `/${transforms}`)
      .replace('/public', `/${transforms}`);
  }

  return `${WRPCDN_PREFIX}/${transforms}/${encodeURIComponent(url)}`;
}

const extractOriginalPathOffCloudflare = (
  maybeCloudflareUrl: string | undefined,
): string | undefined => {
  if (!maybeCloudflareUrl) {
    return;
  }

  if (!maybeCloudflareUrl.startsWith(WRPCDN_PREFIX)) {
    return;
  }

  const match = maybeCloudflareUrl.match(WRPCDN_REGEX);
  if (match?.groups?.originalUrl) {
    return decodeURIComponent(match.groups.originalUrl);
  }

  return;
};

export { applyCloudflarePath, extractOriginalPathOffCloudflare };
