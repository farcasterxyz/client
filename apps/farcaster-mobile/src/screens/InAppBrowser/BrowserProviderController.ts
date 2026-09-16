import { EmbeddedWalletContextType } from 'farcaster-expo';

import { normalizeOriginFromUrl } from './BrowserOriginController';
import {
  getBrowserPermission,
  upsertBrowserPermission,
} from './BrowserPermissionStore';
import { evaluateBrowserRpcPolicy } from './BrowserRpcPolicy';
import { BrowserProviderRequest, BrowserSession } from './BrowserTypes';

const ETH_ACCOUNTS_PERMISSION = 'eth_accounts';

/**
 * Normalize a thrown error into the EIP-1193 `{ code, message }` shape we
 * forward to the dApp.
 *
 * Critical: when the error carries no explicit `code` we fall back to
 * `-32603` (internal JSON-RPC error), NOT `4001`. Defaulting to `4001`
 * here previously caused every Privy / keychain / RPC failure during a
 * confirm to surface to the dApp as a synthetic "user rejected the
 * request", indistinguishable from an actual cancel. Real cancels raised
 * via `Provider.UserRejectedRequestError` (or anything else with
 * `code === 4001`) still propagate as 4001 because we only fall back
 * when `code` is missing.
 */
function toRpcError(
  err: unknown,
  fallbackMessage = 'Internal wallet error',
): { code: number; message: string } {
  const explicitCode = (err as { code?: unknown } | null)?.code;
  const code =
    typeof explicitCode === 'number' && Number.isFinite(explicitCode)
      ? explicitCode
      : -32603;
  const explicitMessage = (err as { message?: unknown } | null)?.message;
  const message =
    typeof explicitMessage === 'string' && explicitMessage.length > 0
      ? explicitMessage
      : code === 4001
        ? 'User rejected the request'
        : fallbackMessage;
  return { code, message };
}

function buildEthAccountsPermission(accounts: string[]) {
  return [
    {
      parentCapability: ETH_ACCOUNTS_PERMISSION,
      caveats: [
        {
          type: 'restrictReturnedAccounts',
          value: accounts,
        },
      ],
      date: Date.now(),
    },
  ];
}

function requestedEthAccountsPermission(params: unknown): boolean {
  if (!Array.isArray(params) || params.length === 0) {
    return true;
  }
  const [firstParam] = params;
  if (
    !firstParam ||
    typeof firstParam !== 'object' ||
    Array.isArray(firstParam)
  ) {
    return false;
  }
  return ETH_ACCOUNTS_PERMISSION in firstParam;
}

export type BrowserConnectApprovalDecision =
  | { type: 'connect'; trusted: boolean; address?: `0x${string}` }
  | { type: 'reject' };

export type BrowserConnectApprovalRequester = (ctx: {
  origin: string;
  previouslyTrusted: boolean;
}) => Promise<BrowserConnectApprovalDecision>;

type BrowserProviderControllerArgs = {
  session: BrowserSession;
  embeddedWallet: EmbeddedWalletContextType;
  requestConnectApproval: BrowserConnectApprovalRequester;
  onConnectAuthorized?: (ctx: {
    address: `0x${string}`;
    trusted: boolean;
  }) => void;
  onChainChanged?: (chainId: `0x${string}`) => void;
  onUnsupportedRpc?: (method: string) => void;
};

