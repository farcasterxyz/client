import { useSuspenseQuery } from '@tanstack/react-query';
import { ApiOnchainTransactionType } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildOfferingFetcher } from './buildOfferingFetcher';
import { buildOfferingKey } from './buildOfferingKey';

const useOffering = ({
  onchainTransactionType,
}: {
  onchainTransactionType: ApiOnchainTransactionType;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildOfferingKey({ onchainTransactionType }),
    queryFn: buildOfferingFetcher({ onchainTransactionType, apiClient }),
  });
};

export { useOffering };
