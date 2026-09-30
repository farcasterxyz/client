import { useFocusEffect } from '@react-navigation/native';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import { CircleIconBadge } from 'farcaster-expo';
import { Check } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Linking, View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePop } from '~/hooks/navigation/usePop';

type ConnectAppCompletedProps = {
  app?: ApiUser;
  redirectUrl: string | undefined;
};

const ConnectAppCompleted: React.FC<ConnectAppCompletedProps> = ({
  app,
  redirectUrl,
}) => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const pop = usePop();

  useFocusEffect(
    useCallback(() => {
      trackEvent(AnalyticsEvent.ViewOnchainSignerRequestComplete, {});
    }, [trackEvent]),
  );

  const onContinue = async () => {
    try {
      if (redirectUrl) {
        await Linking.openURL(redirectUrl);
      }
    } finally {
      pop();
    }
  };

  const appName = app?.displayName ?? 'This app';

  return (
    <View style={[t.flex1, t.p3, t.justifyBetween]}>
      <View style={[t.flex1, t.pT6]}>
        <View
          style={[{ height: 358, gap: 18 }, t.itemsCenter, t.justifyCenter]}
        >
          <CircleIconBadge
            variant="success"
            size="80"
            Icon={(props) => <Check {...props} />}
          />
          <View
            style={[{ gap: 12 }, t.textCenter, t.itemsCenter, t.justifyCenter]}
          >
            <Text2 weight="semibold" size="3xl" align="center">
              Connected
            </Text2>
            <Text2 size="lg" color="secondary" align="center">
              {redirectUrl ? (
                <>{appName} is now connected.</>
              ) : (
                <>
                  {appName} is now connected, and you can return to it to
                  continue using Farcaster.
                </>
              )}
            </Text2>
          </View>
        </View>
      </View>
      <View>
        {redirectUrl ? (
          <ButtonV2 title="Continue" textSize="lg" onPress={onContinue} />
        ) : (
          <ButtonV2 title="Return to feed" textSize="lg" onPress={pop} />
        )}
      </View>
    </View>
  );
};

export { ConnectAppCompleted };
