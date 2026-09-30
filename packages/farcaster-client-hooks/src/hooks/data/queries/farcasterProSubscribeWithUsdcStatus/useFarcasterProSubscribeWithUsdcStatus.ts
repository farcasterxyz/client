import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useSetUserPreferences } from '../../mutations/useSetUserPreferences';
import { useOptimisticallyUpdateCurrentUserLevel } from '../../optimistic/useOptimisticallyUpdateCurrentUserLevel';
import { buildFarcasterProSubscribeWithUsdcStatusFetcher } from './buildFarcasterProSubscribeWithUsdcStatusFetcher';
import { buildFarcasterProSubscribeWithUsdcStatusKey } from './buildFarcasterProSubscribeWithUsdcStatusKey';

const useFarcasterProSubscribeWithUsdcStatus = ({
  workflowId,
  enabled = true,
}: {
  workflowId: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateCurrentUserLevel =
    useOptimisticallyUpdateCurrentUserLevel();
  const setUserPreferences = useSetUserPreferences(true);
  const result = useQuery({
    queryKey: buildFarcasterProSubscribeWithUsdcStatusKey({ workflowId }),
    queryFn: buildFarcasterProSubscribeWithUsdcStatusFetcher({
      workflowId,
      apiClient,
    }),
    refetchIntervalInBackground: true,
    refetchInterval: 10000,
    staleTime: 0,
    gcTime: 0,
    enabled,
  });

  if (result.data?.state === 'completed') {
    optimisticallyUpdateCurrentUserLevel({ level: 'pro' });
    setUserPreferences({
      preferences: {
        showFarcasterProProfileBanner: false,
      },
    });
  }

  return result.data?.state;
};

export { useFarcasterProSubscribeWithUsdcStatus };
