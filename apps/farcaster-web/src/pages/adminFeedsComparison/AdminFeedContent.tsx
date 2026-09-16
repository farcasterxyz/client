import cn from 'classnames';
import { useAdminFeed } from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React, { useEffect, useMemo } from 'react';

import { Cast } from '~/components/casts/Cast';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { ApiCastWithContext } from '~/types';
import { buildCastsWithContext } from '~/utils/castUtils';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';
import { toast } from '~/utils/toast';

import { AdminFeedConfig } from './AdminFeedConfigPanel';

interface AdminFeedCast {
  cast: ApiCastWithContext;
  itemIndex: number;
  castIndex: number;
  otherItemIndex: number;
  otherCastIndex: number;
}

function compareFeeds(
  casts: ApiCastWithContext[],
  otherCasts: ApiCastWithContext[],
): AdminFeedCast[] {
  const adminFeedCasts: AdminFeedCast[] = [];
  let itemIndex = -1;
  for (let i = 0; i < casts.length; i++) {
    const cast = casts[i];

    let otherItemIndex = -1;
    let otherCastIndex = -1;

    let otherItemIndexIter = -1;
    let otherCastIndexIter = -1;
    for (let j = 0; j < otherCasts.length; j++) {
      const otherCast = otherCasts[j];

      otherCastIndexIter += 1;
      if (
        otherCast.context.threadPosition === 'start' ||
        otherCast.context.threadPosition === 'start_and_end'
      ) {
        otherItemIndexIter += 1;
      }

      if (otherCast.cast.hash === cast.cast.hash) {
        otherItemIndex = otherItemIndexIter;
        otherCastIndex = otherCastIndexIter;
        break;
      }
    }

    if (
      cast.context.threadPosition === 'start' ||
      cast.context.threadPosition === 'start_and_end'
    ) {
      itemIndex += 1;
    }

    adminFeedCasts.push({
      cast,
      itemIndex,
      castIndex: i,
      otherItemIndex,
      otherCastIndex,
    });
  }
  return adminFeedCasts;
}

interface AdminFeedComparisonContentProps {
  leftConfig: AdminFeedConfig;
  rightConfig: AdminFeedConfig;
  setLeftRefetch: (refetch: () => void) => void;
  setLeftIsLoading: (isLoading: boolean) => void;
  setRightRefetch: (refetch: () => void) => void;
  setRightIsLoading: (isLoading: boolean) => void;
}

