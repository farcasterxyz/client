import {
  SolanaCombinedTransaction,
  SolanaConnection,
  SolanaConnectRequestArguments,
  SolanaSendOptions,
  SolanaSignMessageRequestArguments,
  SolanaSignTransactionRequestArguments,
} from '@farcaster/miniapp-core';
import {
  ApiChain,
  ApiEthFungibleTokenPosition,
  ApiEthNonFungibleToken,
  ApiPlatformType,
  ApiSwapIntent,
  ApiUser,
  ApiWalletSendTarget,
} from 'farcaster-client-data';
import type * as Provider from 'ox/Provider';
import type * as RpcSchema from 'ox/RpcSchema';
import { MutableRefObject } from 'react';
import { Address, Chain, JsonRpcAccount, Transport, WalletClient } from 'viem';

export type SlippageSettings =
  | {
      auto: true;
      lastSelectedSlippage: number;
    }
  | {
      auto: false;
      slippage: number;
    };

/**
 * Links an in-app-browser session (and its wallet txs) back to the wallet-links
 * card that opened it, for a click -> transaction funnel (NEYN-12452).
 */
export type WalletLinkAttribution = {
  id: string;
  name?: string;
  url: string;
  index?: number;
};

export type ConnectionContext = {
  domain: string;
  iconUrl?: string;
  source?: 'mini-app' | 'browser';
  origin?: string;
  pageTitle?: string;
  surface?: 'mini_app' | 'web_app';
  /**
   * Set when this connection originated from a wallet-links card, so preview
   * surfaces can emit wallet-link transaction funnel events (NEYN-12452).
   */
  walletLinkAttribution?: WalletLinkAttribution;
};

export type SendTargetWithAddress = ApiWalletSendTarget & {
  address: string;
};

export type SendTransactionArgs = {
  toAddress: string;
  data: string;
  weiValue: string;
  chainId?: string;
  gasLimit?: string;
  actionSource?: {
    url: string;
  };
};

export type SignTypedDataV4Args = {
  message: Record<string, unknown>;
  types: Record<string, unknown>;
  primaryType: string;
  domain?: {
    chainId?: number;
    name?: string;
    salt?: string;
    verifyingContract?: string;
    version?: string;
  };
};

export type WrappedResult<T> = Promise<T | 'wallet-not-installed'>;

export type ConnectResult =
  | {
      success: true;
    }
  | {
      success: false;
      errorReason: 'user_rejected' | 'unknown';
    };

export type SendTransactionResult =
  | {
      success: true;
      transactionHash: string;
    }
  | {
      success: false;
      errorReason: 'user_rejected' | 'unknown';
    };

export type SignatureResult =
  | {
      success: true;
      signature: string;
    }
  | {
      success: false;
      errorReason: 'user_rejected' | 'unknown';
    };

export const mwpWalletTypes = ['rainbow', 'coinbase'] as const;

export type MWPWalletType = (typeof mwpWalletTypes)[number];

export type EmbeddedWalletType = 'warpcast';

export type WalletType = MWPWalletType | EmbeddedWalletType;
export type WalletTypeWithoutCoinbase = Exclude<WalletType, 'coinbase'>;

export type InstallUrls = {
  android: string;
  ios: string;
};

export type BaseWalletConfig = {
  type: WalletType;
  name: string;
};

export type MWPWalletConfig = BaseWalletConfig & {
  type: MWPWalletType;
  hostUrl: string;
  hostPackageName: string;
  protocol: string;
  installUrls: InstallUrls;
};

export type WarpcastWalletConfig = BaseWalletConfig & {
  type: EmbeddedWalletType;
};

export type WalletConfig = MWPWalletConfig | WarpcastWalletConfig;

export type RequestFn = <
  methodName extends RpcSchema.ExtractMethodName<RpcSchema.Default>,
>(
  parameters: RpcSchema.ExtractRequest<RpcSchema.Default, methodName>,
) => Promise<RpcSchema.ExtractReturnType<RpcSchema.Default, methodName>>;

export type EvmWalletProvider = Provider.Provider<{
  schema: RpcSchema.Default;
  includeEvents: true;
}>;

export type SolanaSignAndSendTransactionRequestWithConnArguments = {
  method: 'signAndSendTransaction';
  params: {
    transaction: SolanaCombinedTransaction;
    connection: SolanaConnection;
    options?: SolanaSendOptions;
  };
};

export type SolanaRequestFnWithConn = ((
  request: SolanaConnectRequestArguments,
) => Promise<{ publicKey: string }>) &
  ((request: SolanaSignMessageRequestArguments) => Promise<{
    signature: string;
  }>) &
  ((request: SolanaSignAndSendTransactionRequestWithConnArguments) => Promise<{
    signature: string;
  }>) &
  (<T extends SolanaCombinedTransaction>(
    request: SolanaSignTransactionRequestArguments<T>,
  ) => Promise<{ signedTransaction: T }>);

export interface SolanaWalletProviderWithConn {
  request: SolanaRequestFnWithConn;

  signMessage(message: string): Promise<{ signature: string }>;
  signTransaction<T extends SolanaCombinedTransaction>(
    transaction: T,
  ): Promise<{ signedTransaction: T }>;
  signAndSendTransaction(input: {
    transaction: SolanaCombinedTransaction;
    connection: SolanaConnection;
  }): Promise<{ signature: string }>;
}

export type RpcRequest = RpcSchema.Default['Request'];

