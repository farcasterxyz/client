import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDirectCastConversationRecentMessagesFetcher } from './buildDirectCastConversationRecentMessagesFetcher';
import { buildDirectCastConversationRecentMessagesKey } from './buildDirectCastConversationRecentMessagesKey';
import { directCastConversationRecentMessagesDefaultQueryOptions } from './directCastConversationRecentMessagesDefaultQueryOptions';

const useDirectCastConversationRecentMessages = ({
  conversationId,
}: {
  conversationId: string;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    ...directCastConversationRecentMessagesDefaultQueryOptions,
    queryKey: buildDirectCastConversationRecentMessagesKey({
      conversationId: conversationId,
    }),

    queryFn: buildDirectCastConversationRecentMessagesFetcher({
      apiClient,
      conversationId: conversationId,
    }),

    throwOnError: false,
  });
};

export { useDirectCastConversationRecentMessages };
