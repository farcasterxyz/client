import { FarcasterApiClient } from 'farcaster-client-data';

const buildContractAddressFetcher =
  ({ apiClient, ca }: { ca: string; apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.scrapeContractAddress({
      ca,
      intent: 'submit',
    });

    return response.data.result;
  };

export { buildContractAddressFetcher };
