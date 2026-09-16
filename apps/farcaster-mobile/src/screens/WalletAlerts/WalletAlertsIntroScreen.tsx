import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useTheme } from 'farcaster-expo';
import { Bell, ChartLine, Settings2 } from 'lucide-react-native';
import React from 'react';
import { ScrollView } from 'react-native';

import { FeatureIntro } from '~/components/FeatureIntro';
import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useReplace } from '~/hooks/navigation/useReplace';
import { WalletStackParamList } from '~/types';

type WalletAlertsIntroScreenProps = NativeStackScreenProps<
  WalletStackParamList,
  'WalletAlertsIntro'
>;

const WalletAlertsIntroScreen = buildScreen<WalletAlertsIntroScreenProps>(
  {
    name: 'WalletAlertsIntro',
    themeV2: true,
  },
  () => {
    const t = useTheme();
    const replace = useReplace();
    const { trackEvent } = useAnalytics();

    const handlePress = React.useCallback(() => {
      replace('WalletAlertsSettings', { promptForPushes: true });
    }, [replace]);

    useFocusEffect(
      React.useCallback(() => {
        trackEvent(AnalyticsEvent.ViewWalletAlertsIntro);
      }, [trackEvent]),
    );

    return (
      <ScrollView
        contentContainerStyle={[
          { flex: 1, paddingTop: 12 },
          t.backgrounds.default,
        ]}
      >
        <FeatureIntro
          titleLabel="Introducing"
          title="Token and Trade Alerts"
          bannerImage={require('./intro.webp')}
          bullets={[
            {
              icon: <ChartLine color={t.colors.text.primary} />,
              title: 'Learn from the best traders',
              description:
                'Get alerts when people you follow buy or sell things onchain.',
            },
            {
              icon: <Bell color={t.colors.text.primary} />,
              title: 'Don’t miss out',
              description:
                'Set notifications for when tokens reach specific prices or market caps',
            },
            {
              icon: <Settings2 color={t.colors.text.primary} />,
              title: 'Customize to your needs',
              description:
                'Dial in alerts by price movement, targets and other parameters so you only get notifications that are useful to you.',
            },
          ]}
          primaryActionText="Continue"
          primaryActionOnPress={handlePress}
        />
      </ScrollView>
    );
  },
);

export { WalletAlertsIntroScreen };
