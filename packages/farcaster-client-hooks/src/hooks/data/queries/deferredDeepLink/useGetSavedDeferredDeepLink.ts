import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDeferredDeepLinkFetcher } from './buildDeferredDeepLinkFetcher';
import { buildDeferredDeepLinkKey } from './buildDeferredDeepLinkKey';

const useGetSavedDeferredDeepLink = ({
  platform,
  platformVersion,
  deviceName,
  enabled = true,
}: {
  platform: string;
  platformVersion: string;
  deviceName: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildDeferredDeepLinkKey(),
    queryFn: () =>
      buildDeferredDeepLinkFetcher({ apiClient })({
        platform,
        platformVersion,
        deviceName,
      }),
    enabled,
  });
};

export { useGetSavedDeferredDeepLink };
