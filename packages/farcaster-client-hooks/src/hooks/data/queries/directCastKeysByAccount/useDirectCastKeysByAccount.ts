import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDirectCastKeysByAccountFetcher } from './buildDirectCastKeysByAccountFetcher';
import { buildDirectCastKeysByAccountKey } from './buildDirectCastKeysByAccountKey';

const useDirectCastKeysByAccount = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildDirectCastKeysByAccountKey({ fid }),
    queryFn: buildDirectCastKeysByAccountFetcher({ apiClient, fid }),
  });
};

export { useDirectCastKeysByAccount };
