import {
  BrowserConnectApprovalDecision,
  BrowserConnectApprovalRequester,
  createBrowserProviderController,
} from '../BrowserProviderController';

let permissionRecord:
  | {
      origin: string;
      connectGranted: boolean;
      trusted: boolean;
      connectedAddress?: `0x${string}`;
    }
  | undefined;

const mockGetBrowserPermission = jest.fn(
  () => permissionRecord,
) as unknown as typeof import('../BrowserPermissionStore').getBrowserPermission;
const mockUpsertBrowserPermission = jest.fn(
  (_origin: string, update: Record<string, unknown>) => {
    permissionRecord = {
      origin: 'https://app.uniswap.org',
      connectGranted: (update.connectGranted as boolean) ?? true,
      trusted: (update.trusted as boolean) ?? false,
      connectedAddress: update.connectedAddress as `0x${string}` | undefined,
    };
    return permissionRecord;
  },
) as unknown as typeof import('../BrowserPermissionStore').upsertBrowserPermission;

jest.mock('../BrowserPermissionStore', () => ({
  getBrowserPermission: (
    ...args: Parameters<typeof mockGetBrowserPermission>
  ) => mockGetBrowserPermission(...args),
  upsertBrowserPermission: (
    ...args: Parameters<typeof mockUpsertBrowserPermission>
  ) => mockUpsertBrowserPermission(...args),
}));

const neverCalledApproval: BrowserConnectApprovalRequester = jest.fn(() => {
  throw new Error('requestConnectApproval should not be called');
});

function makeApproval(
  decision: BrowserConnectApprovalDecision,
): BrowserConnectApprovalRequester {
  return jest.fn(() => Promise.resolve(decision));
}

