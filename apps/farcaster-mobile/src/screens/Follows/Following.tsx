import {
  useFollowingWithRefreshOnMount,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import React, { FC, memo, useMemo } from 'react';
import { View } from 'react-native';

import { Empty } from '~/components/Empty';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePullToRefreshFollowing } from '~/hooks/data/usePullToRefreshFollowing';
import { useReportErrorOnDuplicateKeys } from '~/hooks/useReportErrorOnDuplicateKeys';

import { FollowList } from './FollowList';
import { LeastInteractedWithFollowingSummary } from './LeastInteractedWithFollowingSummary';

type FollowingProps = {
  fid: number;
};

const Following: FC<FollowingProps> = memo(({ fid }) => {
  const t = useTheme();

  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  const { data, onEndReached, refetch, hasNextPage } =
    useFollowingWithRefreshOnMount({
      fid,
    });
  const { refreshControl } = usePullToRefreshFollowing({ fid, refetch });

  const users = useMemo(
    () => data?.pages.flatMap((page) => page.result.users) || [],
    [data],
  );

  const FollowingHeaderComponent = useMemo(() => {
    if (fid !== currentUserFid) {
      return null;
    }

    const shouldShowLeastInteractedWith =
      typeof data?.pages[0].result.leastInteractedWith !== 'undefined';

    if (!shouldShowLeastInteractedWith) {
      return null;
    }

    return (
      <View style={[t.flex, t.flexCol]}>
        {shouldShowLeastInteractedWith && (
          <LeastInteractedWithFollowingSummary
            summary={data.pages[0].result.leastInteractedWith}
          />
        )}
      </View>
    );
  }, [currentUserFid, data?.pages, fid, t.flex, t.flexCol]);

  useReportErrorOnDuplicateKeys('FollowResults', users, userKeyExtractor);

  if (!users || users.length === 0) {
    return (
      <Empty
        justify="start"
        message={(() => {
          return fid === currentUserFid
            ? "You aren't following anyone yet."
            : "This user isn't following anyone yet.";
        })()}
      />
    );
  }

  return (
    <FollowList
      onEndReached={onEndReached}
      refreshControl={refreshControl}
      users={users}
      hasNextPage={hasNextPage}
      HeaderComponent={FollowingHeaderComponent}
    />
  );
});

Following.displayName = 'Following';

export { Following };
