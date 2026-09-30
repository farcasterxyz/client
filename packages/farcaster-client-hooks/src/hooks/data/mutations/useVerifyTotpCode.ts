import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiGetTotpEnabled200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useTrackEvent } from '../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildTotpEnabledKey } from '../queries/totpEnabled/buildTotpEnabledKey';
import { StepUpAuthParams, useStepUpAuth } from './useStepUpAuth';

const useVerifyTotpCode = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const { trackEvent } = useTrackEvent();
  const { stepUpAuthOrThrow } = useStepUpAuth();

  return useCallback(
    async ({
      code,
      stepUpParams,
      email,
      firstTimeVerification = false,
    }: {
      code: string;
      stepUpParams: StepUpAuthParams;
      email?: string;
      firstTimeVerification?: boolean;
    }) => {
      await stepUpAuthOrThrow(stepUpParams);

      if (email) {
        const response = await apiClient.verifyTotpCodeForEmail({
          code,
          email,
        });
        return response.data.result.success;
      } else {
        const response = await apiClient.verifyTotpCode({
          code,
          markAsVerified: firstTimeVerification,
        });

        if (response.data.result.success) {
          void queryClient.setQueryData<ApiGetTotpEnabled200Response>(
            buildTotpEnabledKey(),
            () => {
              return {
                result: {
                  enabled: true,
                },
              };
            },
          );

          trackEvent(AnalyticsEvent.EnableAdvancedProtection, {});
        }

        return response.data.result.success;
      }
    },
    [apiClient, queryClient, trackEvent, stepUpAuthOrThrow],
  );
};

export { useVerifyTotpCode };
