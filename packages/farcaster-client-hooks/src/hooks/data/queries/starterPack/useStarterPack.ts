import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildStarterPackFetcher } from './buildStarterPackFetcher';
import { buildStarterPackKey } from './buildStarterPackKey';

const useStarterPack = ({ id }: { id: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildStarterPackKey({ id }),
    queryFn: buildStarterPackFetcher({ apiClient, id }),
  });
};

export { useStarterPack };
