import { BottomSheetView } from '@gorhom/bottom-sheet';
import {
  createCloseAccountInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { PublicKey, Transaction } from '@solana/web3.js';
import { LinearGradient } from 'expo-linear-gradient';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  apiChainToChainId,
  ApiEthFungibleTokenPosition,
  isUsdc,
} from 'farcaster-client-data';
import { MILLIS_PER_HOUR } from 'farcaster-client-hooks';
import { AlertTriangle, Info } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useSharedNavigationContext,
  useSharedTelemetry,
} from '../../../contexts';
import { useEmbeddedWallet } from '../../../contexts/EmbeddedWalletContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useWalletTransactions } from '../../../contexts/WalletTransactionsProvider';
import { useCachedOrQueryToken } from '../../../hooks';
import { useHaptics } from '../../../hooks/useHaptics';
import { useLimitOrdersEnabled } from '../../../hooks/useLimitOrdersEnabled';
import { useWalletBalances } from '../../../hooks/useWalletBalances';
import { useWalletRefresh } from '../../../hooks/useWalletRefresh';
import {
  isSameAsset,
  SOLANA_NATIVE_ASSET_ADDRESS,
  toAnalyticsName,
  tokenLinkToMinimalToken,
  tokenPositionToMinimalToken,
  WRAPPED_SOLANA_ASSET_ADDRESS,
} from '../../../utils';
import {
  getLimitOrderUnavailableDescription,
  tokenSupportsLimitOrder,
} from '../../../utils/LimitOrderUtils';
import { solanaConnection } from '../../../utils/SolanaUtils';
import {
  AutoDisplayingBottomSheetModal,
  BottomSheetModal,
  useBottomSheetModalRef,
} from '../../bottom-sheet';
import { AnimatedPressable, Text, Text2 } from '../../design-system';
import { WalletTradeActionsContent } from '../WalletTradeActionsContent';
import { CreateCastButton } from './CreateCastButton';

// ============================================================================
// Constants & Types
// ============================================================================

const BLOCKAID_QUALITY_CONFIG = {
  NewlyLaunched: {
    message: 'Newly Launched',
    color: 'secondary',
    showInfoIcon: true,
  },
  Warning: {
    message: 'Warning',
    color: 'danger',
    showInfoIcon: true,
  },
  Malicious: {
    message: 'High Risk',
    color: 'danger',
    showInfoIcon: true,
  },
  Spam: {
    message: 'Spam',
    color: 'danger',
    showInfoIcon: true,
  },
} as const;

type BlockaidQuality = keyof typeof BLOCKAID_QUALITY_CONFIG | undefined;

const FEATURE_ID_DISPLAY_MAP: Record<string, string> = {
  HONEYPOT: 'Honeypot',
  UNSELLABLE_TOKEN: 'Unsellable Token',
  STATIC_CODE_SIGNATURE: 'Risky Token Code',
  DYNAMIC_ANALYSIS: 'Potential Hidden Behavior',
  CONCENTRATED_SUPPLY_DISTRIBUTION: 'Concentrated Holders',
  HEAVILY_SNIPED: 'Heavily Sniped',
  INSUFFICIENT_LOCKED_LIQUIDITY: 'Low Locked Liquidity',
  HIDDEN_SUPPLY_BY_KEY_HOLDER: 'Whale Dominates Supply',
  KNOWN_MALICIOUS: 'Malicious Address',
  METADATA: 'Malicious Metadata',
  INORGANIC_VOLUME: 'Inorganic Volume',
  WASH_TRADING: 'Wash Trading',
  HIGH_SELL_FEE: 'High Sell Fee',
  HIGH_TRANSFER_FEE: 'High Transfer Fee',
  AIRDROP_PATTERN: 'Airdrop History',
  POST_DUMP: 'Post Dump',
};

