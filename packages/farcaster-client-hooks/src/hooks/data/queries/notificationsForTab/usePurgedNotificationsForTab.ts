import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useOnEndReached,
  usePurgedInfiniteQuery,
} from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildNotificationsForTabFetcher } from './buildNotificationsForTabFetcher';
import { buildNotificationsForTabKey } from './buildNotificationsForTabKey';

export const usePurgedNotificationsForTab = ({
  tab,
  wasPopped,
}: {
  tab: string;
  wasPopped: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = usePurgedInfiniteQuery(
    buildNotificationsForTabKey({ tab }),
    buildNotificationsForTabFetcher({
      apiClient,
      tab,
      setLastCheckedTimestamp: true,
      batchMergeIntoGloballyCachedCasts,
    }),
    {
      initialPageParam: undefined,
      getNextPageParam: getNextPageCursor,
    },
    !wasPopped,
  );

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};
