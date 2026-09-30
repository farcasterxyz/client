// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSnapActionHandlers } from '~/hooks/snap/useSnapActionHandlers';

const mockNavigateInWallet = vi.fn();
const mockSendToken = vi.fn();
const mockSwapToken = vi.fn();
const mockOpenWarpcastWallet = vi.fn();
const mockOpenMiniAppFromSnap = vi.fn();
const mockTrackEvent = vi.fn();
const mockAppNavigate = vi.fn();
const mockFetchEvmScanAction = vi.fn();
const mockWalletProviderRequest = vi.fn();
const mockSnapRequest = vi.fn();
const mockUsePostHogFeatureFlag = vi.fn();
let walletProvider:
  | {
      request: typeof mockWalletProviderRequest;
    }
  | undefined;
let currentUser: { fid: number } | undefined;
let walletBridge:
  | {
      navigate?: typeof mockNavigateInWallet;
      sendToken?: typeof mockSendToken;
      swapToken?: typeof mockSwapToken;
    }
  | undefined;

vi.mock('farcaster-client-hooks', () => ({
  buildSnapHandlerAnalyticsProps: (url: string) => ({
    snapDomain: 'example.com',
    snapSourceBucket: 'self_hosted',
    snapUrl: url,
  }),
  isLocalhostUrl: (url: string) => url.includes('localhost'),
  snapUrlForAnalyticsEvent: (url: string) => url,
  useFarcasterApiClient: () => ({
    apiClient: {
      snapRequest: mockSnapRequest,
    },
  }),
  useFetchEvmScanAction: () => mockFetchEvmScanAction,
  useInteractedSnapUrls: () => ({
    markInteracted: vi.fn(),
  }),
}));

vi.mock('~/components/EmbeddedWallet', () => ({
  useOptionalEmbeddedWalletBridge: () => walletBridge,
}));

vi.mock('~/contexts/AnalyticsProvider', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
  }),
}));

vi.mock('~/contexts/OpenableWarpcastWalletContext', () => ({
  useOpenableWarpcastWallet: () => ({
    openWarpcastWallet: mockOpenWarpcastWallet,
  }),
}));

vi.mock('~/contexts/WalletProvider', () => ({
  useWallet: () => ({
    address: '0x0000000000000000000000000000000000000002',
    provider: walletProvider,
  }),
}));

vi.mock('~/hooks/data/useCachedCurrentUser', () => ({
  useCachedCurrentUser: () => currentUser,
}));

vi.mock('~/hooks/navigation/useNavigate', () => ({
  useNavigate: () => mockAppNavigate,
}));

vi.mock('~/hooks/snap/useOpenMiniAppFromSnap', () => ({
  useOpenMiniAppFromSnap: () => mockOpenMiniAppFromSnap,
}));

vi.mock('~/hooks/usePostHogFeatureFlag', () => ({
  usePostHogFeatureFlag: (flag: string) => mockUsePostHogFeatureFlag(flag),
}));

const VALID_TOKEN = 'eip155:1/erc20:0x0000000000000000000000000000000000000001';

function renderHandlers(onBeforeExternalAction = vi.fn()) {
  return renderHook(() =>
    useSnapActionHandlers({
      snapDocumentUrl: 'https://example.com/snap',
      onBeforeExternalAction,
    }),
  );
}

