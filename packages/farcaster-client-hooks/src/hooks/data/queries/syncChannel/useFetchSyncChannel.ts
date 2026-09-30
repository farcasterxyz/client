import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildSyncChannelsFetcher } from './buildSyncChannelFetcher';

const useFetchSyncChannel = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  return useCallback(
    async ({
      base64PublicKey,
      base64Signature,
      channelId,
    }: {
      base64PublicKey: string;
      base64Signature: string;
      channelId: string;
    }) => {
      const response = await buildSyncChannelsFetcher({ apiClient })({
        base64PublicKey,
        base64Signature,
        channelId,
        queryClient,
      });

      return response;
    },
    [apiClient, queryClient],
  );
};

export { useFetchSyncChannel };
