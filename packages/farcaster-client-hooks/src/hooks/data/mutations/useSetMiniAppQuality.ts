import { useMutation } from '@tanstack/react-query';
import { ApiMiniAppQuality } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateFrameBlocklist } from '../queries/frameBlocklist/useInvalidateFrameBlocklist';
import { useInvalidateFrameDetails } from '../queries/frameDetails/useInvalidateFrameDetails';

const useSetMiniAppQuality = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateFrameDetails = useInvalidateFrameDetails();
  const invalidateFrameBlocklist = useInvalidateFrameBlocklist();

  return useMutation({
    mutationFn: async ({
      domain,
      quality,
      reason,
    }: {
      domain: string;
      quality: ApiMiniAppQuality;
      reason: string;
    }) => {
      const response = await apiClient.setMiniAppQuality({
        domain,
        quality,
        reason,
      });
      return response.data;
    },
    onSuccess: (_data, { domain }) => {
      invalidateFrameDetails({ domain });
      invalidateFrameBlocklist();
    },
  });
};

export { useSetMiniAppQuality };
