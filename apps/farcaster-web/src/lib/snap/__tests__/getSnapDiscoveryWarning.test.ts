import { FarcasterApiClient } from 'farcaster-client-data';

import { getSnapDiscoveryWarning } from '~/lib/snap/getSnapDiscoveryWarning';

const mockApiClient = (snap?: object) =>
  ({
    devToolsRefreshOpenGraphMetadata: vi.fn().mockResolvedValue({
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

    const warning = await getSnapDiscoveryWarning(
      'https://example.com/snap',
      apiClient,
    );

    expect(warning).toBeNull();
  });

  it('returns warning when the crawler does not detect a snap', async () => {
    const apiClient = mockApiClient();

    const warning = await getSnapDiscoveryWarning(
      'https://example.com/snap',
      apiClient,
    );

    expect(warning).toContain('does not detect this URL as a snap');
  });

  it('returns null when the API call fails', async () => {
    const apiClient = {
      devToolsRefreshOpenGraphMetadata: vi
        .fn()
        .mockRejectedValue(new Error('network error')),
    } as unknown as FarcasterApiClient;

    const warning = await getSnapDiscoveryWarning(
      'https://example.com/snap',
      apiClient,
    );

    expect(warning).toBeNull();
  });
});
