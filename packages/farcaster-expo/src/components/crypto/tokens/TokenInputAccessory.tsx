import {
  FuelIcon,
  InfoIcon,
  type LucideIcon,
  TriangleAlertIcon,
} from 'lucide-react-native';
import React, { type ComponentProps, JSX } from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../contexts';
import { SwapWarning, SwapWarningType } from '../../../utils/SwapWarnings';
import {
  AutoDisplayingBottomSheetModal,
  BottomSheetHeader,
  useBottomSheetModalRef,
} from '../../bottom-sheet';
import {
  AnimatedPressable,
  AtomsButton,
  Text2,
  Typography,
} from '../../design-system';

export const TOKEN_ACCESSORY_STRINGS = {
  gas_conversion: 'Gas conversion',
  quote_unavailable: 'Quote unavailable',
  guest_checkout_limit_exceeded:
    'Guest limit exceeded • Coinbase account required',
} as const;

export const TokenInputAccessoryIconMap: Record<
  SwapWarningType,
  React.ComponentType<ComponentProps<LucideIcon>>
> = {
  high_price_impact_danger: TriangleAlertIcon,
  high_price_impact_warning: TriangleAlertIcon,
  market_rate_unfavorable_warning: TriangleAlertIcon,
  market_rate_unfavorable_blocked: TriangleAlertIcon,
  gas_conversion: FuelIcon,
  needs_gas: FuelIcon,
  quote_unavailable: InfoIcon,
  new_token: InfoIcon,
  coinbase_onramp_limit_explainer: InfoIcon,
} as const;

export const TokenInputAccessoryColorMap: Record<
  SwapWarningType,
  'danger' | 'warning' | 'secondary'
> = {
  high_price_impact_danger: 'danger',
  high_price_impact_warning: 'warning',
  market_rate_unfavorable_warning: 'warning',
  market_rate_unfavorable_blocked: 'danger',
  gas_conversion: 'secondary',
  needs_gas: 'secondary',
  quote_unavailable: 'secondary',
  new_token: 'secondary',
  coinbase_onramp_limit_explainer: 'secondary',
} as const;

function GuestCheckoutExplainerText() {
  const t = useTheme();
  return (
    <View style={[t.flexCol, t.gap4, t.mB2]}>
      <Text2 size="sm">
        You can onramp funds{' '}
        <Text2 size="sm" weight="semibold">
          without needing a Coinbase account.
        </Text2>{' '}
        As a guest, you are limited to:
      </Text2>

      <View style={[t.flexCol, t.gap0_5]}>
        <View style={[t.flexRow, t.gap2]}>
          <Text2 size="sm">{'\u2022'}</Text2>
          <Text2 size="sm">
            <Text2 size="sm" weight="semibold">
              15
            </Text2>{' '}
            total lifetime transactions
          </Text2>
        </View>

        <View style={[t.flexRow, t.gap2]}>
          <Text2 size="sm">{'\u2022'}</Text2>
          <Text2 size="sm">
            <Text2 size="sm" weight="semibold">
              $2,500 per week
            </Text2>{' '}
            (rolling 7-day window)
          </Text2>
        </View>
      </View>
    </View>
  );
}

export function TokenInputAccessoryIcon({
  type,
  size = 12,
}: {
  type: SwapWarningType;
  size?: number;
}) {
  const t = useTheme();
  const Icon = TokenInputAccessoryIconMap[type];
  const color = TokenInputAccessoryColorMap[type];
  if (!Icon) {
    return null;
  }
  return <Icon size={size} color={t.colors.text[color]} />;
}

export function TokenInputAccessory({
  text,
  icon,
  color,
  onPress,
}: {
  text: string;
  icon: React.ReactNode;
  color: 'warning' | 'danger' | 'secondary';
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <AnimatedPressable onPress={onPress}>
      <View
        style={[
          t.flexRow,
          t.itemsCenter,
          t.gap1,
          {
            paddingHorizontal: 6,
            paddingVertical: 2,
          },
        ]}
      >
        {icon}
        <Typography label="Body/ExtraSmall/Strong" color={color}>
          {text}
        </Typography>
      </View>
    </AnimatedPressable>
  );
}

function getBottomSheetTitle(type: SwapWarningType): string {
  switch (type) {
    case 'high_price_impact_danger':
      return 'Unusually high price impact';
    case 'high_price_impact_warning':
      return 'High price impact';
    case 'market_rate_unfavorable_warning':
      return 'Unfavorable quote';
    case 'market_rate_unfavorable_blocked':
      return 'Quote blocked';
    case 'gas_conversion':
      return 'Gas conversion';
    case 'needs_gas':
      return 'Not enough gas';
    case 'quote_unavailable':
      return 'Quote unavailable';
    case 'new_token':
      return 'New token';
    case 'coinbase_onramp_limit_explainer':
      return 'Guest Checkout Limits';
  }
}

export function getTokenInputAccessoryBottomSheetContent(
  type: SwapWarningType,
): string | JSX.Element {
  switch (type) {
    case 'high_price_impact_danger':
      return 'This swap has high price impact because of low liquidity, you may receive less than expected.';
    case 'high_price_impact_warning':
      return 'This swap has high price impact because of low liquidity, you may receive less than expected.';
    case 'market_rate_unfavorable_warning':
      return 'This quote is unfavorable versus market value. Confirm only if you understand the expected loss.';
    case 'market_rate_unfavorable_blocked':
      return 'This quote is too unfavorable versus market value and cannot be executed.';
    case 'gas_conversion':
      return 'Converting $1 USDC to cover gas fees.';
    case 'needs_gas':
      return 'Not enough gas to cover chain fees. Please add more gas to your transaction.';
    case 'quote_unavailable':
      return 'Quotes may be unavailable when a token has low liquidity. Orders that are very small or very large can be hard to match. To continue, try adjusting the amount you want to trade.';
    case 'new_token':
      return 'Quotes may be unavailable for new tokens because liquidity is still low. Try again later or adjust the amount you want to trade.';
    case 'coinbase_onramp_limit_explainer':
      return <GuestCheckoutExplainerText />;
  }
}

export function TokenInputAccessoryBottomSheet({
  warning,
  onDismiss,
  bottomSheetModalRef,
}: {
  warning: SwapWarning | null;
  onDismiss: () => void;
  bottomSheetModalRef: ReturnType<typeof useBottomSheetModalRef>;
}) {
  const t = useTheme();
  if (!warning) {
    return null;
  }
  const title = getBottomSheetTitle(warning.type);
  const content = getTokenInputAccessoryBottomSheetContent(warning.type);

  return (
    <AutoDisplayingBottomSheetModal
      name="SwapTokensAccessoryInfoSheet"
      onDismiss={onDismiss}
      ref={bottomSheetModalRef}
      displayedInModalPresentationScreen={true}
    >
      <BottomSheetHeader
        title={title}
        Icon={<TokenInputAccessoryIcon type={warning.type} size={24} />}
      />
      {typeof content === 'string' ? (
        <Typography style={[t.pT1, t.pB2, t.pL1]} label="Medium/S">
          {content}
        </Typography>
      ) : (
        <View style={[t.pT1, t.pB4, t.pL1]}>{content}</View>
      )}
      <AtomsButton onPress={onDismiss} size="l" hierarchy="primary">
        Got it
      </AtomsButton>
    </AutoDisplayingBottomSheetModal>
  );
}
