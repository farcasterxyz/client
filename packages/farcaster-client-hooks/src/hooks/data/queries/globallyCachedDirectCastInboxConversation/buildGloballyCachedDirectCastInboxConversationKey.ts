import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildGloballyCachedDirectCastInboxConversationKey = ({
  conversationId,
}: {
  conversationId?: string;
} = {}) =>
  compactQueryKey([
    'globallyCachedDirectCastInboxConversation',
    conversationId,
  ]) as string[];

export { buildGloballyCachedDirectCastInboxConversationKey };
