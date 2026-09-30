import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { ApiGetAppLauncher200Response } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildAppLauncherFetcher } from './buildAppLauncherFetcher';
import { buildAppLauncherKey } from './buildAppLauncherKey';

const useAppLauncher = ({
  viewerFid,
  weightRecency,
  weightFrequency,
  weightInstalled,
  enabled = true,
  ...queryOptions
}: {
  viewerFid?: number;
  weightRecency?: number;
  weightFrequency?: number;
  weightInstalled?: number;
  enabled?: boolean;
} & Omit<
  UseQueryOptions<ApiGetAppLauncher200Response['result']>,
  'queryKey' | 'queryFn'
>) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useQuery({
    queryKey: buildAppLauncherKey({
      viewerFid,
      weightRecency,
      weightFrequency,
      weightInstalled,
    }),
    queryFn: buildAppLauncherFetcher({
      apiClient,
      viewerFid,
      weightRecency,
      weightFrequency,
      weightInstalled,
    }),
    enabled,
    ...queryOptions,
  });

  return result;
};

export { useAppLauncher };
