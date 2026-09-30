import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useUpdateDirectCastConversation } from '../queries/directCastConversation/useUpdateDirectCastConversation';

const useUpdateDirectCastGroupPreferences = () => {
  const { apiClient } = useFarcasterApiClient();

  const optimisticallyUpdateDirectCastConversation =
    useUpdateDirectCastConversation();

  return useCallback(
    async ({
      conversationId,
      membersCanInvite,
      periodicallyValidateMemberships,
    }: {
      conversationId: string;
      membersCanInvite: boolean;
      periodicallyValidateMemberships: boolean;
    }) => {
      optimisticallyUpdateDirectCastConversation({
        updates: {
          conversationId: conversationId,
          groupPreferences: {
            membersCanInvite: membersCanInvite,
            periodicallyValidateMemberships: periodicallyValidateMemberships,
          },
        },
      });

      const { data } = await apiClient.updateDirectCastGroupPreferences({
        conversationId,
        membersCanInvite,
        periodicallyValidateMemberships,
      });

      return data;
    },
    [apiClient, optimisticallyUpdateDirectCastConversation],
  );
};

export { useUpdateDirectCastGroupPreferences };
