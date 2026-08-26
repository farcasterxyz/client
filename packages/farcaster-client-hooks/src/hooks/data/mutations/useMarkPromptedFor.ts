import { useQueryClient } from '@tanstack/react-query';
import { ApiUserAppContext, ApiUserAppPromptType } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildUserAppContextKey } from '../queries/userAppContext/buildUserAppContextKey';

const useMarkPromptedFor = () => {
  const { apiClient } = useFarcasterApiClient();

  const queryClient = useQueryClient();

  return useCallback(
    async ({ promptType }: { promptType: ApiUserAppPromptType }) => {
      const response = apiClient.markPromptedFor({ promptType });

      queryClient.setQueryData<ApiUserAppContext>(
        buildUserAppContextKey(),
        (data) => {
          if (typeof data === 'undefined') {
            return data;
          }

          const filteredPrompts = data.prompts.filter(
            (prompt) => prompt !== promptType,
          );

          return { ...data, prompts: filteredPrompts };
        },
      );

      return response;
    },
    [apiClient, queryClient],
  );
};

export { useMarkPromptedFor };
