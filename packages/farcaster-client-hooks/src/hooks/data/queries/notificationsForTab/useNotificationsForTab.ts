import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildNotificationsForTabFetcher } from './buildNotificationsForTabFetcher';
import { buildNotificationsForTabKey } from './buildNotificationsForTabKey';

export const useNotificationsForTab = ({
  tab,
  setLastCheckedTimestamp,
}: {
  tab: string;
  setLastCheckedTimestamp: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  return useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildNotificationsForTabKey({ tab }),
    queryFn: buildNotificationsForTabFetcher({
      apiClient,
      tab,
      batchMergeIntoGloballyCachedCasts,
      setLastCheckedTimestamp,
    }),
    getNextPageParam: getNextPageCursor,
  });
};