const FEATURE_DISPLAY_DESCRIPTION_MAP: Record<string, string> = {
  Honeypot: 'You may not be able to sell this token once you buy.',
  'Unsellable Token': 'This token cannot be sold once you buy it.',
  'Risky Token Code':
    "This token's code may behave in harmful or unexpected ways.",
  'Potential Hidden Behavior':
    'Simulated tests of the token suggest the code may act maliciously.',
  'Concentrated Holders':
    "Most of this token's supply is owned by a small group of wallets.",
  'Heavily Sniped':
    "Automated bots bought a large portion of this token's supply before regular buyers.",
  'Low Locked Liquidity':
    "This token's liquidity can be removed at any time, potentially resulting in major price drops.",
  'Whale Dominates Supply':
    "A single holder controls a large share of this token's supply.",
  'Malicious Address':
    'A wallet tied to scams or attacks is involved with this token.',
  'Malicious Metadata':
    "This token's metadata contains signs of potential malicious intent.",
  'Inorganic Volume':
    "This token's trading volume appears manipulated or boosted unnaturally.",
  'Wash Trading':
    'This token shows signs of self-trading to create fake activity.',
  'High Sell Fee': 'You will be charged a high fee when selling this token.',
  'High Transfer Fee':
    'You will be charged a high fee when sending this token to another wallet.',
  'Airdrop History':
    'This token was sent to many wallets for free and may be unsafe or promotional.',
  'Post Dump':
    'The creator or key holders of this token have recently sold large amounts.',
};

const FEATURE_DISPLAY_PRIORITY_MAP: Record<string, number> = {
  Honeypot: 1,
  'Unsellable Token': 2,
  'Risky Token Code': 3,
  'Potential Hidden Behavior': 4,
  'Concentrated Holders': 5,
  'Heavily Sniped': 6,
  'Low Locked Liquidity': 7,
  'Whale Dominates Supply': 8,
  'Malicious Address': 9,
  'Malicious Metadata': 10,
  'Inorganic Volume': 11,
  'Wash Trading': 12,
  'High Sell Fee': 13,
  'High Transfer Fee': 14,
  'Airdrop History': 15,
  'Post Dump': 16,
};

// ============================================================================
// Helper Functions
// ============================================================================

function getFeatureDisplayName(featureId: string): string {
  return FEATURE_ID_DISPLAY_MAP[featureId] || featureId;
}

function getFeatureDescription(displayName: string): string {
  return FEATURE_DISPLAY_DESCRIPTION_MAP[displayName] || '';
}

function getWarningColor(
  blockaidQuality: BlockaidQuality,
  colors: { text: { secondary: string; warning: string; danger: string } },
) {
  if (blockaidQuality === 'NewlyLaunched') {
    return colors.text.secondary;
  }
  if (blockaidQuality === 'Warning') {
    return colors.text.warning;
  }
  return colors.text.danger;
}

// ============================================================================
// Warning Components
// ============================================================================

function WarningIcon({
  size = 14,
  color,
  filled = false,
}: {
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertTriangle
          size={size}
          fill={filled ? color : 'transparent'}
          strokeWidth={filled ? 0 : 1.5}
          color={color}
        />
      </View>
      <Text
        style={{
          color: filled ? t.colors.background.default : color,
          fontSize: size * 0.65,
          fontWeight: 'bold',
          lineHeight: size,
          textAlign: 'center',
          includeFontPadding: false,
        }}
      >
        !
      </Text>
    </View>
  );
}

function WarningDisplay({
  blockaidQuality,
  onInfoPress,
}: {
  blockaidQuality: BlockaidQuality;
  onInfoPress?: () => void;
}) {
  const t = useTheme();

  if (!blockaidQuality) return null;

  const config = BLOCKAID_QUALITY_CONFIG[blockaidQuality];
  if (!config) return null;

  const textColor = getWarningColor(blockaidQuality, t.colors);

  return (
    <View style={[t.mB3, t.pT2, t.flexRow, t.itemsCenter, t.justifyCenter]}>
      <AnimatedPressable
        onPress={onInfoPress}
        disabled={!onInfoPress}
        style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
      >
        {blockaidQuality === 'NewlyLaunched' ? (
          <Info size={14} color={textColor} />
        ) : (
          <WarningIcon size={14} color={textColor} />
        )}
        <Text2
          weight="medium"
          size="sm"
          style={{
            color: textColor,
          }}
        >
          {config.message}
        </Text2>
      </AnimatedPressable>
    </View>
  );
}

