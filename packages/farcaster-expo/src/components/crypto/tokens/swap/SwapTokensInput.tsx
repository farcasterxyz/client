import {
  ApiChain,
  ApiOnchainTokenMinimal,
  ApiTokenLink,
  ETHER_DECIMALS,
} from 'farcaster-client-data';
import {
  formatAmount,
  formatBalance,
  formatTokenQuantity,
  formatTokenSymbol,
  useFetchToken,
} from 'farcaster-client-hooks';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../../../contexts';
import { useWalletBalances } from '../../../../hooks';
import { useSafeFocusEffect } from '../../../../hooks/useSafeFocusEffect';
import {
  EIP7528_NATIVE_ASSET_ADDRESS,
  isSameAsset,
  NATIVE_ASSET_SYMBOLS,
  parseTokenAmount,
  SOLANA_NATIVE_ASSET_ADDRESS,
  sortBalancesByPriority,
  tokenPositionToMinimalToken,
  tokenPositionToTokenLink,
  USDC_ADDRESSES,
} from '../../../../utils';
import { TokenIcon } from '../../../crypto/tokens/TokenIcon';
import {
  AnimatedPressable,
  Text2,
  TextInput,
  TextPlaceholder,
} from '../../../design-system';
import { useSwapTokens } from './SwapTokensProvider';

