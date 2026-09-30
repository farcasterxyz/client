import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildInviteFetcher } from './buildInviteFetcher';
import { buildInviteKey } from './buildInviteKey';

const useInvite = ({
  inviteId,
  inviteCode,
}: {
  inviteId?: string;
  inviteCode?: string;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildInviteKey({ inviteId }),
    queryFn: buildInviteFetcher({ inviteId, inviteCode, apiClient }),
    refetchIntervalInBackground: true,
    refetchInterval: 60000,
  });
};

export { useInvite };
