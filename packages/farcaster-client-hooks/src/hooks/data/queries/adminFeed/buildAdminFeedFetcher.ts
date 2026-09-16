import {
  ApiAdminFeedOrdering,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedCasts } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildAdminFeedFetcher = ({
  apiClient,
  batchUpdateGloballyCachedCast,
  type,
  fid,
  demoteViewedCasts,
  spreadOutAuthors,
  includeReplies,
  mutedKeywords,
  includeTrendingCasts,
  recastsNumRequired,
  followerLikedCastsMinLikes,
  includeHasReplyByFollowed,
  hasReplyByFollowedMinTotalRepliesEngagement,
  explorationCoefficient,
  ordering,
  bundleMiniApps,
  limit = 15,
}: {
  apiClient: FarcasterApiClient;
  batchUpdateGloballyCachedCast: BatchMergeIntoGloballyCachedCasts;
  type?: string;
  fid?: number;
  demoteViewedCasts?: boolean;
  spreadOutAuthors?: number;
  includeReplies?: boolean;
  minScoreForMediumDistChannels?: number;
  mutedKeywords?: string;
  includeTrendingCasts?: boolean;
  recastsNumRequired?: number;
  followerLikedCastsMinLikes?: number;
  includeHasReplyByFollowed?: boolean;
  hasReplyByFollowedMinTotalRepliesEngagement?: number;
  explorationCoefficient?: number;
  ordering?: ApiAdminFeedOrdering;
  bundleMiniApps?: boolean;
  limit?: number;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getAdminFeed({
      cursor,
      limit,
      type,
      fid,
      demoteViewedCasts,
      spreadOutAuthors,
      includeReplies,
      mutedKeywords,
      includeTrendingCasts,
      recastsNumRequired,
      followerLikedCastsMinLikes,
      includeHasReplyByFollowed,
      hasReplyByFollowedMinTotalRepliesEngagement,
      explorationCoefficient,
      ordering,
      bundleMiniApps,
    });

    batchUpdateGloballyCachedCast({
      batchUpdates: response.data.result.feed.flatMap(({ cast }) => cast),
    });

    return response.data;
  });

export { buildAdminFeedFetcher };
