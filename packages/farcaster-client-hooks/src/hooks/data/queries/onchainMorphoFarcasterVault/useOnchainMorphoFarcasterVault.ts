import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildOnchainMorphoFarcasterVaultFetcher } from './buildOnchainMorphoFarcasterVaultFetcher';

export const useOnchainMorphoFarcasterVault = () => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: ['morpho-farcaster-vault'],
    queryFn: buildOnchainMorphoFarcasterVaultFetcher({ apiClient }),
  });
};
