import { describe, expect, it, vi } from 'vitest';

import { buildEmbeddedWalletsFetcher } from '../buildEmbeddedWalletsFetcher';
import { buildEmbeddedWalletsKey } from '../buildEmbeddedWalletsKey';

describe('embedded wallet query helpers', () => {
  it('includes private-wallet list mode and scope in the query key', () => {
    expect(
      buildEmbeddedWalletsKey({ includePrivate: true, scopeKey: 123 }),
    ).toEqual(['embeddedWallets', 123, true]);
  });

  it('passes params through and unwraps the response result', async () => {
    const result = {
      wallets: [
        {
          id: 'wallet-id',
          fid: 123,
          protocol: 'ethereum',
          address: '0x0000000000000000000000000000000000000001',
          source: 'privy',
          displayName: 'Private wallet',
          displayPolicy: {
            showInTokenList: false,
            showInActivity: false,
          },
          miniAppPolicy: { default: 'blocked' },
          isPrimary: false,
          status: 'active',
          createdAt: 1,
          updatedAt: 2,
        },
      ],
    };
    const apiClient = {
      listEmbeddedWallets: vi.fn().mockResolvedValue({
        data: { result },
      }),
    };

    await expect(
      buildEmbeddedWalletsFetcher({
        apiClient: apiClient as never,
        params: { includePrivate: true },
      })(),
    ).resolves.toBe(result);
    expect(apiClient.listEmbeddedWallets).toHaveBeenCalledWith({
      includePrivate: true,
    });
  });
});
