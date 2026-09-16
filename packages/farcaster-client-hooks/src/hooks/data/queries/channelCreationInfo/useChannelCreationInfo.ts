import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildChannelCreationInfoFetcher } from './buildChannelCreationInfoFetcher';
import { buildChannelCreationInfoKey } from './buildChannelCreationInfoKey';

const useChannelCreationInfo = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildChannelCreationInfoKey(),

    queryFn: buildChannelCreationInfoFetcher({
      apiClient,
    }),

    staleTime: 0,
  });
};

export { useChannelCreationInfo };
