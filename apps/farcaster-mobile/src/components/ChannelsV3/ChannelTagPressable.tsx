import {
  ApiChannelMinimal,
  ApiOnchainTokenMinimal,
} from 'farcaster-client-data';
import { TokenIcon } from 'farcaster-expo/src/components/crypto/tokens/TokenIcon';
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { Text } from '~/components/Text';
import { bodyFontSize, bodyLineHeight } from '~/constants/Cast';
import { useTheme } from '~/contexts/ThemeProvider';

import { ChannelRemoteImage } from './ChannelRemoteImage';
import { ChannelTagSize } from './ChannelTagSize';

export function channelTagTextColorGenerator({
  inversed,
  dark,
}: {
  inversed: boolean;
  dark: boolean;
}) {
  return inversed ? '#ffffff' : dark ? '#9FA3AF' : '#546473';
}

export function channelTagBackgroundColorGenerator({
  inversed,
  dark,
  variant,
}: {
  inversed: boolean;
  dark: boolean;
  variant?: 'direct-cast' | 'default';
}) {
  if (variant === 'direct-cast') {
    return dark ? '#473962' : '#E9E7F9';
  }

  return inversed ? '#8A63DE' : dark ? '#27212F' : '#F2F2F2';
}

type ChannelTagPressableProps = {
  channel: ApiChannelMinimal;
  variant?: 'direct-cast' | 'default';
  inversedTextColors: boolean;
  onPress: TouchableOpacityProps['onPress'];
  hitSlop: TouchableOpacityProps['hitSlop'];
  size: ChannelTagSize;
};

// Do not adjust the height of this component for the feed without adjusting
// the entire height of the username line
const ChannelTagPressable: React.FC<ChannelTagPressableProps> = React.memo(
  ({
    channel,
    variant = 'default',
    inversedTextColors,
    onPress,
    hitSlop,
    size,
  }) => {
    const t = useTheme();

    const channelTagTouchableStyle = React.useMemo(
      () => [
        t.flex,
        t.flexRow,
        t.itemsCenter,
        size === 'feed'
          ? {
              paddingLeft: 4,
              paddingRight: 4,
              height: 22,
              borderRadius: 12,
            }
          : {
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 20,
            },
        size !== 'threads' && {
          backgroundColor: channelTagBackgroundColorGenerator({
            inversed: inversedTextColors,
            dark: t.dark,
            variant,
          }),
        },
      ],
      [
        inversedTextColors,
        size,
        t.dark,
        t.flex,
        t.flexRow,
        t.itemsCenter,
        variant,
      ],
    );

    const channelTagTextStyle = React.useMemo(
      () => [
        t.flexShrink,
        t.mL1,
        t.fontMedium,
        {
          color:
            size === 'threads'
              ? t.colors.text.primary
              : channelTagTextColorGenerator({
                  inversed: inversedTextColors,
                  dark: t.dark,
                }),
          fontSize: size === 'feed' ? bodyFontSize : 15,
          lineHeight: size === 'feed' ? bodyLineHeight : 20,
          letterSpacing: -0.25,
        },
        size === 'threads' && [t.textLg, t.texts.brand, t.fontSemibold],
      ],
      [
        inversedTextColors,
        size,
        t.colors.text.primary,
        t.dark,
        t.flexShrink,
        t.fontMedium,
        t.fontSemibold,
        t.mL1,
        t.textLg,
        t.texts.brand,
      ],
    );

    return (
      <TouchableOpacity
        hitSlop={hitSlop}
        onPress={onPress}
        activeOpacity={0.75}
        style={channelTagTouchableStyle}
      >
        <ChannelRemoteImage channelImageUrl={channel.imageUrl} size={size} />
        <Text
          style={channelTagTextStyle}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {channel.key}
        </Text>
      </TouchableOpacity>
    );
  },
);

ChannelTagPressable.displayName = 'ChannelTagPressable';

type TokenTagPressableProps = {
  token: ApiOnchainTokenMinimal;
  variant?: 'direct-cast' | 'default';
  inversedTextColors: boolean;
  onPress: TouchableOpacityProps['onPress'];
  hitSlop: TouchableOpacityProps['hitSlop'];
  size: ChannelTagSize;
};

const TokenTagPressable: React.FC<TokenTagPressableProps> = React.memo(
  ({
    token,
    variant = 'default',
    inversedTextColors,
    onPress,
    hitSlop,
    size,
  }) => {
    const t = useTheme();

    const truncatedSymbol = React.useMemo(() => {
      const maxLength = 20;
      if (token.symbol.length <= maxLength) {
        return token.symbol;
      }
      return `${token.symbol.substring(0, maxLength)}...`;
    }, [token.symbol]);

    const tokenTagTouchableStyle = React.useMemo(
      () => [
        t.flex1,
        t.flexRow,
        t.itemsCenter,
        size === 'feed'
          ? {
              paddingLeft: 4,
              paddingRight: 4,
              height: 22,
              borderRadius: 12,
            }
          : {
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 20,
            },
        size !== 'threads' && {
          backgroundColor: channelTagBackgroundColorGenerator({
            inversed: inversedTextColors,
            dark: t.dark,
            variant,
          }),
        },
      ],
      [
        inversedTextColors,
        size,
        t.flex1,
        t.dark,
        t.flexRow,
        t.itemsCenter,
        variant,
      ],
    );

    const tokenTagTextStyle = React.useMemo(
      () => [
        t.flexShrink,
        t.mL1,
        t.fontMedium,
        {
          color:
            size === 'threads'
              ? t.colors.text.primary
              : channelTagTextColorGenerator({
                  inversed: inversedTextColors,
                  dark: t.dark,
                }),
          fontSize: size === 'feed' ? bodyFontSize : 15,
          lineHeight: size === 'feed' ? bodyLineHeight : 20,
          letterSpacing: -0.25,
        },
        size === 'threads' && [t.textLg, t.texts.brand, t.fontSemibold],
      ],
      [
        inversedTextColors,
        size,
        t.colors.text.primary,
        t.dark,
        t.flexShrink,
        t.fontMedium,
        t.fontSemibold,
        t.mL1,
        t.textLg,
        t.texts.brand,
      ],
    );

    return (
      <TouchableOpacity
        hitSlop={hitSlop}
        onPress={onPress}
        activeOpacity={0.75}
        style={tokenTagTouchableStyle}
      >
        <TokenIcon
          iconUrl={token.imageUrl}
          diameter={16}
          symbol={token.symbol}
        />
        <Text style={tokenTagTextStyle} numberOfLines={1} ellipsizeMode="tail">
          {truncatedSymbol}
        </Text>
      </TouchableOpacity>
    );
  },
);

TokenTagPressable.displayName = 'TokenTagPressable';

export { ChannelTagPressable, TokenTagPressable };
