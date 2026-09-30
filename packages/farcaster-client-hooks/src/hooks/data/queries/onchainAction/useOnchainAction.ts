import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildOnchainActionFetcher } from './buildOnchainActionFetcher';
import { buildOnchainActionKey } from './buildOnchainActionKey';

const useOnchainAction = ({ onchainActionId }: { onchainActionId: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildOnchainActionKey({ onchainActionId }),
    queryFn: buildOnchainActionFetcher({ onchainActionId, apiClient }),
  });
};

export { useOnchainAction };
