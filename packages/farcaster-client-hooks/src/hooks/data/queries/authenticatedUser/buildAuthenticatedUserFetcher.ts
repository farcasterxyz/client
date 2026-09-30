import {
  ApiGetAuthenticatedUser200Response,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildAuthenticatedUserFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async (): Promise<ApiGetAuthenticatedUser200Response> => {
    const response = await apiClient.getAuthenticatedUser();
    return response.data;
  };

export { buildAuthenticatedUserFetcher };
