import formatDistanceStrict from 'date-fns/formatDistanceStrict';
import locale from 'date-fns/locale/en-US';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  ApiGetCoinbaseOnrampLimit200Response,
  formatDisplayDollars,
} from 'farcaster-client-data';
import {
  formatDistanceLong,
  useCoinbaseOnrampLimit,
} from 'farcaster-client-hooks';
import { Check, ChevronLeft, Copy, QrCode, X } from 'lucide-react-native';
import * as React from 'react';
import { useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';

import Crypto from '../../assets/platforms/payment/crypto.svg';
import Debit from '../../assets/platforms/payment/debit.svg';
import { hitSlop } from '../../constants';
import { useEmbeddedWallet } from '../../contexts/EmbeddedWalletContext';
import { useSharedNavigationContext } from '../../contexts/SharedNavigationContext';
import { useSharedTelemetry } from '../../contexts/SharedTelemetryContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useWalletFeatures } from '../../contexts/WalletFeaturesProvider';
import {
  useCopyWalletAddress,
  useHaptics,
  useWalletGeoRestricted,
} from '../../hooks';
import { sizes } from '../../theme';
import { formatAddress } from '../../utils/WalletUtils';
import { ChainImage } from '../crypto';
import { AnimatedPressable, Text2 } from '../design-system';
import { WalletNotAvailableInRegion } from './auth/WalletNotAvailableInRegion';
import { WalletNotConnected } from './auth/WalletNotConnected';
import { WalletOnRamp } from './WalletOnRamp';
import { WalletScreenHeader } from './WalletScreenHeader';

function WalletReceiveCrypto({ onBack }: { onBack?: () => void }) {
  const { evmAddress, solanaAddress } = useEmbeddedWallet();
  const geoRestricted = useWalletGeoRestricted();
  const t = useTheme();
  const [isDepositFlow, setIsDepositFlow] = React.useState(false);
  const { trackEvent } = useSharedTelemetry();

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewWalletReceive, {});
  }, [trackEvent]);

  const leftIcon = useMemo(() => {
    if (!onBack) {
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

  if (geoRestricted) {
    return <WalletNotAvailableInRegion />;
  }

  if (!evmAddress) {
    return <WalletNotConnected source="wallet-receive" />;
  }

  if (isDepositFlow) {
    return <WalletOnRamp onBack={() => setIsDepositFlow(false)} />;
  }

  return (
    <ScrollView
      style={[{ minHeight: '100%' }]}
      contentContainerStyle={[t.flexGrow]}
      alwaysBounceVertical={false}
    >
      {onBack ? (
        <WalletScreenHeader title="Receive Crypto" leftIcon={leftIcon} />
      ) : (
        <WalletScreenHeader title="Deposit" />
      )}
      <View>
        <WalletAddress chain="base" address={evmAddress} name="Base" />
        {solanaAddress && (
          <WalletAddress chain="solana" address={solanaAddress} name="Solana" />
        )}
        <WalletAddress chain="bsc" address={evmAddress} name="BSC" />
        <WalletAddress chain="ethereum" address={evmAddress} name="Ethereum" />
        <WalletAddress chain="arbitrum" address={evmAddress} name="Arbitrum" />
        <WalletAddress chain="monad" address={evmAddress} name="Monad" />
        <WalletAddress chain="hyperevm" address={evmAddress} name="HyperEVM" />
        <WalletAddress
          chain="robinhood"
          address={evmAddress}
          name="Robinhood"
        />
        <WalletAddress chain="celo" address={evmAddress} name="Celo" isLast />
      </View>
    </ScrollView>
  );
}

interface WalletReceiveOption {
  title: string;
  description: string;
  icon: typeof Crypto;
  onPress: () => void | Promise<void>;
}

function WalletTemplateRow({
  option,
  shouldShowNewBadge = true,
}: {
  option: WalletReceiveOption;
  shouldShowNewBadge?: boolean;
}) {
  const t = useTheme();
  return (
    <TouchableOpacity
      style={[
        t.flexRow,
        t.pY3,
        t.mX3,
        t.itemsCenter,
        { gap: sizes.s2 },
        t.borderB,
        t.borders.primary,
      ]}
      onPress={option.onPress}
    >
      <View
        style={[
          { borderRadius: 8 },
          t.backgrounds.secondary,
          t.w8,
          t.h8,
          t.justifyCenter,
          t.itemsCenter,
        ]}
      >
        <option.icon color={t.colors.text.primary} />
      </View>
      <View style={[t.flex1, t.flexCol, { gap: sizes.s1 }]}>
        <View style={[t.flexRow, t.itemsCenter, { gap: sizes.s1 }]}>
          <Text2 weight="semibold" color="primary">
            {option.title}
          </Text2>
          {shouldShowNewBadge && (
            <View
              style={[
                {
                  backgroundColor: t.dark
                    ? t.colors.green900
                    : t.colors.green100,
                  paddingVertical: 2,
                  paddingHorizontal: 6,
                  borderRadius: 16,
                },
                t.itemsCenter,
                t.justifyCenter,
              ]}
            >
              <Text2 weight="medium" color="success" style={{ fontSize: 12 }}>
                New
              </Text2>
            </View>
          )}
        </View>
        <Text2 size="xs" color="tertiary">
          {option.description}
        </Text2>
      </View>
    </TouchableOpacity>
  );
}

type ReceiveType = 'crypto' | 'coinbase' | 'debit' | undefined;

function WalletTemplate({
  onSelect,
}: {
  onSelect: (type: 'crypto' | 'coinbase' | 'debit') => void;
}) {
  const t = useTheme();
  const { goBack } = useSharedNavigationContext();
  const { trackEvent } = useSharedTelemetry();
  const { supportedFeatures } = useWalletFeatures();
  const onRampEnabled = supportedFeatures.walletOnRamp !== false;

  const { data: coinbaseOnrampLimit } = useCoinbaseOnrampLimit({});

  // Add coinbase onramp limits with a default option
  const cbLimits: ApiGetCoinbaseOnrampLimit200Response['result'] =
    useMemo(() => {
      if (coinbaseOnrampLimit !== undefined) {
        return coinbaseOnrampLimit;
      }

      return {
        isAvailable: true,
        guestCheckout: { isAvailable: false },
      };
    }, [coinbaseOnrampLimit]);

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewWalletReceive, {});
  }, [trackEvent]);

  const coinbaseBuyOptionDescription: string | null = useMemo(() => {
    const { isAvailable, guestCheckout } = cbLimits;
    if (!isAvailable) {
      return null;
    }

    if (!guestCheckout.isAvailable) {
      return 'Coinbase account required';
    }

    if (guestCheckout.limitUsd !== undefined) {
      const formattedLimitUsd = formatDisplayDollars(guestCheckout.limitUsd);
      return `${formattedLimitUsd} available as guest`;
    }

    if (guestCheckout.refreshDate !== undefined) {
      const delta = formatDistanceStrict(
        new Date(guestCheckout.refreshDate),
        new Date(),
        {
          addSuffix: true,
          locale: {
            ...locale,
            formatDistance: formatDistanceLong,
          },
        },
      );
      return `Available in ${delta} · Login to Coinbase removes limits`;
    }

    return 'Coinbase account required';
  }, [cbLimits]);

  const options: {
    type: 'crypto' | 'coinbase' | 'debit';
    title: string;
    description: string;
    icon: typeof Crypto;
  }[] = useMemo(
    () => [
      {
        type: 'crypto' as const,
        title: 'Transfer crypto',
        description: 'From your wallet or exchange',
        icon: Debit,
      },
      ...(onRampEnabled && cbLimits.isAvailable && coinbaseBuyOptionDescription
        ? [
            {
              type: 'debit' as const,
              title: 'Buy crypto',
              description: coinbaseBuyOptionDescription,
              icon: Crypto,
            },
          ]
        : []),
    ],
    [onRampEnabled, cbLimits, coinbaseBuyOptionDescription],
  );

  const rightIcon = useMemo(() => {
    if (Platform.OS !== 'android') {
      return null;
    }

    return (
      <Pressable
        hitSlop={hitSlop}
        onPress={goBack}
        style={[t.itemsEnd, { width: 40 }]}
      >
        <X size={24} color={t.colors.text.primary} />
      </Pressable>
    );
  }, [goBack, t.colors.text.primary, t.itemsEnd]);

  return (
    <ScrollView
      style={[{ minHeight: '100%' }]}
      contentContainerStyle={[t.flexGrow]}
      alwaysBounceVertical={false}
    >
      <WalletScreenHeader title="Deposit" rightIcon={rightIcon} />
      <View>
        {options.map((option) => (
          <WalletTemplateRow
            key={option.type}
            option={{
              title: option.title,
              description: option.description,
              icon: option.icon,
              onPress: () => {
                trackEvent(AnalyticsEvent.PressWalletReceiveOption, {
                  option: option.type,
                });
                onSelect(option.type);
              },
            }}
            shouldShowNewBadge={option.type !== 'crypto'}
          />
        ))}
      </View>
    </ScrollView>
  );
}

