import {
  ApiAssetEventFeedItem,
  ApiCast,
  ApiCastFeedItem,
  ApiQuoteCastEmbed,
} from 'farcaster-client-data';
import { FeedItemType, MixedFeedItem } from 'farcaster-client-hooks';

// moved from .join to template literals as it's roughly 2x faster
// gets run frequently when scrolling the feed, so it's worth optimizing
// see https://www.measurethat.net/Benchmarks/Show/18440/0/native-js-arrayjoin-strings-vs-template-literals-vs-str

// Cast cells use content-based keys (no `index`) so that prepending or
// reordering casts in the feed does not invalidate the FlashList cell
// cache. That cache invalidation is what causes cells to remount with
// new measured heights and forces FlashList to re-calibrate its
// projected contentSize mid-scroll, producing the "blank space at
// bottom" / content-shrinking artifacts on iOS.
//
// UserRecommendations / TrendingTopics blocks are appended once per
// page by the mixed-feed builder, and pages can legitimately share the
// same `suggestedUsers` / `trendingTopics` payload — purely content-
// based keys would collide and let FlashList recycle the wrong cell
// into a different block. We add the FlashList `index` as a tie-
// breaker for these auxiliary blocks. The trade-off (these cells
// remount when casts are prepended above them) is acceptable: the
// blocks are rare (≤1 per page), small, and have low height variance,
// so they don't contribute to the FlashList drift bug that the
// cast-side stable keys are guarding against.
const extractMixedFeedItemKey = (
  item: MixedFeedItem | undefined,
  index?: number,
) => {
  if (item && item.type === FeedItemType.Cast) {
    return `cast|${item.item.id}|${item.item.cast.recast ? 'r' : 'o'}`;
  }
  const positional = index ?? 0;
  if (!item) {
    return `unknown|${positional}`;
  }
  if (item.type === FeedItemType.UserRecommendations) {
    return `users|${positional}|${item.item.users
      .map((user) => user.fid)
      .join('|')}`;
  }
  if (item.type === FeedItemType.TrendingTopics) {
    return `topics|${positional}|${item.item.topics
      .map((topic) => topic.id)
      .join('|')}`;
  }
  return `unknown|${positional}`;
};

const extractCastFeedItemKey = (item: ApiCastFeedItem) =>
  `${item.id}|${item.cast.recast ? 'true' : 'false'}`;

const extractAssetEventFeedItemKey = (item: ApiAssetEventFeedItem) =>
  `${item.id}|${item.events.length !== 0 ? item.events[0]?.id : 'no-event'}`;

// FlashList item type that captures the cell's dominant content shape.
// Splits casts by their top-level embed kind so text-only (~120px) and
// video (~600px) cells don't share a height-estimation bucket. Quote
// casts are sub-split by inner embed shape since text-only vs. media
// quotes also differ substantially in height.
//
// Memoized via WeakMap so the per-render hot path stays cheap.
const castItemTypeByCast = new WeakMap<ApiCast, string>();

const getMixedFeedItemType = (item: MixedFeedItem | undefined): string => {
  if (!item) {
    return 'unknown';
  }
  switch (item.type) {
    case FeedItemType.Cast: {
      return getCastItemType(item.item.cast);
    }
    case FeedItemType.UserRecommendations:
      return 'user-recommendations';
    case FeedItemType.TrendingTopics:
      return 'trending-topics';
    default:
      return 'unknown';
  }
};

const getCastItemType = (cast: ApiCast): string => {
  const cached = castItemTypeByCast.get(cast);
  if (cached !== undefined) {
    return cached;
  }
  const embeds = cast.embeds;
  let type: string;
  if (embeds?.videos && embeds.videos.length > 0) {
    type = 'cast-video';
  } else if (embeds?.snap && embeds.snap.length > 0) {
    type = 'cast-snap';
  } else if (embeds?.images && embeds.images.length > 0) {
    type =
      embeds.casts && embeds.casts.length > 0
        ? getQuoteSuffix(embeds.casts[0], 'cast-image-quote')
        : 'cast-image';
  } else if (embeds?.casts && embeds.casts.length > 0) {
    type = getQuoteSuffix(embeds.casts[0], 'cast-quote');
  } else if (embeds?.urls && embeds.urls.length > 0) {
    type = 'cast-url';
  } else {
    type = 'cast-text';
  }
  castItemTypeByCast.set(cast, type);
  return type;
};

// Bucket suffix for the inner quoted-cast's dominant embed shape.
// Order matters — checks must run from the *tallest* rendered shape
// down so a quote that contains both a snap and an image still lands
// in the snap bucket. Heights below are approximate rendered heights
// of the quoted-cast embed area only:
//   - video    : ~128 px (carousel thumbnail; tallest visual block)
//   - snap     : ~280–400 px (full SnapEmbedAttachment card)
//   - image    : ~128 px (carousel thumbnail)
//   - text     : ~24–80 px (just the truncated text body)
// Keeping these as separate FlashList item-type buckets avoids recycling a
// short quote cell into a much taller quote cell, or vice versa.
const getQuoteSuffix = (
  quotedCast: ApiQuoteCastEmbed | undefined,
  prefix: string,
): string => {
  const innerEmbeds = quotedCast?.embeds;
  if (innerEmbeds?.videos && innerEmbeds.videos.length > 0) {
    return `${prefix}-v`;
  }
  if (innerEmbeds?.snap && innerEmbeds.snap.length > 0) {
    return `${prefix}-s`;
  }
  if (innerEmbeds?.images && innerEmbeds.images.length > 0) {
    return `${prefix}-i`;
  }
  return `${prefix}-t`;
};

export {
  extractAssetEventFeedItemKey,
  extractCastFeedItemKey,
  extractMixedFeedItemKey,
  getCastItemType,
  getMixedFeedItemType,
};
