import type { CastComposerEmbedsReturn } from 'farcaster-client-hooks';

const EMPTY_CAST_COMPOSER_EMBEDS: CastComposerEmbedsReturn['embeds'][number] = {
  images: [],
  videos: [],
  urls: [],
};

const EMPTY_EMBED_URLS: string[] = [];

const getCastComposerEmbedsForLocalKey = ({
  embeds,
  localKey,
}: {
  embeds: CastComposerEmbedsReturn['embeds'];
  localKey: number;
}) => embeds[localKey] ?? EMPTY_CAST_COMPOSER_EMBEDS;

const getEmbedUrlsForLocalKey = ({
  embedUrls,
  localKey,
}: {
  embedUrls: CastComposerEmbedsReturn['embedUrls'];
  localKey: number;
}) => embedUrls[localKey] ?? EMPTY_EMBED_URLS;

export {
  EMPTY_CAST_COMPOSER_EMBEDS,
  EMPTY_EMBED_URLS,
  getCastComposerEmbedsForLocalKey,
  getEmbedUrlsForLocalKey,
};
