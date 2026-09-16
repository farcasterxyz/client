import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ApiGetPrimaryAddress200Response,
  ApiVerification,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildPrimaryAddressKey } from '../primaryAddress/buildPrimaryAddressKey';
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
    onSuccess: (_result, verification) => {
      queryClient.invalidateQueries({
        queryKey: buildVerificationsKey({ fid }),
      });
      queryClient.invalidateQueries({
        queryKey: buildUserByFidKey({ fid }),
      });
      // This is the key senders read to decide where a payment goes, and on
      // mobile it is persisted to disk with a 14-day gcTime. Invalidation alone
      // marks it stale but keeps serving the old address until the background
      // refetch lands, so Pay opened in that window can still route to the
      // previous address. The primaryAddress query only tracks the Ethereum
      // primary, so write the new value synchronously before invalidating.
      if (verification.protocol === 'ethereum') {
        queryClient.setQueryData<ApiGetPrimaryAddress200Response['result']>(
          buildPrimaryAddressKey({ fid }),
          { address: verification.address },
        );
      }
      queryClient.invalidateQueries({
        queryKey: buildPrimaryAddressKey({ fid }),
      });
    },
  });
};
