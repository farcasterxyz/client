import {
  Minus,
  Plus,
  Repeat2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '../../contexts';
import { useLimitOrdersEnabled } from '../../hooks';
import { BottomSheetContentContainer } from '../bottom-sheet';
import { Text2 } from '../design-system';

type WalletTradeAction = {
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  label: string;
  description: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function WalletTradeActionsContent({
  onBuyPress,
  onLimitBuyPress,
  onSellPress,
  onLimitSellPress,
  onSwapPress,
  sellActionsDisabled = false,
  limitOrderActionsDisabled = false,
  limitOrderUnavailableDescription,
  hideSwapAction = false,
}: {
  onBuyPress?: () => void;
  onLimitBuyPress?: () => void;
  onSellPress?: () => void;
  onLimitSellPress?: () => void;
  onSwapPress?: () => void;
  sellActionsDisabled?: boolean;
  limitOrderActionsDisabled?: boolean;
  limitOrderUnavailableDescription?: string;
  hideSwapAction?: boolean;
}) {
  const t = useTheme();
  const limitOrdersEnabled = useLimitOrdersEnabled();
  const hideLimitOrderActions = !limitOrdersEnabled;
  const unavailableForTokenDescription =
    limitOrderUnavailableDescription ?? 'Not available for this token';

  const actions: WalletTradeAction[] = [
    {
      Icon: Plus,
      label: 'Buy',
      description: 'Instant buy at current market price',
      onPress: onBuyPress,
    },
    ...(hideLimitOrderActions
      ? []
      : [
          {
            Icon: TrendingDown,
            label: 'Limit Buy',
            description: limitOrderActionsDisabled
              ? unavailableForTokenDescription
              : 'Set a target to buy when price drops',
            onPress: limitOrderActionsDisabled ? undefined : onLimitBuyPress,
            disabled: limitOrderActionsDisabled,
          },
        ]),
    {
      Icon: Minus,
      label: 'Sell',
      description: 'Instant sell at current market price',
      onPress: sellActionsDisabled ? undefined : onSellPress,
      disabled: sellActionsDisabled,
    },
    ...(hideLimitOrderActions
      ? []
      : [
          {
            Icon: TrendingUp,
            label: 'Limit Sell',
            description: limitOrderActionsDisabled
              ? unavailableForTokenDescription
              : 'Set a target to sell when price rises',
            onPress:
              sellActionsDisabled || limitOrderActionsDisabled
                ? undefined
                : onLimitSellPress,
            disabled: sellActionsDisabled || limitOrderActionsDisabled,
          },
        ]),
    ...(hideSwapAction
      ? []
      : [
          {
            Icon: Repeat2,
            label: 'Swap',
            description: 'Convert or bridge one token to another',
            onPress: onSwapPress,
          },
        ]),
  ];

  return (
    <BottomSheetContentContainer style={[t.pX0, { paddingTop: 18 }]}>
      <View style={[t.pX4, { gap: 8 }]}>
        {actions.map(({ Icon, label, description, onPress, disabled }) => {
          const isDisabled = disabled || !onPress;

          return (
            <Pressable
              key={label}
              onPress={onPress}
              disabled={isDisabled}
              style={({ pressed }) => [
                t.flexRow,
                t.itemsCenter,
                {
                  gap: 16,
                  paddingVertical: 11,
                  opacity: isDisabled ? 0.4 : pressed ? 0.72 : 1,
                },
              ]}
            >
              <View style={[t.itemsCenter, t.justifyCenter, { width: 38 }]}>
                <Icon
                  size={24}
                  color={t.colors.text.primary}
                  strokeWidth={2.2}
                />
              </View>
              <View style={[t.flex1]}>
                <Text2 weight="semibold" size="base">
                  {label}
                </Text2>
                <Text2 color="secondary" size="sm">
                  {description}
                </Text2>
              </View>
            </Pressable>
          );
        })}
      </View>
    </BottomSheetContentContainer>
  );
}
