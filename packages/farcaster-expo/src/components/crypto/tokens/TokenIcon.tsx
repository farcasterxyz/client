import { Ionicons } from '@expo/vector-icons';
import { ApiChain, ApiTokenLinkFeatures } from 'farcaster-client-data';
import React, { useMemo } from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';

import { useTheme } from '../../../contexts';
import { Text2 } from '../../design-system/Text';
import { CircleQuestionIcon } from '../../icons/CircleQuestionIcon';
import { RemoteImage } from '../../RemoteImage';
import { ChainImage } from '../chains/ChainImage';
import BNBDark from './images/dark/BNB.svg';
import CeloDark from './images/dark/CELO.svg';
import EthereumDark from './images/dark/ETH.svg';
import HypeDark from './images/dark/HYPE.svg';
import MonadDark from './images/dark/MON.svg';
import SolanaDark from './images/dark/SOL.svg';
import USDCDark from './images/dark/USDC.svg';
import BNBLight from './images/light/BNB.svg';
import CeloLight from './images/light/CELO.svg';
import EthereumLight from './images/light/ETH.svg';
import HypeLight from './images/light/HYPE.svg';
import MonadLight from './images/light/MON.svg';
import SolanaLight from './images/light/SOL.svg';
import USDCLight from './images/light/USDC.svg';

const TOKEN_IMAGES: Record<
  'true' | 'false',
  Record<string, React.FC<SvgProps>>
> = {
  true: {
    CELO: CeloDark,
    ETH: EthereumDark,
    SOL: SolanaDark,
    WSOL: SolanaDark,
    USDC: USDCDark,
    HYPE: HypeDark,
    BNB: BNBDark,
    WBNB: BNBDark,
    MON: MonadDark,
  },
  false: {
    CELO: CeloLight,
    ETH: EthereumLight,
    SOL: SolanaLight,
    WSOL: SolanaLight,
    USDC: USDCLight,
    HYPE: HypeLight,
    BNB: BNBLight,
    WBNB: BNBLight,
    MON: MonadLight,
  },
};

