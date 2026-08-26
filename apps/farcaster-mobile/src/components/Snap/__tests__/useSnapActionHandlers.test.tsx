import { act, render } from '@testing-library/react-native';
import React from 'react';

import { useSnapActionHandlers } from '../useSnapActionHandlers';

const mockOpenUrl = jest.fn();
const mockTrackEvent = jest.fn();
const mockFetchEvmScanAction = jest.fn();
const mockResolveMiniAppConfig = jest.fn();
const mockLaunchFrame = jest.fn();
const mockOpenComposer = jest.fn();
const mockPush = jest.fn();
const mockPushToUserProfile = jest.fn();
const mockSnapRequest = jest.fn();
const mockEvmMiniAppProviderRequest = jest.fn();
const mockUsePostHogFeatureFlag = jest.fn();

jest.mock('@farcaster/snap', () => ({
  MEDIA_TYPE: 'application/json',
  validateSnapResponse: jest.fn(),
}));

jest.mock('farcaster-client-hooks', () => ({
  buildSnapHandlerAnalyticsProps: (url: string) => ({
    snapDomain: 'example.com',
    snapSourceBucket: 'self_hosted',
    snapUrl: url,
  }),
  useFarcasterApiClient: () => ({
    apiClient: {
      snapRequest: mockSnapRequest,
    },
  }),
  snapUrlForAnalyticsEvent: (url: string) => url,
  useFetchEvmScanAction: () => mockFetchEvmScanAction,
  useResolveMiniAppConfig: () => mockResolveMiniAppConfig,
}));

jest.mock('farcaster-expo', () => ({
  useEmbeddedWallet: () => ({
    activeWalletId: undefined,
    evmAddress: '0x0000000000000000000000000000000000000002',
    evmMiniAppProvider: { request: mockEvmMiniAppProviderRequest },
    miniAppActiveWalletId: undefined,
    miniAppEvmAddress: undefined,
  }),
}));

jest.mock('~/contexts/AnalyticsProvider', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
  }),
}));

jest.mock('~/contexts/CreateCastComposerProvider', () => ({
  useOpenComposer: () => mockOpenComposer,
}));

jest.mock('~/hooks/navigation/usePush', () => ({
  usePush: () => mockPush,
}));

jest.mock('~/hooks/navigation/usePushToUserProfile', () => ({
  usePushToUserProfile: () => mockPushToUserProfile,
}));

jest.mock('~/hooks/data/useCurrentUser', () => ({
  useCurrentUser_UNSAFE: () => ({ fid: 123 }),
}));

jest.mock('~/hooks/useLaunchFrame', () => ({
  useLaunchFrame: () => mockLaunchFrame,
}));

jest.mock('~/hooks/usePostHogFeatureFlag', () => ({
  usePostHogFeatureFlag: (flag: string) => mockUsePostHogFeatureFlag(flag),
}));

jest.mock('~/utils/LinkingUtils', () => ({
  usePossiblyNavigateOrOpenUrl: () => mockOpenUrl,
}));

