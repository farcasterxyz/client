import { ApiTokenLink } from 'farcaster-client-data';
import {
  formatAmount,
  formatTokenSymbol,
  useIsInReferralCodePromo,
} from 'farcaster-client-hooks';
import {
  Bug,
  ChevronLeft,
  Settings,
  SquarePercentIcon,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { formatUnits } from 'viem';

import {
  useEmbeddedWallet,
  useSharedNavigationContext,
  useSharedUserAppContext,
  useTheme,
} from '../../../../contexts';
import {
  getQuoteAcceptanceIdentifier,
  getQuoteAcceptanceStateKey,
} from '../../../../contexts/walletFinancialImpactGuard';
import {
  useCurrentUser,
  useHaptics,
  useIsAdmin,
  useOptionalSafeAreaInsets,
  useUserLevel,
} from '../../../../hooks';
import {
  formatFee,
  NATIVE_ASSET_SYMBOLS,
  parseTokenAmount,
  tokenLinkToMinimalToken,
} from '../../../../utils';
import {
  AnimatedPressable,
  HoldToTransactButton,
  Text2,
  TextPlaceholder,
} from '../../../design-system';
import { FarcasterProBadge } from '../../../farcasterPro';
import { GaslessConversionText } from '../../../wallet';
import { TokenListItem } from '../TokenListItem';
import { NumPad } from './Numpad';
import { SwapTokenDropdownSelector } from './SwapTokenDropdownSelector';
import { SwapTokenInputAccessory } from './SwapTokenInputAccessory';
import { SwapTokensDetailsSheet } from './SwapTokensDetailsSheet';
import { SwapTokenInput } from './SwapTokensInput';
import { SwapTokensLargeValueDisplay } from './SwapTokensLargeValueDisplay';
import { SwapTokensMarketRateWarning } from './SwapTokensMarketRateWarning';
import { SwapTokensPriceImpactWarning } from './SwapTokensPriceImpactWarning';
import { useSwapTokens } from './SwapTokensProvider';
import { SwapTokensQuickSelect } from './SwapTokensQuickSelect';
import { SwapTokensResult } from './SwapTokensResult';
import { SwapTokensSettingsSheet } from './SwapTokensSettingsSheet';
import { SwapToggle } from './SwapTokensToggle';
import { useSwapFees } from './useSwapFees';
import { PreparedQuote } from './useSwapQuotes';

const SIWF_DEBUG = (() => {
  try {
    if (typeof window === 'undefined') return false;
    return (
      window.location?.search?.includes('debug-swap=1') ||
      window.localStorage?.getItem('debug-swap') === '1'
    );
  } catch {
    return false;
  }
})();
const siwfLog = (...args: unknown[]) => {
  if (!SIWF_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log('[swap-debug][SwapTokens]', ...args);
};

export function SwapTokens({
  onOpenSelectBuyToken,
  onOpenSelectSellToken,
}: {
  onOpenSelectBuyToken?: () => void;
  onOpenSelectSellToken?: () => void;
}) {
  const { state } = useSwapTokens();

  if (state.state !== 'pending') {
    return <SwapTokensResult />;
  }

  return (
    <SwapTokensForm
      onOpenSelectBuyToken={onOpenSelectBuyToken}
      onOpenSelectSellToken={onOpenSelectSellToken}
    />
  );
}

function SwapTokensForm({
  onOpenSelectBuyToken,
  onOpenSelectSellToken,
}: {
  onOpenSelectBuyToken?: () => void;
  onOpenSelectSellToken?: () => void;
}) {
  const t = useTheme();
  const {
    onError,
    sellToken,
    buyToken,
    sellAmount,
    setSellAmount,
    preparedQuote,
    quoteError,
    buyTokenBalance,
    sellTokenBalance,
    isFetching,
    setSellToken,
    setBuyToken,
    isSellExperience,
    isBuyExperience,
    sellTokenUsdBalance,
    sellTokenPriceUsd,
    buyTokenUsdBalance,
    usdcDenominatedSwaps,
    setPercentageOfSellAmountChosen,
    assetPickerType,
    priceImpact: swapPriceImpact,
  } = useSwapTokens();
  const insets = useOptionalSafeAreaInsets();
  const { goBack, push } = useSharedNavigationContext();
  const [showSettings, setShowSettings] = React.useState(false);
  const { triggerImpactAsync } = useHaptics();
  const isAdmin = useIsAdmin();

  const user = useCurrentUser();
  const isPro = useUserLevel(user) === 'pro';
  const { data } = useIsInReferralCodePromo();
  const isReferralProgram = data.isInReferralCodePromo;

  const { userAppContext } = useSharedUserAppContext();
  const isNoFeeAllowlisted = userAppContext.noFeeAllowlisted;

  const isExecuting = React.useRef(false);
  const quote = preparedQuote?.quote;

  const handleExecuteQuote = React.useCallback(() => {
    siwfLog('handleExecuteQuote click', {
      hasPreparedQuote: !!preparedQuote,
      sellAmount: preparedQuote?.quote?.sellAmount,
      buyAmount: preparedQuote?.quote?.buyAmount,
      source: preparedQuote?.quote?.source,
      actionsCount: preparedQuote?.quote?.actions?.length,
      ts: Date.now(),
    });
    if (!preparedQuote) {
      siwfLog('handleExecuteQuote: no preparedQuote, returning', {
        ts: Date.now(),
      });
      return;
    }
    isExecuting.current = true;
    siwfLog('handleExecuteQuote → preparedQuote.action.submit()', {
      ts: Date.now(),
    });
    const submitResult = preparedQuote.action.submit();
    siwfLog('handleExecuteQuote ← submit() returned', {
      txId: submitResult?.id,
      ts: Date.now(),
    });
  }, [preparedQuote]);

  React.useEffect(() => {
    return () => {
      if (onError && !isExecuting.current) {
        onError('rejected_by_user');
      }
    };
  }, [onError]);

  const handleBack = React.useCallback(() => {
    if (onError) {
      onError('rejected_by_user');
    }
    goBack();
  }, [onError, goBack]);

  const onPressBalance = React.useCallback(() => {
    triggerImpactAsync();
    if (sellToken && sellTokenBalance) {
      const tokenAmount = formatUnits(
        BigInt(sellTokenBalance),
        sellToken.decimals ?? 18,
      );
      setSellAmount(tokenAmount);
    }
  }, [sellToken, sellTokenBalance, setSellAmount, triggerImpactAsync]);

  const openSellTokenSelector = React.useCallback(() => {
    triggerImpactAsync();
    if (onOpenSelectSellToken) {
      onOpenSelectSellToken();
    } else {
      push({
        path: 'WalletSwapSelectSell',
      });
    }
  }, [push, triggerImpactAsync, onOpenSelectSellToken]);

  const openBuyTokenSelector = React.useCallback(() => {
    triggerImpactAsync();
    if (onOpenSelectBuyToken) {
      onOpenSelectBuyToken();
    } else {
      push({
        path: 'WalletSwapSelectBuy',
      });
    }
  }, [push, triggerImpactAsync, onOpenSelectBuyToken]);

  const { buyUsdValue, sellUsdValue, priceImpact, showPriceImpactWarning } =
    swapPriceImpact;

  const displaySellExperience = usdcDenominatedSwaps && isSellExperience;
  const displayBuyExperience = usdcDenominatedSwaps && isBuyExperience;

  const handleNumpadChange = React.useCallback(
    (val: string, prevVal?: string) => {
      setPercentageOfSellAmountChosen(null);
      if (!prevVal) {
        if (!usdcDenominatedSwaps) {
          setSellAmount(val);
          return;
        }
        const [_, decimals] = val.split('.');
        if (decimals && decimals.length > 2) {
          return;
        }
        setSellAmount(val);
        return;
      }

      // Necessary to handle number input after pressing max

      const balanceAmount = formatUnits(
        BigInt(sellTokenBalance ?? '0'),
        sellToken?.decimals ?? 18,
      );

      if (balanceAmount !== prevVal) {
        setSellAmount(val);
        return;
      }

      const newVal = formatAmount(parseFloat(balanceAmount), {
        priceUsd: sellTokenPriceUsd ?? 0,
        useGrouping: false,
      })
        .replace(/,/g, '.')
        .slice(0, -1);

      setSellAmount(newVal);
    },
    [
      sellTokenBalance,
      sellToken?.decimals,
      sellTokenPriceUsd,
      setSellAmount,
      usdcDenominatedSwaps,
      setPercentageOfSellAmountChosen,
    ],
  );

  const handleDebugPress = React.useCallback(() => {
    push({
      path: 'WalletSwapDebug',
    });
  }, [push]);

  useEffect(() => {
    setSellAmount('0');
  }, [usdcDenominatedSwaps, setSellAmount]);

  return (
    <ScrollView
      style={[{ minHeight: '100%' }]}
      contentContainerStyle={[
        t.flexGrow,
        { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0 },
      ]}
      alwaysBounceVertical={false}
    >
      <SwapTokensFormHeader
        handleBack={handleBack}
        isAdmin={isAdmin}
        handleDebugPress={handleDebugPress}
        isSellExperience={isSellExperience}
        isBuyExperience={isBuyExperience}
        setShowSettings={setShowSettings}
      />
      {!displaySellExperience && !displayBuyExperience && (
        <View style={[t.flex1, t.itemsCenter, { padding: 20, gap: 8 }]}>
          <SwapTokenInput
            side="sell"
            value={sellAmount}
            token={sellToken ? tokenLinkToMinimalToken(sellToken) : undefined}
            balance={sellTokenBalance}
            onPressTokenSelector={openSellTokenSelector}
            onPressSelectToken={setSellToken}
            onPressBalance={onPressBalance}
            onWebChangeText={(val) => {
              if (
                val &&
                (Number.isNaN(parseFloat(val)) ||
                  (!/^\d*\.?\d*$/.test(val) && !/^\d*,\d*$/.test(val)))
              ) {
                return;
              }
              setSellAmount(val.replace(',', '.'));
            }}
            editable
            error={quoteError?.error === 'INVALID_AMOUNT'}
            usdValue={sellUsdValue}
          />
          <SwapToggle />
          <SwapTokenInput
            side="buy"
            value={
              buyToken && quote?.buyAmount
                ? parseTokenAmount(
                    quote?.buyAmount ?? '',
                    buyToken.decimals ?? 18,
                  ).toString()
                : ''
            }
            token={buyToken ? tokenLinkToMinimalToken(buyToken) : undefined}
            balance={buyTokenBalance}
            onPressTokenSelector={openBuyTokenSelector}
            onPressSelectToken={setBuyToken}
            isLoading={isFetching}
            usdValue={buyUsdValue}
            showPriceImpactWarning={showPriceImpactWarning}
          />
          <SwapTokensFeesOrError
            onShowSettings={() => setShowSettings(true)}
            isPro={isPro}
            isNoFeeAllowlisted={isNoFeeAllowlisted}
            isReferralProgram={isReferralProgram || false}
          />
        </View>
      )}
      {displaySellExperience && (
        <SellTokensExperience
          sellAmount={sellAmount}
          sellTokenAmount={formatUnits(
            BigInt(sellTokenBalance ?? '0'),
            sellToken?.decimals ?? 18,
          )}
          sellTokenUsdBalance={sellTokenUsdBalance}
          sellToken={sellToken}
          buyToken={buyToken}
          buyTokenUsdBalance={buyTokenUsdBalance}
          preparedQuote={preparedQuote}
          isPro={isPro}
          isNoFeeAllowlisted={isNoFeeAllowlisted}
          isReferralProgram={isReferralProgram || false}
          priceImpact={priceImpact}
          onShowSettings={() => setShowSettings(true)}
          openBuyTokenSelector={openBuyTokenSelector}
          isFetching={isFetching}
          assetPickerType={assetPickerType}
        />
      )}
      {displayBuyExperience && (
        <BuyTokensExperience
          sellAmount={sellAmount}
          sellTokenUsdBalance={sellTokenUsdBalance}
          buyToken={buyToken}
          onShowSettings={() => setShowSettings(true)}
          preparedQuote={preparedQuote}
          isPro={isPro}
          isNoFeeAllowlisted={isNoFeeAllowlisted}
          isReferralProgram={isReferralProgram || false}
          priceImpact={priceImpact}
          sellToken={sellToken}
          openSellTokenSelector={openSellTokenSelector}
          isFetching={isFetching}
          assetPickerType={assetPickerType}
        />
      )}
      <SwapTokensFormFooter
        amount={sellAmount}
        handleNumpadChange={handleNumpadChange}
        handleExecuteQuote={handleExecuteQuote}
        assetPickerType={assetPickerType}
        sellAmount={sellAmount}
        isBuyExperience={isBuyExperience}
        isSellExperience={isSellExperience}
        usdcDenominatedSwaps={usdcDenominatedSwaps}
      />
      {showSettings && (
        <SwapTokensSettingsSheet onDismiss={() => setShowSettings(false)} />
      )}
    </ScrollView>
  );
}

function SellTokensExperience({
  sellAmount,
  sellToken,
  sellTokenAmount,
  sellTokenUsdBalance,
  buyToken,
  buyTokenUsdBalance,
  preparedQuote,
  isPro,
  isNoFeeAllowlisted,
  isReferralProgram,
  priceImpact,
  onShowSettings,
  openBuyTokenSelector,
  isFetching,
  assetPickerType,
}: {
  sellAmount: string;
  sellToken: ApiTokenLink | undefined;
  sellTokenAmount: string | undefined;
  sellTokenUsdBalance: number | undefined;
  buyToken: ApiTokenLink | undefined;
  buyTokenUsdBalance: number | undefined;
  preparedQuote: PreparedQuote | undefined;
  isPro: boolean;
  isNoFeeAllowlisted: boolean;
  isReferralProgram: boolean;
  priceImpact: number;
  onShowSettings: () => void;
  openBuyTokenSelector: () => void;
  isFetching: boolean;
  assetPickerType: 'crypto' | 'cash';
}) {
  const t = useTheme();
  const { percentageOfSellAmountChosen } = useSwapTokens();
  // Quick-select (esp. Max) formats USD display values that can round *above*
  // the raw balance (e.g. 1.079 → "1.08"). formError already skips that check
  // when a percentage is chosen; match it here so we don't hide the NEEDS_GAS
  // accessory under a false invalid-amount state.
  const isInvalidAmount =
    !!sellAmount &&
    !percentageOfSellAmountChosen &&
    parseFloat(sellAmount) > (sellTokenUsdBalance ?? 0);
  const offset = useSharedValue<number>(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const OFFSET = 2;
  const TIME = 100;

  const shakeAnimation = React.useCallback(() => {
    offset.value = withSequence(
      // start from -OFFSET
      withTiming(-OFFSET, { duration: TIME / 2 }),
      // shake between -OFFSET and OFFSET 5 times
      withRepeat(withTiming(OFFSET, { duration: TIME }), 3, true),
      // go back to 0 at the end
      withTiming(0, { duration: TIME / 2 }),
    );
  }, [offset]);

  useEffect(() => {
    if (isInvalidAmount) {
      shakeAnimation();
    }
  }, [isInvalidAmount, shakeAnimation]);

  return (
    <View style={[t.flex1]}>
      {sellToken ? (
        <TokenListItem
          token={sellToken}
          variant="balance"
          pressableAnimationsDisabled
          ownedValue={sellTokenUsdBalance ?? 0}
          ownedAmount={parseFloat(sellTokenAmount ?? '0')}
          green={t.colors.green450}
          shouldHideBalance={true}
          hideEarnings={false}
          hidePriceChange={true}
        />
      ) : null}

      <Animated.View style={[style, { flex: 1 }]}>
        <SwapTokensLargeValueDisplay
          value={sellAmount}
          iconDisplay={isInvalidAmount ? null : <SwapTokenInputAccessory />}
        />
      </Animated.View>
      <SwapTokenDropdownSelector
        onPress={openBuyTokenSelector}
        token={buyToken}
        availableUsdValue={buyTokenUsdBalance ?? 0}
        preparedQuote={preparedQuote}
        isPro={isPro}
        isNoFeeAllowlisted={isNoFeeAllowlisted}
        isReferralProgram={isReferralProgram}
        priceImpact={priceImpact}
        onShowSettings={onShowSettings}
        warning={undefined}
        isFetching={isFetching}
        assetPickerType={assetPickerType}
        sellAmount={sellAmount}
      />
    </View>
  );
}

function BuyTokensExperience({
  buyToken,
  sellTokenUsdBalance,
  sellAmount,
  sellToken,
  preparedQuote,
  isPro,
  isNoFeeAllowlisted,
  isReferralProgram,
  priceImpact,
  onShowSettings,
  openSellTokenSelector,
  isFetching,
  assetPickerType,
}: {
  sellAmount: string;
  sellToken: ApiTokenLink | undefined;
  sellTokenUsdBalance: number | undefined;
  buyToken: ApiTokenLink | undefined;
  preparedQuote: PreparedQuote | undefined;
  isPro: boolean;
  isNoFeeAllowlisted: boolean;
  isReferralProgram: boolean;
  priceImpact: number;
  onShowSettings: () => void;
  openSellTokenSelector: () => void;
  isFetching: boolean;
  assetPickerType: 'crypto' | 'cash';
}) {
  const t = useTheme();
  const { percentageOfSellAmountChosen } = useSwapTokens();
  const isInvalidAmount =
    !!sellAmount &&
    !percentageOfSellAmountChosen &&
    parseFloat(sellAmount) > (sellTokenUsdBalance ?? 0);
  const offset = useSharedValue<number>(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const OFFSET = 2;
  const TIME = 100;

  const shakeAnimation = React.useCallback(() => {
    offset.value = withSequence(
      // start from -OFFSET
      withTiming(-OFFSET, { duration: TIME / 2 }),
      // shake between -OFFSET and OFFSET 5 times
      withRepeat(withTiming(OFFSET, { duration: TIME }), 3, true),
      // go back to 0 at the end
      withTiming(0, { duration: TIME / 2 }),
    );
  }, [offset]);

  useEffect(() => {
    if (isInvalidAmount) {
      shakeAnimation();
    }
  }, [isInvalidAmount, shakeAnimation]);

  return (
    <View style={[t.flex1, t.mT2]}>
      {buyToken ? (
        <TokenListItem
          variant="price"
          token={buyToken}
          pressableAnimationsDisabled
          hidePriceChange={true}
        />
      ) : null}

      <Animated.View style={[style, { flex: 1 }]}>
        <SwapTokensLargeValueDisplay
          value={sellAmount}
          iconDisplay={isInvalidAmount ? null : <SwapTokenInputAccessory />}
        />
      </Animated.View>
      <SwapTokenDropdownSelector
        token={sellToken}
        availableUsdValue={sellTokenUsdBalance ?? 0}
        preparedQuote={preparedQuote}
        isPro={isPro}
        isNoFeeAllowlisted={isNoFeeAllowlisted}
        isReferralProgram={isReferralProgram}
        priceImpact={priceImpact}
        onShowSettings={onShowSettings}
        warning={undefined}
        onPress={openSellTokenSelector}
        isFetching={isFetching}
        assetPickerType={assetPickerType}
        sellAmount={sellAmount}
      />
    </View>
  );
}

function SwapTokensFormFooter({
  amount,
  handleNumpadChange,
  handleExecuteQuote,
  isBuyExperience,
  isSellExperience,
  usdcDenominatedSwaps,
}: {
  amount: string;
  handleNumpadChange: (val: string, prevVal?: string) => void;
  handleExecuteQuote: () => void;
  assetPickerType: 'crypto' | 'cash';
  sellAmount: string;
  isBuyExperience: boolean;
  isSellExperience: boolean;
  usdcDenominatedSwaps: boolean;
}) {
  const t = useTheme();
  return (
    <View style={[t.pX3, { gap: 12 }, Platform.OS !== 'ios' && t.pY3]}>
      {Platform.OS !== 'web' || usdcDenominatedSwaps ? (
        <>
          <SwapTokensQuickSelect />
          <NumPad
            value={amount}
            maxDecimals={8}
            onChange={handleNumpadChange}
          />
        </>
      ) : (
        <SwapTokensQuickSelect />
      )}
      <SwapTokensButton
        onPress={handleExecuteQuote}
        isBuyExperience={isBuyExperience}
        isSellExperience={isSellExperience}
      />
    </View>
  );
}

function SwapTokensFormHeader({
  handleBack,
  isAdmin,
  handleDebugPress,
  isSellExperience,
  isBuyExperience,
  setShowSettings,
}: {
  handleBack: () => void;
  isAdmin: boolean;
  handleDebugPress: () => void;
  isSellExperience: boolean;
  isBuyExperience: boolean;
  setShowSettings: (show: boolean) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        { paddingHorizontal: 20, paddingTop: 20 },
      ]}
    >
      <View style={{ width: 100 }}>
        {Platform.OS !== 'ios' && (
          <AnimatedPressable onPress={handleBack}>
            <ChevronLeft size={24} color={t.colors.text.primary} />
          </AnimatedPressable>
        )}
        {isAdmin && Platform.OS !== 'web' && (
          <AnimatedPressable onPress={handleDebugPress}>
            <Bug size={20} color={t.colors.text.secondary} />
          </AnimatedPressable>
        )}
      </View>
      <Text2 size="lg" weight="semibold">
        {isSellExperience ? 'Sell' : isBuyExperience ? 'Buy' : 'Swap'}
      </Text2>
      <View style={[t.itemsEnd, { width: 100 }]}>
        <AnimatedPressable
          onPress={() => {
            setShowSettings(true);
          }}
        >
          <Settings
            size={20}
            color={t.colors.text.tertiary}
            fill={t.colors.text.tertiary}
          />
          <View
            style={[
              t.absolute,
              t.flex1,
              t.top0,
              t.right0,
              t.left0,
              t.bottom0,
              t.justifyCenter,
              t.itemsCenter,
            ]}
          >
            <View
              style={[t.bgDefault, t.roundedFull, { height: 6, width: 6 }]}
            />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}

function SwapTokensFeesOrError({
  onShowSettings,
  isPro,
  isNoFeeAllowlisted,
  isReferralProgram,
}: {
  onShowSettings: () => void;
  isPro: boolean;
  isNoFeeAllowlisted: boolean;
  isReferralProgram: boolean;
}) {
  const t = useTheme();
  const {
    preparedQuote,
    showDetailsSheet,
    setShowDetailsSheet,
    isFetching,
    quoteError,
    fundGasQuote,
    sellToken,
    priceImpact: swapPriceImpact,
  } = useSwapTokens();
  const { priceImpact } = swapPriceImpact;
  const { others, farcaster } = useSwapFees({
    fees: preparedQuote?.quote?.fees,
    isPro,
    isNoFeeAllowlisted,
    priceImpact,
  });

  const quote = preparedQuote?.quote;

  const handlePressFees = React.useCallback(() => {
    setShowDetailsSheet(true);
  }, [setShowDetailsSheet]);

  if (quoteError && quoteError.error !== 'INVALID_AMOUNT' && sellToken) {
    const nativeAssetSymbol = NATIVE_ASSET_SYMBOLS[sellToken?.chain];
    return (
      <View style={[t.wFull, { paddingTop: 16, gap: 12 }]}>
        <View style={[t.wFull, t.backgrounds.tertiary, { height: 0.8 }]} />
        <View style={[t.flex, t.flexRow, t.justifyCenter, { gap: 4 }]}>
          <View style={{ paddingVertical: 3 }}>
            <Svg width="15" height="14" viewBox="0 0 15 14" fill="none">
              <Path
                d="M7.5 0.5C11.0897 0.5 13.9998 3.4103 14 7C14 10.5899 11.0899 13.5 7.5 13.5C3.9103 13.4998 1 10.5897 1 7C1.00018 3.41041 3.91041 0.500176 7.5 0.5ZM7.5 6.33398C7.13181 6.33398 6.83301 6.63279 6.83301 7.00098V9.33398C6.83301 9.70217 7.13181 10.001 7.5 10.001C7.86819 10.001 8.16699 9.70217 8.16699 9.33398V7.00098C8.16699 6.63279 7.86819 6.33398 7.5 6.33398ZM7.5 4C7.13181 4 6.83301 4.2988 6.83301 4.66699C6.83301 5.03518 7.13181 5.33398 7.5 5.33398H7.50684C7.87495 5.33389 8.17285 5.03513 8.17285 4.66699C8.17285 4.29886 7.87495 4.00009 7.50684 4H7.5Z"
                fill={t.colors.yellow500}
              />
            </Svg>
          </View>

          <Text2 size="sm" weight="medium" color="warning">
            {quoteError?.error === 'NEEDS_GAS'
              ? `Not enough ${nativeAssetSymbol} to cover for chain fees`
              : 'No route found to complete this swap'}
          </Text2>
        </View>
      </View>
    );
  }

  if (!isFetching && !quote) {
    return null;
  }

  return (
    <View style={[t.wFull, { paddingTop: 16, gap: 12 }]}>
      <View style={[t.wFull, t.backgrounds.tertiary, { height: 0.8 }]} />
      {isFetching ? (
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween]}>
          <TextPlaceholder width={56} size="sm" />
          <TextPlaceholder width={116} size="sm" />
        </View>
      ) : quote ? (
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween]}>
          <AnimatedPressable
            onPress={handlePressFees}
            style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}
          >
            <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <Path
                d="M12.25 9.41675V10.2083C12.25 10.6832 12.0277 11.0892 11.7192 11.4083C11.4141 11.7244 10.9999 11.9822 10.5338 12.1864C9.59933 12.5947 8.34983 12.8333 7 12.8333C5.65017 12.8333 4.40067 12.5953 3.46617 12.1864C3.00008 11.9822 2.58592 11.7244 2.28083 11.4083C1.99792 11.1166 1.78792 10.7502 1.75467 10.3256L1.75 10.2083V9.41675C2.02125 9.57075 2.31117 9.70725 2.6215 9.82217C3.80567 10.2602 5.35442 10.5047 7 10.5047C8.64558 10.5047 10.1943 10.2602 11.3785 9.82217C11.6112 9.73583 11.8323 9.63783 12.0429 9.52875L12.25 9.41675ZM1.75 6.20842C2.02125 6.36242 2.31117 6.49892 2.6215 6.61383C3.80567 7.05192 5.35442 7.29633 7 7.29633C8.64558 7.29633 10.1943 7.05192 11.3785 6.61383C11.6888 6.49892 11.9787 6.363 12.25 6.20842V8.01967C11.8626 8.31865 11.4323 8.5574 10.9737 8.72783C9.94992 9.107 8.54467 9.33858 7 9.33858C5.45592 9.33858 4.05067 9.107 3.02633 8.72783C2.56765 8.5574 2.13735 8.31865 1.75 8.01967V6.20842ZM7 1.75C8.34983 1.75 9.59933 1.988 10.5338 2.39692C10.9999 2.60108 11.4141 2.85892 11.7192 3.17508C12.0021 3.46675 12.2121 3.83308 12.2453 4.25775L12.25 4.375V4.81133C11.8627 5.11034 11.4324 5.34909 10.9737 5.5195C9.94992 5.89867 8.54467 6.13025 7 6.13025C5.45592 6.13025 4.05067 5.89867 3.02633 5.5195C2.61858 5.36842 2.2505 5.1695 1.91508 4.93267L1.75 4.81133V4.375C1.75 3.90017 1.97225 3.49417 2.28083 3.17508C2.58592 2.85892 3.00008 2.60108 3.46617 2.39692C4.40067 1.98858 5.65017 1.75 7 1.75Z"
                fill={t.colors.text.tertiary}
              />
            </Svg>

            <Text2 size="sm" weight="medium" color="tertiary">
              Wallet Fees
            </Text2>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={handlePressFees}
            style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}
          >
            {isPro ? (
              <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
                <FarcasterProBadge size={15} color={t.colors.text.brand} />
                <Text2 size="sm" weight="medium" color="brand">
                  {formatFee(farcaster.walletFee)}
                </Text2>
              </View>
            ) : isReferralProgram ? (
              <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
                <SquarePercentIcon size={15} color={t.colors.text.brand} />
                <Text2 size="sm" weight="medium" color="brand">
                  {formatFee(others.walletFee - others.referralFee)}
                </Text2>
              </View>
            ) : (
              <View
                style={[
                  t.backgrounds.brandLight,
                  { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
                ]}
              >
                <Text2 size="xs" weight="semibold" color="brand">
                  Reduce fees with Pro
                </Text2>
              </View>
            )}
            <Text2
              size="sm"
              weight="medium"
              color="tertiary"
              style={[
                (isPro || isReferralProgram) && {
                  textDecorationLine: 'line-through',
                },
              ]}
            >
              {formatFee(others.walletFee)}
            </Text2>
          </AnimatedPressable>
        </View>
      ) : null}
      {fundGasQuote && (
        <View style={[t.p2]}>
          <GaslessConversionText gaslessQuote={fundGasQuote} />
        </View>
      )}
      {showDetailsSheet && quote && (
        <SwapTokensDetailsSheet
          onDismiss={() => setShowDetailsSheet(false)}
          isPro={isPro}
          isReferralProgram={isReferralProgram}
          isNoFeeAllowlisted={isNoFeeAllowlisted}
          fees={quote?.fees}
          onShowSettings={onShowSettings}
        />
      )}
    </View>
  );
}

