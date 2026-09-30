import { useQuery } from '@tanstack/react-query';
import { ApiAnalyticsMiniAppRollupRequestBody } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildAnalyticsMiniAppRollupFetcher } from './buildAnalyticsMiniAppRollupFetcher';
import { buildAnalyticsMiniAppRollupKey } from './buildAnalyticsMiniAppRollupKey';

const useAnalyticsMiniAppRollup = ({
  request,
}: {
  request: ApiAnalyticsMiniAppRollupRequestBody;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useQuery({
    queryKey: buildAnalyticsMiniAppRollupKey({ request }),
    queryFn: buildAnalyticsMiniAppRollupFetcher({ apiClient, request }),
  });

  return result;
};

export { useAnalyticsMiniAppRollup };
