import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getNotionLinkTarget } from 'farcaster-client-hooks';
import { ButtonV2, Typography } from 'farcaster-expo';
import {
  BadgeDollarSignIcon,
  Clock2Icon,
  HandHelpingIcon,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Linking, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildScreen } from '~/components/Screen';
import { TextWithPress } from '~/components/TextWithPress';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useNavigationMethods } from '~/contexts/NavigationMethodsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { CommonStackParamList } from '~/types';

type DepositBonusesIntroScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DepositBonusesIntro'
>;

const DepositBonusesIntroScreen = buildScreen<DepositBonusesIntroScreenProps>(
  { name: 'DepositBonusesIntro' },
  () => {
    const { trackEvent } = useAnalytics();

    useEffect(() => {
      trackEvent(AnalyticsEvent.ViewDepositBonusesIntroScreen, {});
    }, [trackEvent]);

    return <DepositBonusesIntroScreenContent />;
  },
);

DepositBonusesIntroScreen.displayName = 'DepositBonusesIntroScreen';

const InfoItem = ({
  title,
  description,
  icon,
  hasLearnMore = false,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  hasLearnMore?: boolean;
}) => {
  const t = useTheme();

  const renderDescription = () => {
    if (hasLearnMore) {
      const [mainText] = description.split('Learn more');
      return (
        <Typography style={t.flexGrow} label="Regular/Base" color="secondary">
          {mainText}
          <TextWithPress
            style={[t.texts.brand]}
            onPress={() => {
              Linking.openURL(getNotionLinkTarget({ to: 'deposit-bonuses' }));
            }}
          >
            Learn more
          </TextWithPress>
        </Typography>
      );
    }

    return (
      <Typography style={t.flexGrow} label="Regular/Base" color="secondary">
        {description}
      </Typography>
    );
  };

  return (
    <View style={[t.flexRow, t.gap3]}>
      {icon}
      <View style={[t.gap1, t.flex1]}>
        <Typography label="Semibold/Base" color="primary">
          {title}
        </Typography>
        {renderDescription()}
      </View>
    </View>
  );
};

const ICON_SIZE = 24;
const SPLASH_IMAGE_HEIGHT = 240;

function DepositBonusesIntroScreenContent() {
  const navigate = useNavigate();
  const { goBack } = useNavigationMethods();
  const t = useTheme();

  const onContinue = useCallback(() => {
    navigate('WalletReceiveOnChain', { chain: 'base' });
  }, [navigate]);

  const onSkip = useCallback(() => {
    goBack();
  }, [goBack]);

  const { bottom } = useSafeAreaInsets();

  const infoItems = useMemo(
    () => [
      {
        title: 'Deposit to earn',
        description:
          "This October, we'll match Base USDC you deposit in your wallet with a 10% bonus.",
        icon: (
          <HandHelpingIcon size={ICON_SIZE} stroke={t.colors.text.primary} />
        ),
      },
      {
        title: 'Earn up to $500',
        description:
          'You can earn up to $500 in deposit rewards for an eligible Farcaster account. Learn more',
        icon: <Clock2Icon size={ICON_SIZE} stroke={t.colors.text.primary} />,
        hasLearnMore: true,
      },
      {
        title: 'Onchain payouts',
        description: 'Rewards are paid out onchain in Base USDC every week.',
        icon: (
          <BadgeDollarSignIcon
            size={ICON_SIZE}
            stroke={t.colors.text.primary}
          />
        ),
      },
    ],
    [t.colors.text.primary],
  );

  return (
    <View style={[t.flex1, { paddingBottom: bottom }]}>
      <ScrollView style={[t.flex1, t.mX4]} bounces={false}>
        <View style={[t.mT4]}>
          <Image
            source={require('~/assets/images/deposit-bonuses-splash.png')}
            style={[t.wFull, { height: SPLASH_IMAGE_HEIGHT }]}
            contentFit="fill"
          />
        </View>
        <View style={[t.flex1, t.mT6, t.pX4]}>
          <View>
            <Typography label="Semibold/Base" color="brand">
              Introducing
            </Typography>
            <Typography label="Semibold/2XL" color="primary">
              Deposit bonus
            </Typography>
          </View>
          <View style={[t.pY6, t.gap4, t.flex1, t.justifyStart, t.itemsStart]}>
            {infoItems.map((item) => (
              <InfoItem
                key={item.title}
                title={item.title}
                description={item.description}
                icon={item.icon}
                hasLearnMore={item.hasLearnMore}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={[t.mX4, t.gap3]}>
        <ButtonV2 title="Deposit now" onPress={onContinue} textSize="lg" />
        <ButtonV2
          title="Skip"
          onPress={onSkip}
          variant="secondary"
          textSize="lg"
        />
      </View>
    </View>
  );
}

DepositBonusesIntroScreenContent.displayName =
  'DepositBonusesIntroScreenContent';

export { DepositBonusesIntroScreen };