export function SwapTokenInput({
  value,
  token,
  balance,
  usdValue,
  onPressTokenSelector,
  onPressSelectToken,
  onPressBalance,
  onWebChangeText,
  editable = false,
  isLoading = false,
  side,
  error,
  showPriceImpactWarning,
}: {
  value: string;
  token?: ApiOnchainTokenMinimal;
  balance?: string;
  usdValue: number;
  onPressTokenSelector: () => void;
  onPressSelectToken: (token: ApiTokenLink) => void;
  onPressBalance?: () => void;
  onWebChangeText?: (text: string) => void;
  editable?: boolean;
  isLoading?: boolean;
  side: 'sell' | 'buy';
  error?: boolean;
  showPriceImpactWarning?: boolean;
}) {
  const t = useTheme();

  const formattedValue = React.useMemo(() => {
    if (!value) {
      return '';
    }

    let formattedValue = formatBalance(parseFloat(value), token?.priceUsd);

    if (side === 'buy') {
      return formattedValue;
    }

    const decimalSeparatorLocal =
      (1.1).toLocaleString().replace(/1/g, '').replace(/\./g, '')[0] || '.';
    const decimalSeparator = '.';

    if (!value.includes(decimalSeparator)) {
      return formattedValue;
    }

    let decimals = value.split(decimalSeparator)[1];

    // This is necessary to format number input after pressing max
    if (side === 'sell') {
      const balanceAmount = parseTokenAmount(
        balance ?? '0',
        token?.decimals ?? 18,
      );

      if (balanceAmount === parseFloat(value)) {
        formattedValue = formatAmount(balanceAmount, {
          priceUsd: token?.priceUsd,
        });

        decimals = formattedValue.split(decimalSeparatorLocal)[1];
      }
    }

    const formattedInt = formattedValue.split(decimalSeparatorLocal)[0];

    return `${formattedInt}${decimalSeparatorLocal}${decimals ?? ''}`;
  }, [value, token?.priceUsd, side, balance, token?.decimals]);

  if (!token) {
    return (
      <EmptyTokenSelector
        onPressTokenSelector={onPressTokenSelector}
        onPressSelectToken={onPressSelectToken}
        side={side}
      />
    );
  }

  return (
    <View style={[t.flex, t.wFull, t.justifyEnd, { height: 96, gap: 10 }]}>
      <View style={[t.flex, t.flexRow, t.itemsEnd, t.justifyBetween]}>
        <AmountInput
          value={formattedValue}
          webValue={value}
          editable={editable}
          onWebChangeText={onWebChangeText}
          isLoading={isLoading}
          error={error}
        />
        <AnimatedPressable onPress={onPressTokenSelector}>
          <View
            style={[
              t.flex,
              t.flexRow,
              t.justifyCenter,
              t.itemsCenter,
              t.roundedFull,
              t.backgrounds.secondary,
              t.borderHairline,
              t.borders.primary,
              {
                height: 38,
                maxWidth: 160,
                paddingLeft: 6,
                paddingRight: 9,
                gap: 4,
              },
            ]}
          >
            <TokenIcon
              iconUrl={token.imageUrl}
              chain={token.chain}
              diameter={26}
              chainImageSize={12}
              symbol={token.symbol}
              badgeOffset={{ top: -2, right: -2 }}
            />
            <Text2
              weight="semibold"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[{ maxWidth: 80 }]}
            >
              {formatTokenSymbol(token.symbol, token.ca)}
            </Text2>
          </View>
        </AnimatedPressable>
      </View>
      <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween]}>
        <Text2
          size="sm"
          weight="medium"
          numberOfLines={1}
          color={showPriceImpactWarning ? 'danger' : 'secondary'}
        >
          {usdValue.toLocaleString(undefined, {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text2>
        <Pressable onPress={onPressBalance}>
          <Text2
            size="sm"
            numberOfLines={1}
            weight="medium"
            style={t.texts.secondary}
          >
            {token
              ? `${formatTokenQuantity({
                  quantity: balance ? BigInt(balance) : BigInt(0),
                  price: token.priceUsd,
                  decimals: token.decimals ?? ETHER_DECIMALS,
                })} ${formatTokenSymbol(token.symbol)}`
              : ''}
          </Text2>
        </Pressable>
      </View>
    </View>
  );
}

function AmountInput({
  value,
  webValue,
  editable,
  onWebChangeText,
  isLoading = false,
  error = false,
}: {
  value: string;
  webValue: string;
  editable: boolean;
  onWebChangeText?: (text: string) => void;
  isLoading?: boolean;
  error?: boolean;
}) {
  const t = useTheme();

  // Constants for sizing
  const MAX_WIDTH = Platform.OS === 'web' ? 240 : 260;
  const BASE_FONT_SIZE = 36; // 4xl size
  const MIN_FONT_SIZE = 16; // Minimum readable size
  const PADDING_HORIZONTAL = 8; // Account for paddingLeft: 3, paddingRight: 1
  const SAFETY_MARGIN = 0.98; // Use 90% of available width to prevent ellipsis

  // More accurate character width calculation
  const calculateTextWidth = React.useCallback(
    (text: string, fontSize: number) => {
      // Character width ratios for semibold font (more conservative)
      const charWidths: Record<string, number> = {
        '0': 0.7,
        '1': 0.5,
        '2': 0.65,
        '3': 0.65,
        '4': 0.7,
        '5': 0.65,
        '6': 0.7,
        '7': 0.6,
        '8': 0.7,
        '9': 0.7,
        '.': 0.35,
        ',': 0.35,
      };

      let totalWidth = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const ratio = charWidths[char] || 0.6; // Default ratio
        totalWidth += fontSize * ratio;
      }

      return totalWidth;
    },
    [],
  );

  // Calculate initial font size synchronously
  const calculateOptimalFontSize = React.useCallback(
    (text: string) => {
      const availableWidth = (MAX_WIDTH - PADDING_HORIZONTAL) * SAFETY_MARGIN;
      const estimatedWidth = calculateTextWidth(text || '0', BASE_FONT_SIZE);

      if (estimatedWidth <= availableWidth) {
        return BASE_FONT_SIZE;
      }

      // Binary search for optimal font size
      let low = MIN_FONT_SIZE;
      let high = BASE_FONT_SIZE;
      let optimalSize = MIN_FONT_SIZE;

      while (high - low > 0.5) {
        const mid = (low + high) / 2;
        const width = calculateTextWidth(text, mid);

        if (width <= availableWidth) {
          optimalSize = mid;
          low = mid;
        } else {
          high = mid;
        }
      }

      return optimalSize;
    },
    [calculateTextWidth, MAX_WIDTH],
  );

  const fontSize = useSharedValue(BASE_FONT_SIZE);

  React.useEffect(() => {
    if (!value) {
      return;
    }

    const currentSize = calculateOptimalFontSize(value);

    if (currentSize === MIN_FONT_SIZE) {
      fontSize.set(MIN_FONT_SIZE);
    } else {
      fontSize.set(
        withTiming(currentSize, {
          duration: 150,
          easing: Easing.out(Easing.cubic),
        }),
      );
    }
  }, [value, calculateOptimalFontSize, fontSize, calculateTextWidth]);

  React.useEffect(() => {
    if (isLoading) {
      fontSize.set(BASE_FONT_SIZE);
    }
  }, [isLoading, fontSize]);

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      fontSize: fontSize.value,
      lineHeight: fontSize.value * 1.2,
    };
  });

  if (isLoading) {
    return <TextPlaceholder size="4xl" width={200} />;
  }

  if (Platform.OS === 'web' && editable) {
    return (
      <TextInput
        style={[
          t.texts.primary,
          t.text4xl,
          t.fontSemibold,
          !value ? t.texts.tertiary : error ? t.texts.danger : t.texts.primary,
          { maxWidth: MAX_WIDTH, paddingRight: 16 },
        ]}
        cursorColor={t.colors.text.tertiary}
        value={webValue}
        onChangeText={onWebChangeText}
        placeholder="0"
        autoFocus
      />
    );
  }

  return (
    <View style={[t.flex, t.flexRow, t.justifyCenter, t.itemsCenter]}>
      <BlinkingCursor enabled={!value && editable} />
      <Animated.Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          t.fontSemibold,
          !value ? t.texts.tertiary : error ? t.texts.danger : t.texts.primary,
          !value
            ? { paddingHorizontal: 1 }
            : { paddingLeft: 3, paddingRight: 1 },
          {
            letterSpacing: -0.25,
            maxWidth: MAX_WIDTH,
          },
          animatedTextStyle,
          !value && {
            fontSize: BASE_FONT_SIZE,
            lineHeight: BASE_FONT_SIZE * 1.2,
          },
        ]}
      >
        {value || '0'}
      </Animated.Text>
      <BlinkingCursor enabled={!!value && editable} />
    </View>
  );
}

