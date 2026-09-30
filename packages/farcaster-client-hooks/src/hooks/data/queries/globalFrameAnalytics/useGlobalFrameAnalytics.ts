import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildGlobalFrameAnalyticsFetcher } from './buildGlobalFrameAnalyticsFetcher';
import { buildGlobalFrameAnalyticsKey } from './buildGlobalFrameAnalyticsKey';

const useGlobalFrameAnalytics = ({
  start,
  end,
}: {
  start?: string;
  end?: string;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildGlobalFrameAnalyticsKey({ start, end }),

    queryFn: buildGlobalFrameAnalyticsFetcher({
      apiClient,
      start,
      end,
    }),
  });
};

export { useGlobalFrameAnalytics };
