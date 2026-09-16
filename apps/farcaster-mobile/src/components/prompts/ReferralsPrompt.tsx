import { AnalyticsEvent } from 'farcaster-analytics';
import { useMarkPromptedFor } from 'farcaster-client-hooks';
import {
  AutoDisplayingBottomSheetModal,
  ButtonV2,
  Text2,
  useTheme,
} from 'farcaster-expo';
import {
  DollarSignIcon,
  HandCoinsIcon,
  TrophyIcon,
  UserRoundPlusIcon,
} from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalGate } from '~/contexts/GlobalGateProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { shareUrl } from '~/utils/SharingUtils';

function ReferralsPrompt() {
  const { referrals: hasAccessToReferrals } = useGlobalGate();

  const { prompts } = useUserAppContext();

  const [showReferralsPrompt, setShowReferralsPrompt] =
    React.useState<boolean>(false);

  const onReferralsPromptDismiss = React.useCallback(() => {
    setShowReferralsPrompt(false);
  }, []);

  const alreadyPromptedForReferrals = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (
      hasAccessToReferrals &&
      !showReferralsPrompt &&
      !alreadyPromptedForReferrals.current &&
      prompts.length !== 0 &&
      prompts.findIndex((p) => p === 'referrals') !== -1
    ) {
      setShowReferralsPrompt(true);
      alreadyPromptedForReferrals.current = true;
    }
  }, [hasAccessToReferrals, prompts, showReferralsPrompt]);

  if (!showReferralsPrompt) {
    return null;
  }

  return <ReferralsPromptContent onDismiss={onReferralsPromptDismiss} />;
}

type ReferraslPromptContenProps = {
  onDismiss: () => void;
};

export const ReferralsPromptContent = ({
  onDismiss,
}: ReferraslPromptContenProps) => {
  const markPromptedFor = useMarkPromptedFor();

  const currentUser = useCurrentUser_UNSAFE();

  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const referralURL = React.useMemo(() => {
    if (typeof currentUser === 'undefined') {
      return undefined;
    }

    if (
      typeof currentUser.username !== 'undefined' &&
      currentUser.username !== null
    ) {
      return `https://farcaster.xyz/${currentUser.username}/referral`;
    }

    return `https://farcaster.xyz/referral/${currentUser.fid}`;
  }, [currentUser]);

  const onDismissWrapped = React.useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const onReferNowPress = React.useCallback(async () => {
    if (typeof referralURL === 'undefined') {
      return;
    }

    trackEvent(AnalyticsEvent.PressReferNowReferralsPrompt, {});

    await shareUrl({ title: 'Join Farcaster!', url: referralURL });

    onDismissWrapped();
  }, [onDismissWrapped, referralURL, trackEvent]);

  const onLaterPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressLaterReferralsPrompt, {});

    onDismissWrapped();
  }, [onDismissWrapped, trackEvent]);

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewReferralsPrompt, {});

    markPromptedFor({ promptType: 'referrals' });
  }, [markPromptedFor, trackEvent]);

  return (
    <AutoDisplayingBottomSheetModal
      name="referralsPrompt"
      onDismiss={onDismissWrapped}
    >
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsCenter,
          t.justifyCenter,
          { gap: 12, marginBottom: 24 },
        ]}
      >
        <View
          style={[
            t.selfCenter,
            t.roundedFull,
            t.itemsCenter,
            t.justifyCenter,
            t.p8,
            t.bgFaint,
          ]}
        >
          <DollarSignIcon size={40} color={t.colors.text.secondary} />
        </View>
        <Text2 size="2xl" weight="semibold" color="primary">
          Get paid for referrals
        </Text2>
      </View>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.wFull,
          t.bgFaint,
          { borderRadius: 12, marginBottom: 24 },
        ]}
      >
        <View
          style={[
            t.flexRow,
            t.itemsStart,
            t.p3,
            { gap: 8 },
            t.borderB,
            { borderColor: t.colors.bgDefault },
          ]}
        >
          <UserRoundPlusIcon size={20} color={t.colors.text.secondary} />
          <View style={[t.flex, t.flexCol, t.flex1]}>
            <Text2 weight="semibold" size="base">
              Refer users to Farcaster
            </Text2>
            <Text2 size="base" style={t.texts.secondary}>
              The more you refer, the more points you’ll earn.
            </Text2>
          </View>
        </View>
        <View
          style={[
            t.flexRow,
            t.itemsStart,
            t.p3,
            { gap: 8 },
            t.borderB,
            { borderColor: t.colors.bgDefault },
          ]}
        >
          <TrophyIcon size={20} color={t.colors.text.secondary} />
          <View style={[t.flex, t.flexCol, t.flex1]}>
            <Text2 weight="semibold" size="base">
              Earn points each week
            </Text2>
            <Text2 size="base" style={t.texts.secondary}>
              Point tallies reset after each week.
            </Text2>
          </View>
        </View>
        <View
          style={[
            t.flexRow,
            t.itemsStart,
            t.p3,
            { gap: 8 },
            t.borderB,
            { borderColor: t.colors.bgDefault },
          ]}
        >
          <HandCoinsIcon size={20} color={t.colors.text.secondary} />
          <View style={[t.flex, t.flexCol, t.flex1]}>
            <Text2 weight="semibold" size="base">
              Compete for cash rewards
            </Text2>
            <Text2 size="base" style={t.texts.secondary}>
              Earn up to $5K each week.
            </Text2>
          </View>
        </View>
      </View>
      <View style={[t.wFull, t.flexCol, t.itemsCenter, { gap: 8 }]}>
        <ButtonV2 onPress={onReferNowPress} title="Refer now" width={'full'} />
        <ButtonV2
          onPress={onLaterPress}
          title="Later"
          variant="secondary"
          width={'full'}
        />
      </View>
    </AutoDisplayingBottomSheetModal>
  );
};

export { ReferralsPrompt };