export function TokenIcon({
  iconUrl,
  secondIconUrl,
  diameter,
  chain,
  chainImageSize,
  symbol,
  secondSymbol,
  badge,
  imageBordered = true,
  imageStyle,
  bgMuted,
  features,
  badgeOffset,
}: {
  iconUrl?: string | undefined;
  secondIconUrl?: string | undefined;
  diameter: number;
  chain?: ApiChain;
  imageStyle?: StyleProp<ViewStyle>;
  imageBordered?: boolean;
  chainImageSize?: number;
  symbol?: string;
  secondSymbol?: string;
  badge?: React.ReactNode;
  badgeOffset?: { top: number; right: number };
  bgMuted?: boolean;
  features?: ApiTokenLinkFeatures;
}) {
  const t = useTheme();

  const testNetLogo = useMemo(() => {
    if (features?.isTestnet !== true) {
      return null;
    }
    const iconSize = 16; // Size for the w5, h5 classes
    const borderWidth = 2;

    return (
      <View
        style={[
          t.absolute,
          { top: -2, left: -2 },
          t.bgDefault,
          t.roundedFull,
          t.itemsCenter,
          t.justifyCenter,
          t.overflowHidden,
          {
            width: iconSize + borderWidth * 2,
            height: iconSize + borderWidth * 2,
          },
        ]}
      >
        <View
          style={[
            t.bgElevated,
            t.roundedFull,
            t.itemsCenter,
            t.justifyCenter,
            { width: iconSize, height: iconSize },
          ]}
        >
          <Ionicons name="code-working-sharp" size={12} color="white" />
        </View>
      </View>
    );
  }, [features, t]);

  const Icon = useMemo(() => {
    const TokenImage = TOKEN_IMAGES[t.dark ? 'true' : 'false'][symbol ?? ''];
    if (TokenImage) {
      if ((symbol === 'WSOL' || symbol === 'SOL') && Platform.OS === 'web') {
        // The Solana SVG on web is not rendering the Linear Gradient correctly
        // so we just use a remote PNG instead for now
        return (
          <RemoteImage
            uri="https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/05eb1ac6-f95a-456a-3faa-5d0f58eda300/original"
            recyclingKey="https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/05eb1ac6-f95a-456a-3faa-5d0f58eda300/original"
            width={diameter}
            height={diameter}
            style={[t.roundedFull]}
          />
        );
      }

      return (
        <TokenImage
          width={diameter}
          height={diameter}
          style={[t.roundedFull]}
        />
      );
    }

    if (secondIconUrl || secondSymbol) {
      return (
        <View
          style={[
            t.roundedFull,
            t.overflowHidden,
            { width: diameter, height: diameter },
          ]}
        >
          {/* Left half */}
          <View
            style={[
              t.absolute,
              {
                left: 0,
                width: diameter / 2,
                height: diameter,
                overflow: 'hidden',
                zIndex: 1,
              },
            ]}
          >
            {iconUrl ? (
              <RemoteImage uri={iconUrl} height={diameter} width={diameter} />
            ) : (
              <TokenDefaultIcon
                symbol={symbol}
                diameter={diameter}
                bgMuted={bgMuted}
              />
            )}
          </View>

          {/* Divider line */}
          <View
            style={[
              t.absolute,
              {
                left: '50%',
                width: 2,
                height: diameter,
                backgroundColor: t.colors.bgDefault,
                zIndex: 2,
                transform: [{ translateX: -1 }],
              },
            ]}
          />

          {/* Right half */}
          <View
            style={[
              t.absolute,
              {
                right: 0,
                width: diameter,
                height: diameter,
                overflow: 'hidden',
                zIndex: 0,
              },
            ]}
          >
            {secondIconUrl ? (
              <RemoteImage
                uri={secondIconUrl}
                height={diameter}
                width={diameter}
                shouldFadeIn={false}
              />
            ) : (
              <TokenDefaultIcon
                symbol={secondSymbol}
                diameter={diameter}
                bgMuted={bgMuted}
              />
            )}
          </View>
        </View>
      );
    }

    if (!iconUrl) {
      return (
        <TokenDefaultIcon
          symbol={symbol}
          diameter={diameter}
          bgMuted={bgMuted}
        />
      );
    }

    return (
      <RemoteImage
        uri={iconUrl}
        height={diameter}
        width={diameter}
        style={[
          t.roundedFull,
          imageStyle,
          imageBordered && [t.borderHairline, t.borders.secondary],
        ]}
        shouldFadeIn={false}
        shouldAttemptToUncloudifyOnError={true}
      />
    );
  }, [
    t,
    diameter,
    iconUrl,
    imageBordered,
    imageStyle,
    secondIconUrl,
    secondSymbol,
    symbol,
    bgMuted,
  ]);

  return (
    <View style={[t.relative, { width: diameter, height: diameter }]}>
      {Icon}
      {testNetLogo}
      {(chain || badge) && (
        <View
          style={[
            t.absolute,
            { right: badgeOffset?.right ?? 0, bottom: badgeOffset?.top ?? 0 },
          ]}
        >
          {chain ? (
            <ChainImage chain={chain} size={chainImageSize} bordered />
          ) : (
            badge
          )}
        </View>
      )}
    </View>
  );
}

export function TokenDefaultIcon({
  symbol,
  diameter,
  bgMuted,
}: {
  symbol: string | undefined;
  diameter: number;
  bgMuted?: boolean;
}) {
  const t = useTheme();

  const getTextSize = () => {
    if (diameter <= 16) {
      return 'xs';
    }
    if (diameter <= 24) {
      return 'sm';
    }
    if (diameter <= 32) {
      return 'base';
    }
    if (diameter <= 40) {
      return 'lg';
    }
    return 'xl';
  };

  return (
    <View
      style={[
        t.roundedFull,
        bgMuted ? t.bgMuted : t.bgFaint,
        t.itemsCenter,
        t.justifyCenter,
        { height: diameter, width: diameter },
      ]}
    >
      {symbol !== '[invalid]' && symbol !== undefined ? (
        <Text2 size={getTextSize()} weight="semibold" color="brand">
          {symbol[0]?.toUpperCase()}
        </Text2>
      ) : (
        <CircleQuestionIcon size={diameter * 0.6} color={t.colors.text.brand} />
      )}
    </View>
  );
}
