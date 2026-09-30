import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildConversationCastRepliesKey = ({
  focusedCastHash,
  parentCastHash,
  page,
}: {
  focusedCastHash: string;
  parentCastHash?: string;
  page?: number;
}) =>
  compactQueryKey([
    'conversationCastReplies',
    focusedCastHash,
    parentCastHash,
    page,
  ]);
