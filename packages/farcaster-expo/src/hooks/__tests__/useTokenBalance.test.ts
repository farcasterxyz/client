import {
  ApiEthFungibleTokenPosition,
  ApiOnchainTokenMinimal,
  ApiTokenLink,
} from 'farcaster-client-data';

import { type TokenBalance } from '../useTokenBalance';
import { resolveTokenBalanceData } from '../useTokenBalance.utils';

function makeTokenLink(overrides: Partial<ApiTokenLink> = {}): ApiTokenLink {
  return {
    chain: 'base',
    ca: '0xda4427f0fFEcdf5b5497B0d9b22aEc3EBA1f1B07',
    name: 'gensyn',
    ticker: 'Ai',
    decimals: 18,
    imageUrl: '',
    ...overrides,
  } as ApiTokenLink;
}

function makeCachedPosition(
  overrides: Partial<ApiEthFungibleTokenPosition> = {},
): ApiEthFungibleTokenPosition {
  return {
    id: 'position-1',
    chain: 'base',
    quantity: {
      int: '3024130000000000000000000',
      float: 3024130,
    },
    address: '0xda4427f0fFEcdf5b5497B0d9b22aEc3EBA1f1B07',
    value: 2.67,
    features: {
      canTrade: true,
      isTestnet: false,
    },
    token: makeTokenLink({
      priceUsd: '0.0000008828',
    }),
    ...overrides,
  };
}

describe('resolveTokenBalanceData', () => {
  it('preserves cached usd value when refreshed sources lose pricing', () => {
    const result = resolveTokenBalanceData({
      chain: 'base',
      ca: '0xda4427f0fFEcdf5b5497B0d9b22aEc3EBA1f1B07',
      tokenData: {
        priceUsd: '0',
        ...makeTokenLink(),
      },
      walletContext: {
        position: {
          quantity: {
            int: '3024130000000000000000000',
          },
          valueUsd: 0,
        },
      },
      cachedPosition: {
        ...makeCachedPosition(),
      },
    });

    expect(result?.valueUsd).toBeCloseTo(2.67, 2);
    expect(result?.priceUsd).toBeGreaterThan(0);
    expect(result?.quantity.int).toBe('3024130000000000000000000');
  });

  it('falls back to previous good data when live sources are empty', () => {
    const previousData: TokenBalance = {
      quantity: {
        int: '1000000',
        float: 1,
      },
      priceUsd: 2.5,
      valueUsd: 2.5,
      userHidden: false,
      token: {
        chain: 'base',
        ca: '0x123',
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 6,
        imageUrl: '',
        priceUsd: 2.5,
      } as ApiOnchainTokenMinimal,
    };

    const result = resolveTokenBalanceData({
      chain: 'base',
      ca: '0x123',
      previousData,
    });

    expect(result).toEqual(previousData);
  });
});
