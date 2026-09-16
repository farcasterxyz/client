import { FarcasterApiClient } from 'farcaster-client-data';

const buildProductCatalogFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getProductCatalog();

    return response.data.result;
  };

export { buildProductCatalogFetcher };
