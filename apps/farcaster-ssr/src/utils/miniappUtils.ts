import {
  ApiFrame,
  ApiFrameEmbedNextExtended,
  ApiOpenGraphMetadata,
  getMiniAppCanonicalUrl,
} from 'farcaster-client-data';

export type MiniappMetadata = {
  pageTitle: string;
  pageDescription: string;
  url: string;
  imageUrl: string;
  iconUrl: string;
  authorProfileUrl?: string;
  authorUsername?: string;
  screenshotUrls?: string[];
  primaryCategory?: string;
  tags?: string[];
  twitterCard: 'summary' | 'summary_large_image';
  ogTitle: string;
  ogDescription: string;
};

export const cleanImageUrl = (imageUrl: string) => {
  const proxyPrefix = 'https://proxy.wrpcd.net';
  if (imageUrl.startsWith(proxyPrefix)) {
    const url = new URL(imageUrl);
    const urlParam = url.searchParams.get('url');
    return urlParam ? decodeURIComponent(urlParam) : imageUrl;
  }
  return imageUrl;
};

export const getMiniappMetadata = ({
  frame,
  embed,
  ogMetadata,
}: {
  frame: ApiFrame;
  embed: ApiFrameEmbedNextExtended | null;
  ogMetadata: ApiOpenGraphMetadata | null;
}): MiniappMetadata | null => {
  if (!frame) {
    return null;
  }

  // Handle the case where the backend sets a 404 error title.
  const ogMetadataTitle =
    ogMetadata?.title &&
    ogMetadata?.title.includes('404: This page could not be found')
      ? undefined
      : ogMetadata?.title;

  const ogTitle = ogMetadataTitle || frame.ogTitle || `${frame.name}`;
  const ogDescription =
    ogMetadata?.description ??
    frame.ogDescription ??
    frame.subtitle ??
    frame.tagline ??
    (frame.author?.username
      ? `A mini app by ${frame.author.username}.`
      : 'A mini app.');

  const pageTitle = `${ogTitle}`;
  const pageDescription = frame.description ?? ogDescription;

  let imageUrl =
    embed?.frameEmbed?.imageUrl ??
    frame.ogImageUrl ??
    ogMetadata?.image ??
    frame.imageUrl ??
    frame.heroImageUrl ??
    frame.iconUrl;
  imageUrl = cleanImageUrl(imageUrl);
  const twitterCard = imageUrl ? 'summary_large_image' : 'summary';

  if (!imageUrl) {
    imageUrl = frame.iconUrl;
  }

  const url = getMiniAppCanonicalUrl({ frame, forceId: true });
  const authorProfileUrl = frame.author?.username
    ? `https://farcaster.xyz/${frame.author.username}`
    : undefined;

  return {
    pageTitle,
    pageDescription,
    iconUrl: frame.iconUrl,
    authorProfileUrl,
    authorUsername: frame.author?.username,
    screenshotUrls: frame.screenshotUrls,
    primaryCategory: frame.primaryCategory,
    tags: frame.tags,
    twitterCard,
    ogTitle,
    ogDescription,
    imageUrl,
    url,
  };
};
