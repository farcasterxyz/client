import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDirectCastGroupInvitesFetcher } from './buildDirectCastGroupInvitesFetcher';
import { buildDirectCastGroupInvitesKey } from './buildDirectCastGroupInvitesKey';

const useGetDirectCastGroupInvites = ({
  conversationId,
  enabled = true,
}: {
  conversationId: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildDirectCastGroupInvitesKey({
      conversationId,
    }),

    queryFn: buildDirectCastGroupInvitesFetcher({
      apiClient,
      conversationId,
    }),

    select: (data) => data.pages.flatMap((page) => page.result.invites),

    getNextPageParam: getNextPageCursor,
    refetchOnMount: 'always',
    enabled,
  });
};

export { useGetDirectCastGroupInvites };
