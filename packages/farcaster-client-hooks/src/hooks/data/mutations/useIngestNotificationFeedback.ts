import { useQueryClient } from '@tanstack/react-query';
import {
  ApiNotificationFeedbackType,
  ApiNotificationType,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildFrameDetailsKey } from '../queries/frameDetails/buildFrameDetailsKey';

const useIngestNotificationFeedback = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  return useCallback(
    async ({
      notificationType,
      feedbackType,
      domain,
    }: {
      notificationType: ApiNotificationType;
      feedbackType: ApiNotificationFeedbackType;
      domain?: string;
    }) => {
      const result = await apiClient.ingestNotificationFeedback({
        notificationType,
        feedbackType,
        domain,
      });
      if (domain) {
        await queryClient.invalidateQueries({
          queryKey: buildFrameDetailsKey({ domain }),
        });
      }
      return result;
    },
    [apiClient, queryClient],
  );
};

export { useIngestNotificationFeedback };