export type EvmPreviewRequest<
  method extends
    | 'eth_signTypedData_v4'
    | 'eth_sendTransaction'
    | 'eth_requestAccounts'
    | 'personal_sign'
    | 'wallet_sendCalls' =
    | 'eth_signTypedData_v4'
    | 'eth_sendTransaction'
    | 'eth_requestAccounts'
    | 'personal_sign'
    | 'wallet_sendCalls',
> = {
  approve: method extends 'eth_requestAccounts'
    ? (address: string) => Promise<void>
    : () => Promise<void>;
  reject: () => void;
  request: RpcSchema.ExtractRequest<RpcSchema.Default, method>;
};

export type SolanaConnectPreviewRequest = SolanaConnectRequestArguments & {
  approve: () => Promise<void>;
  reject: () => void;
};

export type SolanaSignMessagePreviewRequest =
  SolanaSignMessageRequestArguments & {
    solanaAddress: string;
    approve: () => Promise<void>;
    reject: () => void;
  };

export type SolanaSignAndSendTransactionPreviewRequest =
  SolanaSignAndSendTransactionRequestWithConnArguments & {
    solanaAddress: string;
    approve: () => Promise<void>;
    reject: () => void;
  };

export type SolanaSignTransactionPreviewRequest<
  T extends SolanaCombinedTransaction,
> = SolanaSignTransactionRequestArguments<T> & {
  solanaAddress: string;
  approve: () => Promise<void>;
  reject: () => void;
};

export type SolanaPreviewRequest =
  | SolanaConnectPreviewRequest
  | SolanaSignMessagePreviewRequest
  | SolanaSignAndSendTransactionPreviewRequest
  | SolanaSignTransactionPreviewRequest<SolanaCombinedTransaction>;

export type PreviewRequest =
  | {
      id: string;
      protocol: 'evm';
      evmPreviewRequest: EvmPreviewRequest;
      /**
       * Connection context captured from the surface that dispatched this
       * request, so the preview is attributed to it rather than whatever
       * surface last wrote the shared connectionContextRef (NEYN-12452).
       * Undefined for surfaces that don't thread it (web / mini-app), where
       * consumers fall back to getConnectionContext().
       */
      connectionContext?: ConnectionContext;
    }
  | {
      id: string;
      protocol: 'solana';
      solanaPreviewRequest: SolanaPreviewRequest;
      connectionContext?: ConnectionContext;
    };

export type GetWalletClient = <chain extends Chain = Chain>(
  chain: chain,
) => Promise<WalletClient<Transport, chain, JsonRpcAccount<Address>>>;

export interface Wallet {
  type: WalletType | undefined;
  provider: EvmWalletProvider;
  name: string | undefined;
  address: `0x${string}` | undefined;
  isInitialized: boolean;
  isConnected: boolean;
  connectionContextRef: MutableRefObject<ConnectionContext | undefined>;
  getWalletClient: GetWalletClient;

  initialize?: (params: WalletConfig) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;

  /**
   * @deprecated - interact with the wallet via viem client
   */
  sendTransaction?: (
    args: SendTransactionArgs,
  ) => WrappedResult<SendTransactionResult>;

  /**
   * @deprecated - interact with the wallet via viem client
   */
  signTypedDataV4?: (
    chainId: number,
    typedData: SignTypedDataV4Args,
  ) => WrappedResult<SignatureResult>;
  personalSign?: (message: string) => WrappedResult<SignatureResult>;
}

export const WALLET_CONFIGS: Record<WalletType, WalletConfig> = {
  warpcast: {
    type: 'warpcast',
    name: 'Farcaster',
  },
  coinbase: {
    type: 'coinbase',
    name: 'Coinbase Wallet',
    hostUrl: 'https://wallet.coinbase.com/wsegue',
    hostPackageName: 'org.toshi',
    protocol: 'cbwallet://',
    installUrls: {
      android:
        'https://play.google.com/store/apps/details?id=org.toshi&hl=en_US&gl=US',
      ios: 'https://apps.apple.com/us/app/coinbase-wallet-nfts-crypto/id1278383455',
    },
  },
  rainbow: {
    type: 'rainbow',
    name: 'Rainbow',
    hostUrl: 'https://rnbwapp.com/wsegue',
    hostPackageName: 'me.rainbow',
    protocol: 'rainbow://',
    installUrls: {
      android:
        'https://play.google.com/store/apps/details?id=me.rainbow&hl=en_US&gl=US',
      ios: 'https://apps.apple.com/us/app/rainbow-ethereum-wallet/id1457119021',
    },
  },
};

export type WalletSwapParams = {
  platformType: ApiPlatformType;
  swapIntent?: ApiSwapIntent;
  attributedDomain?: string;
  onSuccess?: (hashes: string[]) => void;
  onError?: (reason: string) => void;
  onSwapExecuted?: () => void;
  isBuy?: boolean;
  isSell?: boolean;
};

export type WalletSendIntent = {
  chain?: ApiChain;
  ca?: string;
  amount?: string;
  token?: ApiEthFungibleTokenPosition | ApiEthNonFungibleToken;
  recipientAddress?: string;
  recipientSolanaAddress?: string;
  recipientFid?: number;
  recipientUser?: ApiUser;
};

export type WalletSendParams = {
  platformType: ApiPlatformType;
  sendIntent?: WalletSendIntent;
  attributedDomain?: string;
  origin?: string;
  onSuccess?: (hash: string) => void;
  onError?: (reason: string) => void;
  onSendExecuted?: () => void;
};
