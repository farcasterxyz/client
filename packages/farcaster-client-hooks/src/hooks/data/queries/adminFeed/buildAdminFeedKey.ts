import { ApiAdminFeedOrdering } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildAdminFeedKey = ({
  type,
  fid,
  demoteViewedCasts,
  spreadOutAuthors,
  includeReplies,
  minScoreForMediumDistChannels,
  mutedKeywords,
  includeChannelCastsFromUnfollowedUsers,
  includeTrendingCasts,
  separateTrendingCasts,
  recastsNumRequired,
  followerLikedCastsMinLikes,
  includeHasReplyByFollowed,
  hasReplyByFollowedMinTotalRepliesEngagement,
  explorationCoefficient,
  ordering,
  bundleMiniApps,
  updateTimestamp,
}: {
  type?: string;
  fid?: number;
  demoteViewedCasts?: boolean;
  spreadOutAuthors?: number;
  includeReplies?: boolean;
  minScoreForMediumDistChannels?: number;
  mutedKeywords?: string;
  includeChannelCastsFromUnfollowedUsers?: boolean;
  includeTrendingCasts?: boolean;
  separateTrendingCasts?: boolean;
  recastsNumRequired?: number;
  followerLikedCastsMinLikes?: number;
  includeHasReplyByFollowed?: boolean;
  hasReplyByFollowedMinTotalRepliesEngagement?: number;
  ordering?: ApiAdminFeedOrdering;
  explorationCoefficient?: number;
  bundleMiniApps?: boolean;
  // Used for cache busting
  updateTimestamp?: number;
}) =>
  compactQueryKey([
    'adminFeed',
    type,
    fid,
    demoteViewedCasts,
    spreadOutAuthors,
    includeReplies,
    minScoreForMediumDistChannels,
    mutedKeywords,
    includeChannelCastsFromUnfollowedUsers,
    includeTrendingCasts,
    separateTrendingCasts,
    recastsNumRequired,
    followerLikedCastsMinLikes,
    includeHasReplyByFollowed,
    hasReplyByFollowedMinTotalRepliesEngagement,
    explorationCoefficient,
    ordering,
    bundleMiniApps,
    updateTimestamp,
  ]);

export { buildAdminFeedKey };
