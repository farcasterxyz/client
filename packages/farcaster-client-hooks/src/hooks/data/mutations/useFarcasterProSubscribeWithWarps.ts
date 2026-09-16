import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { generateIdempotencyKey } from '../../../utils/AccountingUtils';
import { useOptimisticallyUpdateCurrentUserLevel } from '../optimistic/useOptimisticallyUpdateCurrentUserLevel';
import { useSetUserPreferences } from './useSetUserPreferences';

export const useFarcasterProSubscribeWithWarps = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateCurrentUserLevel =
    useOptimisticallyUpdateCurrentUserLevel();
  const setUserPreferences = useSetUserPreferences(true);

  return useCallback(
    async ({
      subscriptionType,
      warpsAmount,
      durationInDays,
    }: {
      subscriptionType: 'farcaster-pro';
      warpsAmount: number;
      durationInDays: number;
    }) => {
      const idempotencyKey = generateIdempotencyKey();
      const result = await apiClient.farcasterProSubscribeWithWarps({
        subscriptionType,
        durationInDays,
        warpsAmount,
        idempotencyKey,
      });
      optimisticallyUpdateCurrentUserLevel({ level: 'pro' });
      setUserPreferences({
        preferences: {
          showFarcasterProProfileBanner: false,
        },
      });

      return result;
    },
    [apiClient, optimisticallyUpdateCurrentUserLevel, setUserPreferences],
  );
};
