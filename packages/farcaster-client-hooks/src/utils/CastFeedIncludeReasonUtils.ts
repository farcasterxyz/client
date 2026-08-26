import { ApiCastFeedIncludeReason } from 'farcaster-client-data';

const castFeedIncludeReasonTypes = new Set<ApiCastFeedIncludeReason['type']>([
  'popular',
  'following-author',
  'evergreen-following-author',
  'popular-in-channel',
  'follow-of-follow',
  'recasted-by-following',
  'pinned-in-channel',
  'has-reply-by-followed',
  'high-quality-unfollowed',
  'snap-promoted',
]);

export const getCastFeedIncludeReasonType = (
  includeReason: string | undefined,
): ApiCastFeedIncludeReason['type'] | undefined => {
  if (
    typeof includeReason === 'string' &&
    castFeedIncludeReasonTypes.has(
      includeReason as ApiCastFeedIncludeReason['type'],
    )
  ) {
    return includeReason as ApiCastFeedIncludeReason['type'];
  }

  return undefined;
};
