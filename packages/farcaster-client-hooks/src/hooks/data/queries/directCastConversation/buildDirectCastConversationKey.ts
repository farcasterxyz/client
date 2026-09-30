import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDirectCastConversationKey = ({
  conversationId,
}: {
  conversationId: string | undefined;
}) => compactQueryKey(['directCastConversation', conversationId]);

export { buildDirectCastConversationKey };
