import { Delete } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../contexts';
import { useHaptics } from '../hooks';
import { Text2 } from './design-system/Text';

const NumPadButton = <
  TSymbol extends
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '.'
    | 'del'
    | '0',
>({
  symbol,
  onPress,
  onLongPress,
  disabled,
}: {
  symbol: TSymbol;
  onPress: (symbol: TSymbol) => void;
  onLongPress?: (symbol: TSymbol) => void;
  disabled?: boolean;
}) => {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();
  const scale = useSharedValue(1);

  const isIcon = symbol === 'del';
  const Icon = useMemo(() => {
    if (symbol === 'del') {
      return <Delete style={[t.texts.primary]} />;
    } else {
      return null;
    }
  }, [symbol, t.texts.primary]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const wrappedOnPress = useCallback(() => {
    triggerImpactAsync();
    onPress(symbol);
  }, [onPress, symbol, triggerImpactAsync]);

  const wrappedOnLongPress = useCallback(() => {
    if (onLongPress) {
      triggerImpactAsync();
      onLongPress(symbol);
    }
  }, [onLongPress, symbol, triggerImpactAsync]);

  return (
    <Pressable
      onPress={wrappedOnPress}
      onLongPress={onLongPress ? wrappedOnLongPress : undefined}
      onTouchStart={() => {
        scale.value = withSpring(0.9);
      }}
      onTouchEnd={() => {
        scale.value = withSpring(1);
      }}
      style={[t.flex1]}
      disabled={disabled}
    >
      <Animated.View
        style={[
          { height: 46 },
          t.itemsCenter,
          t.justifyCenter,
          t.roundedLg,
          animatedStyle,
          t.bgSwap,
          disabled && { opacity: 0.25 },
        ]}
      >
        {isIcon ? (
          Icon
        ) : (
          <Text2 size="2xl" weight="semibold">
            {symbol}
          </Text2>
        )}
      </Animated.View>
    </Pressable>
  );
};

export function NumPad({
  maxDecimals,
  value,
  onChange,
  onInvalidInput,
  noPadding,
}: {
  value: string;
  maxDecimals?: number;
  onChange: (value: string) => void;
  onInvalidInput?: (input: string) => void;
  noPadding?: boolean;
}) {
  const t = useTheme();

  const handleNumberPress = useCallback(
    (number: string) => {
      const [, decimals] = value.split('.');
      if (
        decimals !== undefined &&
        maxDecimals !== undefined &&
        decimals.length >= maxDecimals
      ) {
        onInvalidInput?.(number);
        return;
      }

      if (value === '0') {
        return onChange(number);
      }

      return onChange(value + number);
    },
    [maxDecimals, onChange, onInvalidInput, value],
  );

  const handleDeletePress = useCallback(() => {
    onChange(value.slice(0, -1));
  }, [onChange, value]);

  const handleDeleteLongPress = useCallback(() => {
    onChange('0');
  }, [onChange]);

  const handleDecimalPress = useCallback(() => {
    if (value.includes('.')) {
      onInvalidInput?.('.');
      return;
    }

    if (value === '') {
      onChange('0.');
      return;
    }

    onChange(value + '.');
  }, [value, onChange, onInvalidInput]);

  return (
    <View style={[t.wFull, { paddingVertical: 6, gap: 6 }]}>
      <View style={[t.flexRow, t.wFull, !noPadding && t.pX3, { gap: 6 }]}>
        <NumPadButton onPress={handleNumberPress} symbol="1" />
        <NumPadButton onPress={handleNumberPress} symbol="2" />
        <NumPadButton onPress={handleNumberPress} symbol="3" />
      </View>
      <View style={[t.flexRow, t.wFull, !noPadding && t.pX3, { gap: 8 }]}>
        <NumPadButton onPress={handleNumberPress} symbol="4" />
        <NumPadButton onPress={handleNumberPress} symbol="5" />
        <NumPadButton onPress={handleNumberPress} symbol="6" />
      </View>
      <View style={[t.flexRow, t.wFull, !noPadding && t.pX3, { gap: 8 }]}>
        <NumPadButton onPress={handleNumberPress} symbol="7" />
        <NumPadButton onPress={handleNumberPress} symbol="8" />
        <NumPadButton onPress={handleNumberPress} symbol="9" />
      </View>
      <View style={[t.flexRow, t.wFull, !noPadding && t.pX3, { gap: 8 }]}>
        <NumPadButton
          onPress={handleDecimalPress}
          symbol="."
          disabled={
            maxDecimals === 0 ||
            (maxDecimals !== undefined &&
              value.includes('.') &&
              value.split('.')[1]?.length >= maxDecimals)
          }
        />
        <NumPadButton onPress={handleNumberPress} symbol="0" />
        <NumPadButton
          onPress={handleDeletePress}
          onLongPress={handleDeleteLongPress}
          symbol="del"
        />
      </View>
    </View>
  );
}

export const formatNumPadValue = (value: string) => {
  if (value === '') {
    return '0';
  }

  if (value === '.') {
    return '0.';
  }

  const [integers, decimals] = value.split('.');
  const formattedIntegers =
    integers === undefined || integers === ''
      ? '0'
      : parseInt(integers).toLocaleString();

  if (value.includes('.')) {
    return formattedIntegers + '.' + decimals;
  }

  return formattedIntegers;
};
