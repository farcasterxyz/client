import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildPlaintextDirectCastReactionsFetcher } from './buildPlaintextDirectCastReactionsFetcher';
import { buildPlaintextDirectCastReactionsKey } from './buildPlaintextDirectCastReactionsKey';

const usePlaintextDirectCastReactions = ({
  fid,
  conversationId,
  messageId,
}: {
  fid: number;
  conversationId: string;
  messageId: string;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildPlaintextDirectCastReactionsKey({
      fid,
      conversationId,
      messageId,
    }),

    queryFn: buildPlaintextDirectCastReactionsFetcher({
      apiClient,
      conversationId,
      messageId,
    }),

    getNextPageParam: getNextPageCursor,
  });
};

export { usePlaintextDirectCastReactions };
