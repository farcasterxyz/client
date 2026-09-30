import {
  SendToken,
  SignIn,
  SolanaWalletProvider,
  SwapToken,
} from '@farcaster/miniapp-core';
import {
  ApiChain,
  ApiJsonFarcasterSignature,
  ApiSwapIntent,
} from 'farcaster-client-data';
import { Provider, Siwe } from 'ox';
import * as React from 'react';

import { AppThemeName } from '~/hooks/theme/useAppTheme';

export type EmbeddedWalletBridgeContextType = {
  id: string;
  initialized: boolean;
  ethProvider: Provider.Provider;
  isConnected: boolean;
  initialize: (
    iframe: HTMLIFrameElement,
    id: string,
    sourceWindow?: Window,
  ) => void;
  navigate: (options: {
    path: string;
    params?: unknown;
    inParent?: boolean;
  }) => void;
  sendToken: (options: {
    sendIntent?: {
      chain: ApiChain;
      ca: string;
      amount?: string;
      recipientAddress?: string;
      recipientFid?: number;
    };
    attributedDomain?: string;
  }) => Promise<SendToken.SendTokenResult>;
  swapToken: (options: {
    swapIntent?: ApiSwapIntent;
    attributedDomain?: string;
  }) => Promise<SwapToken.SwapTokenResult>;
  signInWithAuthAddress: (options: {
    message: Omit<Siwe.Message, 'address'>;
  }) => Promise<SignIn.SignInResult>;
  silentlySignAuthMessage: (options: {
    message: string;
  }) => Promise<{ signature: `0x${string}` }>;
  silentlySignManifest: (options: {
    domain: string;
  }) => Promise<ApiJsonFarcasterSignature>;
  refresh: () => void;
  clearPreviewRequests: () => void;
  connectionContextRef: React.MutableRefObject<
    | {
        domain: string;
        iconUrl?: string;
      }
    | undefined
  >;
  solanaProvider: SolanaWalletProvider;
  onTransactionStateChange: (
    listener: (
      state: 'confirmed' | 'cancelled' | 'pending' | 'failed',
      metadata?: { type?: string; [key: string]: unknown },
    ) => void,
  ) => () => void;
  updateWalletTheme: (iframe: HTMLIFrameElement, theme: AppThemeName) => void;
};

const EmbeddedWalletBridgeContext = React.createContext<
  EmbeddedWalletBridgeContextType | undefined
>(undefined);

export { EmbeddedWalletBridgeContext };