function BlinkingCursor({ enabled }: { enabled: boolean }) {
  const t = useTheme();

  const cursorOpacity = useSharedValue(1);
  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  useSafeFocusEffect(
    React.useCallback(() => {
      if (!enabled) {
        return;
      }

      cursorOpacity.value = withRepeat(
        withSequence(
          withTiming(0),
          withTiming(1, {
            duration: 700,
            easing: Easing.bezier(0.9, 0, 0.1, 1),
          }),
        ),
        -1,
        true,
      );

      return () => {
        cancelAnimation(cursorOpacity);
        cursorOpacity.value = 1;
      };
    }, [cursorOpacity, enabled]),
  );

  if (!enabled) {
    return null;
  }

  return (
    <Animated.View
      style={[
        cursorStyle,
        {
          width: 2,
          height: 40,
          backgroundColor: t.colors.text.tertiary,
          borderRadius: 16,
        },
      ]}
    />
  );
}

function EmptyTokenSelector({
  onPressTokenSelector,
  onPressSelectToken,
  side,
}: {
  onPressTokenSelector: () => void;
  onPressSelectToken: (token: ApiTokenLink) => void;
  side: 'sell' | 'buy';
}) {
  const t = useTheme();

  return (
    <View style={[t.flex, t.wFull, t.justifyEnd, { height: 96, gap: 10 }]}>
      <View style={[t.flex, t.flexRow, t.itemsEnd, t.justifyBetween]}>
        {side === 'sell' && (
          <SellTokenSuggestions onPressSelectToken={onPressSelectToken} />
        )}
        {side === 'buy' && (
          <BuyTokenSuggestions onPressSelectToken={onPressSelectToken} />
        )}
        <AnimatedPressable onPress={onPressTokenSelector}>
          <View
            style={[
              t.flex,
              t.flexRow,
              t.justifyCenter,
              t.itemsCenter,
              t.roundedFull,
              t.backgrounds.brand,
              { height: 38, paddingLeft: 6, paddingRight: 9, gap: 4 },
            ]}
          >
            <View
              style={[
                t.backgrounds.light,
                t.roundedFull,
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                { width: 26, height: 26 },
              ]}
            >
              <Plus width={18} strokeWidth={3} color={t.colors.text.brand} />
            </View>
            <Text2 weight="semibold" color="light">
              Select
            </Text2>
          </View>
        </AnimatedPressable>
      </View>
      <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween]}>
        <Text2 size="sm" weight="medium" numberOfLines={1} color="secondary">
          {' '}
        </Text2>
        <Text2 size="sm" numberOfLines={1} weight="medium" color="secondary">
          {' '}
        </Text2>
      </View>
    </View>
  );
}