export function WalletReceive() {
  const [receiveType, setReceiveType] = React.useState<ReceiveType>(undefined);
  const { supportedFeatures } = useWalletFeatures();
  const canShowDepositFlow = useMemo(() => {
    const isSupportedPlatform =
      Platform.OS === 'android' || Platform.OS === 'ios';
    return isSupportedPlatform;
  }, []);

  const goBack = React.useCallback(() => {
    setReceiveType(undefined);
  }, []);

  if (!canShowDepositFlow || supportedFeatures.walletOnRamp === false) {
    return <WalletReceiveCrypto />;
  }

  if (receiveType === 'crypto') {
    return <WalletReceiveCrypto onBack={goBack} />;
  }

  if (receiveType === 'coinbase') {
    return <WalletOnRamp onBack={goBack} />;
  }

  if (receiveType === 'debit') {
    return <WalletOnRamp onBack={goBack} paymentMethod="CARD" />;
  }

  return <WalletTemplate onSelect={setReceiveType} />;
}

function WalletAddress({
  chain,
  address,
  name,
  isLast,
}: {
  chain: ApiChain;
  address: string;
  name: string;
  isLast?: boolean;
}) {
  const t = useTheme();

  const { copy, copied } = useCopyWalletAddress(address);
  const { trackEvent } = useSharedTelemetry();
  const { navigate } = useSharedNavigationContext();
  const { triggerImpactAsync } = useHaptics();

  const onCopyPress = React.useCallback(() => {
    triggerImpactAsync();
    trackEvent(AnalyticsEvent.PressWalletCopySelfAddress, {});
    copy();
  }, [copy, trackEvent, triggerImpactAsync]);

  const onPress = React.useCallback(() => {
    triggerImpactAsync();
    navigate({
      path: 'WalletReceiveOnChain',
      params: { chain },
    });
  }, [navigate, chain, triggerImpactAsync]);

  return (
    <Pressable
      style={[
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        t.p3,
        isLast ? undefined : t.borderB,
        t.borders.primary,
        { borderRadius: 12 },
      ]}
      onPress={onPress}
    >
      <View style={[t.flexRow, { gap: 8 }]}>
        <ChainImage chain={chain} size={32} />
        <View style={[t.justifyBetween]}>
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <Text2 weight="medium" size="sm">
              {name}
            </Text2>
          </View>
          <Text2 size="xs" color="tertiary">
            {formatAddress(address)}
          </Text2>
        </View>
      </View>
      <View style={[t.flexRow, { gap: 8 }]}>
        <AnimatedPressable
          onPress={onPress}
          style={[t.justifyCenter, t.itemsCenter, { width: 36, height: 36 }]}
        >
          <QrCode size={20} color={t.colors.text.secondary} />
        </AnimatedPressable>
        <AnimatedPressable
          onPress={onCopyPress}
          style={[t.justifyCenter, t.itemsCenter, { width: 36, height: 36 }]}
        >
          {copied ? (
            <Check size={20} color={t.colors.text.secondary} />
          ) : (
            <Copy size={20} color={t.colors.text.secondary} />
          )}
        </AnimatedPressable>
      </View>
    </Pressable>
  );
}
