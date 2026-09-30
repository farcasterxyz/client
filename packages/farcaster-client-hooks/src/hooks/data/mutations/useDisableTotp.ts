import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiGetTotpEnabled200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildTotpEnabledKey } from '../queries/totpEnabled/buildTotpEnabledKey';
import { StepUpAuthParams, useStepUpAuth } from './useStepUpAuth';

const useDisableTotp = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const { trackEvent } = useTrackEvent();
  const { stepUpAuthOrThrow } = useStepUpAuth();

  return useCallback(
    async (params: StepUpAuthParams) => {
      // Temporarily step up privileges
      await stepUpAuthOrThrow(params);

      const response = await apiClient.disableTotp();
      void queryClient.setQueryData<ApiGetTotpEnabled200Response>(
        buildTotpEnabledKey(),
        () => {
          return {
            result: {
              enabled: false,
            },
          };
        },
      );

      trackEvent(AnalyticsEvent.DisableAdvancedProtection, {});

      return response.data.result.success;
    },
    [apiClient, queryClient, trackEvent, stepUpAuthOrThrow],
  );
};

export { useDisableTotp };