function SellTokenSuggestions({
  onPressSelectToken,
}: {
  onPressSelectToken: (token: ApiTokenLink) => void;
}) {
  const t = useTheme();
  const { buyToken } = useSwapTokens();
  const { balances } = useWalletBalances();

  const prioritizedBalances = React.useMemo(
    () => sortBalancesByPriority(balances, buyToken?.chain ?? 'base'),
    [balances, buyToken?.chain],
  );

  return (
    <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 12 }]}>
      {prioritizedBalances.slice(0, 2).map((balance) => (
        <AnimatedPressable
          key={`${balance.ca}-${balance.chain}`}
          onPress={() => onPressSelectToken(balance)}
        >
          <TokenIcon
            iconUrl={balance.imageUrl}
            diameter={26}
            symbol={balance.ticker}
            chain={balance.chain}
            chainImageSize={12}
            badgeOffset={{ top: -2, right: -2 }}
          />
        </AnimatedPressable>
      ))}
    </View>
  );
}

function BuyTokenSuggestions({
  onPressSelectToken,
}: {
  onPressSelectToken: (token: ApiTokenLink) => void;
}) {
  const t = useTheme();
  const { sellToken } = useSwapTokens();

  const assets = React.useMemo(() => {
    const assets = [];
    const chain = sellToken?.chain ?? 'base';

    const isSellToken = (chain: ApiChain, ca: string) =>
      sellToken &&
      isSameAsset({
        chain,
        ca,
        asset: sellToken,
      });

    const nativeAssetSymbol = NATIVE_ASSET_SYMBOLS[chain];
    const nativeAssetCa =
      chain === 'solana'
        ? SOLANA_NATIVE_ASSET_ADDRESS
        : EIP7528_NATIVE_ASSET_ADDRESS;

    if (!isSellToken(chain, nativeAssetCa)) {
      assets.push({
        chain,
        ca: nativeAssetCa,
        symbol: nativeAssetSymbol,
      });
    }

    if (
      nativeAssetSymbol !== 'ETH' &&
      !isSellToken('base', EIP7528_NATIVE_ASSET_ADDRESS)
    ) {
      assets.push({
        chain: 'base' as const,
        ca: EIP7528_NATIVE_ASSET_ADDRESS,
        symbol: 'ETH',
      });
    }

    const usdcAddress = USDC_ADDRESSES[chain as ApiChain];
    if (usdcAddress && !isSellToken(chain, usdcAddress)) {
      assets.push({ chain, ca: usdcAddress, symbol: 'USDC' });
    } else if (assets.length < 2) {
      assets.push({
        chain: 'base' as const,
        ca: USDC_ADDRESSES.base!,
        symbol: 'USDC',
      });
    }

    return assets.filter(
      (asset) =>
        !sellToken ||
        !isSameAsset({
          chain: asset.chain,
          ca: asset.ca,
          asset: sellToken,
        }),
    );
  }, [sellToken]);

  return (
    <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 12 }]}>
      {assets.map((asset) => (
        <TokenSuggestion
          key={`${asset.ca}-${asset.chain}`}
          chain={asset.chain}
          ca={asset.ca}
          symbol={asset.symbol}
          onPress={onPressSelectToken}
        />
      ))}
    </View>
  );
}

function TokenSuggestion({
  chain,
  ca,
  symbol,
  onPress,
}: {
  chain: ApiChain;
  ca: string;
  symbol: string;
  onPress: (token: ApiTokenLink) => void;
}) {
  const { balances } = useWalletBalances();
  const [token, setToken] = React.useState<ApiTokenLink | undefined>(undefined);
  const fetchToken = useFetchToken();

  React.useEffect(() => {
    const initialize = async () => {
      const balance = balances.find((balance) =>
        isSameAsset({ chain, ca, asset: tokenPositionToMinimalToken(balance) }),
      );
      if (balance) {
        setToken(tokenPositionToTokenLink(balance));
      } else {
        const token = await fetchToken({ ca, chain });
        if (token?.token) {
          setToken(token.token);
        }
      }
    };
    initialize();
  }, [ca, chain, fetchToken, balances]);

  const handlePress = React.useCallback(() => {
    if (token) {
      onPress(token);
    }
  }, [token, onPress]);

  if (!token) {
    return null;
  }

  return (
    <AnimatedPressable onPress={handlePress}>
      <TokenIcon
        iconUrl=""
        diameter={26}
        symbol={symbol}
        chain={chain}
        chainImageSize={12}
        badgeOffset={{ top: -2, right: -2 }}
      />
    </AnimatedPressable>
  );
}
