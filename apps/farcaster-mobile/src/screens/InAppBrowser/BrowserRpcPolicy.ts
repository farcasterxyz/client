import { BrowserPermissionTier, BrowserProviderRequest } from './BrowserTypes';

const TIER_ONE_ALLOWLIST = new Set([
  'eth_chainId',
  'eth_accounts',
  'wallet_getPermissions',
  'wallet_getCapabilities',
  'net_version',
]);
const TIER_TWO_ALLOWLIST = new Set([
  'eth_chainId',
  'eth_accounts',
  'eth_requestAccounts',
  'wallet_getPermissions',
  'wallet_getCapabilities',
  'net_version',
  'eth_blockNumber',
  'eth_gasPrice',
  'eth_estimateGas',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_getTransactionByHash',
  'eth_getBalance',
  'eth_getCode',
  'eth_getStorageAt',
  'eth_getBlockByNumber',
  'eth_getLogs',
  'eth_call',
  'personal_sign',
  'eth_signTypedData_v4',
  'eth_sendTransaction',
  'wallet_sendCalls',
  'wallet_switchEthereumChain',
  'wallet_getCallsStatus',
  'wallet_showCallsStatus',
]);
const BLOCKED_METHODS = new Set(['wallet_addEthereumChain', 'eth_sign']);

export type BrowserRpcPolicyDecision =
  | {
      allowed: true;
      requiresConnectPrompt: boolean;
    }
  | {
      allowed: false;
      errorCode: number;
      errorMessage: string;
    };

export function evaluateBrowserRpcPolicy({
  tier,
  request,
  injectEnabled,
}: {
  tier: BrowserPermissionTier;
  request: BrowserProviderRequest;
  injectEnabled: boolean;
}): BrowserRpcPolicyDecision {
  if (!injectEnabled) {
    return {
      allowed: false,
      errorCode: 4100,
      errorMessage: 'Wallet provider unavailable for this origin',
    };
  }

  if (BLOCKED_METHODS.has(request.method)) {
    return {
      allowed: false,
      errorCode: 4200,
      errorMessage: `Unsupported method: ${request.method}`,
    };
  }

  if (
    request.method === 'eth_requestAccounts' ||
    request.method === 'wallet_requestPermissions'
  ) {
    if (tier < 1) {
      return {
        allowed: false,
        errorCode: 4100,
        errorMessage: 'Unauthorized request',
      };
    }
    return {
      allowed: true,
      requiresConnectPrompt: true,
    };
  }

  if (tier <= 1 && !TIER_ONE_ALLOWLIST.has(request.method)) {
    return {
      allowed: false,
      errorCode: 4100,
      errorMessage: `Method requires wallet connection: ${request.method}`,
    };
  }

  if (tier >= 2 && TIER_TWO_ALLOWLIST.has(request.method)) {
    return { allowed: true, requiresConnectPrompt: false };
  }

  if (tier <= 1 && TIER_ONE_ALLOWLIST.has(request.method)) {
    return { allowed: true, requiresConnectPrompt: false };
  }

  return {
    allowed: false,
    errorCode: 4200,
    errorMessage: `Unsupported method: ${request.method}`,
  };
}
