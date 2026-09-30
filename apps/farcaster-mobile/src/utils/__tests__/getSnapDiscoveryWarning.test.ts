import { FarcasterApiClient } from 'farcaster-client-data';

import { getSnapDiscoveryWarning } from '../getSnapDiscoveryWarning';

const mockApiClient = (snap?: object) =>
  ({
    devToolsRefreshOpenGraphMetadata: jest.fn().mockResolvedValue({
      data: {
        result: {
          openGraph: {
            url: 'https://example.com/snap',
            ...(snap ? { snap } : {}),
          },
        },
      },
    }),
  }) as unknown as FarcasterApiClient;

describe('getSnapDiscoveryWarning', () => {
  it('returns null when the crawler detects a snap', async () => {
    const apiClient = mockApiClient({ url: 'https://example.com/snap' });

    await expect(
      getSnapDiscoveryWarning('https://example.com/snap', apiClient),
    ).resolves.toBeNull();
  });

  it('returns warning when the crawler does not detect a snap', async () => {
    const apiClient = mockApiClient();

    await expect(
      getSnapDiscoveryWarning('https://example.com/snap', apiClient),
    ).resolves.toContain('does not detect this URL as a snap');
  });

  it('returns null when the API call fails', async () => {
    const apiClient = {
      devToolsRefreshOpenGraphMetadata: jest
        .fn()
        .mockRejectedValue(new Error('network error')),
    } as unknown as FarcasterApiClient;

    await expect(
      getSnapDiscoveryWarning('https://example.com/snap', apiClient),
    ).resolves.toBeNull();
  });
});
