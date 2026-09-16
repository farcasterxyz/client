import type { ComposeCast } from '@farcaster/miniapp-core';
import {
  ApiCaststormCast,
  ApiChain,
  ApiEthNonFungibleToken,
  ApiLimitOrder,
  ApiOnchainTokenMinimal,
  ApiOnchainTransactionSwapEmbed,
  ApiTokenLink,
  ApiTokenNewsItem,
  ApiTrendingTokensTimeWindow,
  ApiUser,
  ApiUserMinimal,
} from 'farcaster-client-data';
import * as React from 'react';

import { WalletSendParams, WalletSwapParams } from '../types/wallet';

export type DebugEmbeddedWalletParams = {
  path: 'DebugEmbeddedWallet';
  params?: Record<string, never>;
};

export type CreateCastParams = {
  path: 'CreateCast';
  params?: {
    intent?: {
      text: string;
      embeds: string[];
      mentions: ApiUser[];
      channelKey?: string;
      activeDraftId?: string;
      tokenKey?: string;
      parentCastHash?: string;
      draftCasts?: ApiCaststormCast[];
      scheduledAt?: Date;
    };
    placeholder?: string;
    onSuccess?: (cast: ComposeCast.Result<false>['cast']) => void;
    onDismiss?: () => void;
    banner?: {
      type: 'swap';
      sellToken: ApiOnchainTokenMinimal;
      buyToken: ApiOnchainTokenMinimal;
      sellAmount: number;
      buyAmount: number;
      mode: 'buy' | 'sell';
    };
    optimisticTxEmbed?: ApiOnchainTransactionSwapEmbed;
  };
};

export type NavigationActions =
  | DebugEmbeddedWalletParams
  | CreateCastParams
  | {
      path: 'RecoverWalletAccount';
      params?: Record<string, never>;
    }
  | {
      path: 'Wallet';
      params?: { initialTab?: 'orders'; limitOrderId?: string };
    }
  | {
      path: 'WalletSend';
      params?: WalletSendParams;
    }
  | {
      path: 'WalletSendCollectible';
      params: { data: ApiEthNonFungibleToken };
    }
  | {
      path: 'WalletSwap';
      params: WalletSwapParams & {
        // Web only: after picking a token from the entry picker, replace into
        // Main without re-running the "no token → open picker" remap.
        resumeMain?: boolean;
      };
    }
  | {
      path: 'WalletSwapSelectSell';
      params?: Record<string, never>;
    }
  | {
      path: 'WalletSwapSelectBuy';
      params?: Record<string, never>;
    }
  | {
      path: 'WalletSwapDebug';
      params?: Record<string, never>;
    }
  | {
      path: 'WalletLimitOrder';
      params: {
        kind: 'buy' | 'sell';
        initialToken?: ApiTokenLink;
        // Web only: after picking a token from the entry picker, replace into
        // Main without re-running the "no token → open picker" remap.
        resumeMain?: boolean;
      };
    }
  | {
      path: 'WalletLimitOrderSelectToken';
      params?: Record<string, never>;
    }
  | {
      path: 'WalletLimitOrderSelectFundingToken';
      params?: Record<string, never>;
    }
  | {
      path: 'WalletLimitOrderFills';
      params: { order: ApiLimitOrder };
    }
  | {
      path: 'WalletReceive';
      params?: Record<string, never>;
    }
  | {
      path: 'WalletReceiveOnChain';
      params: { chain: ApiChain };
    }
  | {
      path: 'WalletActivity';
      params?: Record<string, never>;
    }
  | {
      path: 'Token';
      params: {
        chain: ApiChain;
        ca: string;
        via: string;
        attributedDomain?: string;
      };
    }
  | {
      path: 'TokenActivity';
      params: { chain: ApiChain; ca: string };
    }
  | {
      path: 'TokenNews';
      params: { symbol: string; newsItems: ApiTokenNewsItem[] };
    }
  | {
      path: 'TrendingTokens';
      params?: {
        timeWindow?: ApiTrendingTokensTimeWindow;
      };
    }
  | {
      path: 'Collectible';
      params: { data: ApiEthNonFungibleToken };
    }
  | {
      path: 'FarcasterProUpsell';
      params: { source: string };
    }
  | {
      path: 'WalletExplore';
      params: { prefilledQuery: string | undefined };
    }
  | {
      path: 'PlaintextDirectCastsConversation';
      params: {
        counterParty?: ApiUserMinimal;
        conversationId: string;
        create: boolean;
        intentText: string | undefined;
        focusOnMessageId?: string;
        tokenMentions?: ApiTokenLink[];
      };
    }
  | {
      path: 'WalletAlertsIntro';
      params?: Record<string, never>;
    }
  | {
      path: 'WalletAlertsSettings';
      params?: { promptForPushes?: boolean };
    }
  | {
      path: 'WalletAlertsToken';
      params: { chain: ApiChain; ca: string };
    }
  | {
      path: 'TokenNewsCasts';
      params: { newsItem: ApiTokenNewsItem; symbol: string };
    }
  | {
      path: 'TokenReportsSummary';
      params: { chain: ApiChain; ca: string };
    }
  | {
      path: 'WalletSettings';
      params?: Record<string, never>;
    }
  | {
      path: 'DepositBonusesIntro';
      params?: Record<string, never>;
    }
  | {
      path: 'ReferralsOverview';
      params?: Record<string, never>;
    }
  | {
      path: 'WalletCash';
      params?: Record<string, never>;
    };

type SharedNavigationContextType = {
  goBack: () => void;
  navigate: (action: NavigationActions) => void;
  pop: (count?: number) => void;
  push: (action: NavigationActions) => void;
  replace: (action: NavigationActions) => void;
  popToTop: () => void;
};

const SharedNavigationContext = React.createContext<
  SharedNavigationContextType | undefined
>(undefined);

function useSharedNavigationContext() {
  const context = React.useContext(SharedNavigationContext);
  if (!context) {
    throw new Error(
      'useSharedNavigationContext requires SharedNavigationContext',
    );
  }
  return context;
}

export { SharedNavigationContext, useSharedNavigationContext };
