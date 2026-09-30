import { useSuspenseQuery } from '@tanstack/react-query';
import { ApiOnchainTransactionType } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWarpsOfferingFetcher } from './buildWarpsOfferingFetcher';
import { buildWarpsOfferingKey } from './buildWarpsOfferingKey';

const useWarpsOffering = ({
  onchainTransactionType,
}: {
  onchainTransactionType: ApiOnchainTransactionType;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildWarpsOfferingKey({ onchainTransactionType }),
    queryFn: buildWarpsOfferingFetcher({ onchainTransactionType, apiClient }),
  });
};

export { useWarpsOffering };