const AdminFeedComparisonContent: React.FC<AdminFeedComparisonContentProps> = ({
  leftConfig,
  rightConfig,
  setLeftRefetch,
  setLeftIsLoading,
  setRightRefetch,
  setRightIsLoading,
}) => {
  const {
    data: leftData,
    refetch: leftRefetch,
    isFetching: leftIsLoading,
  } = useAdminFeed({
    type: leftConfig.type,
    fid: leftConfig.fid,
    minScoreForMediumDistChannels: leftConfig.minScoreForMediumDistChannels,
    mutedKeywords: leftConfig.mutedKeywords,
    ordering: leftConfig.ordering,
    updateTimestamp: Math.max(
      leftConfig.updateTimestamp,
      rightConfig.updateTimestamp,
    ),
    demoteViewedCasts: leftConfig.demoteViewedCasts,
    spreadOutAuthors: leftConfig.spreadOutAuthors,
    includeReplies: leftConfig.includeReplies,
    includeTrendingCasts: leftConfig.includeTrendingCasts,
    recastsNumRequired: leftConfig.recastsNumRequired,
    followerLikedCastsMinLikes: leftConfig.followerLikedCastsMinLikes,
    includeHasReplyByFollowed: leftConfig.includeHasReplyByFollowed,
    hasReplyByFollowedMinTotalRepliesEngagement:
      leftConfig.hasReplyByFollowedMinTotalRepliesEngagement,
    explorationCoefficient: leftConfig.exploreCoefficient,
    bundleMiniApps: leftConfig.bundleMiniApps,
    limit: 300,
  });

  const {
    data: rightData,
    refetch: rightRefetch,
    isFetching: rightIsLoading,
  } = useAdminFeed({
    type: rightConfig.type,
    fid: rightConfig.fid,
    minScoreForMediumDistChannels: rightConfig.minScoreForMediumDistChannels,
    mutedKeywords: rightConfig.mutedKeywords,
    ordering: rightConfig.ordering,
    updateTimestamp: Math.max(
      leftConfig.updateTimestamp,
      rightConfig.updateTimestamp,
    ),
    demoteViewedCasts: rightConfig.demoteViewedCasts,
    spreadOutAuthors: rightConfig.spreadOutAuthors,
    includeReplies: rightConfig.includeReplies,
    includeTrendingCasts: rightConfig.includeTrendingCasts,
    recastsNumRequired: rightConfig.recastsNumRequired,
    followerLikedCastsMinLikes: rightConfig.followerLikedCastsMinLikes,
    includeHasReplyByFollowed: rightConfig.includeHasReplyByFollowed,
    hasReplyByFollowedMinTotalRepliesEngagement:
      rightConfig.hasReplyByFollowedMinTotalRepliesEngagement,
    explorationCoefficient: rightConfig.exploreCoefficient,
    bundleMiniApps: rightConfig.bundleMiniApps,
    limit: 300,
  });

  useEffect(() => {
    setLeftRefetch(leftRefetch);
  }, [leftRefetch, setLeftRefetch]);

  useEffect(() => {
    setLeftIsLoading(leftIsLoading);
  }, [leftIsLoading, setLeftIsLoading]);

  useEffect(() => {
    setRightRefetch(rightRefetch);
  }, [rightRefetch, setRightRefetch]);

  useEffect(() => {
    setRightIsLoading(rightIsLoading);
  }, [rightIsLoading, setRightIsLoading]);

  const leftCastsWithContext = useMemo(
    () =>
      uniqBy(
        buildCastsWithContext(
          leftData!.pages.flatMap((page) => page.result.feed),
        ),
        castWithContextKeyExtractor,
      ),
    [leftData],
  );

  const rightCastsWithContext = useMemo(
    () =>
      uniqBy(
        buildCastsWithContext(
          rightData!.pages.flatMap((page) => page.result.feed),
        ),
        castWithContextKeyExtractor,
      ),
    [rightData],
  );

  const leftCasts = useMemo(
    () => compareFeeds(leftCastsWithContext, rightCastsWithContext),
    [leftCastsWithContext, rightCastsWithContext],
  );
  const rightCasts = useMemo(
    () => compareFeeds(rightCastsWithContext, leftCastsWithContext),
    [leftCastsWithContext, rightCastsWithContext],
  );

  const leftDescription = useMemo(
    () => leftData?.pages[0].result.description || '',
    [leftData?.pages],
  );
  const rightDescription = useMemo(
    () => rightData?.pages[0].result.description || '',
    [rightData?.pages],
  );

  return (
    <div className="flex h-full flex-row">
      <div className="flex h-full w-1/2 flex-col border-r border-default">
        <AdminFeed casts={leftCasts} description={leftDescription} />
      </div>
      <div className="flex h-full w-1/2 flex-col">
        <AdminFeed casts={rightCasts} description={rightDescription} />
      </div>
    </div>
  );
};

AdminFeedComparisonContent.displayName = 'AdminFeedContent';

interface AdminFeedProps {
  casts: AdminFeedCast[];
  description: string;
}

const AdminFeed: React.FC<AdminFeedProps> = ({ casts, description }) => {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 border-b p-1 text-center text-sm text-muted border-default">
        {description}
      </div>
      <FlatList
        data={casts}
        emptyView={<DefaultEmptyListView message="No casts in this feed! 😮" />}
        renderItem={renderItem}
        keyExtractor={(adminCast) => adminCast.cast.cast.hash}
      />
    </div>
  );
};

const renderItem = ({ item }: { item: AdminFeedCast }) => {
  let color = '#444444';
  let label = 'Same';
  if (item.otherCastIndex < 0) {
    color = '#00A000';
    label = 'Added';
  } else if (item.itemIndex < item.otherItemIndex) {
    color = '#0000C0';
    label = `Higher (from ${item.otherItemIndex + 1})`;
  } else if (item.itemIndex > item.otherItemIndex) {
    color = '#C07000';
    label = `Lower (from ${item.otherItemIndex + 1})`;
  }

  return (
    <div className={cn('relative')}>
      <Cast castWithContext={item.cast} />
      <div
        className="absolute top-0 cursor-pointer flex-col px-3 py-1 text-sm text-light"
        style={{
          right: 44,
          top: 5,
          backgroundColor: color,
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.writeText(item.cast.cast.hash);
          toast({
            message: 'Cast hash copied',
            toastId: 'admin-feed-toast',
          });
        }}
      >
        <div>
          {`${item.itemIndex + 1}: `}
          {label}
          {item.cast.context.itemTimestamp
            ? `, ts: ${item.cast.context.itemTimestamp / 1000}`
            : ''}
          {`, score: ${item.cast.context.score !== undefined ? item.cast.context.score.toFixed(3) : 'und'},`}
        </div>
        <div>
          {`reason: ${item.cast.context.includeReason?.type}`}
          {`, ${item.cast.cast.hash.slice(0, 10)}`}
        </div>
      </div>
    </div>
  );
};

AdminFeed.displayName = 'AdminFeedContent';

export { AdminFeed, type AdminFeedCast, AdminFeedComparisonContent };
