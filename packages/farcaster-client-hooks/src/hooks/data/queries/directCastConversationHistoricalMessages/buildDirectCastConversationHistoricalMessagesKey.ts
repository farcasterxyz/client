import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDirectCastConversationHistoricalMessagesKey = ({
  conversationId,
  messageId,
}: {
  conversationId: string;
  messageId: string | undefined;
}) =>
  compactQueryKey([
    'directCastConversationHistoricalMessages',
    conversationId,
    messageId,
  ]);

export { buildDirectCastConversationHistoricalMessagesKey };
