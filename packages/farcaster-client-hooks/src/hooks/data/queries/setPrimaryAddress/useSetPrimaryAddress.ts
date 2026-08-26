import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiVerification } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildUserByFidKey } from '../userByFid';
import { buildVerificationsKey } from '../verifications/buildVerificationsKey';

export const useSetPrimaryAddress = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (verification: ApiVerification) => {
      const response = await apiClient.putPrimaryVerification(verification);
      if (response.status !== 200) {
        throw new Error('Failed to set primary address');
      }
      if (response.data.result.success !== true) {
        throw new Error('Failed to set primary address');
      }
      return response.data.result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildVerificationsKey({ fid }),
      });
      queryClient.invalidateQueries({
        queryKey: buildUserByFidKey({ fid }),
      });
    },
  });
};
