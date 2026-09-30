import {
  useFarcasterApiClient,
  useInvalidateUser,
  useInvalidateUserByFid,
  useInvalidateUserByUsername,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

type SetNeynarScoreOverrideRequestBody = {
  fid: number;
  score: number;
  reason: string;
};

type SetNeynarScoreOverrideResponse = {
  result: {
    success: boolean;
  };
};

type PrivatePutApiClient = {
  put<T>(
    relativeUrl: string,
    options: {
      body: unknown;
      endpointName: string;
      headers?: Record<string, string>;
      retryLimit?: number;
      timeout?: number;
    },
  ): Promise<{
    data: T;
    status: number;
  }>;
};

const useSetNeynarScoreOverride = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateUser = useInvalidateUser();
  const invalidateUserByFid = useInvalidateUserByFid();
  const invalidateUserByUsername = useInvalidateUserByUsername();

  return useCallback(
    async ({
      fid,
      username,
      score,
      reason,
    }: SetNeynarScoreOverrideRequestBody & {
      username?: string;
    }) => {
      // Temporary direct call until the backend schema sync adds a generated client method.
      const response = await (
        apiClient as unknown as PrivatePutApiClient
      ).put<SetNeynarScoreOverrideResponse>('/v2/set-neynar-score-override', {
        endpointName: 'setNeynarScoreOverride',
        body: {
          fid,
          score,
          reason,
        },
      });

      if (!response.data.result.success) {
        throw new Error('Failed to set Neynar score override');
      }

      // Delay due to replication lag on profile reads.
      setTimeout(() => {
        invalidateUserByFid({ fid });
        invalidateUser({ fid });
        invalidateUser({ fid, isCurrentUser: true });
        if (username) {
          invalidateUserByUsername({ username });
        }
      }, 500);

      return response.data;
    },
    [apiClient, invalidateUser, invalidateUserByFid, invalidateUserByUsername],
  );
};

export { useSetNeynarScoreOverride };