describe('BrowserProviderController', () => {
  beforeEach(() => {
    permissionRecord = undefined;
    jest.clearAllMocks();
  });

  it('reuses existing authorization without re-prompting provider', async () => {
    permissionRecord = {
      origin: 'https://app.uniswap.org',
      connectGranted: true,
      trusted: false,
      connectedAddress: '0x1111111111111111111111111111111111111111',
    };

    const requestMock = jest
      .fn()
      .mockResolvedValue(['0x1111111111111111111111111111111111111111']);

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 2,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x1111111111111111111111111111111111111111',
        evmMiniAppProvider: {
          request: requestMock,
        },
      } as never,
      requestConnectApproval: neverCalledApproval,
    });

    const response = await controller.handleRequest({
      id: '1',
      method: 'wallet_requestPermissions',
      params: [],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(requestMock).not.toHaveBeenCalled();
    expect(neverCalledApproval).not.toHaveBeenCalled();
    expect(response.error).toBeUndefined();
    expect(response.result).toEqual([
      {
        parentCapability: 'eth_accounts',
        caveats: [
          {
            type: 'restrictReturnedAccounts',
            value: ['0x1111111111111111111111111111111111111111'],
          },
        ],
        date: expect.any(Number),
      },
    ]);
  });

  it('auto-connects trusted origins without any UI prompt', async () => {
    permissionRecord = {
      origin: 'https://app.uniswap.org',
      connectGranted: true,
      trusted: true,
      connectedAddress: '0x1111111111111111111111111111111111111111',
    };

    const approvalMock =
      jest.fn() as unknown as BrowserConnectApprovalRequester;

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 3,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x1111111111111111111111111111111111111111',
        evmMiniAppProvider: {
          request: jest.fn(),
        },
      } as never,
      requestConnectApproval: approvalMock,
    });

    const response = await controller.handleRequest({
      id: '1',
      method: 'eth_requestAccounts',
      params: [],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(approvalMock).not.toHaveBeenCalled();
    expect(response.error).toBeUndefined();
    expect(response.result).toEqual([
      '0x1111111111111111111111111111111111111111',
    ]);
  });

  it('dedupes concurrent connect RPCs into one approval prompt', async () => {
    const approval = makeApproval({ type: 'connect', trusted: false });

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 1,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x2222222222222222222222222222222222222222',
        evmMiniAppProvider: {
          request: jest.fn(),
        },
      } as never,
      requestConnectApproval: approval,
    });

    const [permissionsResponse, accountsResponse] = await Promise.all([
      controller.handleRequest({
        id: '1',
        method: 'wallet_requestPermissions',
        params: [],
        origin: 'https://app.uniswap.org',
        url: 'https://app.uniswap.org/swap',
      }),
      controller.handleRequest({
        id: '2',
        method: 'eth_requestAccounts',
        params: [],
        origin: 'https://app.uniswap.org',
        url: 'https://app.uniswap.org/swap',
      }),
    ]);

    expect(approval).toHaveBeenCalledTimes(1);
    expect(permissionsResponse.error).toBeUndefined();
    expect(accountsResponse.error).toBeUndefined();
    expect(accountsResponse.result).toEqual([
      '0x2222222222222222222222222222222222222222',
    ]);
  });

  it('returns a user-rejected error when the approval is declined', async () => {
    const approval = makeApproval({ type: 'reject' });

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 1,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x2222222222222222222222222222222222222222',
        evmMiniAppProvider: {
          request: jest.fn(),
        },
      } as never,
      requestConnectApproval: approval,
    });

    const response = await controller.handleRequest({
      id: '1',
      method: 'eth_requestAccounts',
      params: [],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(approval).toHaveBeenCalledTimes(1);
    expect(response.result).toBeUndefined();
    expect(response.error).toEqual({
      code: 4001,
      message: 'User rejected the request',
    });
  });

  it('persists the trusted flag when the user taps Connect and trust', async () => {
    const approval = makeApproval({ type: 'connect', trusted: true });

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 1,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x5555555555555555555555555555555555555555',
        evmMiniAppProvider: {
          request: jest.fn(),
        },
      } as never,
      requestConnectApproval: approval,
    });

    const response = await controller.handleRequest({
      id: '1',
      method: 'eth_requestAccounts',
      params: [],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(response.error).toBeUndefined();
    expect(response.result).toEqual([
      '0x5555555555555555555555555555555555555555',
    ]);
    expect(mockUpsertBrowserPermission).toHaveBeenCalledWith(
      'https://app.uniswap.org',
      expect.objectContaining({
        connectGranted: true,
        trusted: true,
        connectedAddress: '0x5555555555555555555555555555555555555555',
      }),
    );
  });

  it('does not persist when the user taps Connect once', async () => {
    const approval = makeApproval({ type: 'connect', trusted: false });
    const onConnectAuthorized = jest.fn();

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 1,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x6666666666666666666666666666666666666666',
        evmMiniAppProvider: { request: jest.fn() },
      } as never,
      requestConnectApproval: approval,
      onConnectAuthorized,
    });

    const firstResponse = await controller.handleRequest({
      id: '1',
      method: 'eth_requestAccounts',
      params: [],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(firstResponse.error).toBeUndefined();
    expect(firstResponse.result).toEqual([
      '0x6666666666666666666666666666666666666666',
    ]);
    expect(mockUpsertBrowserPermission).not.toHaveBeenCalled();
    expect(onConnectAuthorized).toHaveBeenCalledWith({
      address: '0x6666666666666666666666666666666666666666',
      trusted: false,
    });

    // Within the same mount the ephemeral authorization keeps subsequent
    // calls from re-prompting.
    const secondResponse = await controller.handleRequest({
      id: '2',
      method: 'eth_accounts',
      params: [],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });
    expect(secondResponse.result).toEqual([
      '0x6666666666666666666666666666666666666666',
    ]);
    expect(approval).toHaveBeenCalledTimes(1);
  });

  it('allows protected RPCs after Connect once in the same session', async () => {
    const approval = makeApproval({ type: 'connect', trusted: false });
    const requestMock = jest.fn().mockResolvedValue('0xsigned');

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 1,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x6666666666666666666666666666666666666666',
        evmMiniAppProvider: { request: requestMock },
      } as never,
      requestConnectApproval: approval,
    });

    await controller.handleRequest({
      id: '1',
      method: 'eth_requestAccounts',
      params: [],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    const signResponse = await controller.handleRequest({
      id: '2',
      method: 'personal_sign',
      params: ['0x68656c6c6f', '0x6666666666666666666666666666666666666666'],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(signResponse).toEqual({ id: '2', result: '0xsigned' });
    expect(requestMock).toHaveBeenCalledWith({
      method: 'personal_sign',
      params: ['0x68656c6c6f', '0x6666666666666666666666666666666666666666'],
    });
  });

  it('allows protected RPCs when current-session authorization recreates the controller', async () => {
    const requestMock = jest.fn().mockResolvedValue('0xsigned');

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        sessionConnectedAddress: '0x6666666666666666666666666666666666666666',
        tier: 2,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x6666666666666666666666666666666666666666',
        evmMiniAppProvider: { request: requestMock },
      } as never,
      requestConnectApproval: neverCalledApproval,
    });

    const signResponse = await controller.handleRequest({
      id: '1',
      method: 'personal_sign',
      params: ['0x68656c6c6f', '0x6666666666666666666666666666666666666666'],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(signResponse).toEqual({ id: '1', result: '0xsigned' });
    expect(neverCalledApproval).not.toHaveBeenCalled();
  });

  it('re-prompts a Connect-once origin on a fresh mount', async () => {
    const approval = makeApproval({ type: 'connect', trusted: false });

    const firstController = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 1,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x7777777777777777777777777777777777777777',
        evmMiniAppProvider: { request: jest.fn() },
      } as never,
      requestConnectApproval: approval,
    });

    await firstController.handleRequest({
      id: '1',
      method: 'eth_requestAccounts',
      params: [],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(approval).toHaveBeenCalledTimes(1);

    // Simulate WebView unmount / reload / origin change by creating a
    // fresh controller with the same origin. No persisted permission
    // should carry over.
    const secondController = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 1,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x7777777777777777777777777777777777777777',
        evmMiniAppProvider: { request: jest.fn() },
      } as never,
      requestConnectApproval: approval,
    });

    const response = await secondController.handleRequest({
      id: '2',
      method: 'eth_requestAccounts',
      params: [],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(approval).toHaveBeenCalledTimes(2);
    expect(response.result).toEqual([
      '0x7777777777777777777777777777777777777777',
    ]);
  });

  it('rejects requests whose origin does not match the active session', async () => {
    const approval = neverCalledApproval;

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 3,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x1111111111111111111111111111111111111111',
        evmMiniAppProvider: { request: jest.fn() },
      } as never,
      requestConnectApproval: approval,
    });

    const response = await controller.handleRequest({
      id: '1',
      method: 'eth_accounts',
      params: [],
      origin: 'https://evil.example.com',
      url: 'https://evil.example.com/spoof',
    });

    expect(response.result).toBeUndefined();
    expect(response.error?.code).toBe(4100);
    expect(approval).not.toHaveBeenCalled();
  });

  it('rejects every RPC when the session has no origin (non-https/unsafe pages)', async () => {
    const approval = neverCalledApproval;

    const controller = createBrowserProviderController({
      session: {
        origin: undefined,
        tier: 0,
        secureTopLevelOrigin: false,
        injectEnabled: false,
      } as never,
      embeddedWallet: {
        evmAddress: '0x1111111111111111111111111111111111111111',
        evmMiniAppProvider: { request: jest.fn() },
      } as never,
      requestConnectApproval: approval,
    });

    const response = await controller.handleRequest({
      id: '1',
      method: 'eth_requestAccounts',
      params: [],
      origin: 'http://example.com',
      url: 'http://example.com/',
    });

    expect(response.error?.code).toBe(4100);
    expect(approval).not.toHaveBeenCalled();
  });

  it('forwards wallet_switchEthereumChain and emits chainChanged after success', async () => {
    permissionRecord = {
      origin: 'https://app.uniswap.org',
      connectGranted: true,
      trusted: true,
      connectedAddress: '0x1111111111111111111111111111111111111111',
    };
    const requestMock = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('0x2105');
    const onChainChanged = jest.fn();

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 3,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x1111111111111111111111111111111111111111',
        evmMiniAppProvider: { request: requestMock },
      } as never,
      requestConnectApproval: neverCalledApproval,
      onChainChanged,
    });

    const response = await controller.handleRequest({
      id: '1',
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x2105' }],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(response).toEqual({ id: '1', result: null });
    expect(requestMock).toHaveBeenNthCalledWith(1, {
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x2105' }],
    });
    expect(requestMock).toHaveBeenNthCalledWith(2, {
      method: 'eth_chainId',
    });
    expect(onChainChanged).toHaveBeenCalledWith('0x2105');
  });

  it('maps a rejected signing request to { id, error } instead of throwing', async () => {
    // The embedded wallet's confirm sheet rejects the underlying preview
    // request when the user taps Cancel or swipes it away. That reject
    // surfaces here as a thrown error. Without a translation into a
    // response payload, the bridge silently drops the error and the
    // dApp's window.ethereum promise stays pending ("pending approval"
    // stuck state in RainbowKit / wagmi).
    permissionRecord = {
      origin: 'https://app.uniswap.org',
      connectGranted: true,
      trusted: true,
      connectedAddress: '0x1111111111111111111111111111111111111111',
    };

    const userRejected = Object.assign(new Error('User rejected the request'), {
      code: 4001,
    });
    const requestMock = jest.fn().mockRejectedValue(userRejected);

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 3,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x1111111111111111111111111111111111111111',
        evmMiniAppProvider: { request: requestMock },
      } as never,
      requestConnectApproval: neverCalledApproval,
    });

    const response = await controller.handleRequest({
      id: 'tx-1',
      method: 'eth_sendTransaction',
      params: [
        {
          from: '0x1111111111111111111111111111111111111111',
          to: '0x2222222222222222222222222222222222222222',
          value: '0x0',
        },
      ],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(response.result).toBeUndefined();
    expect(response.error).toEqual({
      code: 4001,
      message: 'User rejected the request',
    });
  });

  it('maps a thrown RPC error on eth_call to an error response', async () => {
    permissionRecord = {
      origin: 'https://app.uniswap.org',
      connectGranted: true,
      trusted: true,
      connectedAddress: '0x1111111111111111111111111111111111111111',
    };

    const requestMock = jest
      .fn()
      .mockRejectedValue(new Error('chain not reachable'));

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 3,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x1111111111111111111111111111111111111111',
        evmMiniAppProvider: { request: requestMock },
      } as never,
      requestConnectApproval: neverCalledApproval,
    });

    const response = await controller.handleRequest({
      id: 'call-1',
      method: 'eth_call',
      params: [],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/',
    });

    expect(response.result).toBeUndefined();
    expect(response.error?.code).toBe(-32603);
    expect(response.error?.message).toBe('chain not reachable');
  });

  it('does not turn an unannotated wallet failure into a fake user reject (eth_sendTransaction)', async () => {
    // Real cancels surface as Provider.UserRejectedRequestError with code
    // 4001. An *unannotated* throw from the embedded wallet (e.g. a Privy
    // / keychain / RPC failure mid-confirm with no `code`) used to be
    // forwarded to the dApp as { code: 4001, message: 'User rejected the
    // request' }, indistinguishable from a real user cancel. dApps then
    // showed "user cancelled" for what was actually an internal wallet
    // error. We now forward -32603 (internal error) for unannotated
    // throws and only preserve 4001 when it is set on the original error.
    permissionRecord = {
      origin: 'https://app.uniswap.org',
      connectGranted: true,
      trusted: true,
      connectedAddress: '0x1111111111111111111111111111111111111111',
    };

    const requestMock = jest
      .fn()
      .mockRejectedValue(new Error('Privy provider crashed'));

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 3,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x1111111111111111111111111111111111111111',
        evmMiniAppProvider: { request: requestMock },
      } as never,
      requestConnectApproval: neverCalledApproval,
    });

    const response = await controller.handleRequest({
      id: 'tx-1',
      method: 'eth_sendTransaction',
      params: [{}],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(response.result).toBeUndefined();
    expect(response.error?.code).toBe(-32603);
    expect(response.error?.message).toBe('Privy provider crashed');
  });

  it('preserves an explicit 4001 / UserRejectedRequestError code on protected RPCs', async () => {
    permissionRecord = {
      origin: 'https://app.uniswap.org',
      connectGranted: true,
      trusted: true,
      connectedAddress: '0x1111111111111111111111111111111111111111',
    };

    const userRejection = Object.assign(
      new Error('User rejected the request'),
      {
        code: 4001,
      },
    );

    const requestMock = jest.fn().mockRejectedValue(userRejection);

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 3,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x1111111111111111111111111111111111111111',
        evmMiniAppProvider: { request: requestMock },
      } as never,
      requestConnectApproval: neverCalledApproval,
    });

    const response = await controller.handleRequest({
      id: 'tx-2',
      method: 'eth_sendTransaction',
      params: [{}],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(response.result).toBeUndefined();
    expect(response.error?.code).toBe(4001);
    expect(response.error?.message).toBe('User rejected the request');
  });

  it('preserves an explicit non-4001 RPC error code on protected RPCs', async () => {
    permissionRecord = {
      origin: 'https://app.uniswap.org',
      connectGranted: true,
      trusted: true,
      connectedAddress: '0x1111111111111111111111111111111111111111',
    };

    const rpcError = Object.assign(new Error('Insufficient funds for gas'), {
      code: -32000,
    });

    const requestMock = jest.fn().mockRejectedValue(rpcError);

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 3,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x1111111111111111111111111111111111111111',
        evmMiniAppProvider: { request: requestMock },
      } as never,
      requestConnectApproval: neverCalledApproval,
    });

    const response = await controller.handleRequest({
      id: 'tx-3',
      method: 'eth_sendTransaction',
      params: [{}],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(response.result).toBeUndefined();
    expect(response.error?.code).toBe(-32000);
    expect(response.error?.message).toBe('Insufficient funds for gas');
  });

  it('does not reuse a stale disconnected address', async () => {
    permissionRecord = {
      origin: 'https://app.uniswap.org',
      connectGranted: false,
      trusted: false,
      connectedAddress: '0x3333333333333333333333333333333333333333',
    };

    const approval = makeApproval({ type: 'connect', trusted: false });

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 1,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x4444444444444444444444444444444444444444',
        evmMiniAppProvider: {
          request: jest.fn(),
        },
      } as never,
      requestConnectApproval: approval,
    });

    const response = await controller.handleRequest({
      id: '1',
      method: 'eth_requestAccounts',
      params: [],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(approval).toHaveBeenCalledTimes(1);
    expect(response.error).toBeUndefined();
    expect(response.result).toEqual([
      '0x4444444444444444444444444444444444444444',
    ]);
  });

  it('does not expose a trusted address after the active wallet changes', async () => {
    permissionRecord = {
      origin: 'https://app.uniswap.org',
      connectGranted: true,
      trusted: true,
      connectedAddress: '0x3333333333333333333333333333333333333333',
    };

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 3,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x4444444444444444444444444444444444444444',
        evmMiniAppProvider: {
          request: jest.fn(),
        },
      } as never,
      requestConnectApproval: neverCalledApproval,
    });

    const response = await controller.handleRequest({
      id: '1',
      method: 'eth_accounts',
      params: [],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(neverCalledApproval).not.toHaveBeenCalled();
    expect(response.error).toBeUndefined();
    expect(response.result).toEqual([]);
  });

  it('uses the address selected when the browser connect approval resolves', async () => {
    const approval = makeApproval({
      type: 'connect',
      trusted: true,
      address: '0x5555555555555555555555555555555555555555',
    });

    const controller = createBrowserProviderController({
      session: {
        origin: 'https://app.uniswap.org',
        tier: 1,
        secureTopLevelOrigin: true,
        injectEnabled: true,
      },
      embeddedWallet: {
        evmAddress: '0x4444444444444444444444444444444444444444',
        evmMiniAppProvider: {
          request: jest.fn(),
        },
      } as never,
      requestConnectApproval: approval,
    });

    const response = await controller.handleRequest({
      id: '1',
      method: 'eth_requestAccounts',
      params: [],
      origin: 'https://app.uniswap.org',
      url: 'https://app.uniswap.org/swap',
    });

    expect(response.error).toBeUndefined();
    expect(response.result).toEqual([
      '0x5555555555555555555555555555555555555555',
    ]);
    expect(mockUpsertBrowserPermission).toHaveBeenCalledWith(
      'https://app.uniswap.org',
      expect.objectContaining({
        connectedAddress: '0x5555555555555555555555555555555555555555',
      }),
    );
  });
});
