import { useCallback } from 'react';

import { useNavigate } from '~/hooks/navigation/useNavigate';

const useNavigateToDirectCastsConversation = () => {
  const navigate = useNavigate();

  return useCallback(
    ({ conversationId, text }: { conversationId: string; text?: string }) => {
      return navigate({
        to: 'directCastsConversation',
        params: { conversationId },
        searchParams: { text },
      });
    },
    [navigate],
  );
};

export { useNavigateToDirectCastsConversation };
