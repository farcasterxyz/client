import { useQueryClient } from '@tanstack/react-query';
import { ApiChain, ApiTokenEmbedFeedType } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildTokenFeedKey } from './buildTokenFeedKey';

const useInvalidateTokenFeed = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      chain,
      ca,
      feedType,
    }: {
      chain: ApiChain;
      ca?: string;
      feedType?: ApiTokenEmbedFeedType;
    }) => {
      return queryClient.invalidateQueries({
        queryKey: buildTokenFeedKey({ chain, ca, feedType }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateTokenFeed };
