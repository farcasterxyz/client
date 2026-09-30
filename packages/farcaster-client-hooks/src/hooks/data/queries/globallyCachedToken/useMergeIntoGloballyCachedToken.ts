import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { ApiTokenLink, shouldUpdateCache } from 'farcaster-client-data';
import merge from 'lodash/merge';
import { useCallback } from 'react';

import {
  GloballyCachedTokenCache,
  MergeIntoGloballyCachedToken,
  TokenUpdates,
} from '../../../../types';
import { buildGloballyCachedTokenKey } from './buildGloballyCachedTokenKey';
import { buildGetGloballyCachedToken } from './useGetGloballyCachedToken';

const buildMergeIntoGloballyCachedToken = (queryClient: QueryClient) => {
  const getCachedToken = buildGetGloballyCachedToken(queryClient);
  return ({ updates }: { updates: TokenUpdates }) => {
    const cacheKey = buildGloballyCachedTokenKey({
      chain: updates.chain,
      ca: updates.ca,
    });

    const cachedToken = getCachedToken({
      chain: updates.chain,
      ca: updates.ca,
    });

    if (shouldUpdateCache({ cache: cachedToken, updates })) {
      queryClient.setQueryData<GloballyCachedTokenCache>(
        cacheKey,
        (prevToken: undefined | ApiTokenLink) => merge({}, prevToken, updates),
      );
    }
  };
};

const useMergeIntoGloballyCachedToken = (): MergeIntoGloballyCachedToken => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ updates }: { updates: TokenUpdates }) => {
      const mergeIntoGloballyCachedToken =
        buildMergeIntoGloballyCachedToken(queryClient);
      return mergeIntoGloballyCachedToken({ updates });
    },
    [queryClient],
  );
};

export { buildMergeIntoGloballyCachedToken, useMergeIntoGloballyCachedToken };
