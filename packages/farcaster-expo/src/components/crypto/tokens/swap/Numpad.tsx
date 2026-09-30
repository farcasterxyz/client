import { ArrowLeft } from 'lucide-react-native';
import React, { memo, useCallback } from 'react';
import { Platform, View } from 'react-native';

import { useTheme } from '../../../../contexts';
import { useHaptics } from '../../../../hooks';
import { AnimatedPressable, Text2 } from '../../../design-system';

const BUTTON_HEIGHT = 46;
const DELETE_SYMBOL = '←';

// Type definitions
type NumericSymbol = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type SpecialSymbol = '.' | typeof DELETE_SYMBOL;
type NumPadSymbol = NumericSymbol | SpecialSymbol;

// Numpad layout configuration
const NUMPAD_LAYOUT: NumPadSymbol[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', DELETE_SYMBOL],
];

/**
 * Individual button component for the numeric keypad
 */
const NumPadButton = memo(
  ({
    symbol,
    onPress,
    onLongPress,
    disabled,
    displaySymbol,
  }: {
    symbol: NumPadSymbol;
    onPress: (symbol: NumPadSymbol) => void;
    onLongPress?: (symbol: NumPadSymbol) => void;
    disabled?: boolean;
    displaySymbol?: string;
  }) => {
    const t = useTheme();
    const { triggerImpactAsync } = useHaptics();

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
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={symbol === DELETE_SYMBOL ? 'Delete' : symbol}
        accessibilityHint={
          symbol === DELETE_SYMBOL && onLongPress
            ? 'Long press to clear'
            : undefined
        }
        onPress={wrappedOnPress}
        onLongPress={onLongPress ? wrappedOnLongPress : undefined}
        style={[t.flex1]}
        disabled={disabled}
      >
        <View
          style={[{ height: BUTTON_HEIGHT }, t.itemsCenter, t.justifyCenter]}
        >
          {symbol === DELETE_SYMBOL ? (
            <ArrowLeft style={disabled ? t.texts.tertiary : t.texts.primary} />
          ) : (
            <Text2
              size="2xl"
              weight="semibold"
              color={disabled ? 'tertiary' : 'primary'}
              style={[
                symbol === '.' && {
                  textAlignVertical: 'center',
                  lineHeight: 16,
                },
              ]}
            >
              {displaySymbol ?? symbol}
            </Text2>
          )}
        </View>
      </AnimatedPressable>
    );
  },
);

/**
 * A numeric keypad component for entering decimal numbers
 * @param value - Current numeric value as string
 * @param onChange - Callback when value changes
 * @param maxDecimals - Maximum number of decimal places allowed
 * @param onInvalidInput - Callback when invalid input is attempted
 * @param noPadding - Whether to remove horizontal padding
 */
export function NumPad({
  maxDecimals,
  value,
  onChange,
  onInvalidInput,
  disabled = false,
  gap = Platform.OS === 'ios' ? 12 : 3,
}: {
  value: string;
  maxDecimals?: number;
  onChange: (value: string, prevValue?: string) => void;
  onInvalidInput?: (input: string) => void;
  disabled?: boolean;
  gap?: number;
}) {
  const t = useTheme();
  const decimalsEnabled = maxDecimals !== 0;

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
    onChange(value.slice(0, -1), value);
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

  // Helper function to determine which handler to use for a symbol
  const getHandlerForSymbol = useCallback(
    (symbol: NumPadSymbol) => {
      switch (symbol) {
        case '.':
          return handleDecimalPress;
        case DELETE_SYMBOL:
          return handleDeletePress;
        default:
          return () => handleNumberPress(symbol);
      }
    },
    [handleDecimalPress, handleDeletePress, handleNumberPress],
  );

  // Helper function to determine if a button should be disabled
  const getDisabledState = useCallback(
    (symbol: NumPadSymbol) => {
      if (disabled) {
        return true;
      }
      if (symbol === '.') {
        return maxDecimals === 0 || value.includes('.');
      } else if (symbol === DELETE_SYMBOL) {
        return value === '';
      }
      return false;
    },
    [disabled, maxDecimals, value],
  );

  const decimalSymbol = React.useMemo(() => {
    return (
      (1.1).toLocaleString().replace(/1/g, '').replace(/\./g, '')[0] || '.'
    );
  }, []);

  return (
    <View style={[{ gap }]}>
      {NUMPAD_LAYOUT.map((row, rowIndex) => (
        <View key={rowIndex} style={[t.flexRow, t.wFull, { gap }]}>
          {row.map((symbol) => {
            if (symbol === '.' && !decimalsEnabled) {
              return (
                <View
                  key={symbol}
                  style={[{ height: BUTTON_HEIGHT, flex: 1 }]}
                />
              );
            }
            return (
              <NumPadButton
                key={symbol}
                symbol={symbol}
                onPress={getHandlerForSymbol(symbol)}
                onLongPress={
                  symbol === DELETE_SYMBOL ? handleDeleteLongPress : undefined
                }
                disabled={getDisabledState(symbol)}
                displaySymbol={symbol === '.' ? decimalSymbol : undefined}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * A numeric keypad component for entering decimal numbers with a quick select
 * @param value - Current numeric value as string
 * @param maxValue - Maximum value as string
 * @param onChange - Callback when value changes
 * @returns A component that displays a numeric keypad with a quick select
 */
export function NumpadWithQuickSelect({
  value,
  maxValue,
  onChange,
}: {
  value: string;
  maxValue: string;
  onChange: (value: string) => void;
}) {
  const t = useTheme();

  const maxAmount = React.useMemo(() => parseFloat(maxValue), [maxValue]);
  const options = React.useMemo(
    () => [
      { label: '25%', value: 0.25 },
      { label: '50%', value: 0.5 },
      { label: '75%', value: 0.75 },
      { label: 'Max', value: 1 },
    ],
    [],
  );

  return (
    <View>
      <View style={[t.flexRow, t.pX3, t.pB3, { gap: 8 }]}>
        {options.map((option) => (
          <AnimatedPressable
            key={option.label}
            onPress={() => {
              const amount = maxAmount * option.value;
              onChange(amount.toFixed(2));
            }}
            style={[
              t.flex1,
              t.itemsCenter,
              t.justifyCenter,
              t.backgrounds.secondary,
              t.roundedFull,
              { paddingVertical: 8 },
            ]}
          >
            <Text2 weight="semibold" color="brand" size="base">
              {option.label}
            </Text2>
          </AnimatedPressable>
        ))}
      </View>

      <NumPad
        value={value}
        maxDecimals={2}
        onChange={(val) => {
          const parsed = parseFloat(val);
          if (isNaN(parsed) || parsed < 0) {
            onChange('0');
          } else {
            onChange(val);
          }
        }}
      />
    </View>
  );
}
/**
 * Formats a numeric string value with proper integer formatting and decimal handling
 * @param value - The numeric string to format
 * @returns Formatted string with locale-specific integer formatting
 */
export const formatNumPadValue = (value: string): string => {
  if (!value || value === '0') {
    return '0';
  }
  if (value === '.') {
    return '0.';
  }

  const [integerPart = '0', decimalPart] = value.split('.');
  const parsedInteger = parseInt(integerPart) || 0;
  const formattedInteger = parsedInteger.toLocaleString();

  return decimalPart !== undefined
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger;
};
