import { renderHook } from '@testing-library/react-native';
import { ApiEmbeddedWallet } from 'farcaster-client-data';

import { useActiveWallet } from '../useActiveWallet';

const mockMmkvStore: Record<string, string | undefined> = {};

jest.mock('react-native-mmkv', () => ({
  useMMKVString: (key: string) => {
    const react = require('react') as typeof import('react');
    const [value, setValue] = react.useState<string | undefined>(
      () => mockMmkvStore[key],
    );
    const set = react.useCallback(
      (next?: string) => {
        mockMmkvStore[key] = next;
        setValue(next);
      },
      [key],
    );
    return [value, set];
  },
}));

let mockSecondaryWalletsEnabled = false;
jest.mock('../useSecondaryWalletsEnabled', () => ({
  useSecondaryWalletsEnabled: () => mockSecondaryWalletsEnabled,
}));

jest.mock('../useCurrentUser', () => ({
  useCurrentUserFid: () => 1234,
}));

let mockWalletsData: { wallets: ApiEmbeddedWallet[] } | undefined;
let mockIsPending = true;
jest.mock('farcaster-client-hooks', () => ({
  useEmbeddedWalletsQuery: () => ({
    data: mockWalletsData,
    isPending: mockIsPending,
  }),
}));

const NAMESPACE_KEY = 'wallet-active-wallet-1234';

function buildWallet(overrides: Partial<ApiEmbeddedWallet>): ApiEmbeddedWallet {
  return {
    id: 'wallet-1',
    address: '0x1111111111111111111111111111111111111111',
    protocol: 'ethereum',
    isPrimary: true,
    privyAppNamespace: 'primary',
    ...overrides,
  } as ApiEmbeddedWallet;
}

const primaryEvm = buildWallet({
  id: 'primary-evm',
  address: '0x1111111111111111111111111111111111111111',
});
const secondaryEvm = buildWallet({
  id: 'secondary-evm',
  address: '0x2222222222222222222222222222222222222222',
  isPrimary: false,
  privyAppNamespace: 'secondary',
});

beforeEach(() => {
  for (const key of Object.keys(mockMmkvStore)) {
    delete mockMmkvStore[key];
  }
  mockSecondaryWalletsEnabled = false;
  mockWalletsData = undefined;
  mockIsPending = true;
});

describe('useActiveWallet', () => {
  it('keeps a stored secondary selection through a cold start', () => {
    mockMmkvStore[NAMESPACE_KEY] = 'secondary';

    // Cold start: the `secondary-wallets` flag rides on the non-persisted
    // authenticatedUser query, so it reads false and the wallet list is not
    // fetched yet. Nothing here proves the user lacks a secondary wallet.
    const { result, rerender } = renderHook(() => useActiveWallet());

    expect(result.current.activeNamespace).toBe('primary');
    expect(mockMmkvStore[NAMESPACE_KEY]).toBe('secondary');

    // Flag resolves and the wallet list lands.
    mockSecondaryWalletsEnabled = true;
    mockIsPending = false;
    mockWalletsData = { wallets: [primaryEvm, secondaryEvm] };
    rerender({});

    expect(result.current.activeNamespace).toBe('secondary');
    expect(result.current.activeEvmAddress).toBe(secondaryEvm.address);
    expect(mockMmkvStore[NAMESPACE_KEY]).toBe('secondary');
  });

  it('does not wipe the selection while the wallet list is still loading', () => {
    mockMmkvStore[NAMESPACE_KEY] = 'secondary';
    mockSecondaryWalletsEnabled = true;
    mockIsPending = true;
    mockWalletsData = undefined;

    renderHook(() => useActiveWallet());

    expect(mockMmkvStore[NAMESPACE_KEY]).toBe('secondary');
  });

  it('does not wipe the selection when the wallet list request fails', () => {
    mockMmkvStore[NAMESPACE_KEY] = 'secondary';
    mockSecondaryWalletsEnabled = true;
    // Errored query: no longer pending, but still no data.
    mockIsPending = false;
    mockWalletsData = undefined;

    renderHook(() => useActiveWallet());

    expect(mockMmkvStore[NAMESPACE_KEY]).toBe('secondary');
  });

  it('heals to primary once a loaded list shows no secondary wallet', () => {
    mockMmkvStore[NAMESPACE_KEY] = 'secondary';
    mockSecondaryWalletsEnabled = true;
    mockIsPending = false;
    mockWalletsData = { wallets: [primaryEvm] };

    const { result } = renderHook(() => useActiveWallet());

    expect(mockMmkvStore[NAMESPACE_KEY]).toBe('primary');
    expect(result.current.activeNamespace).toBe('primary');
    expect(result.current.activeEvmAddress).toBe(primaryEvm.address);
  });

  it('migrates a legacy walletId only against a loaded list', () => {
    mockMmkvStore[NAMESPACE_KEY] = 'secondary-evm';

    const { rerender } = renderHook(() => useActiveWallet());

    // Not loaded: the legacy id must not be resolved (it would resolve to
    // 'primary' against an empty list and lose the selection).
    expect(mockMmkvStore[NAMESPACE_KEY]).toBe('secondary-evm');

    mockSecondaryWalletsEnabled = true;
    mockIsPending = false;
    mockWalletsData = { wallets: [primaryEvm, secondaryEvm] };
    rerender({});

    expect(mockMmkvStore[NAMESPACE_KEY]).toBe('secondary');
  });

  it('reports primary while the feature is unavailable, without persisting it', () => {
    mockMmkvStore[NAMESPACE_KEY] = 'secondary';
    mockSecondaryWalletsEnabled = false;
    mockIsPending = true;

    const { result } = renderHook(() => useActiveWallet());

    expect(result.current.activeNamespace).toBe('primary');
    expect(mockMmkvStore[NAMESPACE_KEY]).toBe('secondary');
  });
});
