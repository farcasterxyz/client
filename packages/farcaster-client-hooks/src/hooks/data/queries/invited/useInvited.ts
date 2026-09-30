import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildInvitedFetcher } from './buildInvitedFetcher';
import { buildInvitedKey } from './buildInvitedKey';

const useInvited = ({ email }: { email: string }) => {
  const { apiClient } = useFarcasterApiClient();
  return useSuspenseQuery({
    queryKey: buildInvitedKey({ email }),
    queryFn: buildInvitedFetcher({ apiClient, email }),
  });
};
export { useInvited };
