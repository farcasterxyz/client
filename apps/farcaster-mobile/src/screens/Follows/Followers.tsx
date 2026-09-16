import {
  useFollowersWithRefreshOnMount,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import React, { FC, memo, useMemo } from 'react';

import { Empty } from '~/components/Empty';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePullToRefreshFollowers } from '~/hooks/data/usePullToRefreshFollowers';
import { useReportErrorOnDuplicateKeys } from '~/hooks/useReportErrorOnDuplicateKeys';

import { FollowList } from './FollowList';

type FollowersProps = {
  fid: number;
};

const Followers: FC<FollowersProps> = memo(({ fid }) => {
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  const { data, onEndReached, refetch, hasNextPage } =
    useFollowersWithRefreshOnMount({
      fid,
    });
  const { refreshControl } = usePullToRefreshFollowers({ fid, refetch });

  const users = useMemo(
    () => data?.pages.flatMap((page) => page.result.users) || [],
    [data],
  );

  useReportErrorOnDuplicateKeys('FollowResults', users, userKeyExtractor);

  if (!users || users.length === 0) {
    return (
      <Empty
        justify="start"
        message={(() => {
          return fid === currentUserFid
            ? "You don't have any followers yet."
            : "This user doesn't have any followers yet.";
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
    />
  );
});

Followers.displayName = 'Followers';

export { Followers };
