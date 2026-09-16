import { useSuspenseQuery } from '@tanstack/react-query';

import { MILLIS_PER_SECOND } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildChannelSettingsFetcher } from './buildChannelSettingsFetcher';
import { buildChannelSettingsKey } from './buildChannelSettingsKey';

const useChannelSettings = ({ key }: { key: string }) => {
  const { apiClient } = useFarcasterApiClient();
  return useSuspenseQuery({
    queryKey: buildChannelSettingsKey({ key }),

    queryFn: buildChannelSettingsFetcher({
      apiClient,
      key,
    }),

    // Refresh always, just preventing closely spaced calls
    staleTime: MILLIS_PER_SECOND * 2,
  });
};

export { useChannelSettings };
