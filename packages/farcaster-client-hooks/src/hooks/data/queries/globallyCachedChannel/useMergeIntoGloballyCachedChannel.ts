import { useQueryClient } from '@tanstack/react-query';
import { ApiChannel, shouldUpdateCache } from 'farcaster-client-data';
import merge from 'lodash/merge';
import { useCallback } from 'react';

import {
  ChannelUpdates,
  GloballyCachedChannelCache,
  MergeIntoGloballyCachedChannel,
} from '../../../../types';
import { buildGloballyCachedChannelKey } from './buildGloballyCachedChannelKey';
import { useGetGloballyCachedChannel } from './useGetGloballyCachedChannel';

const useMergeIntoGloballyCachedChannel =
  (): MergeIntoGloballyCachedChannel => {
    const queryClient = useQueryClient();
    const getCachedChannel = useGetGloballyCachedChannel();

    return useCallback(
      ({ updates }: { updates: ChannelUpdates }) => {
        const cacheKey = buildGloballyCachedChannelKey({
          key: updates.key,
        });

        const cachedChannel = getCachedChannel({
          key: updates.key,
        });

        if (shouldUpdateCache({ cache: cachedChannel, updates })) {
          queryClient.setQueryData<GloballyCachedChannelCache>(
            cacheKey,
            (prevFeed: undefined | ApiChannel) => merge({}, prevFeed, updates),
          );
        }
      },
      [getCachedChannel, queryClient],
    );
  };

export { useMergeIntoGloballyCachedChannel };
