import { useQuery } from '@tanstack/react-query';
import { ApiOnchainTransactionType } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers';
import { buildOfferingFetcher } from './buildOfferingFetcher';
import { buildOfferingKey } from './buildOfferingKey';

const useNonSuspendingOffering = ({
  onchainTransactionType,
}: {
  onchainTransactionType: ApiOnchainTransactionType;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useQuery({
    queryKey: buildOfferingKey({ onchainTransactionType }),
    queryFn: buildOfferingFetcher({ onchainTransactionType, apiClient }),
  });

  return result;
};

export { useNonSuspendingOffering };
