import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  useCreateTraderSubscription,
  useDeleteTraderSubscription,
} from 'farcaster-client-hooks';
import { AnimatedPressable, useHaptics, useTheme } from 'farcaster-expo';
import { Check } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { useAnalytics } from '~/contexts/AnalyticsProvider';

export function ExploreFeedTopTraderAlertTrigger({
  trader,
}: {
  trader: ApiUser;
}) {
  const t = useTheme();

  const toast = useToast();

  const { trackEvent } = useAnalytics();

  const { triggerImpactAsync } = useHaptics();

  const [
    isSubscribedToTraderNotifications,
    setIsSubscribedToTraderNotifications,
  ] = React.useState(false);

  React.useEffect(() => {
    setIsSubscribedToTraderNotifications(
      trader.viewerContext?.traderNotificationThreshold !== undefined,
    );
  }, [trader.viewerContext?.traderNotificationThreshold]);

  const enableTraderNotifications = useCreateTraderSubscription();
  const disableTraderNotifications = useDeleteTraderSubscription();

  const onAlertsPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.TurnOnAlertsExploreFeed, {
      fid: trader.fid,
      enabled: !isSubscribedToTraderNotifications,
    });

    triggerImpactAsync();

    const DEFAULT_TRADER_NOTIFICATION_THRESHOLD = 10;

    if (isSubscribedToTraderNotifications) {
      setIsSubscribedToTraderNotifications(false);

      disableTraderNotifications({
        targetFid: trader.fid,
        previousMinimumValueUsd: DEFAULT_TRADER_NOTIFICATION_THRESHOLD,
      });

      toast.show(`Trade alerts removed for ${trader.username}`, {
        placement: 'bottom',
      });
    } else {
      setIsSubscribedToTraderNotifications(true);

      enableTraderNotifications({
        targetFid: trader.fid,
        type: 'token-swapped',
        minimumValueUsd: DEFAULT_TRADER_NOTIFICATION_THRESHOLD,
      });

      toast.show(`Trade alerts enabled for ${trader.username}`, {
        placement: 'bottom',
      });
    }
  }, [
    disableTraderNotifications,
    enableTraderNotifications,
    isSubscribedToTraderNotifications,
    toast,
    trackEvent,
    trader.fid,
    trader.username,
    triggerImpactAsync,
  ]);

  return (
    <AnimatedPressable
      onPress={onAlertsPress}
      style={[
        t.itemsCenter,
        t.justifyCenter,
        t.roundedFull,
        {
          width: 32,
          height: 32,
          backgroundColor: t.colors.background.tertiary,
        },
      ]}
    >
      <View style={[t.relative, t.itemsCenter, t.justifyCenter]}>
        <Octicons
          name={isSubscribedToTraderNotifications ? 'bell-fill' : 'bell'}
          size={16}
          color={t.colors.text.secondary}
        />
        {isSubscribedToTraderNotifications && (
          <View
            style={[
              t.absolute,
              t.itemsCenter,
              t.justifyCenter,
              { top: 0, left: 0, right: 0, bottom: 0 },
            ]}
          >
            <Check size={8} color={t.colors.text.light} strokeWidth={6} />
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}
