import {
  ApiDevToolsListMiniAppManifests200Response,
  ApiDevToolsListMiniAppManifestsQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildDevToolsListMiniAppManifestsFetcher = ({
  apiClient,
  params,
}: {
  apiClient: FarcasterApiClient;
  params?: Omit<ApiDevToolsListMiniAppManifestsQueryParams, 'cursor' | 'limit'>;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const finalParams: ApiDevToolsListMiniAppManifestsQueryParams = {
      ...(params || {}),
      cursor,
      limit: 25,
    };
    const response = await apiClient.devToolsListMiniAppManifests(finalParams);

    const result = (response.data as ApiDevToolsListMiniAppManifests200Response)
      .result;

    return {
      items: result.manifests,
      next: response.data.next,
    };
  });

export { buildDevToolsListMiniAppManifestsFetcher };
