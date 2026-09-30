import { AnalyticsEvent } from 'farcaster-analytics';
import { Bug, CircleX } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSharedNavigationContext } from '../../../contexts/SharedNavigationContext';
import { useSharedTelemetry } from '../../../contexts/SharedTelemetryContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { IconButton } from '../../design-system/Buttons/IconButton';
import { CircleIconBadge } from '../../design-system/CircleIconBadge';
import { Text2 } from '../../design-system/Text';

export function WalletNotConnected({ source }: { source: string }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const isAdmin = useIsAdmin();
  const { navigate } = useSharedNavigationContext();
  const { trackEvent, trackError } = useSharedTelemetry();

  useEffect(() => {
    trackEvent(AnalyticsEvent.WalletNotConnected, { source });
    trackError(new Error(`Wallet not connected from source: ${source}`));
  }, [trackEvent, source, trackError]);

  const rightIcon = useMemo(
    () =>
      isAdmin ? (
        <IconButton
          size="32"
          onPress={() => {
            navigate({ path: 'DebugEmbeddedWallet' });
          }}
          Icon={(props) => <Bug {...props} />}
          variant="tertiary"
        />
      ) : undefined,
    [isAdmin, navigate],
  );

  return (
    <View style={[t.flex1, t.pX3, { paddingBottom: insets.bottom }]}>
      <View style={[t.flexRow, t.justifyEnd]}>{rightIcon}</View>
      <View style={[t.flex1, t.pT6]}>
        <View
          style={[{ height: 414, gap: 12 }, t.itemsCenter, t.justifyCenter]}
        >
          <CircleIconBadge
            variant="warn"
            size="64"
            Icon={(props) => <CircleX {...props} />}
          />
          <Text2 weight="semibold" size="2xl">
            Wallet Not Connected
          </Text2>
          <Text2 color="secondary" size="sm" align="center">
            An unexpected error occurred when trying to connect your wallet.
            Don't worry, your funds are safe. Please try closing and reopening
            your app.
          </Text2>
        </View>
      </View>
    </View>
  );
}
