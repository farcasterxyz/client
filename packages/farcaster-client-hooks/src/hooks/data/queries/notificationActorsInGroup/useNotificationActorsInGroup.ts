import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { ApiNotificationType, getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser';
import { buildNotificationActorsInGroupFetcher } from './buildNotificationActorsInGroupFetcher';
import { buildNotificationActorsInGroupKey } from './buildNotificationActorsInGroupKey';

const useNotificationActorsInGroup = ({
  groupId,
  type,
}: {
  groupId: string;
  type: ApiNotificationType;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildNotificationActorsInGroupKey({ groupId, type }),

    queryFn: buildNotificationActorsInGroupFetcher({
      apiClient,
      batchMergeIntoGloballyCachedUsers,
      groupId,
      type,
    }),

    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useNotificationActorsInGroup };