describe('useSnapActionHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapRequest.mockResolvedValue({
      data: { result: { success: true, response: null } },
    });
    mockEvmMiniAppProviderRequest.mockResolvedValue('0xtx');
    mockUsePostHogFeatureFlag.mockReturnValue(false);
  });

  it('routes open_url through the mobile URL follower so Farcaster channel links can navigate internally', () => {
    const onBeforeExternalAction = jest.fn();
    const onNavigateAway = jest.fn();
    let handlers: ReturnType<typeof useSnapActionHandlers> | undefined;

    function TestComponent() {
      handlers = useSnapActionHandlers({
        snapDocumentUrl: 'https://example.com/snap',
        onBeforeExternalAction,
        onNavigateAway,
      });

      return null;
    }

    render(<TestComponent />);

    handlers?.open_url('https://farcaster.xyz/~/channel/fc-devs');

    expect(onBeforeExternalAction).toHaveBeenCalledTimes(1);
    expect(onNavigateAway).toHaveBeenCalledTimes(1);
    expect(mockOpenUrl).toHaveBeenCalledWith({
      url: 'https://farcaster.xyz/~/channel/fc-devs',
      openExternalTarget: 'system',
    });
    expect(mockTrackEvent).toHaveBeenCalledWith('snap handler', {
      handler: 'open_url',
      surface: 'cast_embed_mobile',
      snapDomain: 'example.com',
      snapSourceBucket: 'self_hosted',
      snapUrl: 'https://example.com/snap',
    });
  });

  it('opens channels directly through mobile navigation', () => {
    const onBeforeExternalAction = jest.fn();
    const onNavigateAway = jest.fn();
    let handlers: ReturnType<typeof useSnapActionHandlers> | undefined;

    function TestComponent() {
      handlers = useSnapActionHandlers({
        snapDocumentUrl: 'https://example.com/snap',
        onBeforeExternalAction,
        onNavigateAway,
      });

      return null;
    }

    render(<TestComponent />);

    handlers?.view_channel({ channelKey: ' fc-devs ' });

    expect(onBeforeExternalAction).toHaveBeenCalledTimes(1);
    expect(onNavigateAway).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('Channel', {
      channelKey: 'fc-devs',
    });
    expect(mockOpenUrl).not.toHaveBeenCalled();
  });

  it('reseats before navigating to a cast', () => {
    const onBeforeExternalAction = jest.fn();
    const onNavigateAway = jest.fn();
    let handlers: ReturnType<typeof useSnapActionHandlers> | undefined;

    function TestComponent() {
      handlers = useSnapActionHandlers({
        snapDocumentUrl: 'https://example.com/snap',
        onBeforeExternalAction,
        onNavigateAway,
      });

      return null;
    }

    render(<TestComponent />);

    handlers?.view_cast({ hash: '0x123' });

    expect(onBeforeExternalAction).toHaveBeenCalledTimes(1);
    expect(onNavigateAway).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('Cast', { castHash: '0x123' });
  });

  it('posts a transaction_result callback after a successful wallet transaction', async () => {
    mockUsePostHogFeatureFlag.mockImplementation(
      (flag: string) => flag === 'snap-transaction-actions-execute',
    );
    mockEvmMiniAppProviderRequest.mockResolvedValue('0xabc123');
    const onBeforeExternalAction = jest.fn();
    const onTransactionLoadingChange = jest.fn();
    let handlers: ReturnType<typeof useSnapActionHandlers> | undefined;

    function TestComponent() {
      handlers = useSnapActionHandlers({
        snapDocumentUrl: 'https://example.com/snap',
        onBeforeExternalAction,
        onTransactionLoadingChange,
      });

      return null;
    }

    render(<TestComponent />);

    await act(async () => {
      await handlers?.send_transaction({
        chainId: '0x2105',
        to: '0x0000000000000000000000000000000000000001',
        data: '0x1234',
        value: '0x0',
      });
    });

    expect(mockEvmMiniAppProviderRequest).toHaveBeenCalledWith({
      method: 'eth_sendTransaction',
      params: [
        {
          chainId: '0x2105',
          from: '0x0000000000000000000000000000000000000002',
          to: '0x0000000000000000000000000000000000000001',
          data: '0x1234',
          value: '0x0',
        },
      ],
    });
    expect(mockSnapRequest).toHaveBeenCalledWith({
      method: 'POST',
      targetUrl: 'https://example.com/snap',
      payload: expect.objectContaining({
        fid: 123,
        audience: 'https://example.com',
        surface: { type: 'standalone' },
        type: 'transaction_result',
        transaction: {
          request: {
            chainId: '0x2105',
            to: '0x0000000000000000000000000000000000000001',
            data: '0x1234',
            value: '0x0',
          },
          result: { success: true, transactionHash: '0xabc123' },
        },
      }),
    });
    expect(onBeforeExternalAction).toHaveBeenCalledTimes(1);
    expect(onTransactionLoadingChange).toHaveBeenNthCalledWith(1, true);
    expect(onTransactionLoadingChange).toHaveBeenLastCalledWith(false);
  });
});