function WarningModalContent({
  blockaidQuality,
  featureIds,
  originalBackendQuality,
}: {
  blockaidQuality: BlockaidQuality;
  featureIds: string[];
  originalBackendQuality?: string | null;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  if (!blockaidQuality) return null;

  const iconColor = getWarningColor(blockaidQuality, t.colors);

  const showNewlyLaunchedSubtitle =
    blockaidQuality === 'NewlyLaunched' &&
    (originalBackendQuality === null ||
      originalBackendQuality === undefined ||
      originalBackendQuality === 'Benign' ||
      originalBackendQuality === 'Spam');

  return (
    <BottomSheetView>
      <View
        style={[
          t.pX4,
          {
            paddingBottom: insets.bottom,
            borderRadius: 12,
            paddingVertical: 8,
            gap: 12,
          },
        ]}
      >
        <View style={{ gap: 4 }}>
          <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
            {blockaidQuality === 'NewlyLaunched' ? (
              <Info size={20} color={t.colors.text.secondary} />
            ) : (
              <WarningIcon size={20} color={iconColor} filled={true} />
            )}
            <Text2 size="xl" weight="semibold" color="primary">
              {BLOCKAID_QUALITY_CONFIG[blockaidQuality]?.message}
            </Text2>
          </View>
          {showNewlyLaunchedSubtitle && (
            <Text2 size="sm" color="secondary">
              This token was launched in the last 6 hours. Please proceed with
              caution.
            </Text2>
          )}
        </View>
        {featureIds.length > 0 && (
          <View style={{ gap: 12 }}>
            {featureIds.map((featureId, index) => {
              const displayName = getFeatureDisplayName(featureId);
              const description = getFeatureDescription(displayName);
              return (
                <View key={index} style={{ gap: 2 }}>
                  <Text2 weight="semibold" color="primary">
                    {displayName}
                  </Text2>
                  {description && (
                    <Text2 size="sm" weight="regular" color="secondary">
                      {description}
                    </Text2>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </BottomSheetView>
  );
}

// ============================================================================
// Main Components
// ============================================================================

export function WalletTokenIntents({
  chain,
  ca,
  showTokenWarnings = false,
  onCreateCastPress,
}: {
  chain: ApiChain;
  ca: string;
  showTokenWarnings?: boolean;
  onCreateCastPress?: () => void;
}) {
  const { evmAddress } = useEmbeddedWallet();

  if (!evmAddress) {
    return null;
  }

  return (
    <WalletTokenIntentsInner
      evmAddress={evmAddress}
      chain={chain}
      ca={ca}
      showTokenWarnings={showTokenWarnings}
      onCreateCastPress={onCreateCastPress}
    />
  );
}

export function WalletTokenIntentsInner({
  evmAddress,
  chain,
  ca,
  showTokenWarnings,
  onCreateCastPress,
}: {
  evmAddress: string;
  chain: ApiChain;
  ca: string;
  showTokenWarnings: boolean;
  onCreateCastPress?: () => void;
}) {
  const t = useTheme();

  const { push } = useSharedNavigationContext();

  const highRiskModalRef = useBottomSheetModalRef();
  const [showTradeBottomSheet, setShowTradeBottomSheet] = React.useState(false);

  const handleInfoPress = useCallback(() => {
    highRiskModalRef.current?.present();
  }, [highRiskModalRef]);

  const { data: token } = useCachedOrQueryToken({ chain, ca });
  const { balances, isPending } = useWalletBalances();
  const { triggerImpactAsync } = useHaptics();
  const { trackEvent } = useSharedTelemetry();

  const tokenAnalyticsProperties = useMemo(
    () => ({
      source: 'token_detail',
      chain: token?.chain,
      token: token
        ? toAnalyticsName(tokenLinkToMinimalToken(token))
        : undefined,
    }),
    [token],
  );

  const buyIntent = useMemo(() => {
    if (!evmAddress || !token) {
      return null;
    }

    if (token.features?.canTrade === false) {
      return null;
    }

    const chainId = apiChainToChainId(token.chain);
    if (!chainId) {
      return null;
    }

    const isUsdcToken = isUsdc(token.ca);
    if (isUsdcToken) {
      return null;
    }

    return {
      buy: {
        address: token.ca,
        chainId: Number(chainId),
      },
    };
  }, [token, evmAddress]);

  const tokenBalance: ApiEthFungibleTokenPosition | undefined = useMemo(() => {
    if (!token) {
      return undefined;
    }

    const { chain, ca } = token;

    return balances.find((b) =>
      isSameAsset({
        chain,
        ca,
        asset: tokenPositionToMinimalToken(b),
      }),
    );
  }, [balances, token]);

  const sellIntent = useMemo(() => {
    if (!evmAddress) {
      return null;
    }

    if (!token) {
      return null;
    }

    if (token.features?.canTrade === false) {
      return null;
    }

    if (!tokenBalance) {
      return null;
    }

    const chainId = apiChainToChainId(token.chain);
    if (!chainId) {
      return null;
    }

    const isUsdcToken = isUsdc(token.ca);
    if (isUsdcToken) {
      return null;
    }

    return {
      sell: {
        address: token.ca,
        chainId: Number(chainId),
      },
    };
  }, [token, evmAddress, tokenBalance]);
  const limitOrdersEnabled = useLimitOrdersEnabled();
  const limitOrderActionsDisabled =
    !limitOrdersEnabled ||
    !token ||
    !tokenSupportsLimitOrder(token) ||
    isUsdc(token.ca);
  const limitOrderUnavailableDescription = getLimitOrderUnavailableDescription({
    limitOrdersEnabled,
    token,
  });
  const useLegacyBuySellButtons = limitOrderActionsDisabled;

  // ========================================================================
  // Warning Logic
  // ========================================================================

  const isNewlyLaunched = useMemo(() => {
    if (!token?.source?.createdAt) {
      return false;
    }
    const createdAt = token.source.createdAt;
    const now = Date.now();
    return now - createdAt < MILLIS_PER_HOUR * 6;
  }, [token]);

  const isVerified = useMemo(() => {
    return token?.verifications && token.verifications.length > 0;
  }, [token]);

  const warningOrMaliciousFeatureIds = useMemo(() => {
    if (!token?.blockaidQualityMetadata?.features) {
      return [];
    }
    const featureIds = token.blockaidQualityMetadata.features
      .filter(
        (feature) =>
          feature.type === 'Warning' ||
          feature.type === 'Malicious' ||
          feature.type === 'Spam',
      )
      .map((feature) => feature.feature_id)
      .filter((id): id is string => id !== undefined)
      .filter((id) => id in FEATURE_ID_DISPLAY_MAP) // Only include features that have a display mapping
      .filter((id) => {
        // If token has a platform, exclude HONEYPOT feature
        if (token.source?.platform && id === 'HONEYPOT') {
          return false;
        }
        return true;
      });

    // Sort by priority and take top 3
    const sortedFeatureIds = featureIds
      .map((featureId) => {
        const displayName = getFeatureDisplayName(featureId);
        const priority = FEATURE_DISPLAY_PRIORITY_MAP[displayName] ?? 999;
        return { featureId, priority, displayName };
      })
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3)
      .map((item) => item.featureId);

    return sortedFeatureIds;
  }, [token]);

  const blockaidQuality = useMemo((): BlockaidQuality => {
    if (!token) {
      return undefined;
    }

    // Verified tokens override all warnings - don't show any warning
    if (isVerified) {
      return undefined;
    }

    // Use backend-computed blockaidQuality, convert 'Benign' and 'Spam' to undefined
    const backendQuality =
      token.blockaidQuality === 'Benign' || token.blockaidQuality === 'Spam'
        ? undefined
        : token.blockaidQuality;

    // If backend has a quality, use it (Warning or Malicious)
    if (backendQuality) {
      return backendQuality;
    }

    // Newly launched tokens show warning if no backend quality
    if (isNewlyLaunched) {
      return 'NewlyLaunched';
    }

    return undefined;
  }, [token, isNewlyLaunched, isVerified]);

  const shouldShowWarningModal =
    blockaidQuality &&
    (blockaidQuality === 'NewlyLaunched' ||
      ((blockaidQuality === 'Warning' ||
        blockaidQuality === 'Malicious' ||
        blockaidQuality === 'Spam') &&
        warningOrMaliciousFeatureIds.length > 0));

  const handleBuyPress = useCallback(() => {
    if (!buyIntent) {
      return;
    }

    trackEvent(AnalyticsEvent.PressWalletBuy, tokenAnalyticsProperties);
    setShowTradeBottomSheet(false);
    push({
      path: 'WalletSwap',
      params: {
        platformType: Platform.OS === 'web' ? 'web' : 'mobile',
        swapIntent: buyIntent,
      },
    });
    triggerImpactAsync();
  }, [
    buyIntent,
    push,
    tokenAnalyticsProperties,
    trackEvent,
    triggerImpactAsync,
  ]);

  const handleSellPress = useCallback(() => {
    if (!sellIntent) {
      return;
    }

    trackEvent(AnalyticsEvent.PressWalletSell, tokenAnalyticsProperties);
    setShowTradeBottomSheet(false);
    push({
      path: 'WalletSwap',
      params: {
        platformType: Platform.OS === 'web' ? 'web' : 'mobile',
        swapIntent: sellIntent,
      },
    });
    triggerImpactAsync();
  }, [
    push,
    sellIntent,
    tokenAnalyticsProperties,
    trackEvent,
    triggerImpactAsync,
  ]);

  const handleTradePress = useCallback(() => {
    setShowTradeBottomSheet(true);
    triggerImpactAsync();
  }, [triggerImpactAsync]);

  const handleLimitBuyPress = useCallback(() => {
    if (!token || !limitOrdersEnabled) {
      return;
    }

    trackEvent(AnalyticsEvent.PressWalletLimitBuy, tokenAnalyticsProperties);
    setShowTradeBottomSheet(false);
    push({
      path: 'WalletLimitOrder',
      params: {
        kind: 'buy',
        initialToken: token,
      },
    });
    triggerImpactAsync();
  }, [
    limitOrdersEnabled,
    push,
    token,
    tokenAnalyticsProperties,
    trackEvent,
    triggerImpactAsync,
  ]);

  const handleLimitSellPress = useCallback(() => {
    if (!tokenBalance || !token || !limitOrdersEnabled) {
      return;
    }

    trackEvent(AnalyticsEvent.PressWalletLimitSell, tokenAnalyticsProperties);
    setShowTradeBottomSheet(false);
    push({
      path: 'WalletLimitOrder',
      params: {
        kind: 'sell',
        initialToken: token,
      },
    });
    triggerImpactAsync();
  }, [
    push,
    limitOrdersEnabled,
    token,
    tokenAnalyticsProperties,
    tokenBalance,
    trackEvent,
    triggerImpactAsync,
  ]);

  if (isPending || !token) {
    return null;
  }

  if (
    token.chain === 'solana' &&
    token.ca === WRAPPED_SOLANA_ASSET_ADDRESS &&
    tokenBalance &&
    tokenBalance.quantity.float > 0
  ) {
    return <WalletUnwrapSolanaIntent quantity={tokenBalance.quantity.int} />;
  }

  if (!buyIntent && !sellIntent) {
    return null;
  }

  return (
    <LinearGradient
      colors={[t.colors.bgTransparent, t.colors.background.default]}
      locations={[0, 0.2]}
      style={[t.absolute, t.bottom0, t.wFull, t.pX4, t.pB3, t.pT5]}
    >
      {blockaidQuality &&
        showTokenWarnings &&
        (blockaidQuality === 'NewlyLaunched' ||
          warningOrMaliciousFeatureIds.length > 0) && (
          <WarningDisplay
            blockaidQuality={blockaidQuality}
            onInfoPress={handleInfoPress}
          />
        )}
      <View style={[t.flexRow, t.justifyEnd, { gap: 8 }]}>
        {useLegacyBuySellButtons ? (
          <>
            {sellIntent && (
              <AnimatedPressable
                onPress={handleSellPress}
                style={{ flex: 1, height: 48 }}
              >
                <View
                  style={[
                    t.flex1,
                    t.backgrounds.brand,
                    { borderRadius: 32 },
                    t.justifyCenter,
                    t.itemsCenter,
                    { height: 48 },
                  ]}
                >
                  <Text2 size="lg" weight="semibold" color="light">
                    Sell
                  </Text2>
                </View>
              </AnimatedPressable>
            )}
            {buyIntent && (
              <AnimatedPressable
                onPress={handleBuyPress}
                style={{ flex: 1, height: 48 }}
              >
                <View
                  style={[
                    t.flex1,
                    t.backgrounds.brand,
                    { borderRadius: 32 },
                    t.justifyCenter,
                    t.itemsCenter,
                    { height: 48 },
                  ]}
                >
                  <Text2 size="lg" weight="semibold" color="light">
                    Buy
                  </Text2>
                </View>
              </AnimatedPressable>
            )}
          </>
        ) : (
          <AnimatedPressable
            onPress={handleTradePress}
            style={{ flex: 1, height: 48 }}
          >
            <View
              style={[
                t.flex1,
                t.backgrounds.brand,
                { borderRadius: 32 },
                t.justifyCenter,
                t.itemsCenter,
                { height: 48 },
              ]}
            >
              <Text2 size="lg" weight="semibold" color="light">
                Trade
              </Text2>
            </View>
          </AnimatedPressable>
        )}
        {typeof onCreateCastPress !== 'undefined' && (
          <CreateCastButton
            width={48}
            height={48}
            onPress={onCreateCastPress}
          />
        )}
      </View>
      {!useLegacyBuySellButtons && showTradeBottomSheet && (
        <AutoDisplayingBottomSheetModal
          name="Token Trade Actions"
          disableBottomSheetContentContainer
          onDismiss={() => setShowTradeBottomSheet(false)}
        >
          <WalletTradeActionsContent
            onBuyPress={buyIntent ? handleBuyPress : undefined}
            onLimitBuyPress={handleLimitBuyPress}
            onSellPress={sellIntent ? handleSellPress : undefined}
            onLimitSellPress={handleLimitSellPress}
            sellActionsDisabled={!sellIntent}
            limitOrderActionsDisabled={limitOrderActionsDisabled}
            limitOrderUnavailableDescription={limitOrderUnavailableDescription}
            hideSwapAction
          />
        </AutoDisplayingBottomSheetModal>
      )}
      {shouldShowWarningModal && showTokenWarnings && (
        <BottomSheetModal ref={highRiskModalRef} name="Warning Info">
          <WarningModalContent
            blockaidQuality={blockaidQuality}
            featureIds={warningOrMaliciousFeatureIds}
            originalBackendQuality={token?.blockaidQuality}
          />
        </BottomSheetModal>
      )}
    </LinearGradient>
  );
}

function WalletUnwrapSolanaIntent({ quantity }: { quantity: string }) {
  const t = useTheme();
  const { solanaAddress } = useEmbeddedWallet();
  const { submitTransaction } = useWalletTransactions();
  const [state, setState] = useState<
    'idle' | 'processing' | 'success' | 'error'
  >('idle');
  const { trackError } = useSharedTelemetry();
  const refreshWallet = useWalletRefresh();

  const handleUnwrapPress = useCallback(async () => {
    if (!solanaAddress) {
      return;
    }

    const buildTransaction = async () => {
      const { blockhash } = await solanaConnection.getLatestBlockhash();
      const wrappedSolana = new PublicKey(WRAPPED_SOLANA_ASSET_ADDRESS);
      const wallet = new PublicKey(solanaAddress);
      const tokenAccount = await getAssociatedTokenAddress(
        wrappedSolana,
        wallet,
      );

      const transaction = new Transaction().add(
        createCloseAccountInstruction(tokenAccount, wallet, wallet),
      );
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet;
      return transaction;
    };

    const onSuccess = () => {
      setState('success');
      refreshWallet([
        {
          chain: 'solana',
          ca: SOLANA_NATIVE_ASSET_ADDRESS,
          decimals: 9,
          delta: quantity,
        },
        {
          chain: 'solana',
          ca: WRAPPED_SOLANA_ASSET_ADDRESS,
          decimals: 9,
          delta: `-${quantity}`,
        },
      ]);
    };

    const onError = (error?: Error) => {
      setState('error');
      trackError('WalletUnwrapSolanaIntentError', {
        error: error?.message,
      });
    };

    submitTransaction({
      protocol: 'solana',
      chain: 'solana',
      buildTransaction,
      onSuccess,
      onError,
      metadata: {
        type: 'unwrap',
      },
    });
  }, [solanaAddress, trackError, submitTransaction, quantity, refreshWallet]);

  return (
    <LinearGradient
      colors={[t.colors.bgTransparent, t.colors.bgDefault]}
      locations={[0, 0.2]}
      style={[
        t.absolute,
        t.bottom0,
        t.flexRow,
        t.justifyEnd,
        t.pX4,
        t.pB3,
        t.pT5,
        t.wFull,
        { gap: 16 },
      ]}
    >
      <AnimatedPressable
        onPress={handleUnwrapPress}
        style={{ flex: 1, height: 48 }}
        disabled={state !== 'idle'}
      >
        <View
          style={[
            t.flex1,
            t.bgActionPrimary,
            { borderRadius: 32 },
            t.justifyCenter,
            t.itemsCenter,
            { height: 48 },
          ]}
        >
          <Text2 size="lg" weight="semibold" color="light">
            {state === 'processing'
              ? 'Converting...'
              : state === 'success'
                ? 'Converted!'
                : state === 'error'
                  ? 'Error converting'
                  : 'Convert to SOL'}
          </Text2>
        </View>
      </AnimatedPressable>
    </LinearGradient>
  );
}
