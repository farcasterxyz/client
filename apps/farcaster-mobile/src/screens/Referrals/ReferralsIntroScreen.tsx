import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ButtonV2, Typography, XpRewardIcon } from 'farcaster-expo';
import { HandHeartIcon, TimerIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useXPNewEntrypoint } from '~/hooks/useXPNewEntrypoint';
import { CommonStackParamList } from '~/types';

type ReferralsIntroScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ReferralsIntro'
>;

const ReferralsIntroScreen = buildScreen<ReferralsIntroScreenProps>(
  { name: 'ReferralsIntro' },
  () => {
    const { trackEvent } = useAnalytics();
    const { xpNewEntrypointSeen, setHasSeenXPNewEntrypoint } =
      useXPNewEntrypoint();

    useEffect(() => {
      trackEvent(AnalyticsEvent.ViewReferralsIntroScreen, {});
    }, [trackEvent]);

    useEffect(() => {
      if (!xpNewEntrypointSeen) {
        setHasSeenXPNewEntrypoint(true);
      }
    }, [xpNewEntrypointSeen, setHasSeenXPNewEntrypoint]);

    return <ReferralsIntroScreenContent />;
  },
);

ReferralsIntroScreen.displayName = 'ReferralsOverviewScreen';

const InfoItem = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) => {
  const t = useTheme();
  return (
    <View style={[t.flexRow, t.gap3]}>
      {icon}
      <View style={[t.gap1, t.flex1]}>
        <Typography label="Semibold/Base" color="primary">
          {title}
        </Typography>
        <Typography style={t.flexGrow} label="Regular/Base" color="secondary">
          {description}
        </Typography>
      </View>
    </View>
  );
};

const ICON_SIZE = 24;
const SPLASH_IMAGE_HEIGHT = 240;

function ReferralsIntroScreenContent() {
  const navigation = useNavigation();
  const t = useTheme();
  const { setHasSeenXPNewEntrypoint } = useXPNewEntrypoint();
  const { trackEvent } = useAnalytics();
  const onContinue = useCallback(() => {
    trackEvent(AnalyticsEvent.DismissReferralsIntroScreen, {});
    setHasSeenXPNewEntrypoint(true);
    navigation.goBack();
  }, [navigation, setHasSeenXPNewEntrypoint, trackEvent]);
  const { bottom } = useSafeAreaInsets();

  const infoItems = useMemo(
    () => [
      {
        title: 'Invite & Earn',
        description:
          'You get 20% of trading fees from people who use your referral code to join.',
        icon: <HandHeartIcon size={ICON_SIZE} stroke={t.colors.text.primary} />,
      },
      {
        title: 'Give your friends a gift',
        description:
          'People you invite will get 20% lower fees when they trade on Farcaster.',
        icon: <TimerIcon size={ICON_SIZE} stroke={t.colors.text.primary} />,
      },
      {
        title: 'Instant payouts',
        description: 'Rewards are paid in USDC and can be claimed every day.',
        icon: (
          <XpRewardIcon
            size={ICON_SIZE}
            outlineColor={t.colors.text.primary}
            color={t.colors.background.default}
            foregroundColor={t.colors.text.primary}
            bold
          />
        ),
      },
    ],
    [t.colors.background.default, t.colors.text.primary],
  );

  return (
    <View style={[t.flex1, t.mB4, { paddingBottom: bottom }, t.pT3, t.mX3]}>
      <ScrollView style={[t.flex1]} bounces={false}>
        <Image
          source={require('~/assets/images/referral-info-splash.png')}
          style={(t.wFull, { height: SPLASH_IMAGE_HEIGHT })}
          contentFit="contain"
        />
        <View style={[t.flex1, t.mT6]}>
          <View style={[t.mX2]}>
            <Typography label="Semibold/Base" color="brand">
              Introducing
            </Typography>
            <Typography label="Semibold/2XL" color="primary">
              Referrals
            </Typography>
          </View>
          <View
            style={[
              t.pY6,
              t.mX5,
              t.gap6,
              t.flex1,
              t.justifyStart,
              t.itemsStart,
            ]}
          >
            {infoItems.map((item) => (
              <InfoItem key={item.title} {...item} />
            ))}
          </View>
        </View>
      </ScrollView>
      <ButtonV2 title="Continue" onPress={onContinue} />
    </View>
  );
}
ReferralsIntroScreenContent.displayName = 'ReferralsIntroScreenContent';

export { ReferralsIntroScreen };
