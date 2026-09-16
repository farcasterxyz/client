import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildSuggestedChannelsKey } from './buildSuggestedChannelsKey';
import { useInvalidateSuggestedChannels } from './useInvalidateSuggestedChannels';
import { useSuggestedChannels } from './useSuggestedChannels';

const useSuggestedChannelsWithRefreshOnMount = () => {
  const initialValue = useSuggestedChannels({});

  const queryKey = useMemo(
    () =>
      buildSuggestedChannelsKey({
        limit: undefined,
        currentChannelKey: undefined,
      }),
    [],
  );

  const invalidateSuggestedChannels = useInvalidateSuggestedChannels();
  const invalidate = useCallback(() => {
    invalidateSuggestedChannels();
  }, [invalidateSuggestedChannels]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useSuggestedChannelsWithRefreshOnMount };
