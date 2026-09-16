import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildPlaintextDirectCastReactionsKey = ({
  fid,
  conversationId,
  messageId,
}: {
  fid: number;
  conversationId: string;
  messageId: string;
}) =>
  compactQueryKey([
    'plaintextDirectCastReactions',
    fid,
    conversationId,
    messageId,
  ]);

export { buildPlaintextDirectCastReactionsKey };
