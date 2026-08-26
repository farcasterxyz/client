import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildAMAFetcher } from './buildAMAFetcher';
import { buildAMAKey } from './buildAMAKey';

const useAMA = ({ fname }: { fname: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildAMAKey({ fname }),
    queryFn: buildAMAFetcher({ fname, apiClient }),
  });
};

export { useAMA };