describe('useSnapActionHandlers external action backgrounding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'open').mockImplementation(() => null);
    mockFetchEvmScanAction.mockResolvedValue({});
    mockWalletProviderRequest.mockResolvedValue('0xtx');
    mockSnapRequest.mockResolvedValue({
      data: { result: { success: true, response: null } },
    });
    mockUsePostHogFeatureFlag.mockReturnValue(false);
    currentUser = { fid: 123 };
    walletProvider = {
      request: mockWalletProviderRequest,
    };
    walletBridge = {
      navigate: mockNavigateInWallet,
      sendToken: mockSendToken.mockResolvedValue({}),
      swapToken: mockSwapToken.mockResolvedValue({}),
    };
  });

  it('renders public snap actions without a logged-in user', () => {
    currentUser = undefined;
    const { result } = renderHandlers();

    act(() => {
      result.current.handlers.view_channel({ channelKey: 'fc-devs' });
    });

    expect(mockAppNavigate).toHaveBeenCalledWith({
      to: 'channel',
      params: { channelKey: 'fc-devs' },
    });
  });

  it('backgrounds after validating a wallet token action', () => {
    const order: string[] = [];
    const onBeforeExternalAction = vi.fn(() => order.push('background'));
    mockNavigateInWallet.mockImplementation(() => order.push('navigate'));
    const { result } = renderHandlers(onBeforeExternalAction);

    act(() => {
      result.current.handlers.view_token({ token: VALID_TOKEN });
    });

    expect(onBeforeExternalAction).toHaveBeenCalledTimes(1);
    expect(mockNavigateInWallet).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['background', 'navigate']);
  });

  it('does not background invalid token actions', () => {
    const onBeforeExternalAction = vi.fn();
    const { result } = renderHandlers(onBeforeExternalAction);

    act(() => {
      result.current.handlers.view_token({ token: 'not-a-token' });
    });

    expect(onBeforeExternalAction).not.toHaveBeenCalled();
    expect(mockNavigateInWallet).not.toHaveBeenCalled();
  });

  it('opens channels directly through web navigation', () => {
    const { result } = renderHandlers();

    act(() => {
      result.current.handlers.view_channel({ channelKey: ' fc-devs ' });
    });

    expect(mockAppNavigate).toHaveBeenCalledWith({
      to: 'channel',
      params: { channelKey: 'fc-devs' },
    });
  });

  it('does not background wallet actions when the wallet bridge is unavailable', () => {
    walletBridge = undefined;
    const onBeforeExternalAction = vi.fn();
    const { result } = renderHandlers(onBeforeExternalAction);

    act(() => {
      result.current.handlers.view_token({ token: VALID_TOKEN });
    });

    expect(onBeforeExternalAction).not.toHaveBeenCalled();
    expect(mockNavigateInWallet).not.toHaveBeenCalled();
  });

  it('backgrounds after validating a mini app action', () => {
    const order: string[] = [];
    const onBeforeExternalAction = vi.fn(() => order.push('background'));
    mockOpenMiniAppFromSnap.mockImplementation(() => order.push('miniapp'));
    const { result } = renderHandlers(onBeforeExternalAction);

    act(() => {
      result.current.handlers.open_mini_app('https://mini.example/app');
    });

    expect(onBeforeExternalAction).toHaveBeenCalledTimes(1);
    expect(mockOpenMiniAppFromSnap).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['background', 'miniapp']);
  });

  it('backgrounds before opening an external URL', () => {
    const order: string[] = [];
    const onBeforeExternalAction = vi.fn(() => order.push('background'));
    vi.mocked(window.open).mockImplementation(() => {
      order.push('open');
      return null;
    });
    const { result } = renderHandlers(onBeforeExternalAction);

    act(() => {
      result.current.handlers.open_url('https://example.com/details');
    });

    expect(onBeforeExternalAction).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(
      'https://example.com/details',
      '_blank',
      'noopener,noreferrer',
    );
    expect(order).toEqual(['background', 'open']);
  });

  it('does not background invalid external URLs', () => {
    const onBeforeExternalAction = vi.fn();
    const { result } = renderHandlers(onBeforeExternalAction);

    act(() => {
      result.current.handlers.open_url('ftp://example.com/details');
    });

    expect(onBeforeExternalAction).not.toHaveBeenCalled();
    expect(window.open).not.toHaveBeenCalled();
  });

  it('simulates EVM transaction actions without executing them', () => {
    const onBeforeExternalAction = vi.fn();
    const { result } = renderHandlers(onBeforeExternalAction);

    act(() => {
      result.current.handlers.send_transaction({
        chainId: '0x2105',
        to: '0x0000000000000000000000000000000000000001',
        data: '0x1234',
        value: '0x0',
      });
    });

    expect(mockFetchEvmScanAction).toHaveBeenCalledWith({
      account: '0x0000000000000000000000000000000000000002',
      chainId: 8453,
      action: {
        method: 'eth_sendTransaction',
        params: {
          chainId: '0x2105',
          from: '0x0000000000000000000000000000000000000002',
          to: '0x0000000000000000000000000000000000000001',
          data: '0x1234',
          value: '0x0',
        },
      },
      domain: 'example.com',
    });
    expect(onBeforeExternalAction).not.toHaveBeenCalled();
    expect(mockOpenWarpcastWallet).not.toHaveBeenCalled();
    expect(mockSendToken).not.toHaveBeenCalled();
    expect(mockSwapToken).not.toHaveBeenCalled();
  });

  it('executes EVM transaction actions through the wallet provider when enabled', async () => {
    mockUsePostHogFeatureFlag.mockImplementation(
      (flag: string) => flag === 'snap-transaction-actions-execute',
    );
    const onBeforeExternalAction = vi.fn();
    const { result } = renderHandlers(onBeforeExternalAction);

    await act(async () => {
      await result.current.handlers.send_transaction({
        chainId: '0x2105',
        to: '0x0000000000000000000000000000000000000001',
        data: '0x1234',
        value: '0x0',
      });
    });

    expect(mockWalletProviderRequest).toHaveBeenCalledWith({
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
    expect(mockFetchEvmScanAction).not.toHaveBeenCalled();
    expect(onBeforeExternalAction).toHaveBeenCalledTimes(1);
  });

  it('tracks a snap transaction error when the wallet provider is unavailable', async () => {
    mockUsePostHogFeatureFlag.mockImplementation(
      (flag: string) => flag === 'snap-transaction-actions-execute',
    );
    walletProvider = undefined;
    const onBeforeExternalAction = vi.fn();
    const { result } = renderHandlers(onBeforeExternalAction);

    await act(async () => {
      await result.current.handlers.send_transaction({
        chainId: '0x2105',
        to: '0x0000000000000000000000000000000000000001',
        data: '0x1234',
        value: '0x0',
      });
    });

    expect(mockWalletProviderRequest).not.toHaveBeenCalled();
    expect(onBeforeExternalAction).not.toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'snap transaction error',
      expect.objectContaining({
        phase: 'wallet_unavailable',
        failureReason: 'wallet_unavailable',
        hasProvider: false,
        hasWalletRequest: true,
        chainId: '0x2105',
        numericChainId: 8453,
        to: '0x0000000000000000000000000000000000000001',
        hasData: true,
        dataByteLength: 2,
        hasValue: false,
        snapDomain: 'example.com',
        snapSourceBucket: 'self_hosted',
        snapUrl: 'https://example.com/snap',
      }),
    );
  });

  it('tracks a snap transaction error when the wallet provider rejects', async () => {
    mockUsePostHogFeatureFlag.mockImplementation(
      (flag: string) => flag === 'snap-transaction-actions-execute',
    );
    const error = Object.assign(new Error('wallet rejected the request'), {
      code: 4001,
    });
    mockWalletProviderRequest.mockRejectedValue(error);
    const { result } = renderHandlers();

    await act(async () => {
      await result.current.handlers.send_transaction({
        chainId: '0x2105',
        to: '0x0000000000000000000000000000000000000001',
        data: '0x1234',
        value: '0x0',
      });
    });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      'snap transaction error',
      expect.objectContaining({
        phase: 'provider_request',
        failureReason: 'rejected_by_user',
        errorName: 'Error',
        errorCode: 4001,
        errorMessage: 'wallet rejected the request',
        hasProvider: true,
        hasWalletRequest: true,
        snapTransactionActionsExecuteEnabled: true,
      }),
    );
    expect(mockSnapRequest).toHaveBeenCalledWith({
      method: 'POST',
      targetUrl: 'https://example.com/snap',
      payload: expect.objectContaining({
        type: 'transaction_result',
        transaction: {
          request: {
            chainId: '0x2105',
            to: '0x0000000000000000000000000000000000000001',
            data: '0x1234',
            value: '0x0',
          },
          result: {
            success: false,
            reason: 'rejected_by_user',
            message: 'wallet rejected the request',
            code: 4001,
          },
        },
      }),
    });
  });

  it('posts a transaction_result callback after a successful wallet transaction', async () => {
    mockUsePostHogFeatureFlag.mockImplementation(
      (flag: string) => flag === 'snap-transaction-actions-execute',
    );
    mockWalletProviderRequest.mockResolvedValue('0xabc123');
    const onBeforeExternalAction = vi.fn();
    const { result } = renderHandlers(onBeforeExternalAction);

    await act(async () => {
      await result.current.handlers.send_transaction({
        chainId: '0x2105',
        to: '0x0000000000000000000000000000000000000001',
        data: '0x1234',
        value: '0x0',
      });
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
  });

  it('does not background invalid mini app actions', () => {
    const onBeforeExternalAction = vi.fn();
    const { result } = renderHandlers(onBeforeExternalAction);

    act(() => {
      result.current.handlers.open_mini_app('not a url');
    });

    expect(onBeforeExternalAction).not.toHaveBeenCalled();
    expect(mockOpenMiniAppFromSnap).not.toHaveBeenCalled();
  });

  it('tracks snap handler events with source bucket analytics', () => {
    const { result } = renderHandlers();

    act(() => {
      result.current.handlers.view_channel({ channelKey: ' fc-devs ' });
    });

    expect(mockTrackEvent).toHaveBeenCalledWith('snap handler', {
      handler: 'view_channel',
      surface: 'cast_embed_web',
      snapDomain: 'example.com',
      snapSourceBucket: 'self_hosted',
      snapUrl: 'https://example.com/snap',
    });
  });
});
