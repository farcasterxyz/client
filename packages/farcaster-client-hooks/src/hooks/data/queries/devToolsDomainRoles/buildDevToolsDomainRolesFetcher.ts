import { FarcasterApiClient } from 'farcaster-client-data';

const buildDevToolsDomainRolesFetcher =
  ({ apiClient, domain }: { apiClient: FarcasterApiClient; domain: string }) =>
  async () => {
    const response = await apiClient.devToolsDomainRoles({
      domain,
    });

    return response.data.result.roles;
  };

export { buildDevToolsDomainRolesFetcher };
