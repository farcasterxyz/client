import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildInviteWithWarpsOfferingFetcher } from './buildInviteWithWarpsOfferingFetcher';
import { buildInviteWithWarpsOfferingKey } from './buildInviteWithWarpsOfferingKey';

const useInviteWithWarpsOffering = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildInviteWithWarpsOfferingKey(),
    queryFn: buildInviteWithWarpsOfferingFetcher({ apiClient }),
    refetchIntervalInBackground: true,
    refetchInterval: 60000,
  });
};

export { useInviteWithWarpsOffering };
