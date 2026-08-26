import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { ApiAdminFeedOrdering, getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import { buildAdminFeedFetcher } from './buildAdminFeedFetcher';
import { buildAdminFeedKey } from './buildAdminFeedKey';

const useAdminFeed = ({
  type,
  fid,
  minScoreForMediumDistChannels,
  mutedKeywords,
  ordering,
  updateTimestamp,
  demoteViewedCasts,
  spreadOutAuthors,
  includeReplies,
  includeTrendingCasts,
  recastsNumRequired,
  followerLikedCastsMinLikes,
  includeHasReplyByFollowed,
  hasReplyByFollowedMinTotalRepliesEngagement,
  explorationCoefficient,
  bundleMiniApps,
  limit,
}: {
  type?: string;
  fid?: number;
  minScoreForMediumDistChannels?: number;
  mutedKeywords?: string;
  ordering?: ApiAdminFeedOrdering;
  // Used for cache busting
  updateTimestamp?: number;
  demoteViewedCasts?: boolean;
  spreadOutAuthors?: number;
  includeReplies?: boolean;
  includeTrendingCasts?: boolean;
  recastsNumRequired?: number;
  followerLikedCastsMinLikes?: number;
  includeHasReplyByFollowed?: boolean;
  hasReplyByFollowedMinTotalRepliesEngagement?: number;
  explorationCoefficient?: number;
  bundleMiniApps?: boolean;
  limit?: number;
} = {}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchUpdateGloballyCachedCast = useBatchMergeIntoGloballyCachedCasts();

  return useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildAdminFeedKey({
      type,
      fid,
      demoteViewedCasts,
      spreadOutAuthors,
      includeReplies,
      minScoreForMediumDistChannels,
      mutedKeywords,
      includeTrendingCasts,
      recastsNumRequired,
      followerLikedCastsMinLikes,
      includeHasReplyByFollowed,
      hasReplyByFollowedMinTotalRepliesEngagement,
      explorationCoefficient,
      ordering,
      updateTimestamp,
      bundleMiniApps,
    }),
    queryFn: buildAdminFeedFetcher({
      apiClient,
      batchUpdateGloballyCachedCast,
      type,
      fid,
      demoteViewedCasts,
      spreadOutAuthors,
      includeReplies,
      minScoreForMediumDistChannels,
      mutedKeywords,
      includeTrendingCasts,
      recastsNumRequired,
      followerLikedCastsMinLikes,
      includeHasReplyByFollowed,
      hasReplyByFollowedMinTotalRepliesEngagement,
      explorationCoefficient,
      ordering,
      bundleMiniApps,
      limit,
    }),

    getNextPageParam: getNextPageCursor,
  });
};

export { useAdminFeed };
