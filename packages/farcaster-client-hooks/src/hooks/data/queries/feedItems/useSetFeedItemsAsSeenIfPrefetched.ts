import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { ApiGetFeedItems200Response } from 'farcaster-client-data';
import { useMemo, useRef } from 'react';

import { useSetFeedSeen } from '../../mutations/useSetFeedSeen';
import { buildFeedItemsKey } from './buildFeedItemsKey';

export const useSetFeedItemsAsSeenIfPrefetched = ({
  feedKey,
  feedType,
}: {
  feedKey: string;
  feedType: string;
}) => {
  const setFeedSeen = useSetFeedSeen();
  const queryClient = useQueryClient();
  const cacheKey = buildFeedItemsKey({ feedKey, feedType });
  const actioned = useRef(false);

  const data = queryClient.getQueryData<
    InfiniteData<ApiGetFeedItems200Response> | undefined
  >(cacheKey);

  const [latestMainCastTimestamp, feedTopSeenAtTimestamp] = useMemo(() => {
    const page0Result = data?.pages?.[0]?.result;
    return [
      page0Result?.latestMainCastTimestamp || 0,
      page0Result?.feedTopSeenAtTimestamp || 0,
    ];
  }, [data]);

  const fetchedWithSetSeen = useMemo(() => {
    const query = queryClient.getQueryCache().find({
      queryKey: cacheKey,
    });
    // Default to false, meaning we'll call setFeedSeen in case we don't
    // know how the data was fetched
    return query?.options.meta?.updateState || false;
  }, [cacheKey, queryClient]);

  if (!actioned.current && !fetchedWithSetSeen) {
    setFeedSeen({
      feedKey,
      feedType,
      latestItemTimestamp: latestMainCastTimestamp,
      accessTimestamp: feedTopSeenAtTimestamp,
    });
    actioned.current = true;
  }
};
