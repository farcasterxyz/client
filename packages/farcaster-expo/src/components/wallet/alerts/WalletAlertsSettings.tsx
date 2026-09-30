import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import {
  useSharedNavigationContext,
  useSharedTelemetry,
  useTheme,
} from '../../../contexts';
import { useSafeFocusEffect } from '../../../hooks/useSafeFocusEffect';
import { AnimatedPressable, Text2 } from '../../design-system';
import { WalletScreenHeader } from '../WalletScreenHeader';
import { WalletAlertsTokens } from './WalletAlertsTokens';
import { WalletAlertsTraders } from './WalletAlertsTraders';

export function WalletAlertsSettings({
  onUserPress,
}: {
  onUserPress: (user: ApiUser) => void;
}) {
  const { goBack } = useSharedNavigationContext();
  const [type, setType] = React.useState<'trader' | 'token'>('trader');
  const t = useTheme();
  const { trackEvent } = useSharedTelemetry();

  useSafeFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ViewWalletAlerts);
    }, [trackEvent]),
  );

  return (
    <View style={[t.flex1]}>
      <WalletScreenHeader title="Trade Alerts" onBackCallback={goBack} />
      <View style={[t.flexRow, t.itemsCenter, t.pX3, { gap: 12 }]}>
        <Button
          isSelected={type === 'trader'}
          onPress={() => setType('trader')}
          label="People"
        />
        <Button
          isSelected={type === 'token'}
          onPress={() => setType('token')}
          label="Tokens"
        />
      </View>
      {type === 'trader' && <WalletAlertsTraders onUserPress={onUserPress} />}
      {type === 'token' && <WalletAlertsTokens />}
    </View>
  );
}

function Button({
  isSelected,
  onPress,
  Icon,
  label,
  variant = 'default',
}: {
  isSelected?: boolean;
  onPress: () => void;
  Icon?: React.ElementType;
  label: string;
  variant?: 'default' | 'sm';
}) {
  const t = useTheme();
  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        variant === 'sm' ? t.pX1 : t.pX3,
        variant === 'sm' ? t.pY1 : t.pY2,
        t.flex1,
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        { borderRadius: 8, gap: 8 },
        isSelected ? t.backgrounds.brandLight : t.backgrounds.secondary,
      ]}
    >
      {Icon && (
        <Icon
          size={16}
          color={isSelected ? t.colors.text.brand : t.colors.text.secondary}
        />
      )}
      <Text2
        weight="semibold"
        color={isSelected ? 'brand' : 'secondary'}
        size={variant === 'sm' ? 'xs' : 'base'}
      >
        {label}
      </Text2>
    </AnimatedPressable>
  );
}
