import { useQueryClient } from '@tanstack/react-query';
import { ApiGetAuthSessions200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildAuthSessionsKey } from '../queries/authSessions/buildAuthSessionsKey';
import { useInvalidateAuthSessions } from '../queries/authSessions/useInvalidateAuthSessions';

const useRevokeAuthSession = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const invalidateAuthSessions = useInvalidateAuthSessions();

  return useCallback(
    async ({ id }: { id: string }) => {
      // Snapshot current state for rollback on failure
      const previousData =
        queryClient.getQueryData<ApiGetAuthSessions200Response>(
          buildAuthSessionsKey(),
        );

      // Optimistically remove the session immediately so the UI updates at once
      queryClient.setQueryData<ApiGetAuthSessions200Response>(
        buildAuthSessionsKey(),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            result: {
              ...old.result,
              sessions: old.result.sessions.filter((s) => s.id !== id),
            },
          };
        },
      );

      try {
        const { data } = await apiClient.revokeAuthSession({ id });
        // Force a fresh network fetch to confirm server state
        invalidateAuthSessions();
        return data.result;
      } catch (error) {
        // Rollback optimistic update if the request failed
        if (previousData) {
          queryClient.setQueryData(buildAuthSessionsKey(), previousData);
        }
        throw error;
      }
    },
    [apiClient, queryClient, invalidateAuthSessions],
  );
};

export { useRevokeAuthSession };
