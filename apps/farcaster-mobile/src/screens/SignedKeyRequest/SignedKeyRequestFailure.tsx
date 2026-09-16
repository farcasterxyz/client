import { useFocusEffect } from '@react-navigation/native';
import { AnalyticsEvent } from 'farcaster-analytics';
import { CircleIconBadge } from 'farcaster-expo';
import { X } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

export function SignedKeyRequestFailure({
  title,
  message,
  onContinue,
}: {
  title: React.ReactNode;
  message: React.ReactNode;
  onContinue: () => void | Promise<void>;
}) {
  const t = useTheme();
  const { trackEvent } = useAnalytics();

  useFocusEffect(
    useCallback(() => {
      trackEvent(AnalyticsEvent.ViewOnchainSignerRequestError, {});
    }, [trackEvent]),
  );

  return (
    <View style={[t.flex1, t.p3, t.justifyBetween]}>
      <View style={[t.flex1, t.pT6]}>
        <View
          style={[{ height: 358, gap: 18 }, t.itemsCenter, t.justifyCenter]}
        >
          <CircleIconBadge
            variant="danger"
            size="80"
            Icon={(props) => <X {...props} />}
          />
          <View
            style={[{ gap: 12 }, t.textCenter, t.itemsCenter, t.justifyCenter]}
          >
            <Text2 weight="semibold" size="3xl" align="center">
              {title}
            </Text2>
            <Text2 size="lg" color="secondary" align="center">
              {message}
            </Text2>
          </View>
        </View>
      </View>
      <View>
        <ButtonV2 title="Continue" textSize="lg" onPress={onContinue} />
      </View>
    </View>
  );
}
