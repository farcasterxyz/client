import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDirectCastConversationRecentMessagesKey = ({
  conversationId,
}: {
  conversationId: string;
}) => compactQueryKey(['directCastConversationRecentMessages', conversationId]);

export { buildDirectCastConversationRecentMessagesKey };