export function createBrowserProviderController({
  session,
  embeddedWallet,
  requestConnectApproval,
  onConnectAuthorized,
  onChainChanged,
  onUnsupportedRpc,
}: BrowserProviderControllerArgs) {
  const pendingRequestIds = new Set<string>();
  let pendingConnectRequest: Promise<string[]> | undefined;
  let lastConnectAccounts: string[] | undefined;
  let lastConnectAt = 0;
  let connectAuthorizedInSession = false;

  const readPersistedPermission = () =>
    session.origin ? getBrowserPermission(session.origin) : undefined;

  const getAlreadyAuthorizedAccounts = (): string[] => {
    const currentAddress = embeddedWallet.evmAddress?.toLowerCase();
    if (lastConnectAccounts && lastConnectAccounts.length > 0) {
      const matchingLastConnectAccounts = lastConnectAccounts.filter(
        (account) => account.toLowerCase() === currentAddress,
      );
      if (matchingLastConnectAccounts.length > 0) {
        return matchingLastConnectAccounts;
      }
    }

    const persistedPermission = readPersistedPermission();
    const persistedAddress = persistedPermission?.connectGranted
      ? persistedPermission.connectedAddress
      : undefined;
    if (persistedAddress && persistedAddress.toLowerCase() === currentAddress) {
      return [persistedAddress];
    }

    if (
      session.sessionConnectedAddress &&
      session.sessionConnectedAddress.toLowerCase() === currentAddress
    ) {
      return [session.sessionConnectedAddress];
    }

    if (connectAuthorizedInSession && embeddedWallet.evmAddress) {
      return [embeddedWallet.evmAddress];
    }

    return [];
  };

  const resolveConnectAccounts = (): Promise<string[]> => {
    const existing = getAlreadyAuthorizedAccounts();
    if (existing.length > 0) {
      connectAuthorizedInSession = true;
      lastConnectAccounts = existing;
      lastConnectAt = Date.now();
      return Promise.resolve(existing);
    }

    const recentlyConnected =
      lastConnectAccounts &&
      Date.now() - lastConnectAt < 1500 &&
      lastConnectAccounts.length > 0;
    if (recentlyConnected) {
      return Promise.resolve(lastConnectAccounts as string[]);
    }

    if (!pendingConnectRequest) {
      pendingConnectRequest = (async () => {
        if (!session.origin) {
          const err = new Error(
            'Browser wallet origin not available',
          ) as Error & {
            code?: number;
          };
          err.code = 4100;
          throw err;
        }

        const decision = await requestConnectApproval({
          origin: session.origin,
          previouslyTrusted: readPersistedPermission()?.trusted ?? false,
        });

        if (decision.type === 'reject') {
          const err = new Error('User rejected the request') as Error & {
            code?: number;
          };
          err.code = 4001;
          throw err;
        }

        const address = decision.address ?? embeddedWallet.evmAddress;
        if (!address) {
          const err = new Error(
            'No wallet available for this origin',
          ) as Error & {
            code?: number;
          };
          err.code = 4100;
          throw err;
        }

        const accounts = [address];
        // "Connect once" (decision.trusted === false) authorizes for the
        // current mount only — the approval lives in the closure-local
        // lastConnectAccounts / connectAuthorizedInSession state below,
        // which is reset when the controller is recreated on
        // navigation / reload / unmount. Persisting via
        // upsertBrowserPermission would make "once" silently behave like
        // "trust" on the next visit, contradicting the button's label.
        if (decision.trusted) {
          upsertBrowserPermission(session.origin, {
            connectGranted: true,
            trusted: true,
            connectedAddress: address as `0x${string}`,
          });
        }
        lastConnectAccounts = accounts;
        lastConnectAt = Date.now();
        connectAuthorizedInSession = true;
        onConnectAuthorized?.({
          address: address as `0x${string}`,
          trusted: decision.trusted,
        });
        return accounts;
      })().finally(() => {
        pendingConnectRequest = undefined;
      });
    }

    return pendingConnectRequest;
  };

  const clearPendingRequests = () => {
    pendingRequestIds.clear();
  };

  const handleRequest = async (request: BrowserProviderRequest) => {
    pendingRequestIds.add(request.id);

    const requestOrigin =
      request.origin ??
      (request.url ? normalizeOriginFromUrl(request.url) : undefined);

    if (!session.origin || requestOrigin !== session.origin) {
      pendingRequestIds.delete(request.id);
      return {
        id: request.id,
        error: {
          code: 4100,
          message: 'Browser wallet origin no longer matches the active page',
        },
      };
    }

    const authorizedAccounts = getAlreadyAuthorizedAccounts();
    const effectiveTier =
      authorizedAccounts.length > 0
        ? session.tier < 2
          ? 2
          : session.tier
        : session.tier === 0
          ? 0
          : 1;
    const decision = evaluateBrowserRpcPolicy({
      tier: effectiveTier,
      request,
      injectEnabled: session.injectEnabled,
    });
    if (!decision.allowed) {
      onUnsupportedRpc?.(request.method);
      pendingRequestIds.delete(request.id);
      return {
        id: request.id,
        error: {
          code: decision.errorCode,
          message: decision.errorMessage,
        },
      };
    }

    try {
      switch (request.method) {
        case 'eth_chainId': {
          const chainId = await embeddedWallet.evmMiniAppProvider.request({
            method: 'eth_chainId',
          });
          return { id: request.id, result: chainId };
        }
        case 'net_version': {
          const chainId = await embeddedWallet.evmMiniAppProvider.request({
            method: 'eth_chainId',
          });
          return {
            id: request.id,
            result: parseInt(chainId, 16).toString(),
          };
        }
        case 'eth_accounts': {
          const existing = getAlreadyAuthorizedAccounts();
          if (existing.length > 0) {
            return { id: request.id, result: existing };
          }
          return { id: request.id, result: [] };
        }
        case 'eth_requestAccounts': {
          try {
            const accounts = await resolveConnectAccounts();
            return { id: request.id, result: accounts };
          } catch (err) {
            return { id: request.id, error: toRpcError(err) };
          }
        }
        case 'wallet_getPermissions': {
          const existing = getAlreadyAuthorizedAccounts();
          if (existing.length > 0) {
            return {
              id: request.id,
              result: buildEthAccountsPermission(existing),
            };
          }
          return { id: request.id, result: [] };
        }
        case 'wallet_getCapabilities': {
          return { id: request.id, result: {} };
        }
        case 'wallet_switchEthereumChain': {
          try {
            const result = await embeddedWallet.evmMiniAppProvider.request({
              method: 'wallet_switchEthereumChain',
              params: request.params as never,
            } as never);
            const chainId = await embeddedWallet.evmMiniAppProvider.request({
              method: 'eth_chainId',
            });
            if (chainId) {
              onChainChanged?.(chainId as `0x${string}`);
            }
            return { id: request.id, result };
          } catch (err) {
            return {
              id: request.id,
              error: toRpcError(err, 'Failed to switch chain'),
            };
          }
        }
        case 'wallet_requestPermissions': {
          if (!requestedEthAccountsPermission(request.params)) {
            return {
              id: request.id,
              error: {
                code: 4200,
                message: 'Unsupported permission request',
              },
            };
          }
          try {
            const accounts = await resolveConnectAccounts();
            return {
              id: request.id,
              result: buildEthAccountsPermission(accounts),
            };
          } catch (err) {
            return { id: request.id, error: toRpcError(err) };
          }
        }
        case 'eth_blockNumber':
        case 'eth_gasPrice':
        case 'eth_estimateGas':
        case 'eth_getTransactionCount':
        case 'eth_getTransactionReceipt':
        case 'eth_getTransactionByHash':
        case 'eth_getBalance':
        case 'eth_getCode':
        case 'eth_getStorageAt':
        case 'eth_getBlockByNumber':
        case 'eth_getLogs':
        case 'eth_call':
        case 'wallet_getCallsStatus':
        case 'wallet_showCallsStatus': {
          try {
            const result = await embeddedWallet.evmMiniAppProvider.request({
              method: request.method,
              params: request.params as never,
            } as never);
            return { id: request.id, result };
          } catch (err) {
            return {
              id: request.id,
              error: toRpcError(err, 'RPC request failed'),
            };
          }
        }
        case 'personal_sign':
        case 'eth_signTypedData_v4':
        case 'eth_sendTransaction':
        case 'wallet_sendCalls': {
          // The embedded wallet confirm sheet resolves/rejects the underlying
          // preview request. A reject (tap Cancel, swipe-to-dismiss, tap the
          // backdrop) surfaces here as a thrown error; we must translate it
          // into a { id, error } response so the dApp clears its "pending
          // approval" state instead of waiting forever.
          //
          // toRpcError preserves the underlying error's code when set
          // (e.g. UserRejectedRequestError -> 4001) and only falls back to
          // -32603 (internal error) for unannotated throws. Defaulting these
          // to 4001 used to surface every Privy / keychain / RPC failure
          // mid-confirm as a fake "user cancelled" to the dApp.
          try {
            const result = await embeddedWallet.evmMiniAppProvider.request({
              method: request.method,
              params: request.params as never,
            } as never);
            return { id: request.id, result };
          } catch (err) {
            return { id: request.id, error: toRpcError(err) };
          }
        }
        default: {
          onUnsupportedRpc?.(request.method);
          return {
            id: request.id,
            error: {
              code: 4200,
              message: `Unsupported method: ${request.method}`,
            },
          };
        }
      }
    } finally {
      pendingRequestIds.delete(request.id);
    }
  };

  return {
    pendingRequestIds,
    clearPendingRequests,
    handleRequest,
  };
}