function SwapTokensButton({
  isBuyExperience,
  isSellExperience,
  onPress,
}: {
  onPress: () => void;
  isBuyExperience: boolean;
  isSellExperience: boolean;
}) {
  const t = useTheme();
  const {
    sellToken,
    buyToken,
    sellAmount,
    sellTokenUsdBalance,
    sellTokenPriceUsd,
    quoteError,
    sellTokenBalance,
    isFetching,
    preparedQuote,
    usdcDenominatedSwaps,
    percentageOfSellAmountChosen,
    priceImpact: swapPriceImpact,
  } = useSwapTokens();
  const { isActiveWalletSignerReady } = useEmbeddedWallet();
  // undefined (e.g. web, no secondary app) means "ready"; only an explicit
  // false gates the CTA while a private wallet's signer is still warming.
  const signerNotReady = isActiveWalletSignerReady === false;
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [showPriceImpactWarningSheet, setShowPriceImpactWarningSheet] =
    React.useState(false);
  const [showMarketRateWarningSheet, setShowMarketRateWarningSheet] =
    React.useState(false);
  const [acceptedMarketRateQuoteIdentity, setAcceptedMarketRateQuoteIdentity] =
    React.useState<string | undefined>(undefined);

  const formError = React.useMemo(() => {
    if (!sellToken) {
      return 'Select token to sell';
    }
    if (!buyToken) {
      return 'Select token to buy';
    }

    if (!sellAmount || parseFloat(sellAmount) === 0) {
      return 'Enter an amount';
    }

    if (
      !sellTokenBalance ||
      (!usdcDenominatedSwaps &&
        parseFloat(sellAmount) >
          parseTokenAmount(sellTokenBalance, sellToken.decimals ?? 18)) ||
      (usdcDenominatedSwaps &&
        !percentageOfSellAmountChosen &&
        (!sellTokenUsdBalance || parseFloat(sellAmount) > sellTokenUsdBalance))
    ) {
      return `Not enough ${formatTokenSymbol(sellToken.ticker)}`;
    }

    if (quoteError) {
      if (quoteError.error === 'EXCESSIVE_VALUE_LOSS') {
        return 'Quote blocked: too unfavorable';
      }
      if (quoteError.error === 'PRICE_GUARD_UNAVAILABLE') {
        return 'Quote unavailable: safety check failed';
      }
      if (quoteError.error === 'NEEDS_GAS') {
        return 'Select a lower amount';
      }
      if (quoteError.error === 'INVALID_AMOUNT') {
        return `Not enough ${formatTokenSymbol(sellToken.ticker)}`;
      }
      return 'Select new token';
    }

    return undefined;
  }, [
    sellToken,
    buyToken,
    sellAmount,
    sellTokenBalance,
    usdcDenominatedSwaps,
    sellTokenUsdBalance,
    quoteError,
    percentageOfSellAmountChosen,
  ]);

  const title = React.useMemo(() => {
    if (isFetching) {
      return 'Fetching quote';
    }

    if (formError) {
      return formError;
    }

    if (isExecuting) {
      if (isBuyExperience) {
        return 'Buying';
      }
      if (isSellExperience) {
        return 'Selling';
      }
      return 'Swapping';
    }

    if (signerNotReady) {
      return 'Preparing wallet…';
    }

    if (Platform.OS === 'web') {
      if (isBuyExperience) {
        return 'Buy';
      }
      if (isSellExperience) {
        return 'Sell';
      }
      return 'Swap';
    }
    if (isBuyExperience) {
      return 'Hold to Buy';
    }
    if (isSellExperience) {
      return 'Hold to Sell';
    }

    return 'Hold to Swap';
  }, [
    formError,
    isExecuting,
    isFetching,
    isBuyExperience,
    isSellExperience,
    signerNotReady,
  ]);

  const handleConfirm = React.useCallback(() => {
    onPress();
    setIsExecuting(true);
  }, [onPress]);

  const {
    priceImpact,
    priceImpactUsd,
    showHighPriceImpactWarning,
    showPriceImpactWarning,
  } = swapPriceImpact;
  const quoteIdentity = React.useMemo(() => {
    return preparedQuote?.quote
      ? getQuoteAcceptanceStateKey(preparedQuote.quote)
      : undefined;
  }, [preparedQuote?.quote]);
  const financialImpact = preparedQuote?.quote.financialImpact;
  const requiresMarketRateAcceptance =
    !!financialImpact?.requiresExplicitAcceptance;
  const showMarketRateWarning =
    requiresMarketRateAcceptance &&
    acceptedMarketRateQuoteIdentity !== quoteIdentity;

  React.useEffect(() => {
    if (!quoteIdentity) {
      setAcceptedMarketRateQuoteIdentity(undefined);
      return;
    }
    if (acceptedMarketRateQuoteIdentity !== quoteIdentity) {
      setShowMarketRateWarningSheet(false);
    }
  }, [quoteIdentity, acceptedMarketRateQuoteIdentity]);

  const handleMaybeShowPriceImpactWarning = React.useCallback(() => {
    if (showHighPriceImpactWarning) {
      setShowPriceImpactWarningSheet(true);
    } else if (showMarketRateWarning) {
      setShowMarketRateWarningSheet(true);
    } else {
      handleConfirm();
    }
  }, [handleConfirm, showHighPriceImpactWarning, showMarketRateWarning]);

  const handleConfirmAfterPriceImpact = React.useCallback(() => {
    setShowPriceImpactWarningSheet(false);
    if (showMarketRateWarning) {
      setShowMarketRateWarningSheet(true);
      return;
    }
    handleConfirm();
  }, [handleConfirm, showMarketRateWarning]);

  const handleConfirmAfterMarketRateWarning = React.useCallback(() => {
    if (quoteIdentity) {
      setAcceptedMarketRateQuoteIdentity(quoteIdentity);
    }
    preparedQuote?.setBadQuoteAcceptance({
      userAcceptedBadQuote: true,
      acceptedQuoteSourceId: preparedQuote?.quote
        ? getQuoteAcceptanceIdentifier(preparedQuote.quote)
        : undefined,
      acceptedQuoteBuyAmount: preparedQuote?.quote.buyAmount,
      acceptedAtMs: Date.now(),
    });
    setShowMarketRateWarningSheet(false);
    handleConfirm();
  }, [quoteIdentity, handleConfirm, preparedQuote]);

  const usdValue = React.useMemo(() => {
    if (!sellToken || !sellAmount) {
      return 0;
    }

    if (usdcDenominatedSwaps) {
      return parseFloat(sellAmount);
    }

    return parseFloat(sellAmount) * (sellTokenPriceUsd ?? 0);
  }, [sellToken, sellAmount, sellTokenPriceUsd, usdcDenominatedSwaps]);

  const disabled = !!formError || isExecuting || isFetching || signerNotReady;

  const Icon = React.useCallback(() => {
    if (isFetching) {
      return <ActivityIndicator size="small" color={t.colors.text.primary} />;
    }
    return null;
  }, [isFetching, t.colors.text.primary]);

  if (Platform.OS === 'web') {
    return (
      <>
        <AnimatedPressable
          onPress={handleMaybeShowPriceImpactWarning}
          disabled={disabled}
        >
          <View
            style={[
              disabled ? t.backgrounds.tertiary : t.backgrounds.brand,
              { borderRadius: 32 },
              t.justifyCenter,
              t.itemsCenter,
              { height: 48 },
            ]}
          >
            <Text2
              size="lg"
              weight="semibold"
              color={disabled ? 'tertiary' : 'light'}
            >
              {title}
            </Text2>
          </View>
        </AnimatedPressable>
        {showPriceImpactWarningSheet && (
          <SwapTokensPriceImpactWarning
            onDismiss={() => setShowPriceImpactWarningSheet(false)}
            priceImpact={priceImpact ?? 0}
            priceImpactUsd={priceImpactUsd}
            onConfirm={handleConfirmAfterPriceImpact}
          />
        )}
        {showMarketRateWarningSheet && (
          <SwapTokensMarketRateWarning
            onDismiss={() => setShowMarketRateWarningSheet(false)}
            valueLossBps={financialImpact?.valueLossBps ?? 0}
            valueLossUsd={financialImpact?.valueLossUsd}
            onConfirm={handleConfirmAfterMarketRateWarning}
          />
        )}
      </>
    );
  }

  return (
    <>
      <HoldToTransactButton
        usdValue={usdValue}
        title={title}
        pressingTitle="Swapping"
        onConfirm={handleMaybeShowPriceImpactWarning}
        disabled={disabled}
        warning={showPriceImpactWarning || showMarketRateWarning}
        error={showHighPriceImpactWarning}
        showBiometricIcon={!disabled}
        Icon={Icon}
      />
      {showPriceImpactWarningSheet && (
        <SwapTokensPriceImpactWarning
          onDismiss={() => setShowPriceImpactWarningSheet(false)}
          priceImpact={priceImpact}
          priceImpactUsd={priceImpactUsd}
          onConfirm={handleConfirmAfterPriceImpact}
        />
      )}
      {showMarketRateWarningSheet && (
        <SwapTokensMarketRateWarning
          onDismiss={() => setShowMarketRateWarningSheet(false)}
          valueLossBps={financialImpact?.valueLossBps ?? 0}
          valueLossUsd={financialImpact?.valueLossUsd}
          onConfirm={handleConfirmAfterMarketRateWarning}
        />
      )}
    </>
  );
}
