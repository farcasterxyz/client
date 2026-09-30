import { DdRum } from '@datadog/mobile-react-native';
import {
  useFollowersYouKnowWithRefreshOnMount,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import React, { FC, memo, useEffect, useMemo } from 'react';
import { InteractionManager } from 'react-native';

import { Empty } from '~/components/Empty';
import { usePullToRefreshFollowersYouKnow } from '~/hooks/data/usePullToRefreshFollowersYouKnow';
import { useReportErrorOnDuplicateKeys } from '~/hooks/useReportErrorOnDuplicateKeys';

import { FollowList } from './FollowList';

type FollowersYouKnowProps = {
  fid: number;
};

const FollowersYouKnow: FC<FollowersYouKnowProps> = memo(({ fid }) => {
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      DdRum.addViewLoadingTime(true);
    });
  }, []);

  const { data, onEndReached, refetch, hasNextPage } =
    useFollowersYouKnowWithRefreshOnMount({
      fid,
      limit: 20,
    });
  const { refreshControl } = usePullToRefreshFollowersYouKnow({
    fid,
    limit: 20,
    refetch,
  });

  const users = useMemo(
    () => data!.pages.flatMap((page) => page.result.users) || [],
    [data],
  );

  useReportErrorOnDuplicateKeys('FollowResults', users, userKeyExtractor);

  if (users.length === 0) {
    return <Empty justify="start" message={`No followers you know.`} />;
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

FollowersYouKnow.displayName = 'FollowersYouKnow';

export { FollowersYouKnow };
