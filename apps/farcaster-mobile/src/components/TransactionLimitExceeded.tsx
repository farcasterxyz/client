import { useFocusEffect } from '@react-navigation/native';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getNotionLinkTarget } from 'farcaster-client-hooks';
import { CircleIconBadge } from 'farcaster-expo';
import { X } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Linking, View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { Text2 } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

export function TransactionLimitExceeded({
  onContinue,
}: {
  onContinue: () => void | Promise<void>;
}) {
  const t = useTheme();
  const { trackEvent } = useAnalytics();

  useFocusEffect(
    useCallback(() => {
      trackEvent(AnalyticsEvent.ViewTransactionLimitExceeded, {});
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
              Limit exceeded
            </Text2>
            <Text2 size="lg" color="secondary" align="center">
              No more transactions allowed at this time.
            </Text2>
            <TextWithPress
              style={[t.texts.brand, t.p1]}
              onPress={() => {
                Linking.openURL(
                  getNotionLinkTarget({ to: 'trx-limit-exceeded' }),
                );
              }}
            >
              Learn more
            </TextWithPress>
          </View>
        </View>
      </View>
      <View>
        <ButtonV2 title="Continue" textSize="lg" onPress={onContinue} />
      </View>
    </View>
  );
}
