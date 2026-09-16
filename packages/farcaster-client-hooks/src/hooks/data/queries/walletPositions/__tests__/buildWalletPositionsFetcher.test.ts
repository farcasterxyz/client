import {
  ApiEthFungibleTokenPosition,
  EIP7528_NATIVE_ASSET_ADDRESS,
} from 'farcaster-client-data';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearTokenPriceFromCoingeckoCacheForTests } from '../../../../../lib/fetchTokenPriceFromCoingecko';
import { buildWalletPositionsFetcher } from '../buildWalletPositionsFetcher';

const realFetch = globalThis.fetch;

const tokenFeatures = { canTrade: true, isTestnet: false };

function createPosition(
  overrides: Partial<ApiEthFungibleTokenPosition>,
): ApiEthFungibleTokenPosition {
  return {
    id: overrides.id ?? 'position-id',
    chain: overrides.chain ?? 'hyperevm',
    symbol: overrides.symbol ?? 'HYPE',
    address: overrides.address ?? EIP7528_NATIVE_ASSET_ADDRESS,
    quantity: overrides.quantity ?? { float: 4.45, int: '4450000000000000000' },
    price: overrides.price ?? 27,
    value: overrides.value ?? 120.15,
    features: overrides.features ?? tokenFeatures,
    token: overrides.token ?? {
      name: overrides.name ?? 'HYPE',
      ticker: overrides.symbol ?? 'HYPE',
      imageUrl: '',
      ca: overrides.address ?? EIP7528_NATIVE_ASSET_ADDRESS,
      chain: overrides.chain ?? 'hyperevm',
      priceUsd: String(overrides.price ?? 27),
      features: tokenFeatures,
    },
    ...overrides,
  };
}

function createApiClient(positions: ApiEthFungibleTokenPosition[]) {
  return {
    getWalletPositions: vi.fn().mockResolvedValue({
      data: {
        result: {
          totalBalance: 0,
          amountChange1d: 0,
          percentChange1d: 0,
          positions,
        },
      },
    }),
  };
}

describe('buildWalletPositionsFetcher HYPE price override', () => {
  beforeEach(() => {
    clearTokenPriceFromCoingeckoCacheForTests();
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('corrects native HyperEVM HYPE even when another HYPE symbol position appears first', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ hyperliquid: { usd: 38.18 } }), {
        status: 200,
      }),
    );
    globalThis.fetch = fetchSpy;

    const nonNativeHype = createPosition({
      id: 'non-native-hype',
      address: '0x1111111111111111111111111111111111111111',
      price: 27,
      value: 27,
      quantity: { float: 1, int: '1000000000000000000' },
    });
    const nativeHype = createPosition({
      id: 'native-hype',
      price: 27,
      value: 120.15,
    });
    const batchMergeIntoGloballyCachedTokens = vi.fn();

    const result = await buildWalletPositionsFetcher({
      apiClient: createApiClient([nonNativeHype, nativeHype]) as never,
      batchMergeIntoGloballyCachedTokens,
      params: { fid: 1 },
    })();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.positions[0]).toMatchObject({ price: 27, value: 27 });
    expect(result.positions[1]).toMatchObject({
      price: 38.18,
      value: 4.45 * 38.18,
      token: { priceUsd: '38.18' },
    });
    expect(batchMergeIntoGloballyCachedTokens).toHaveBeenCalledWith({
      batchUpdates: [
        nonNativeHype.token,
        expect.objectContaining({ priceUsd: '38.18' }),
      ],
    });
  });

  it('leaves API pricing untouched when the override price cannot be fetched', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response('{}'));

    const nativeHype = createPosition({ id: 'native-hype' });

    const result = await buildWalletPositionsFetcher({
      apiClient: createApiClient([nativeHype]) as never,
      batchMergeIntoGloballyCachedTokens: vi.fn(),
      params: { fid: 1 },
    })();

    expect(result.positions[0]).toEqual(nativeHype);
  });
});
