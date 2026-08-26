import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiPaymentMethod,
  ApiTokenLink,
  EIP7528_NATIVE_ASSET_ADDRESS,
  formatDisplayDollars,
  getChain,
  SOLANA_NATIVE_ASSET_ADDRESS,
} from 'farcaster-client-data';
import {
  formatNumber,
  useCoinbaseOnrampLimit,
  useTokenLinks,
  useTokens,
} from 'farcaster-client-hooks';
import { ChevronLeft, ScanFaceIcon } from 'lucide-react-native';
import * as React from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Coinbase from '../../assets/platforms/payment/coinbase.svg';
import CoinbaseWatermark from '../../assets/platforms/payment/coinbase-watermark.svg';
import { hitSlop } from '../../constants';
import { useSharedNavigationContext } from '../../contexts';
import { useSharedTelemetry } from '../../contexts/SharedTelemetryContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  useAttemptBiometricAuth,
  useHaptics,
  useOnrampWithCoinbase,
} from '../../hooks';
import { formatAssetId } from '../../utils';
import { useBottomSheetModalRef } from '../bottom-sheet';
import { TokenListItem } from '../crypto';
import { NumPad } from '../crypto/tokens/swap/Numpad';
import {
  TOKEN_ACCESSORY_STRINGS,
  TokenInputAccessory,
  TokenInputAccessoryBottomSheet,
  TokenInputAccessoryColorMap,
  TokenInputAccessoryIcon,
} from '../crypto/tokens/TokenInputAccessory';
import { AtomsButton, Text2 } from '../design-system';
import { WalletScreenHeader } from './WalletScreenHeader';

type Selector = { type: 'max' } | { type: 'amount'; amount: number };
const BASE_CHAIN = getChain('base');
const DEFAULT_MAX_LIMIT_AVAILABLE = 2_500;
const MAX_AMOUNT_ALLOWED = 10_000;

function SimpleSelectBox({
  setAmountText,
  selector,
  maxLimitAvailable,
}: {
  setAmountText: (text: string) => void;
  selector: Selector;
  maxLimitAvailable: number;
}) {
  const t = useTheme();

  return (
    <TouchableOpacity
      onPress={() =>
        setAmountText(
          selector.type === 'max'
            ? maxLimitAvailable.toString()
            : selector.amount.toString(),
        )
      }
      style={[
        t.flex1,
        t.justifyCenter,
        t.itemsCenter,
        { padding: 6 },
        t.backgrounds.secondary,
        { borderRadius: 100 },
      ]}
    >
      <Text2 weight="semibold" color="brand" size="base">
        {selector.type === 'max'
          ? 'Max'
          : formatDisplayDollars(selector.amount)}
      </Text2>
    </TouchableOpacity>
  );
}

export function WalletOnRampSelector({
  onBack,
  setSelectedToken,
}: {
  onBack?: () => void;
  setSelectedToken: (token: ApiTokenLink) => void;
}) {
  const { triggerImpactAsync } = useHaptics();
  const t = useTheme();

  const { data: tokensData } = useTokens({
    ids: [
      formatAssetId('base', EIP7528_NATIVE_ASSET_ADDRESS), // ETH on Base
      formatAssetId('base', BASE_CHAIN.usdcAddress), // USDC on Base
      formatAssetId('solana', SOLANA_NATIVE_ASSET_ADDRESS), // SOL
      formatAssetId('ethereum', EIP7528_NATIVE_ASSET_ADDRESS), // ETH on Ethereum
    ],
  });

  const tokens = useMemo(() => {
    return (
      tokensData?.filter(
        (token): token is ApiTokenLink => token !== undefined,
      ) ?? []
    );
  }, [tokensData]);

  const handleTokenPress = useCallback(
    (token: ApiTokenLink) => {
      triggerImpactAsync();
      setSelectedToken(token);
      onBack?.();
    },
    [setSelectedToken, onBack, triggerImpactAsync],
  );

  const leftIcon = useMemo(() => {
    if (onBack === undefined) {
      return null;
    }

    return (
      <Pressable
        hitSlop={hitSlop}
        onPress={onBack}
        style={[t.itemsStart, { width: 40 }]}
      >
        <ChevronLeft size={24} color={t.colors.text.primary} />
      </Pressable>
    );
  }, [onBack, t.itemsStart, t.colors.text.primary]);

  return (
    <View style={[t.flex1, t.bgDefault]}>
      <WalletScreenHeader title="Buy" leftIcon={leftIcon} />
      <FlatList
        data={tokens}
        renderItem={({ item }) => (
          <TokenListItem
            token={item}
            variant="price"
            onPress={() => handleTokenPress(item)}
          />
        )}
        keyExtractor={(item) => `${item.chain}-${item.ca}`}
        contentContainerStyle={[t.pX3]}
      />
    </View>
  );
}

