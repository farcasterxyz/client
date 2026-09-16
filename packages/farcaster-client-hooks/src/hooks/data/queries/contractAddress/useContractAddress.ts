import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildContractAddressFetcher } from './buildContractAddressFetcher';
import { buildContractAddressKey } from './buildContractAddressKey';

const useContractAddress = ({ ca }: { ca: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildContractAddressKey({ ca }),
    queryFn: buildContractAddressFetcher({ apiClient, ca }),
  });
};

export { useContractAddress };
