import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildDiscoverChannelsKey } from './buildDiscoverChannelsKey';
import { useDiscoverChannels } from './useDiscoverChannels';
import { useInvalidateDiscoverChannels } from './useInvalidateDiscoverChannels';

const useDiscoverChannelsWithRefreshOnMount = () => {
  const initialValue = useDiscoverChannels();

  const queryKey = useMemo(() => buildDiscoverChannelsKey(), []);

  const invalidateDiscoverChannels = useInvalidateDiscoverChannels();
  const invalidate = useCallback(() => {
    invalidateDiscoverChannels();
  }, [invalidateDiscoverChannels]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useDiscoverChannelsWithRefreshOnMount };