function getQuickSelectors(balance: number): Selector[] {
  // 2. Define Option 1 (The Nibble)
  // If Balance > 100: $25. Else: $10.
  const nibble = balance > 100 ? 25 : 10;

  // 3. Define Option 2 (The Bite)
  // Lookup table based on balance
  let bite: number | null = null;
  if (balance <= 40) {
    bite = null;
  } else if (balance <= 80) {
    bite = 20;
  } else if (balance <= 150) {
    bite = 50;
  } else if (balance <= 400) {
    bite = 100;
  } else if (balance <= 1000) {
    bite = 250;
  } else if (balance <= 3000) {
    bite = 500;
  } else {
    bite = 1000; // > 3000
  }

  const options: Selector[] = [];
  if (nibble < balance) {
    options.push({ type: 'amount', amount: nibble });
  }
  if (bite !== null && bite < balance) {
    options.push({ type: 'amount', amount: bite });
  }
  options.push({ type: 'max' });
  return options;
}

export function WalletOnRamp({
  onBack,
  paymentMethod,
}: {
  onBack?: () => void;
  paymentMethod?: ApiPaymentMethod;
}) {
  const { data: coinbaseOnrampLimit } = useCoinbaseOnrampLimit({});
  const { triggerImpactAsync } = useHaptics();
  const attemptBiometricAuth = useAttemptBiometricAuth();
  const { goBack } = useSharedNavigationContext();
  const t = useTheme();
  const { trackEvent } = useSharedTelemetry();
  const { data: defaultToken } = useTokenLinks({
    ticker: 'USDC',
    chain: 'base',
  });
  const usdcTokenLink = useMemo(() => {
    return defaultToken.tokens[0];
  }, [defaultToken.tokens]);
  const [selectedToken, setSelectedToken] =
    React.useState<ApiTokenLink>(usdcTokenLink);
  const [showSelector, setShowSelector] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxLimitAvailable = useMemo(() => {
    return Math.min(
      coinbaseOnrampLimit?.guestCheckout?.limitUsd ??
        DEFAULT_MAX_LIMIT_AVAILABLE,
      MAX_AMOUNT_ALLOWED,
    );
  }, [coinbaseOnrampLimit]);

  const quickSelectors = useMemo(() => {
    return getQuickSelectors(maxLimitAvailable);
  }, [maxLimitAvailable]);

  const onBackWrapped = useCallback(() => {
    trackEvent(AnalyticsEvent.PressWalletOnRampBack, {});
    onBack?.();
  }, [trackEvent, onBack]);

  const [amountText, setAmountText] = React.useState('');
  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewWalletOnRamp, {
      chain: selectedToken.chain,
      ticker: 'USDC',
      paymentMethod,
    });
  }, [selectedToken, paymentMethod, trackEvent]);
  const amountValue: number | undefined = useMemo(() => {
    if (amountText === '') {
      return 0;
    }

    const parsed = parseFloat(amountText);

    if (isNaN(parsed) || parsed < 0) {
      return 0;
    }

    // Round to 2 decimals
    return Math.round(parsed * 100) / 100;
  }, [amountText]);

  // Initialize onramp hook
  const { initiateOnramp, isLoading, error } = useOnrampWithCoinbase();

  const onPress = useCallback(async () => {
    // Biometric auth
    const { success } = await attemptBiometricAuth();
    if (!success) {
      onBack?.();
      return;
    }

    // Validate amount
    if (!amountValue || amountValue < 10) {
      return;
    }

    triggerImpactAsync();
    trackEvent(AnalyticsEvent.PressWalletOnRampBuy, {
      amountUsd: amountValue,
      chain: selectedToken.chain,
      ticker: 'USDC',
      paymentMethod,
    });
    initiateOnramp(
      amountValue,
      selectedToken.chain,
      selectedToken.ca,
      paymentMethod,
    );

    // Pop screen with a timer to avoid flickering
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      goBack();
    }, 1000);
  }, [
    attemptBiometricAuth,
    goBack,
    trackEvent,
    triggerImpactAsync,
    amountValue,
    initiateOnramp,
    selectedToken,
    paymentMethod,
    onBack,
  ]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const [buttonTitle, isEnabled, buttonIcon] = useMemo(() => {
    if (amountValue === undefined) {
      return ['Enter an amount', false, undefined];
    }

    if (amountValue < 10) {
      return ['$10 minimum', false, undefined];
    }

    if (amountValue > MAX_AMOUNT_ALLOWED) {
      return [
        `Enter an amount less than ${formatDisplayDollars(MAX_AMOUNT_ALLOWED)}`,
        false,
        undefined,
      ];
    }

    return [
      'Pay',
      true,
      () => (
        <ScanFaceIcon
          size={16}
          color={t.colors.text.light}
          fill={t.colors.text.light}
        />
      ),
    ];
  }, [amountValue, t]);

  const leftIcon = useMemo(() => {
    if (onBack === undefined) {
      return null;
    }

    return (
      <Pressable
        hitSlop={hitSlop}
        onPress={onBackWrapped}
        style={[t.itemsStart, { width: 40 }]}
      >
        <ChevronLeft size={24} color={t.colors.text.primary} />
      </Pressable>
    );
  }, [onBack, onBackWrapped, t.itemsStart, t.colors.text.primary]);

  // Show error alert if onramp fails
  useEffect(() => {
    if (error) {
      Alert.alert('Payment Error', error);
    }
  }, [error]);

  const { bottom } = useSafeAreaInsets();

  const accessoryText = useMemo(() => {
    if (!coinbaseOnrampLimit?.guestCheckout.isAvailable) {
      return TOKEN_ACCESSORY_STRINGS.guest_checkout_limit_exceeded;
    }
    if (
      coinbaseOnrampLimit?.guestCheckout.limitUsd &&
      amountValue &&
      amountValue > coinbaseOnrampLimit?.guestCheckout.limitUsd
    ) {
      return TOKEN_ACCESSORY_STRINGS.guest_checkout_limit_exceeded;
    }
    return null;
  }, [coinbaseOnrampLimit, amountValue]);

  const [isBottomSheetOpen, setIsBottomSheetOpen] = React.useState(false);
  const bottomSheetModalRef = useBottomSheetModalRef();
  const handlePress = React.useCallback(() => {
    setIsBottomSheetOpen(true);
  }, [setIsBottomSheetOpen]);

  if (showSelector) {
    return (
      <WalletOnRampSelector
        onBack={() => setShowSelector(false)}
        setSelectedToken={setSelectedToken}
      />
    );
  }

  return (
    <ScrollView
      style={{ minHeight: '100%' }}
      contentContainerStyle={[t.flexGrow, t.flex1]}
      alwaysBounceVertical={false}
    >
      <WalletScreenHeader title="Buy" leftIcon={leftIcon} />
      <TokenListItem
        token={selectedToken}
        variant="onramp"
        pressableAnimationsDisabled
        // TODO: Re-enable as we support more tokens
        // onPress={() => setShowSelector(true)}
      />
      <View style={[t.flex1, t.flexCol]}>
        <View style={[t.flex1, t.justifyCenter, t.itemsCenter, t.h12]}>
          <View
            style={[t.flexCol, t.itemsCenter, t.gap1, t.justifyStart, t.h20]}
          >
            <Text2 weight="semibold" color="primary" size="6xl">
              ${formatNumber(amountValue)}
            </Text2>
            {accessoryText && (
              <TokenInputAccessory
                text={accessoryText}
                icon={<TokenInputAccessoryIcon type="quote_unavailable" />}
                color={TokenInputAccessoryColorMap['quote_unavailable']}
                onPress={handlePress}
              />
            )}
          </View>
        </View>

        {/* This is the keyboard */}
        <View>
          {/* Merchant name */}
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.pY3,
              { marginHorizontal: 10, gap: 2 },
            ]}
          >
            <Coinbase
              fill={t.colors.text.primary}
              color={t.colors.text.primary}
            />
            <View style={[t.mB1]}>
              <CoinbaseWatermark
                fill={t.colors.text.primary}
                color={t.colors.text.primary}
              />
            </View>
          </View>

          {/* Simple selectors */}
          <View style={[t.flexRow, { gap: 10, paddingHorizontal: 10 }, t.pY3]}>
            {quickSelectors.map((selector, idx) => (
              <SimpleSelectBox
                key={idx}
                setAmountText={(text) => setAmountText(text)}
                selector={selector}
                maxLimitAvailable={maxLimitAvailable}
              />
            ))}
          </View>

          {/* Digit pad keyboard */}
          <NumPad value={amountText} maxDecimals={0} onChange={setAmountText} />
        </View>
      </View>
      <View style={[{ marginBottom: 10, paddingBottom: bottom }, t.pX3, t.mT3]}>
        <AtomsButton
          onPress={onPress}
          size="l"
          hierarchy="primary"
          disabled={!isEnabled}
          loading={isLoading}
          Icon={buttonIcon}
        >
          {buttonTitle}
        </AtomsButton>
      </View>
      {isBottomSheetOpen && (
        <TokenInputAccessoryBottomSheet
          warning={{
            type: 'coinbase_onramp_limit_explainer',
            severity: 'INFO',
            data: undefined,
          }}
          onDismiss={() => setIsBottomSheetOpen(false)}
          bottomSheetModalRef={bottomSheetModalRef}
        />
      )}
    </ScrollView>
  );
}
