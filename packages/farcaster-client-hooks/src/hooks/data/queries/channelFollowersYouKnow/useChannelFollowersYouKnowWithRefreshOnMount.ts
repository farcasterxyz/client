import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildChannelFollowersYouKnowKey } from './buildChannelFollowersYouKnowKey';
import { useChannelFollowersYouKnow } from './useChannelFollowersYouKnow';
import { useInvalidateChannelFollowersYouKnow } from './useInvalidateChannelFollowersYouKnow';

const useChannelFollowersYouKnowWithRefreshOnMount = ({
  channelKey,
  limit,
}: {
  channelKey: string;
  limit: number;
}) => {
  const initialValue = useChannelFollowersYouKnow({ channelKey, limit });

  const queryKey = useMemo(
    () => buildChannelFollowersYouKnowKey({ channelKey, limit }),
    [channelKey, limit],
  );

  const invalidateChannelFollowersYouKnow =
    useInvalidateChannelFollowersYouKnow();
  const invalidate = useCallback(() => {
    invalidateChannelFollowersYouKnow({ channelKey, limit });
  }, [channelKey, limit, invalidateChannelFollowersYouKnow]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useChannelFollowersYouKnowWithRefreshOnMount };
