import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { FarcasterProUpsell } from 'farcaster-expo';
import React, { useCallback } from 'react';
import { Platform } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { RootNativeStackParamList } from '~/types';

type FarcasterProUpsellScreenProps = NativeStackScreenProps<
  RootNativeStackParamList,
  'FarcasterProUpsell'
>;

const FarcasterProUpsellScreen = buildScreen<FarcasterProUpsellScreenProps>(
  { name: 'FarcasterProUpsell', insetTop: Platform.OS === 'android' },
  ({ route }) => {
    const { source } = route.params;
    const { trackEvent } = useAnalytics();

    // Track analytics on mount
    useFocusEffect(
      useCallback(() => {
        trackEvent(AnalyticsEvent.FarcasterProUpsellView, {
          source: source ?? 'profile',
        });
      }, [source, trackEvent]),
    );

    const handleClose = useCallback(() => {
      // FarcasterProUpsell will handle the navigation, we just track analytics here
    }, []);

    const handleConfirm = useCallback(() => {
      // FarcasterProUpsell will handle the navigation
    }, []);

    return (
      <FarcasterProUpsell
        onClose={handleClose}
        onConfirm={handleConfirm}
        source={source}
      />
    );
  },
);

FarcasterProUpsellScreen.displayName = 'FarcasterProUpsellScreen';

export { FarcasterProUpsellScreen };
