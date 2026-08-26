import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildMintableAssetsFakeFetcher } from './buildMintableAssetsFakeFetcher';
import { buildMintableAssetsKey } from './buildMintableAssetsKey';

const useMintableAsset = ({ url }: { url: string | undefined }) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildMintableAssetsKey({ url: url! }),
    queryFn: buildMintableAssetsFakeFetcher({ apiClient, url: url! }),
    enabled: typeof url !== 'undefined',
  });
};

export { useMintableAsset };
