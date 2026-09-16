import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDirectCastConversationMessagesKey = ({
  conversationId,
  messageId,
}: {
  conversationId: string;
  messageId: string | undefined;
}) =>
  compactQueryKey([
    'directCastConversationMessages',
    conversationId,
    messageId,
  ]);

export { buildDirectCastConversationMessagesKey };
