import { Hex } from 'viem';

export type BrowserPermissionRecord = {
  origin: string;
  connectGranted: boolean;
  trusted: boolean;
  connectedAddress?: Hex;
  grantedAt?: number;
  lastUsedAt?: number;
  revokedAt?: number;
};

export type BrowserPermissionTier = 0 | 1 | 2 | 3;

export type BrowserSession = {
  origin?: string;
  pageTitle?: string;
  url?: string;
  sessionConnectedAddress?: Hex;
  tier: BrowserPermissionTier;
  secureTopLevelOrigin: boolean;
  injectEnabled: boolean;
};

export type BrowserProviderRequest = {
  id: string;
  method: string;
  params: unknown;
  origin?: string;
  url?: string;
};

export type BrowserProviderResponse = {
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
};

export type BrowserProviderEvent = {
  type: 'accountsChanged' | 'chainChanged';
  payload: unknown;
};
