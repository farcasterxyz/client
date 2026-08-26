import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiGetWalletActivityQueryParams } from 'farcaster-client-data';
import React from 'react';

import { MILLIS_PER_SECOND } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletActivityFetcher } from './buildWalletActivityFetcher';
import { buildWalletActivityPreviewKey } from './buildWalletActivityPreviewKey';

const useWalletActivityPreview = ({
  params,
  enabled,
}: {
  params: Omit<ApiGetWalletActivityQueryParams, 'limit'>;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    queryClient.removeQueries({
      queryKey: buildWalletActivityPreviewKey(params),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useQuery({
    queryKey: buildWalletActivityPreviewKey(params),
    queryFn: buildWalletActivityFetcher({
      apiClient,
      params,
    }),
    staleTime: MILLIS_PER_SECOND * 30,
    enabled,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    placeholderData: undefined,
  });
};

export { useWalletActivityPreview };
