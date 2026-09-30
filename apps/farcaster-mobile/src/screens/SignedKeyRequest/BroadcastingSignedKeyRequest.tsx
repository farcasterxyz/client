import { useFocusEffect } from '@react-navigation/native';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useSignedKeyRequest } from 'farcaster-client-hooks';
import { ActivitySpinner } from 'farcaster-expo';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

export function BroadcastingSignedKeyRequest({ token }: { token: string }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  const { data } = useSignedKeyRequest(
    { token },
    {
      refetchInterval: 500,
    },
  );

  const { signedKeyRequest } = data!.result;
  const analyticsProperties = useMemo(
    () => ({ appFid: signedKeyRequest.requestFid }),
    [signedKeyRequest.requestFid],
  );

  useFocusEffect(
    useCallback(() => {
      trackEvent(AnalyticsEvent.BroadcastingConnectApp, analyticsProperties);
    }, [trackEvent, analyticsProperties]),
  );

  return (
    <View style={[t.flex1, t.p3, { paddingBottom: insets.bottom }]}>
      <View style={[t.flex1, t.pT6]}>
        <View
          style={[{ height: 358, gap: 18 }, t.itemsCenter, t.justifyCenter]}
        >
          <View style={[t.justifyCenter, { height: 80 }]}>
            <ActivitySpinner />
          </View>
          <View
            style={[{ gap: 12 }, t.textCenter, t.itemsCenter, t.justifyCenter]}
          >
            <Text2 weight="semibold" size="3xl" align="center">
              Connecting
            </Text2>
            <Text2 size="lg" color="secondary" align="center">
              Your connection will be made onchain and can take up to 60
              seconds.
            </Text2>
          </View>
        </View>
      </View>
    </View>
  );
}
